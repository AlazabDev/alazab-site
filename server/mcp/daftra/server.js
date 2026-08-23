'use strict';

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { z } = require('zod/v4');
const { McpServer, createMcpHandler } = require('@modelcontextprotocol/server');
const { toNodeHandler } = require('@modelcontextprotocol/node');
const { createMcpExpressApp } = require('@modelcontextprotocol/express');

const { catalogSummary, getOperation, searchOperations } = require('./registry');
const { callOperation } = require('./client');
const { plan } = require('./planner');
const { verifyWrite } = require('./verifier');
const { resolveEntity, resolveProjectAccounting } = require('./resolver');
const audit = require('./audit');

const PORT = Number(process.env.MCP_DAFTRA_PORT || 4007);
const HOST = process.env.MCP_DAFTRA_HOST || '127.0.0.1';
const PUBLIC_KEY = process.env.MCP_DAFTRA_API_KEY;
const EXPOSE_GROUP_TOOLS = String(process.env.DAFTRA_MCP_EXPOSE_GROUP_TOOLS || 'false').toLowerCase() === 'true';

if (!PUBLIC_KEY) throw new Error('MCP_DAFTRA_API_KEY is missing');

const objectSchema = z.record(z.string(), z.unknown());

function jsonText(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function slugTool(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function compactOperation(op) {
  return {
    key: op.key,
    method: op.method,
    path: op.path,
    summary: op.summary,
    group: op.group,
    domain: op.domain,
    deprecated: op.deprecated,
    score: op.score,
  };
}

function actorFromArgs(args = {}) {
  return args.actor || args.agent || 'mcp-client';
}

async function execute(args = {}, forced = {}) {
  const planned = plan({ ...args, ...forced });
  if (!planned.resolved) {
    return {
      ok: false,
      executed: false,
      needs_clarification: true,
      reason: planned.reason,
      confidence: planned.confidence,
      candidates: planned.candidates.map(compactOperation),
    };
  }

  const op = planned.operation;
  const risk = planned.risk;
  if (risk === 'destructive' && args.confirm !== true) {
    return {
      ok: false,
      executed: false,
      requires_confirmation: true,
      risk,
      operation: compactOperation(op),
      message: 'DELETE operations require confirm=true.',
    };
  }

  const payload = {
    path_params: args.path_params || {},
    query: args.query || {},
    body: args.body !== undefined ? args.body : args.data,
    idempotency_key: args.idempotency_key,
  };

  if (args.dry_run === true) {
    return { ok: true, executed: false, dry_run: true, risk, confidence: planned.confidence, operation: compactOperation(op), payload };
  }

  const started = Date.now();
  let result;
  try {
    result = await callOperation(op.key, payload);
  } catch (error) {
    audit.append({ actor: actorFromArgs(args), intent: args.intent, risk, operation_key: op.key, status: 'exception', error: error.message, validation_errors: error.validation_errors, elapsed_ms: Date.now() - started });
    throw error;
  }

  const verification = args.verify === false ? { attempted: false, verified: false, reason: 'disabled' } : await verifyWrite(op, result, payload);
  const auditId = audit.append({
    actor: actorFromArgs(args), intent: args.intent, risk,
    operation_key: op.key, method: op.method, path: op.path,
    status: result.ok ? 'success' : 'failed', http_status: result.status,
    request: result.request, response: result.data, verification, elapsed_ms: result.elapsed_ms,
  });

  return { ...result, audit_id: auditId, risk, confidence: planned.confidence, verification };
}

function buildServer() {
  const server = new McpServer({ name: 'azab-daftra-mcp', version: '2.0.0' });

  server.registerTool('daftra_catalog_summary', {
    title: 'Daftra Capability Summary',
    description: `Authoritative capability map generated from the supplied Daftra OpenAPI: ${catalogSummary.operation_count} operations, ${catalogSummary.group_count} actual groups, ${catalogSummary.domain_count} domains.`,
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async () => jsonText(catalogSummary));

  server.registerTool('daftra_list_groups', {
    title: 'List Daftra Actual Groups',
    description: 'List all actual OpenAPI groups/subgroups and counts. Agents must use catalog/search before concluding that a Daftra capability does not exist.',
    inputSchema: z.object({ domain: z.string().optional() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ domain }) => {
    const groups = domain ? catalogSummary.groups.filter((g) => g.name.toLowerCase().includes(domain.toLowerCase())) : catalogSummary.groups;
    return jsonText({ count: groups.length, groups });
  });

  server.registerTool('daftra_search_operations', {
    title: 'Search All 301 Daftra Operations',
    description: 'Semantic Arabic/English search across every Daftra operation. Returns compact candidates; use daftra_describe_operation for the full exact schema.',
    inputSchema: z.object({ query: z.string().min(1), domain: z.string().optional(), group: z.string().optional(), method: z.enum(['GET','POST','PUT','PATCH','DELETE']).optional(), limit: z.number().int().min(1).max(100).optional() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => {
    const results = searchOperations(args.query, args).map(compactOperation);
    return jsonText({ count: results.length, results });
  });

  server.registerTool('daftra_describe_operation', {
    title: 'Describe Exact Daftra Operation',
    description: 'Return method, path, actual group, parameters, exact request-body schema, response schemas and deprecation state for one operation.',
    inputSchema: z.object({ operation_key: z.string().min(1) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ operation_key }) => jsonText(getOperation(operation_key)));

  const execBaseSchema = z.object({
    operation_key: z.string().optional(), intent: z.string().optional(), action: z.string().optional(), resource: z.string().optional(),
    domain: z.string().optional(), group: z.string().optional(), path_params: objectSchema.optional(), query: objectSchema.optional(),
    data: z.unknown().optional(), body: z.unknown().optional(), idempotency_key: z.string().optional(), actor: z.string().optional(),
    dry_run: z.boolean().optional(), confirm: z.boolean().optional(), verify: z.boolean().optional(),
  });
  const hasTarget = (v) => Boolean(v.operation_key || v.intent || v.resource);
  const targetError = { message: 'Provide operation_key, intent, or resource' };
  const execSchema = execBaseSchema.refine(hasTarget, targetError);
  const groupExecSchema = execBaseSchema.extend({ group: z.string().min(1) }).refine(hasTarget, targetError);

  server.registerTool('daftra_resolve_entity', {
    title: 'Resolve Daftra Business Entity',
    description: 'Resolve Arabic/English names to Daftra IDs. Supports projects, clients, suppliers, products, cost centers, treasuries, staff, branches, stores and work orders.',
    inputSchema: z.object({ type: z.string().min(1), name: z.string().min(1), limit: z.number().int().min(1).max(100).optional(), max_candidates: z.number().int().min(1).max(20).optional() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => jsonText(await resolveEntity(args.type, args.name, args)));

  server.registerTool('daftra_create_expense', {
    title: 'Create Daftra Expense',
    description: 'High-level expense creation: resolve supplier/project/cost-center, build exact Expense payload, apply idempotency, validate against OpenAPI, execute, audit and read back for verification.',
    inputSchema: z.object({
      amount: z.number().positive(), date: z.string().min(1), currency_code: z.string().optional(),
      description: z.string().optional(), category: z.string().optional(), supplier: z.string().optional(),
      supplier_id: z.number().int().optional(), project: z.string().optional(), cost_center_id: z.number().int().optional(),
      treasury_id: z.number().int().optional(), journal_account_id: z.number().int().optional(), actor: z.string().optional(),
      dry_run: z.boolean().optional(), idempotency_key: z.string().optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => {
    let supplierId = args.supplier_id;
    let costCenterId = args.cost_center_id;
    const resolutions = {};

    if (!supplierId && args.supplier) {
      const resolved = await resolveEntity('supplier', args.supplier);
      resolutions.supplier = resolved;
      if (!resolved.resolved) return jsonText({ ok: false, executed: false, needs_resolution: true, field: 'supplier', resolution: resolved });
      supplierId = Number(resolved.match.id);
    }

    if (!costCenterId && args.project) {
      const accounting = await resolveProjectAccounting(args.project);
      resolutions.project_accounting = accounting;
      if (!accounting.resolved) return jsonText({ ok: false, executed: false, needs_resolution: true, field: accounting.stage || 'project', resolution: accounting });
      costCenterId = Number(accounting.cost_center.id);
    }

    const data = {
      amount: args.amount, date: args.date, currency_code: args.currency_code || 'EGP',
      note: args.description, category: args.category, supplier_id: supplierId, treasury_id: args.treasury_id,
      journal_account_id: args.journal_account_id, cost_center_id: costCenterId,
    };
    for (const key of Object.keys(data)) if (data[key] === undefined) delete data[key];

    const result = await execute({
      operation_key: 'daftra.raw.post.expenses_format', data, actor: args.actor, dry_run: args.dry_run,
      idempotency_key: args.idempotency_key, verify: true, intent: args.description || 'create expense',
    });
    return jsonText({ ...result, resolutions });
  });

  server.registerTool('daftra_plan', {
    title: 'Plan Daftra Action',
    description: 'Resolve a business intent to an exact operation without executing. Returns confidence, risk and compact alternatives when ambiguous.',
    inputSchema: execSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => {
    const p = plan(args);
    return jsonText({ ...p, operation: p.operation ? compactOperation(p.operation) : undefined, candidates: (p.candidates || []).map(compactOperation) });
  });

  server.registerTool('daftra_execute', {
    title: 'Execute Any Daftra Action',
    description: 'Primary intelligent executor covering all 301 operations. Accepts an exact key or Arabic/English business intent, validates against the supplied OpenAPI, executes through the server, applies supported idempotency, verifies writes and writes an audit record.',
    inputSchema: execSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  }, async (args) => jsonText(await execute(args)));

  server.registerTool('daftra_group_execute', {
    title: 'Execute Within Actual Daftra Group',
    description: 'Route an intent only inside one of the 70 actual OpenAPI groups. Useful when an agent knows the functional group but not the endpoint.',
    inputSchema: groupExecSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  }, async (args) => jsonText(await execute(args, { group: args.group })));

  server.registerTool('daftra_batch', {
    title: 'Execute Daftra Workflow Batch',
    description: 'Execute an ordered multi-step Daftra workflow. Each step is independently resolved, validated, executed, verified and audited. Stops on first failure by default.',
    inputSchema: z.object({ steps: z.array(execSchema).min(1).max(20), stop_on_error: z.boolean().optional(), actor: z.string().optional() }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  }, async ({ steps, stop_on_error = true, actor }) => {
    const results = [];
    for (let i = 0; i < steps.length; i += 1) {
      const result = await execute({ ...steps[i], actor: steps[i].actor || actor });
      results.push({ step: i + 1, ...result });
      if (stop_on_error && (!result.ok || result.executed === false)) break;
    }
    return jsonText({ ok: results.length === steps.length && results.every((x) => x.ok), completed_steps: results.length, total_steps: steps.length, results });
  });

  for (const d of catalogSummary.domains) {
    const toolName = `daftra_${slugTool(d.name)}`;
    const groups = catalogSummary.groups.filter((g) => g.name.includes(d.name)).map((g) => g.name);
    server.registerTool(toolName, {
      title: `Daftra ${d.name}`,
      description: `Smart ${d.name} router covering ${d.count} source operations. Groups: ${groups.join(' | ')}`.slice(0, 900),
      inputSchema: execSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    }, async (args) => jsonText(await execute(args, { domain: d.name })));
  }

  if (EXPOSE_GROUP_TOOLS) {
    for (const g of catalogSummary.groups) {
      const toolName = `daftra_group_${slugTool(g.name.replace(/^Endpoints\//, ''))}`.slice(0, 60);
      server.registerTool(toolName, {
        title: g.name,
        description: `Exact Daftra OpenAPI group router covering ${g.count} operations in ${g.name}.`,
        inputSchema: execSchema,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
      }, async (args) => jsonText(await execute(args, { group: g.name })));
    }
  }

  return server;
}

const app = createMcpExpressApp();
app.use((req, res, next) => {
  if (req.path === '/healthz') return next();
  const bearer = typeof req.headers.authorization === 'string' ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '';
  const provided = req.headers['x-mcp-key'] || req.headers['x-api-key'] || bearer || '';
  if (!safeEqual(provided, PUBLIC_KEY)) return res.status(401).json({ error: 'Unauthorized' });
  return next();
});

app.get('/healthz', (req, res) => res.json({
  ok: true,
  service: 'azab-daftra-mcp',
  version: '2.0.0',
  operation_count: catalogSummary.operation_count,
  group_count: catalogSummary.group_count,
  domain_count: catalogSummary.domain_count,
  exposed_group_tools: EXPOSE_GROUP_TOOLS,
}));

const handler = createMcpHandler(() => buildServer());
const nodeHandler = toNodeHandler(handler);
app.all('/mcp', (req, res) => void nodeHandler(req, res, req.body));
app.listen(PORT, HOST, () => console.log(`Azab Daftra MCP v2 listening on http://${HOST}:${PORT}/mcp — ${catalogSummary.operation_count} operations / ${catalogSummary.group_count} actual groups`));
