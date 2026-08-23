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
const { resolveEntity } = require('./resolver');
const audit = require('./audit');

const PORT = Number(process.env.MCP_DAFTRA_PORT || 4007);
const HOST = process.env.MCP_DAFTRA_HOST || '127.0.0.1';
const PUBLIC_KEY = process.env.MCP_DAFTRA_API_KEY;

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
      candidates: planned.candidates.map((x) => ({ key: x.key, method: x.method, path: x.path, summary: x.summary, group: x.group, domain: x.domain, score: x.score })),
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
      operation: { key: op.key, method: op.method, path: op.path, summary: op.summary },
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
    return { ok: true, executed: false, dry_run: true, risk, confidence: planned.confidence, operation: op, payload };
  }

  const started = Date.now();
  let result;
  try {
    result = await callOperation(op.key, payload);
  } catch (error) {
    audit.append({ actor: actorFromArgs(args), intent: args.intent, risk, operation_key: op.key, status: 'exception', error: error.message, elapsed_ms: Date.now() - started });
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
    description: `Authoritative Daftra capability map generated from the supplied OpenAPI: ${catalogSummary.operation_count} operations across ${catalogSummary.group_count} actual groups.`,
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async () => jsonText(catalogSummary));

  server.registerTool('daftra_list_groups', {
    title: 'List Daftra Groups',
    description: 'List the actual Daftra OpenAPI groups/subgroups and operation counts. Use this before claiming that a capability does not exist.',
    inputSchema: z.object({ domain: z.string().optional() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ domain }) => {
    const groups = domain ? catalogSummary.groups.filter((g) => g.name.toLowerCase().includes(domain.toLowerCase())) : catalogSummary.groups;
    return jsonText({ count: groups.length, groups });
  });

  server.registerTool('daftra_search_operations', {
    title: 'Search All Daftra Operations',
    description: 'Semantic Arabic/English search over all 301 Daftra operations. Never conclude an operation is unavailable before using this tool.',
    inputSchema: z.object({ query: z.string().min(1), domain: z.string().optional(), group: z.string().optional(), method: z.enum(['GET','POST','PUT','PATCH','DELETE']).optional(), limit: z.number().int().min(1).max(100).optional() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => jsonText({ count: Math.min(args.limit || 20, 100), results: searchOperations(args.query, args) }));

  server.registerTool('daftra_describe_operation', {
    title: 'Describe Daftra Operation',
    description: 'Return method, path, actual group, parameters, request body schema, response statuses and deprecation state for one operation.',
    inputSchema: z.object({ operation_key: z.string().min(1) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ operation_key }) => jsonText(getOperation(operation_key)));

  const execSchema = z.object({
    operation_key: z.string().optional(), intent: z.string().optional(), action: z.string().optional(), resource: z.string().optional(),
    domain: z.string().optional(), group: z.string().optional(), path_params: objectSchema.optional(), query: objectSchema.optional(),
    data: z.unknown().optional(), body: z.unknown().optional(), idempotency_key: z.string().optional(), actor: z.string().optional(),
    dry_run: z.boolean().optional(), confirm: z.boolean().optional(), verify: z.boolean().optional(),
  }).refine((v) => Boolean(v.operation_key || v.intent || v.resource), { message: 'Provide operation_key, intent, or resource' });

  server.registerTool('daftra_resolve_entity', {
    title: 'Resolve Daftra Business Entity',
    description: 'Resolve Arabic/English business names to Daftra IDs before execution. Supports projects, clients, suppliers, products, cost centers, treasuries, staff, branches, stores and work orders.',
    inputSchema: z.object({ type: z.string().min(1), name: z.string().min(1), limit: z.number().int().min(1).max(100).optional(), max_candidates: z.number().int().min(1).max(20).optional() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => jsonText(await resolveEntity(args.type, args.name, args)));

  server.registerTool('daftra_create_expense', {
    title: 'Create Daftra Expense',
    description: 'High-level expense creation. Resolves supplier and project/cost-center names, builds the Daftra Expense payload, applies idempotency, executes, audits and reads the created expense back for verification.',
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
      const project = await resolveEntity('project', args.project);
      resolutions.project = project;
      if (!project.resolved) return jsonText({ ok: false, executed: false, needs_resolution: true, field: 'project', resolution: project });
      const costCenter = await resolveEntity('cost_center', project.match.name || args.project);
      resolutions.cost_center = costCenter;
      if (!costCenter.resolved) return jsonText({ ok: false, executed: false, needs_resolution: true, field: 'cost_center', message: 'Project resolved but no unambiguous matching cost center was found.', resolution: costCenter, project });
      costCenterId = Number(costCenter.match.id);
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
    description: 'Resolve a business intent to the exact Daftra operation without executing it. Returns confidence, risk and candidates when ambiguous.',
    inputSchema: execSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async (args) => jsonText(plan(args)));

  server.registerTool('daftra_execute', {
    title: 'Execute Daftra Action',
    description: 'Primary intelligent execution tool. Accepts an operation key or Arabic/English business intent, resolves it against all 301 operations, validates path/body requirements, applies supported idempotency, executes through the server, and writes an audit record.',
    inputSchema: execSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  }, async (args) => jsonText(await execute(args)));

  server.registerTool('daftra_batch', {
    title: 'Execute Daftra Workflow Batch',
    description: 'Execute an ordered workflow of Daftra operations. Each step is independently resolved and audited. Stops on first failure by default.',
    inputSchema: z.object({ steps: z.array(execSchema).min(1).max(20), stop_on_error: z.boolean().optional(), actor: z.string().optional() }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  }, async ({ steps, stop_on_error = true, actor }) => {
    const results = [];
    for (let i = 0; i < steps.length; i += 1) {
      const result = await execute({ ...steps[i], actor: steps[i].actor || actor });
      results.push({ step: i + 1, ...result });
      if (stop_on_error && (!result.ok || (result.executed === false && result.needs_clarification))) break;
    }
    return jsonText({ ok: results.every((x) => x.ok), completed_steps: results.length, total_steps: steps.length, results });
  });

  for (const d of catalogSummary.domains) {
    const toolName = `daftra_${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
    const groups = catalogSummary.groups.filter((g) => g.name.includes(d.name)).map((g) => g.name);
    server.registerTool(toolName, {
      title: `Daftra ${d.name}`,
      description: `Smart ${d.name} gateway covering ${d.count} operations. Actual groups: ${groups.join(' | ')}`.slice(0, 900),
      inputSchema: execSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    }, async (args) => jsonText(await execute(args, { domain: d.name })));
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

app.get('/healthz', (req, res) => res.json({ ok: true, service: 'azab-daftra-mcp', version: '2.0.0', operation_count: catalogSummary.operation_count, group_count: catalogSummary.group_count, domain_count: catalogSummary.domain_count }));
const handler = createMcpHandler(() => buildServer());
const nodeHandler = toNodeHandler(handler);
app.all('/mcp', (req, res) => void nodeHandler(req, res, req.body));
app.listen(PORT, HOST, () => console.log(`Azab Daftra MCP v2 listening on http://${HOST}:${PORT}/mcp — ${catalogSummary.operation_count} operations / ${catalogSummary.group_count} groups`));
