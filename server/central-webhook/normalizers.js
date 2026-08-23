'use strict';

function text(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function normalizeSeverity(value) {
  const v = String(value || 'info').toLowerCase();
  if (['debug', 'info', 'notice', 'warning', 'error', 'critical'].includes(v)) return v;
  if (['warn'].includes(v)) return 'warning';
  if (['fatal', 'emergency'].includes(v)) return 'critical';
  return 'info';
}

function github(req) {
  const eventName = String(req.headers['x-github-event'] || 'unknown');
  const delivery = String(req.headers['x-github-delivery'] || '');
  const body = req.body || {};
  let severity = 'info';
  let title = `GitHub: ${eventName}`;
  let summary = '';

  if (eventName === 'workflow_run') {
    const run = body.workflow_run || {};
    title = `GitHub Actions: ${run.name || 'workflow'}`;
    summary = `${run.status || ''}${run.conclusion ? ` / ${run.conclusion}` : ''} — ${body.repository?.full_name || ''}`.trim();
    if (run.conclusion === 'failure' || run.conclusion === 'cancelled' || run.conclusion === 'timed_out') severity = 'error';
    else if (run.conclusion === 'success') severity = 'notice';
  } else if (eventName === 'push') {
    title = `GitHub Push: ${body.repository?.full_name || ''}`;
    summary = `${body.pusher?.name || body.sender?.login || 'unknown'} → ${body.ref || ''} (${(body.commits || []).length} commits)`;
  } else if (eventName === 'pull_request') {
    title = `GitHub PR #${body.number || ''}: ${body.action || ''}`;
    summary = `${body.pull_request?.title || ''} — ${body.repository?.full_name || ''}`;
    if (body.action === 'closed' && body.pull_request?.merged) severity = 'notice';
  } else if (eventName === 'issues') {
    title = `GitHub Issue #${body.issue?.number || ''}: ${body.action || ''}`;
    summary = `${body.issue?.title || ''} — ${body.repository?.full_name || ''}`;
  } else {
    summary = `${body.repository?.full_name || body.organization?.login || ''} ${body.action || ''}`.trim();
  }

  return {
    source: 'github',
    event_type: `github.${eventName}.${body.action || 'event'}`,
    severity,
    external_id: delivery || `${eventName}:${body.repository?.id || 'repo'}:${body.sender?.id || Date.now()}`,
    title,
    summary,
    payload: body,
    received_at: new Date().toISOString(),
  };
}

function generic(source, req) {
  const body = req.body || {};
  const externalId = body.event_id || body.id || body.request_id || req.headers['x-event-id'] || req.headers['x-request-id'];
  return {
    source,
    event_type: body.event_type || body.type || body.event || `${source}.event`,
    severity: normalizeSeverity(body.severity || body.level || body.priority),
    external_id: text(externalId, `${source}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`),
    title: text(body.title || body.name || body.event_type || body.type, `${source} event`).slice(0, 300),
    summary: text(body.summary || body.message || body.description || '').slice(0, 2000),
    payload: body,
    received_at: body.timestamp || body.created_at || new Date().toISOString(),
  };
}

module.exports = { github, generic, normalizeSeverity };
