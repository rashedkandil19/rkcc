// Decimal-safe finance rules. All amounts are integer minor units (piasters). No DOM, no DB.
//
// Definitions
//  Revenue          = income not linked to an invoice or a settlement + non-draft/non-cancelled invoices
//                     (by issue date) + receivable entries - refunds
//  Expenses         = expense (not a settlement) + payable entries
//  Net profit       = revenue - expenses   (contributions, withdrawals, transfers are excluded)
//  Cash collected   = posted income - posted refunds
//  Net cash flow    = (income + contributions) - (expenses + withdrawals + refunds), posted only; transfers excluded
//  Receivables      = unpaid invoice balances + pending receivable entries   (NOT cash)
//  Payables         = pending payable entries
const live = t => t.status !== 'void';
const posted = t => t.status === 'posted';
const inRange = (d, f, t) => (!f || d >= f) && (!t || d <= t);
const sum = (arr, k) => arr.reduce((s, x) => s + Number(x[k] || 0), 0);

export const invoiceBilled = inv => inv.status !== 'draft' && inv.status !== 'cancelled';
export function invoicePaid(inv, payments) { return payments.filter(p => p.invoice_id === inv.id && !p.voided_at).reduce((s, p) => s + Number(p.amount_minor), 0); }
export const invoiceOutstanding = (inv, payments) => (invoiceBilled(inv) ? Math.max(0, Number(inv.total_minor) - invoicePaid(inv, payments)) : 0);
/** Display status: stored status, upgraded to overdue when unpaid past the due date. */
export function invoiceDisplayStatus(inv, payments, today) {
  if (['sent', 'partially_paid'].includes(inv.status) && inv.due_date && inv.due_date < today && invoiceOutstanding(inv, payments) > 0) return 'overdue';
  return inv.status;
}

export function summarize({ transactions = [], invoices = [], payments = [] }, f = {}) {
  const okWs = x => !f.workspace_id || x.workspace_id === f.workspace_id;
  const okPr = x => !f.project_id || x.project_id === f.project_id;
  const tx = transactions.filter(t => live(t) && okWs(t) && okPr(t));
  const inPeriod = tx.filter(t => inRange(t.txn_date, f.from, f.to));
  const of = type => inPeriod.filter(t => t.type === type);
  const cash = type => of(type).filter(posted);

  const invs = invoices.filter(i => invoiceBilled(i) && okWs(i) && okPr(i) && inRange(i.issue_date, f.from, f.to));
  const incomeDirect = cash('income').filter(t => !t.invoice_id && !t.settles_txn_id);
  const refunds = sum(cash('refund'), 'amount_minor');
  const revenue = sum(incomeDirect, 'amount_minor') + sum(invs, 'total_minor') + sum(of('receivable'), 'amount_minor') - refunds;
  const expenseDirect = cash('expense').filter(t => !t.settles_txn_id);
  const expenses = sum(expenseDirect, 'amount_minor') + sum(of('payable'), 'amount_minor');

  const cashIn = sum(cash('income'), 'amount_minor');
  const contributions = sum(cash('owner_contribution'), 'amount_minor');
  const cashOut = sum(cash('expense'), 'amount_minor');
  const withdrawals = sum(cash('owner_withdrawal'), 'amount_minor');
  const cashCollected = cashIn - refunds;

  const openInv = invoices.filter(i => okWs(i) && okPr(i));
  const receivables = openInv.reduce((s, i) => s + invoiceOutstanding(i, payments), 0)
    + sum(tx.filter(t => t.type === 'receivable' && t.status === 'pending'), 'amount_minor');
  const payables = sum(tx.filter(t => t.type === 'payable' && t.status === 'pending'), 'amount_minor');

  return { revenue, expenses, netProfit: revenue - expenses, cashCollected, cashIn, cashOut, refunds, contributions, withdrawals,
    netCashFlow: cashIn + contributions - cashOut - withdrawals - refunds, receivables, payables };
}

export function accountBalance(account, transactions) {
  let b = Number(account.opening_balance_minor || 0);
  for (const t of transactions) {
    if (!posted(t)) continue;
    const a = Number(t.amount_minor);
    if (t.account_id === account.id) b += ['income', 'owner_contribution'].includes(t.type) ? a : ['expense', 'owner_withdrawal', 'refund', 'account_transfer'].includes(t.type) ? -a : 0;
    if (t.type === 'account_transfer' && t.to_account_id === account.id) b += a;
  }
  return b;
}

export function monthlyCashFlow(transactions, f = {}) {
  const out = {};
  for (const t of transactions) {
    if (!live(t) || !posted(t) || t.type === 'account_transfer' || !['income', 'expense', 'owner_contribution', 'owner_withdrawal', 'refund'].includes(t.type)) continue;
    if (f.workspace_id && t.workspace_id !== f.workspace_id) continue;
    if (!inRange(t.txn_date, f.from, f.to)) continue;
    const m = t.txn_date.slice(0, 7), r = (out[m] ||= { month: m, in: 0, out: 0, net: 0 });
    const a = Number(t.amount_minor), inflow = ['income', 'owner_contribution'].includes(t.type);
    inflow ? (r.in += a) : (r.out += a);
    r.net = r.in - r.out;
  }
  return Object.values(out).sort((a, b) => a.month.localeCompare(b.month));
}

export function commissionMinor(grossMinor, type, value) {
  if (!type || !value) return 0;
  const c = type === 'fixed' ? Math.round(Number(value) * 100) : Math.round(Number(grossMinor) * Number(value) / 100);
  return Math.min(Math.max(c, 0), Number(grossMinor));
}
/** Freelance: gross (contract) - intermediary commission = my net. Collected = what I actually received. */
export function freelanceBreakdown(project, data) {
  const gross = Number(project.contract_value_minor || 0);
  const commission = commissionMinor(gross, project.commission_type, project.commission_value);
  const net = gross - commission;
  const s = summarize(data, { project_id: project.id });
  return { gross, commission, net, collected: s.cashCollected, remaining: Math.max(0, net - s.cashCollected) };
}
export function projectProfitability(project, data) {
  const s = summarize(data, { project_id: project.id });
  return { ...s, contract: Number(project.contract_value_minor || 0), budget: Number(project.budget_minor || 0) };
}

export function orderProfit(o) {
  if (o.status === 'cancelled') return { revenue: 0, gross: 0, net: 0, costs: 0 };
  const revenue = o.quantity * o.unit_price_minor - o.refund_minor;
  const gross = revenue - o.quantity * o.unit_cost_minor;
  const costs = o.packaging_minor + o.delivery_minor + o.processing_minor + o.ad_minor;
  return { revenue, gross, net: gross - costs, costs };
}
export function productPerformance(products, orders) {
  return products.map(p => {
    const os = orders.filter(o => o.product_id === p.id && o.status !== 'cancelled');
    const t = os.reduce((a, o) => { const x = orderProfit(o); return { revenue: a.revenue + x.revenue, gross: a.gross + x.gross, net: a.net + x.net, units: a.units + o.quantity }; }, { revenue: 0, gross: 0, net: 0, units: 0 });
    return { product: p, orders: os.length, ...t, margin: t.revenue ? Math.round(t.net / t.revenue * 1000) / 10 : null };
  });
}
