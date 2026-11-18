import { sb, S, $, $$, esc, fmtDate, fmtMonth, fmtMoney, toMinor, fromMinor, label, today, must, opts, wsDot, wsById, projById, empty, stat, bars, toast, modal, confirmBox, formModal, refresh, routes, projectOptions, wsOptions } from './core.js';
import { monthStart, monthEnd } from './logic.js';
import { summarize, accountBalance, monthlyCashFlow, invoicePaid, invoiceOutstanding, invoiceDisplayStatus, freelanceBreakdown, projectProfitability, orderProfit, productPerformance } from './finance-calc.js';

const TYPES = ['income', 'expense', 'receivable', 'payable', 'owner_contribution', 'owner_withdrawal', 'account_transfer', 'refund'];
const CASH = ['income', 'expense', 'owner_contribution', 'owner_withdrawal', 'refund', 'account_transfer'];
const METHODS = [['', '—'], ['cash', 'Cash'], ['bank_transfer', 'Bank transfer'], ['wallet', 'Wallet'], ['instapay', 'InstaPay'], ['card', 'Card'], ['other', 'Other']];
const F = { tab: 'summary', from: monthStart(today()), to: monthEnd(today()), ws: '', type: '', status: '', q: '', invStatus: '' };
const friendly = e => /txn_unique_ref/.test(e.message) ? new Error('That reference number is already used by another transaction.') : /payment_no_dupes/.test(e.message) ? new Error('This looks like a duplicate payment (same invoice, date, amount and reference). Add a different reference if it is a separate payment.') : e;
const acctOptions = (none = true) => [...(none ? [['', '— none —']] : []), ...S.accounts.filter(a => !a.archived_at).map(a => [a.id, a.name])];

/* ---------- transaction form ---------- */
export function txnForm(t, replaces = null) {
  const d = t || {};
  formModal(replaces ? 'Correct transaction (replaces the old one)' : 'New transaction', [
    { id: 'type', label: 'Type', type: 'select', options: TYPES.map(x => [x, label(x)]), value: d.type || 'income' },
    { id: 'txn_date', label: 'Date', type: 'date', required: true, value: d.txn_date || today() },
    { id: 'amount_minor', label: 'Amount (EGP)', type: 'money', required: true, value: d.amount_minor },
    { id: 'workspace_id', label: 'Workspace', type: 'select', options: wsOptions(), value: d.workspace_id || S.ws.find(w => !w.archived_at)?.id },
    { id: 'project_id', label: 'Project (sets workspace)', type: 'select', options: projectOptions(), value: d.project_id || '' },
    { id: 'category_id', label: 'Category', type: 'select', options: [['', '— none —'], ...S.categories.filter(c => c.kind === 'transaction').map(c => [c.id, c.name])], value: d.category_id || '' },
    { id: 'account_id', label: 'Account (or transfer from)', type: 'select', options: acctOptions(), value: d.account_id || (S.accounts[0]?.id ?? '') },
    { id: 'to_account_id', label: 'Transfer to account', type: 'select', options: acctOptions(), value: d.to_account_id || '' },
    { id: 'payment_method', label: 'Payment method', type: 'select', options: METHODS, value: d.payment_method || '' },
    { id: 'status', label: 'Status (receivable/payable: pending = still owed)', type: 'select', options: ['posted', 'pending'], value: d.status === 'void' ? 'posted' : d.status || 'posted' },
    { id: 'description', label: 'Description', full: true, value: d.description },
    { id: 'reference_no', label: 'Reference number', value: replaces && d.reference_no ? d.reference_no + '-R' : d.reference_no },
    { id: 'notes', label: 'Notes', type: 'textarea', value: d.notes }], async v => {
    if (!(v.amount_minor > 0)) throw new Error('Amount must be greater than zero');
    if (CASH.includes(v.type) && !v.account_id) throw new Error('Choose the account this money moved through');
    if (v.type === 'account_transfer' && (!v.to_account_id || v.to_account_id === v.account_id)) throw new Error('A transfer needs two different accounts');
    const p = v.project_id && projById(v.project_id);
    const row = { ...v, workspace_id: p ? p.workspace_id : v.workspace_id, project_id: v.project_id || null, category_id: v.category_id || null, account_id: CASH.includes(v.type) ? v.account_id : null,
      to_account_id: v.type === 'account_transfer' ? v.to_account_id : null, status: ['receivable', 'payable'].includes(v.type) && !t ? 'pending' : v.status };
    if (['receivable', 'payable'].includes(v.type) && v.status === 'posted' && !replaces) row.status = 'pending';
    try { await must(sb.from('transactions').insert(row)); } catch (e) { throw friendly(e); }
    if (replaces) await must(sb.rpc('void_txn', { p_txn: replaces.id, p_reason: 'Corrected by a new entry' }));
    toast(replaces ? 'Corrected. The old entry is kept as void' : 'Transaction saved'); refresh();
  }, 'Save transaction', true);
}
const voidTxn = t => formModal('Void transaction', [{ id: 'reason', label: 'Reason', required: true, full: true }], async v => { try { await must(sb.rpc('void_txn', { p_txn: t.id, p_reason: v.reason })); } catch (e) { throw friendly(e); } toast('Voided. The record is kept'); refresh(); }, 'Void');
const settle = t => formModal(`Settle ${label(t.type)}`, [{ id: 'account', label: 'Account', type: 'select', options: acctOptions(false) }, { id: 'date', label: 'Date', type: 'date', value: today(), required: true }],
  async v => { await must(sb.rpc('settle_txn', { p_txn: t.id, p_account: v.account, p_date: v.date })); toast('Settled'); refresh(); }, 'Settle');

/* ---------- page ---------- */
routes.finance = async v => {
  const [transactions, invoices, payments] = await Promise.all([must(sb.from('transactions').select('*').order('txn_date', { ascending: false }).order('created_at', { ascending: false }).limit(5000)), must(sb.from('invoices').select('*').order('issue_date', { ascending: false }).limit(2000)), must(sb.from('invoice_payments').select('*').limit(5000))]);
  const data = { transactions, invoices, payments };
  const tabs = ['summary', 'transactions', 'invoices', 'accounts', 'store'];
  v.innerHTML = `<div class="row between"><div><h1>Finance</h1><p class="muted">Internal management accounting, not certified tax software. Amounts in ${esc(S.prefs.currency)}.</p></div>
    <div class="row"><button id="nt" class="pri">+ Transaction</button><button id="ni">+ Invoice</button></div></div>
    <div class="tabs" style="margin:12px 0">${tabs.map(x => `<button data-t="${x}" class="${F.tab === x ? 'on' : ''}">${label(x)}</button>`).join('')}</div><div id="fv"></div>`;
  $('#nt').onclick = () => txnForm(); $('#ni').onclick = () => invoiceForm();
  $$('[data-t]', v).forEach(b => b.onclick = () => { F.tab = b.dataset.t; refresh(); });
  await ({ summary, transactions: txTab, invoices: invTab, accounts: accTab, store: storeTab }[F.tab])($('#fv'), data);
};

const rangeBar = () => `<div class="row" style="margin-bottom:12px"><label class="row" style="margin:0">From <input type="date" id="rf" value="${F.from}" style="width:150px"></label><label class="row" style="margin:0">To <input type="date" id="rt" value="${F.to}" style="width:150px"></label>
  <select id="rw" style="width:180px" aria-label="Workspace"><option value="">All workspaces</option>${S.ws.map(w => `<option value="${w.id}" ${F.ws === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select></div>`;
const bindRange = el => { $('#rf', el).onchange = e => { F.from = e.target.value; refresh(); }; $('#rt', el).onchange = e => { F.to = e.target.value; refresh(); }; $('#rw', el).onchange = e => { F.ws = e.target.value; refresh(); }; };

function summary(el, data) {
  const f = { from: F.from, to: F.to, workspace_id: F.ws || undefined }, s = summarize(data, f), t0 = today();
  const wsRows = S.ws.filter(w => !w.archived_at).map(w => ({ w, ...summarize(data, { from: F.from, to: F.to, workspace_id: w.id }) }));
  const free = S.projects.filter(p => p.commission_type && (!F.ws || p.workspace_id === F.ws));
  const projRows = S.projects.filter(p => !F.ws || p.workspace_id === F.ws).map(p => ({ p, ...projectProfitability(p, data) })).filter(r => r.revenue || r.expenses || r.contract);
  const open = [...data.invoices.filter(i => (!F.ws || i.workspace_id === F.ws) && invoiceOutstanding(i, data.payments) > 0).map(i => ({ k: 'Invoice ' + i.invoice_no, d: i.due_date, a: invoiceOutstanding(i, data.payments), st: invoiceDisplayStatus(i, data.payments, t0) })),
    ...data.transactions.filter(x => ['receivable', 'payable'].includes(x.type) && x.status === 'pending' && (!F.ws || x.workspace_id === F.ws)).map(x => ({ k: `${label(x.type)}: ${x.description || ''}`, d: x.txn_date, a: x.amount_minor, st: x.type }))];
  el.innerHTML = rangeBar() + `<div class="grid">${stat('Revenue', fmtMoney(s.revenue), 'Recognized: invoices billed + sales − refunds')}${stat('Cash collected', fmtMoney(s.cashCollected), 'Money actually received')}${stat('Expenses', fmtMoney(s.expenses))}
    ${stat('Net profit', fmtMoney(s.netProfit), 'Revenue − expenses', s.netProfit < 0 ? 'neg' : '')}${stat('Net cash flow', fmtMoney(s.netCashFlow), 'Includes owner money; excludes transfers', s.netCashFlow < 0 ? 'neg' : '')}
    ${stat('Receivables', fmtMoney(s.receivables), 'Owed to you (not cash)')}${stat('Payables', fmtMoney(s.payables), 'You owe')}${stat('Owner contributions', fmtMoney(s.contributions), 'Not revenue')}${stat('Owner withdrawals', fmtMoney(s.withdrawals), 'Not an expense')}</div>
    <div class="card" style="margin-top:12px"><h2>By workspace</h2><table><thead><tr><th>Workspace</th><th>Revenue</th><th>Expenses</th><th>Net profit</th><th>Cash collected</th><th>Receivables</th></tr></thead><tbody>${wsRows.map(r => `<tr><td>${wsDot(r.w.id)}</td><td>${fmtMoney(r.revenue)}</td><td>${fmtMoney(r.expenses)}</td><td class="${r.netProfit < 0 ? 'neg' : ''}">${fmtMoney(r.netProfit)}</td><td>${fmtMoney(r.cashCollected)}</td><td>${fmtMoney(r.receivables)}</td></tr>`).join('')}</tbody></table></div>
    <div class="card" style="margin-top:12px"><h2>Monthly cash flow</h2>${bars(monthlyCashFlow(data.transactions, { workspace_id: F.ws || undefined, from: F.from, to: F.to }).map(m => ({ label: fmtMonth(m.month), value: m.net })), fmtMoney)}</div>
    <div class="card" style="margin-top:12px"><h2>Open receivables &amp; payables</h2>${open.length ? `<table><tbody>${open.map(o => `<tr><td>${esc(o.k)}</td><td>${fmtDate(o.d)}</td><td><span class="badge ${o.st === 'overdue' ? 'b-cancelled' : ''}">${label(o.st)}</span></td><td>${fmtMoney(o.a)}</td></tr>`).join('')}</tbody></table>` : empty('Nothing outstanding.')}</div>
    <div class="card" style="margin-top:12px"><h2>Project profitability</h2>${projRows.length ? `<table><thead><tr><th>Project</th><th>Contract</th><th>Revenue</th><th>Collected</th><th>Expenses</th><th>Profit</th></tr></thead><tbody>${projRows.map(r => `<tr><td>${esc(r.p.name)}</td><td>${fmtMoney(r.contract)}</td><td>${fmtMoney(r.revenue)}</td><td>${fmtMoney(r.cashCollected)}</td><td>${fmtMoney(r.expenses)}</td><td class="${r.netProfit < 0 ? 'neg' : ''}">${fmtMoney(r.netProfit)}</td></tr>`).join('')}</tbody></table>` : empty('No project money yet.')}</div>
    ${free.length ? `<div class="card" style="margin-top:12px"><h2>Freelance commission</h2><table><thead><tr><th>Project</th><th>Gross</th><th>Commission</th><th>My net</th><th>Collected</th><th>Remaining</th></tr></thead><tbody>${free.map(p => { const b = freelanceBreakdown(p, data); return `<tr><td>${esc(p.name)}</td><td>${fmtMoney(b.gross)}</td><td>${fmtMoney(b.commission)}</td><td>${fmtMoney(b.net)}</td><td>${fmtMoney(b.collected)}</td><td>${fmtMoney(b.remaining)}</td></tr>`; }).join('')}</tbody></table></div>` : ''}
    <div class="card" style="margin-top:12px"><h2>How numbers are calculated</h2><p class="muted small">Transfers between your accounts and owner contributions/withdrawals never change revenue or expenses. An unpaid invoice is a receivable, not cash; each payment is recorded separately and reduces the outstanding balance. Refunds reduce revenue and cash. Voided entries stay in history and are ignored in totals.</p></div>`;
  bindRange(el);
}

function txTab(el, data) {
  const q = F.q.toLowerCase();
  const rows = data.transactions.filter(t => (!F.ws || t.workspace_id === F.ws) && (!F.type || t.type === F.type) && (F.status === 'void' ? t.status === 'void' : t.status !== 'void' || F.status === 'all') && t.txn_date >= F.from && t.txn_date <= F.to && (!q || ((t.description || '') + (t.reference_no || '')).toLowerCase().includes(q)));
  el.innerHTML = rangeBar() + `<div class="row" style="margin-bottom:12px"><select id="ty" style="width:180px"><option value="">All types</option>${TYPES.map(x => `<option value="${x}" ${F.type === x ? 'selected' : ''}>${label(x)}</option>`).join('')}</select>
    <select id="st" style="width:160px"><option value="">Active</option><option value="void" ${F.status === 'void' ? 'selected' : ''}>Voided only</option><option value="all" ${F.status === 'all' ? 'selected' : ''}>Include voided</option></select><input id="qq" type="search" placeholder="Search description / reference" value="${esc(F.q)}" style="width:240px"></div>
    <div class="card">${rows.length ? `<table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Workspace / Project</th><th>Account</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(t => {
      const out = ['expense', 'owner_withdrawal', 'refund', 'payable'].includes(t.type), a = S.accounts.find(x => x.id === t.account_id), b = S.accounts.find(x => x.id === t.to_account_id);
      return `<tr class="${t.status === 'void' ? 'done' : ''}"><td>${fmtDate(t.txn_date)}</td><td>${label(t.type)}</td><td>${esc(t.description || '')}<div class="muted small">${esc(t.reference_no || '')}${t.void_reason ? ' · Void: ' + esc(t.void_reason) : ''}</div></td>
      <td>${wsDot(t.workspace_id)}<div class="muted small">${esc(projById(t.project_id)?.name || '')}</div></td><td>${esc(a?.name || '—')}${b ? ' → ' + esc(b.name) : ''}</td><td class="${out ? 'neg' : ''}">${out ? '−' : ''}${fmtMoney(t.amount_minor)}</td><td><span class="badge">${t.type === 'receivable' || t.type === 'payable' ? (t.status === 'pending' ? 'Open' : t.status === 'posted' ? 'Settled' : 'Void') : label(t.status)}</span></td>
      <td class="nowrap">${t.status === 'void' ? '' : t.invoice_id && t.type === 'income' ? '<span class="muted small">via invoice</span>' : `${t.status === 'pending' && ['receivable', 'payable'].includes(t.type) ? `<button class="sm pri" data-s="${t.id}">Settle</button> ` : ''}<button class="sm" data-c="${t.id}">Correct</button> <button class="sm" data-v="${t.id}">Void</button>`}</td></tr>`;
    }).join('')}</tbody></table>` : empty('No transactions in this view.', '<p class="muted small">Change the dates or add one with + Transaction.</p>')}</div>`;
  bindRange(el);
  $('#ty').onchange = e => { F.type = e.target.value; refresh(); }; $('#st').onchange = e => { F.status = e.target.value; refresh(); };
  $('#qq').onchange = e => { F.q = e.target.value; refresh(); };
  const by = id => data.transactions.find(t => t.id === id);
  $$('[data-s]', el).forEach(b => b.onclick = () => settle(by(b.dataset.s)));
  $$('[data-c]', el).forEach(b => b.onclick = () => txnForm(by(b.dataset.c), by(b.dataset.c)));
  $$('[data-v]', el).forEach(b => b.onclick = () => voidTxn(by(b.dataset.v)));
}

/* ---------- invoices ---------- */
function invTab(el, data) {
  const t0 = today();
  const rows = data.invoices.filter(i => (!F.ws || i.workspace_id === F.ws) && (!F.invStatus || invoiceDisplayStatus(i, data.payments, t0) === F.invStatus));
  el.innerHTML = `<div class="row" style="margin-bottom:12px"><select id="rw" style="width:180px"><option value="">All workspaces</option>${S.ws.map(w => `<option value="${w.id}" ${F.ws === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select>
    <select id="is" style="width:170px"><option value="">All statuses</option>${opts(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'], F.invStatus)}</select></div>
    <div class="card">${rows.length ? `<table><thead><tr><th>Invoice</th><th>Client / Project</th><th>Issued</th><th>Due</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>${rows.map(i => { const st = invoiceDisplayStatus(i, data.payments, t0);
      return `<tr class="click" data-i="${i.id}"><td>${esc(i.invoice_no)}</td><td>${esc(S.clients.find(c => c.id === i.client_id)?.name || '—')}<div class="muted small">${esc(projById(i.project_id)?.name || '')}</div></td><td>${fmtDate(i.issue_date)}</td><td>${fmtDate(i.due_date)}</td><td>${fmtMoney(i.total_minor)}</td><td>${fmtMoney(invoicePaid(i, data.payments))}</td><td>${fmtMoney(invoiceOutstanding(i, data.payments))}</td><td><span class="badge ${st === 'overdue' ? 'b-cancelled' : st === 'paid' ? 'b-active' : ''}">${label(st)}</span></td></tr>`; }).join('')}</tbody></table>` : empty('No invoices yet.', '<button id="ni2" class="pri">Create an invoice</button>')}</div>`;
  $('#rw').onchange = e => { F.ws = e.target.value; refresh(); }; $('#is').onchange = e => { F.invStatus = e.target.value; refresh(); };
  $('#ni2') && ($('#ni2').onclick = () => invoiceForm());
  $$('tr.click', el).forEach(r => r.onclick = () => invoiceDetail(data.invoices.find(i => i.id === r.dataset.i), data));
}

function invoiceForm() {
  const m = modal('New invoice', `<form id="inv"><div class="fg">
    <div class="f"><label for="iw">Workspace</label><select id="iw">${wsOptions().map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></div>
    <div class="f"><label for="ip">Project (sets workspace and client)</label><select id="ip">${projectOptions().map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></div>
    <div class="f"><label for="ic">Client</label><select id="ic"><option value="">— none —</option>${S.clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <div class="f"><label for="in">Invoice number (blank = automatic)</label><input id="in" maxlength="40"></div>
    <div class="f"><label for="id">Issue date</label><input id="id" type="date" value="${today()}" required></div><div class="f"><label for="iu">Due date</label><input id="iu" type="date"></div>
    <div class="f"><label for="is">Status</label><select id="is"><option value="draft">Draft</option><option value="sent">Sent</option></select></div><div class="f"><label for="inn">Notes</label><input id="inn"></div>
    <div class="full"><label>Items</label><div id="items"></div><button type="button" class="sm" id="ai">+ Item</button> <b style="float:right" id="tot"></b></div>
    <div class="row end full"><button type="button" id="cx">Cancel</button><button class="pri">Create invoice</button></div></div></form>`, true);
  const items = $('#items', m.el);
  const addItem = () => { const r = document.createElement('div'); r.className = 'item-row'; r.innerHTML = '<input placeholder="Description" class="d" required><input type="number" class="q" min="0.01" step="0.01" value="1" aria-label="Quantity"><input type="number" class="p" min="0" step="0.01" placeholder="Unit price" required aria-label="Unit price"><button type="button" class="sm" aria-label="Remove item">✕</button>'; $('button', r).onclick = () => { r.remove(); calc(); }; items.append(r); calc(); };
  const rowsData = () => $$('.item-row', items).map(r => ({ description: $('.d', r).value.trim(), quantity: Number($('.q', r).value), unit_price_minor: toMinor($('.p', r).value) }));
  const calc = () => { $('#tot', m.el).textContent = 'Total: ' + fmtMoney(rowsData().reduce((s, i) => s + Math.round(i.quantity * i.unit_price_minor), 0)); };
  items.addEventListener('input', calc); addItem(); $('#ai', m.el).onclick = addItem; $('#cx', m.el).onclick = m.close;
  $('#ip', m.el).onchange = e => { const p = projById(e.target.value); if (p) { $('#iw', m.el).value = p.workspace_id; if (p.client_id) $('#ic', m.el).value = p.client_id; } };
  $('#inv', m.el).onsubmit = async e => {
    e.preventDefault();
    const its = rowsData();
    if (!its.length || its.some(i => !i.description || !(i.quantity > 0))) return toast('Every item needs a description and quantity', true);
    if ($('#iu', m.el).value && $('#iu', m.el).value < $('#id', m.el).value) return toast('Due date cannot be before the issue date', true);
    try {
      await must(sb.rpc('create_invoice', { p: { workspace_id: $('#iw', m.el).value, project_id: $('#ip', m.el).value, client_id: $('#ic', m.el).value, invoice_no: $('#in', m.el).value, issue_date: $('#id', m.el).value, due_date: $('#iu', m.el).value, status: $('#is', m.el).value, notes: $('#inn', m.el).value, items: its } }));
      m.close(); toast('Invoice created'); F.tab = 'invoices'; refresh();
    } catch (er) { toast(/invoices_user_id_invoice_no_key/.test(er.message) ? 'That invoice number already exists' : er.message, true); }
  };
}

async function invoiceDetail(inv, data) {
  const [items] = await Promise.all([must(sb.from('invoice_items').select('*').eq('invoice_id', inv.id).order('created_at'))]);
  const pays = data.payments.filter(p => p.invoice_id === inv.id).sort((a, b) => a.paid_on.localeCompare(b.paid_on)), st = invoiceDisplayStatus(inv, data.payments, today());
  const m = modal(`Invoice ${inv.invoice_no}`, `<p class="muted">${esc(S.clients.find(c => c.id === inv.client_id)?.name || 'No client')} · ${wsById(inv.workspace_id)?.name} · Issued ${fmtDate(inv.issue_date)} · Due ${fmtDate(inv.due_date)} · <span class="badge">${label(st)}</span></p>
    <table><tbody>${items.map(i => `<tr><td>${esc(i.description)}</td><td>${i.quantity} × ${fmtMoney(i.unit_price_minor)}</td><td>${fmtMoney(Math.round(i.quantity * i.unit_price_minor))}</td></tr>`).join('')}
    <tr><td colspan="2"><b>Total</b></td><td><b>${fmtMoney(inv.total_minor)}</b></td></tr><tr><td colspan="2">Paid</td><td>${fmtMoney(invoicePaid(inv, data.payments))}</td></tr><tr><td colspan="2"><b>Outstanding</b></td><td><b>${fmtMoney(invoiceOutstanding(inv, data.payments))}</b></td></tr></tbody></table>
    <h2 style="margin-top:16px">Payments</h2>${pays.length ? `<table><tbody>${pays.map(p => `<tr class="${p.voided_at ? 'done' : ''}"><td>${fmtDate(p.paid_on)}</td><td>${fmtMoney(p.amount_minor)}</td><td>${esc(p.reference_no || '')}${p.voided_at ? ' · voided' : ''}</td><td>${p.voided_at ? '' : `<button class="sm" data-vp="${p.id}">Void</button>`}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No payments yet.</p>'}
    <div class="row end" style="margin-top:12px">${inv.status === 'draft' ? '<button id="snt" class="pri">Mark as sent</button>' : ''}${['sent', 'partially_paid'].includes(inv.status) ? '<button id="pay" class="pri">Record payment</button>' : ''}${inv.status !== 'cancelled' && !pays.some(p => !p.voided_at) ? '<button id="cnl" class="danger">Cancel invoice</button>' : ''}<button id="cl">Close</button></div>`, true);
  const act = fn => async () => { try { await fn(); m.close(); refresh(); } catch (e) { toast(friendly(e).message, true); } };
  $('#cl', m.el).onclick = m.close;
  $('#snt', m.el) && ($('#snt', m.el).onclick = act(async () => { await must(sb.rpc('set_invoice_status', { p_invoice: inv.id, p_status: 'sent' })); toast('Marked as sent'); }));
  $('#cnl', m.el) && ($('#cnl', m.el).onclick = async () => { if (await confirmBox('Cancel this invoice? It stays in history but no longer counts as revenue.', 'Cancel invoice')) act(async () => { await must(sb.rpc('set_invoice_status', { p_invoice: inv.id, p_status: 'cancelled' })); toast('Invoice cancelled'); })(); });
  $('#pay', m.el) && ($('#pay', m.el).onclick = () => { m.close(); formModal('Record payment', [
    { id: 'amount', label: 'Amount (EGP)', type: 'money', required: true, value: invoiceOutstanding(inv, data.payments) }, { id: 'date', label: 'Paid on', type: 'date', required: true, value: today() },
    { id: 'account', label: 'Received in account', type: 'select', options: acctOptions(false) }, { id: 'ref', label: 'Reference (optional)' }], async v => {
    if (!(v.amount > 0)) throw new Error('Amount must be greater than zero');
    try { await must(sb.rpc('record_invoice_payment', { p_invoice: inv.id, p_account: v.account, p_amount: v.amount, p_date: v.date, p_ref: v.ref || '' })); } catch (e) { throw friendly(e); }
    toast('Payment recorded'); refresh();
  }, 'Record payment'); });
  $$('[data-vp]', m.el).forEach(b => b.onclick = async () => { if (await confirmBox('Void this payment? The invoice balance goes back up and the record is kept.', 'Void payment')) act(async () => { await must(sb.rpc('void_invoice_payment', { p_payment: b.dataset.vp, p_reason: 'Voided from invoice' })); toast('Payment voided'); })(); });
}

/* ---------- accounts ---------- */
function accTab(el, data) {
  const active = S.accounts.filter(a => !a.archived_at);
  el.innerHTML = `<div class="row between" style="margin-bottom:12px"><span class="muted">Balances = opening balance + posted money in/out. Transfers only move money between accounts.</span><div class="row"><button id="tr">Transfer between accounts</button><button id="na" class="pri">+ Account</button></div></div>
    <div class="grid">${S.accounts.map(a => `<div class="card ${a.archived_at ? 'done' : ''}"><div class="row between"><b>${esc(a.name)}</b><span class="badge">${label(a.type)}</span></div><div class="stat">${fmtMoney(accountBalance(a, data.transactions.filter(t => t.status !== 'void')))}</div>
      <div class="muted small">Opening ${fmtMoney(a.opening_balance_minor)}</div><div class="row" style="margin-top:8px"><button class="sm" data-e="${a.id}">Edit</button><button class="sm" data-a="${a.id}">${a.archived_at ? 'Restore' : 'Archive'}</button></div></div>`).join('') || empty('No accounts.')}</div>
    <div class="card" style="margin-top:12px"><b>Total across active accounts: ${fmtMoney(active.reduce((s, a) => s + accountBalance(a, data.transactions), 0))}</b></div>`;
  const form = a => formModal(a ? 'Edit account' : 'New account', [{ id: 'name', label: 'Name', required: true, value: a?.name }, { id: 'type', label: 'Type', type: 'select', options: ['cash', 'bank', 'wallet', 'other'], value: a?.type || 'cash' }, { id: 'opening_balance_minor', label: 'Opening balance (EGP)', type: 'money', value: a?.opening_balance_minor ?? 0 }],
    async v => { const row = { ...v, opening_balance_minor: v.opening_balance_minor || 0 }; try { a ? await must(sb.from('accounts').update(row).eq('id', a.id)) : await must(sb.from('accounts').insert(row)); } catch (e) { throw new Error(/duplicate/.test(e.message) ? 'An account with that name exists' : e.message); } toast('Account saved'); refresh(); });
  $('#na').onclick = () => form(); $('#tr').onclick = () => txnForm({ type: 'account_transfer' });
  $$('[data-e]', el).forEach(b => b.onclick = () => form(S.accounts.find(a => a.id === b.dataset.e)));
  $$('[data-a]', el).forEach(b => b.onclick = async () => { const a = S.accounts.find(x => x.id === b.dataset.a); try { await must(sb.from('accounts').update({ archived_at: a.archived_at ? null : new Date().toISOString() }).eq('id', a.id)); refresh(); } catch (e) { toast(e.message, true); } });
}

/* ---------- RK Store ---------- */
async function storeTab(el) {
  const [products, orders] = await Promise.all([must(sb.from('products').select('*').is('archived_at', null).order('name')), must(sb.from('orders').select('*').order('order_date', { ascending: false }).limit(2000))]);
  const perf = productPerformance(products, orders), PF = ['selling_price_minor', 'unit_cost_minor', 'packaging_minor', 'delivery_minor', 'processing_minor', 'ad_minor'];
  const pForm = p => formModal(p ? 'Edit product' : 'New product', [{ id: 'name', label: 'Name', required: true, value: p?.name }, { id: 'sku', label: 'SKU', value: p?.sku },
    { id: 'selling_price_minor', label: 'Selling price', type: 'money', value: p?.selling_price_minor ?? 0 }, { id: 'unit_cost_minor', label: 'Manufacturing cost / unit', type: 'money', value: p?.unit_cost_minor ?? 0 },
    { id: 'packaging_minor', label: 'Packaging / order', type: 'money', value: p?.packaging_minor ?? 0 }, { id: 'delivery_minor', label: 'Delivery / order', type: 'money', value: p?.delivery_minor ?? 0 },
    { id: 'processing_minor', label: 'Payment processing / order', type: 'money', value: p?.processing_minor ?? 0 }, { id: 'ad_minor', label: 'Advertising allocation / order', type: 'money', value: p?.ad_minor ?? 0 }],
    async v => { const row = { ...v }; PF.forEach(k => (row[k] ||= 0)); try { p ? await must(sb.from('products').update(row).eq('id', p.id)) : await must(sb.from('products').insert(row)); } catch (e) { throw new Error(/duplicate/.test(e.message) ? 'A product with that name exists' : e.message); } toast('Product saved'); refresh(); }, 'Save product', true);
  const oForm = o => {
    if (!products.length) return toast('Add a product first', true);
    const base = o || {}, p0 = products.find(p => p.id === base.product_id) || products[0];
    const m = formModal(o ? 'Edit order' : 'New order', [{ id: 'product_id', label: 'Product', type: 'select', options: products.map(p => [p.id, p.name]), value: p0.id }, { id: 'order_date', label: 'Date', type: 'date', required: true, value: base.order_date || today() },
      { id: 'customer_name', label: 'Customer', value: base.customer_name }, { id: 'customer_phone', label: 'Phone', value: base.customer_phone }, { id: 'customer_address', label: 'Address', full: true, value: base.customer_address },
      { id: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true, value: base.quantity || 1 }, { id: 'status', label: 'Status', type: 'select', options: ['new', 'paid', 'shipped', 'delivered', 'returned', 'cancelled'], value: base.status || 'new' },
      { id: 'unit_price_minor', label: 'Unit price', type: 'money', value: base.unit_price_minor ?? p0.selling_price_minor }, { id: 'unit_cost_minor', label: 'Unit manufacturing cost', type: 'money', value: base.unit_cost_minor ?? p0.unit_cost_minor },
      { id: 'packaging_minor', label: 'Packaging', type: 'money', value: base.packaging_minor ?? p0.packaging_minor }, { id: 'delivery_minor', label: 'Delivery', type: 'money', value: base.delivery_minor ?? p0.delivery_minor },
      { id: 'processing_minor', label: 'Payment processing', type: 'money', value: base.processing_minor ?? p0.processing_minor }, { id: 'ad_minor', label: 'Advertising allocation', type: 'money', value: base.ad_minor ?? p0.ad_minor },
      { id: 'refund_minor', label: 'Refund / return amount', type: 'money', value: base.refund_minor ?? 0 }, { id: 'notes', label: 'Notes', type: 'textarea', value: base.notes }], async v => {
      const row = { ...v }; ['unit_price_minor', 'unit_cost_minor', 'packaging_minor', 'delivery_minor', 'processing_minor', 'ad_minor', 'refund_minor'].forEach(k => (row[k] ||= 0));
      if (row.refund_minor > row.quantity * row.unit_price_minor) throw new Error('Refund cannot exceed the order value');
      o ? await must(sb.from('orders').update(row).eq('id', o.id)) : await must(sb.from('orders').insert(row)); toast('Order saved'); refresh();
    }, 'Save order', true);
    if (!o) $('#f_product_id', m.el).onchange = e => { const p = products.find(x => x.id === e.target.value); [['unit_price_minor', 'selling_price_minor'], ['unit_cost_minor', 'unit_cost_minor'], ['packaging_minor', 'packaging_minor'], ['delivery_minor', 'delivery_minor'], ['processing_minor', 'processing_minor'], ['ad_minor', 'ad_minor']].forEach(([f, k]) => ($('#f_' + f, m.el).value = fromMinor(p[k]))); };
  };
  el.innerHTML = `<p class="muted small">RK Store analysis. Orders do not create transactions: record the customer's payment in Transactions as Income (workspace RK Store).</p>
    <div class="card"><div class="row between"><h2>Product performance</h2><button class="sm pri" id="np">+ Product</button></div>${perf.length ? `<table><thead><tr><th>Product</th><th>Orders</th><th>Units</th><th>Revenue</th><th>Gross profit</th><th>Net profit</th><th>Margin</th><th></th></tr></thead><tbody>${perf.map(r => `<tr><td>${esc(r.product.name)}<div class="muted small">Price ${fmtMoney(r.product.selling_price_minor)} · cost ${fmtMoney(r.product.unit_cost_minor)}</div></td><td>${r.orders}</td><td>${r.units}</td><td>${fmtMoney(r.revenue)}</td><td>${fmtMoney(r.gross)}</td><td class="${r.net < 0 ? 'neg' : ''}">${fmtMoney(r.net)}</td><td>${r.margin == null ? '—' : r.margin + '%'}</td><td><button class="sm" data-p="${r.product.id}">Edit</button></td></tr>`).join('')}</tbody></table>` : empty('No products yet.')}</div>
    <div class="card" style="margin-top:12px"><div class="row between"><h2>Orders</h2><button class="sm pri" id="no">+ Order</button></div>${orders.length ? `<table><thead><tr><th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Revenue</th><th>Net profit</th><th>Status</th><th></th></tr></thead><tbody>${orders.map(o => { const x = orderProfit(o); return `<tr><td>${fmtDate(o.order_date)}</td><td>${esc(o.customer_name || '—')}<div class="muted small">${esc(o.customer_phone || '')}</div></td><td>${esc(products.find(p => p.id === o.product_id)?.name || '—')}</td><td>${o.quantity}</td><td>${fmtMoney(x.revenue)}</td><td class="${x.net < 0 ? 'neg' : ''}">${fmtMoney(x.net)}</td><td><span class="badge">${label(o.status)}</span></td><td><button class="sm" data-o="${o.id}">Edit</button></td></tr>`; }).join('')}</tbody></table>` : empty('No orders yet.')}</div>`;
  $('#np').onclick = () => pForm(); $('#no').onclick = () => oForm();
  $$('[data-p]', el).forEach(b => b.onclick = () => pForm(products.find(p => p.id === b.dataset.p)));
  $$('[data-o]', el).forEach(b => b.onclick = () => oForm(orders.find(o => o.id === b.dataset.o)));
}
