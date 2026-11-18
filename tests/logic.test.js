import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../js/logic.js';
import * as F from '../js/finance-calc.js';
import { TABLES, buildBackup, validateBackup } from '../js/backup.js';

const T = (o = {}) => ({ id: 't1', status: 'todo', due_date: '2026-11-10', original_date: '2026-11-01', ...o });

/* ---- tasks ---- */
test('overdue detection', () => {
  assert.equal(L.isOverdue(T(), '2026-11-18'), true);
  assert.equal(L.isOverdue(T({ due_date: '2026-11-18' }), '2026-11-18'), false);
  assert.equal(L.isOverdue(T({ status: 'done' }), '2026-11-18'), false);
  assert.equal(L.isOverdue(T({ due_date: null }), '2026-11-18'), false);
});
test('complete task and recurrence', () => {
  const r = L.completeTask(T({ recurrence: 'weekly' }), new Date(2026, 10, 18));
  assert.equal(r.task.status, 'done'); assert.ok(r.task.completed_at);
  assert.equal(r.next.due_date, '2026-11-17'); assert.equal(r.next.status, 'todo');
  assert.equal(L.completeTask(r.task).next, null);
  assert.equal(L.completeTask(T({ recurrence: 'monthly', due_date: '2026-01-31' })).next.due_date, '2026-02-28');
});
test('reschedule keeps original date and records history; never auto-completes', () => {
  const r = L.rescheduleTask(T(), '2026-11-20', 'client delay');
  assert.equal(r.task.original_date, '2026-11-01'); assert.equal(r.task.status, 'todo');
  assert.deepEqual(r.history[0], { event: 'rescheduled', from_date: '2026-11-10', to_date: '2026-11-20', note: 'client delay' });
  assert.throws(() => L.rescheduleTask(T({ status: 'done' }), '2026-11-20'));
});
test('week start (Saturday default)', () => {
  assert.equal(L.weekStart('2026-11-18'), '2026-11-14');
  assert.equal(L.weekStart('2026-11-14'), '2026-11-14');
  assert.equal(L.weekStart('2026-11-18', 'monday'), '2026-11-16');
});

/* ---- time ---- */
test('timer start, pause, resume, stop', () => {
  const t0 = new Date('2026-11-18T10:00:00Z');
  let a = L.timerStart(t0);
  a = { ...a, ...L.timerPause(a, new Date('2026-11-18T10:30:00Z')) };
  assert.equal(a.accumulated_seconds, 1800);
  a = { ...a, ...L.timerResume(a, new Date('2026-11-18T11:00:00Z')) };
  a = { ...a, ...L.timerStop(a, new Date('2026-11-18T11:15:00Z')) };
  assert.equal(a.duration_minutes, 45); assert.equal(a.timer_state, 'stopped');
});
test('manual duration counts and overlaps are not double counted', () => {
  const acts = [
    { start_at: '2026-11-18T09:00:00Z', duration_minutes: 60 },
    { start_at: '2026-11-18T09:30:00Z', duration_minutes: 60 }, // overlaps 30 min
    { start_at: '2026-11-18T12:00:00Z', duration_minutes: 30 },
    { duration_minutes: 20 }];                                  // manual, no time
  assert.equal(L.trackedMinutes(acts), 90 + 30 + 20);
});

/* ---- habits ---- */
test('habit streak and consistency treat missing days as no data', () => {
  const logs = [['2026-11-18', true], ['2026-11-17', true], ['2026-11-15', true], ['2026-11-14', false]].map(([log_date, done]) => ({ log_date, done }));
  assert.equal(L.habitStreak(logs, '2026-11-18'), 2);
  assert.equal(L.habitStreak(logs, '2026-11-19'), 2); // today not logged yet, yesterday counts
  assert.deepEqual(L.consistency(logs, '2026-11-01', '2026-11-30'), { done: 3, logged: 4, pct: 75 });
  assert.equal(L.consistency([], '2026-11-01', '2026-11-30').pct, null);
});

/* ---- finance ---- */
const WS = 'w1', ACC = 'a1', ACC2 = 'a2';
const tx = (type, amount, o = {}) => ({ id: Math.random().toString(36), type, amount_minor: amount, status: 'posted', workspace_id: WS, txn_date: '2026-11-10', account_id: ACC, ...o });
const base = { transactions: [], invoices: [], payments: [] };

test('income and expense', () => {
  const s = F.summarize({ ...base, transactions: [tx('income', 500000), tx('expense', 120000)] });
  assert.equal(s.revenue, 500000); assert.equal(s.expenses, 120000); assert.equal(s.netProfit, 380000); assert.equal(s.netCashFlow, 380000);
});
test('transfers and owner money never touch revenue or expenses', () => {
  const data = { ...base, transactions: [tx('account_transfer', 999900, { to_account_id: ACC2 }), tx('owner_contribution', 300000), tx('owner_withdrawal', 100000), tx('income', 50000)] };
  const s = F.summarize(data);
  assert.equal(s.revenue, 50000); assert.equal(s.expenses, 0); assert.equal(s.netProfit, 50000);
  assert.equal(s.netCashFlow, 50000 + 300000 - 100000);
  assert.equal(F.accountBalance({ id: ACC, opening_balance_minor: 0 }, data.transactions), -999900 + 300000 - 100000 + 50000);
  assert.equal(F.accountBalance({ id: ACC2, opening_balance_minor: 0 }, data.transactions), 999900);
});
test('invoice partial payments: receivable is not cash', () => {
  const inv = { id: 'i1', workspace_id: WS, status: 'partially_paid', total_minor: 1000000, issue_date: '2026-11-05', due_date: '2026-11-30' };
  const pay = { invoice_id: 'i1', amount_minor: 400000 };
  const data = { transactions: [tx('income', 400000, { invoice_id: 'i1' })], invoices: [inv], payments: [pay] };
  const s = F.summarize(data);
  assert.equal(s.revenue, 1000000);        // billed, counted once
  assert.equal(s.cashCollected, 400000);   // only what was paid
  assert.equal(s.receivables, 600000);
  assert.notEqual(s.cashCollected, s.receivables);
  assert.equal(F.invoiceDisplayStatus(inv, [pay], '2026-12-05'), 'overdue');
  assert.equal(F.invoiceOutstanding({ ...inv, status: 'draft' }, []), 0);
  const voided = F.summarize({ ...data, payments: [{ ...pay, voided_at: 'x' }], transactions: [{ ...data.transactions[0], status: 'void' }] });
  assert.equal(voided.receivables, 1000000); assert.equal(voided.cashCollected, 0);
});
test('refunds reduce revenue and cash', () => {
  const s = F.summarize({ ...base, transactions: [tx('income', 200000), tx('refund', 50000)] });
  assert.equal(s.revenue, 150000); assert.equal(s.cashCollected, 150000); assert.equal(s.netCashFlow, 150000);
});
test('pending receivable/payable settle without double counting', () => {
  const r = tx('receivable', 70000, { id: 'r1', status: 'pending' }), p = tx('payable', 30000, { id: 'p1', status: 'pending' });
  let s = F.summarize({ ...base, transactions: [r, p] });
  assert.equal(s.revenue, 70000); assert.equal(s.receivables, 70000); assert.equal(s.payables, 30000); assert.equal(s.cashCollected, 0);
  const settled = [{ ...r, status: 'posted' }, tx('income', 70000, { settles_txn_id: 'r1' }), { ...p, status: 'posted' }, tx('expense', 30000, { settles_txn_id: 'p1' })];
  s = F.summarize({ ...base, transactions: settled });
  assert.equal(s.revenue, 70000); assert.equal(s.expenses, 30000); assert.equal(s.receivables, 0); assert.equal(s.cashCollected, 70000);
});
test('void rows are ignored and workspaces stay separate', () => {
  const data = { ...base, transactions: [tx('income', 100), tx('income', 900, { status: 'void' }), tx('income', 700, { workspace_id: 'w2' })] };
  assert.equal(F.summarize(data, { workspace_id: WS }).revenue, 100);
  assert.equal(F.summarize(data, { workspace_id: 'w2' }).revenue, 700);
});
test('freelance commission', () => {
  assert.equal(F.commissionMinor(1000000, 'percent', 20), 200000);
  assert.equal(F.commissionMinor(1000000, 'fixed', 1500.5), 150050);
  assert.equal(F.commissionMinor(1000, 'fixed', 99999), 1000);
  const p = { id: 'p1', contract_value_minor: 1000000, commission_type: 'percent', commission_value: 25 };
  const b = F.freelanceBreakdown(p, { ...base, transactions: [tx('income', 300000, { project_id: 'p1' })] });
  assert.deepEqual(b, { gross: 1000000, commission: 250000, net: 750000, collected: 300000, remaining: 450000 });
});
test('project profitability', () => {
  const data = { ...base, transactions: [tx('income', 800000, { project_id: 'p1' }), tx('expense', 150000, { project_id: 'p1' }), tx('expense', 999, { project_id: 'p2' })] };
  assert.equal(F.projectProfitability({ id: 'p1', contract_value_minor: 1000000 }, data).netProfit, 650000);
});
test('store order and product profitability', () => {
  const o = { status: 'paid', quantity: 2, unit_price_minor: 30000, unit_cost_minor: 10000, packaging_minor: 2000, delivery_minor: 5000, processing_minor: 1000, ad_minor: 4000, refund_minor: 0 };
  assert.deepEqual(F.orderProfit(o), { revenue: 60000, gross: 40000, net: 28000, costs: 12000 });
  assert.equal(F.orderProfit({ ...o, refund_minor: 30000 }).revenue, 30000);
  assert.equal(F.orderProfit({ ...o, status: 'cancelled' }).net, 0);
  const perf = F.productPerformance([{ id: 'p', name: 'Frame' }], [{ ...o, product_id: 'p' }]);
  assert.equal(perf[0].net, 28000); assert.equal(perf[0].units, 2);
});
test('monthly cash flow ignores transfers', () => {
  const m = F.monthlyCashFlow([tx('income', 100), tx('expense', 40), tx('account_transfer', 5000, { to_account_id: ACC2 }), tx('income', 7, { txn_date: '2026-12-01' })]);
  assert.deepEqual(m.map(x => [x.month, x.net]), [['2026-11', 60], ['2026-12', 7]]);
});

/* ---- backup ---- */
const empty = () => Object.fromEntries(TABLES.map(t => [t, []]));
test('backup export, validate and round trip', () => {
  const tables = empty();
  tables.workspaces = [{ id: 'w1', name: 'RK Tech' }]; tables.projects = [{ id: 'p1', workspace_id: 'w1' }];
  const json = JSON.stringify(buildBackup(tables));
  const restored = JSON.parse(json);
  const v = validateBackup(restored);
  assert.equal(v.ok, true); assert.equal(v.counts.projects, 1);
  assert.deepEqual(restored.tables.projects, tables.projects);
});
test('backup validation rejects broken files', () => {
  assert.equal(validateBackup(null).ok, false);
  assert.equal(validateBackup({ app: 'other', version: 1, tables: {} }).ok, false);
  const t = empty(); t.projects = [{ id: 'p1', workspace_id: 'missing' }];
  const v = validateBackup(buildBackup(t));
  assert.equal(v.ok, false); assert.match(v.errors.join(), /missing workspaces/);
  t.projects = []; delete t.tasks;
  assert.match(validateBackup(buildBackup(t)).errors.join(), /Missing table: tasks/);
});

/* ---- integration: project -> tasks -> activities -> money -> dashboard totals ---- */
test('dashboard totals reflect project work end to end', () => {
  const project = { id: 'p1', workspace_id: WS, contract_value_minor: 2000000 };
  const tasks = [T({ id: 'a', project_id: 'p1', status: 'done' }), T({ id: 'b', project_id: 'p1', due_date: '2026-11-18' }), T({ id: 'c', project_id: 'p1', due_date: '2026-11-01' })];
  const acts = [{ project_id: 'p1', start_at: '2026-11-18T08:00:00Z', duration_minutes: 120 }, { project_id: 'p1', start_at: '2026-11-18T09:00:00Z', duration_minutes: 60 }];
  const inv = { id: 'i1', workspace_id: WS, project_id: 'p1', status: 'sent', total_minor: 2000000, issue_date: '2026-11-02', due_date: '2026-12-02' };
  const data = { transactions: [tx('income', 500000, { invoice_id: 'i1', project_id: 'p1' }), tx('expense', 200000, { project_id: 'p1' })], invoices: [inv], payments: [{ invoice_id: 'i1', amount_minor: 500000 }] };
  assert.equal(L.taskStats(tasks).rate, 33);
  assert.equal(tasks.filter(t => L.isOverdue(t, '2026-11-18')).length, 1);
  assert.equal(L.trackedMinutes(acts), 120);
  const s = F.summarize(data, { workspace_id: WS, from: '2026-11-01', to: '2026-11-30' });
  assert.deepEqual([s.revenue, s.cashCollected, s.expenses, s.netProfit, s.receivables], [2000000, 500000, 200000, 1800000, 1500000]);
  assert.equal(F.projectProfitability(project, data).netProfit, 1800000);
});
