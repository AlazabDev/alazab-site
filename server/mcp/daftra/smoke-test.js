'use strict';

const assert = require('assert');
const { catalogSummary, getOperation, searchOperations } = require('./registry');
const { plan, riskOf } = require('./planner');
const { validateOperationBody } = require('./schema-validator');

assert.strictEqual(catalogSummary.operation_count, 301, 'operation count');
assert.strictEqual(catalogSummary.group_count, 70, 'group count');
assert.strictEqual(catalogSummary.path_count, 206, 'path count');
assert.strictEqual(catalogSummary.methods.GET, 140, 'GET count');
assert.strictEqual(catalogSummary.methods.POST, 74, 'POST count');
assert.strictEqual(catalogSummary.methods.PUT, 44, 'PUT count');
assert.strictEqual(catalogSummary.methods.PATCH, 0, 'PATCH count');
assert.strictEqual(catalogSummary.methods.DELETE, 43, 'DELETE count');
assert.strictEqual(catalogSummary.groups.reduce((n, x) => n + x.count, 0), 301, 'group coverage');
assert.strictEqual(catalogSummary.domains.reduce((n, x) => n + x.count, 0), 301, 'domain coverage');

const cases = [
  ['اضافة مصروف', 'daftra.raw.post.expenses_format'],
  ['انشاء فاتورة شراء', 'daftra.raw.post.purchase_invoices_format'],
  ['تسجيل قيد محاسبي', 'daftra.raw.post.journals_format'],
  ['عرض الموردين', 'daftra.raw.get.suppliers_format'],
];

for (const [intent, expected] of cases) {
  const resolved = plan({ intent });
  assert.strictEqual(resolved.resolved, true, `intent did not resolve: ${intent}`);
  assert.strictEqual(resolved.operation.key, expected, `wrong operation for: ${intent}`);
}

const expenseCreate = getOperation('daftra.raw.post.expenses_format');
assert.strictEqual(expenseCreate.method, 'POST');
assert.strictEqual(getOperation('daftra.raw.get.expenses_id_format').method, 'GET');
assert.ok(validateOperationBody(expenseCreate, { Expense: { date: '2026-08-23' } }).some((x) => x.includes('amount')));
assert.deepStrictEqual(validateOperationBody(expenseCreate, { Expense: { amount: 1500, date: '2026-08-23' } }), []);

const legacyMutationGet = getOperation('daftra.raw.get.invoices_update_draft_id_draft_status_format');
assert.strictEqual(legacyMutationGet.method, 'GET');
assert.strictEqual(riskOf(legacyMutationGet), 'financial_write');

assert.ok(searchOperations('مراكز تكلفة', { limit: 5 }).some((x) => x.group.includes('Cost Centers')));
assert.ok(searchOperations('تغيير حالة الحجز', { limit: 10 }).some((x) => /change_status|status/.test(x.path)));

const actualGroups = new Map(catalogSummary.groups.map((x) => [x.name, x.count]));
assert.strictEqual(actualGroups.get('Endpoints/Finance/Expenses'), 5);
assert.strictEqual(actualGroups.get('Endpoints/Purchases/Purchase Invoices'), 4);
assert.strictEqual(actualGroups.get('Endpoints/Accounting/Journals'), 5);
assert.strictEqual(actualGroups.get('Endpoints/Suppliers'), 5);

console.log(JSON.stringify({
  ok: true,
  operation_count: catalogSummary.operation_count,
  path_count: catalogSummary.path_count,
  group_count: catalogSummary.group_count,
  domain_count: catalogSummary.domain_count,
  methods: catalogSummary.methods,
  intents: cases.map(([intent, operation_key]) => ({ intent, operation_key })),
  legacy_mutation_get_risk: riskOf(legacyMutationGet),
}, null, 2));
