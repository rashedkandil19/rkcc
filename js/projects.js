import { sb, S, $, esc, fmtDate, fmtMoney, fmtMins, toMinor, fromMinor, label, today, must, opts, safeUrl, wsById, activeWs, empty, stat, toast, modal, confirmBox, formModal, loadLists, refresh, routes } from './core.js';
import { isOverdue, trackedMinutes, activityMinutes } from './logic.js';
import { projectProfitability, freelanceBreakdown, invoiceOutstanding, invoiceDisplayStatus } from './finance-calc.js';

const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

async function viewProjectsInner(v) {
  const f = viewProjects.f || (viewProjects.f = { ws: '', status: '', archived: false });
  let q = sb.from('projects').select('*, clients(name)').order('created_at', { ascending: false });
  q = f.archived ? q.not('archived_at', 'is', null) : q.is('archived_at', null);
  if (f.ws) q = q.eq('workspace_id', f.ws);
  if (f.status) q = q.eq('status', f.status);
  const rows = await must(q);
  const t = today();
  v.innerHTML = `<div class="row between"><div><h1>Projects &amp; Workspaces</h1><p class="muted">A workspace holds many projects.</p></div><button id="np" class="pri">+ New Project</button></div>
    <div class="row" style="margin:12px 0"><select id="fw" aria-label="Workspace" style="width:180px"><option value="">All workspaces</option>${S.ws.map(w => `<option value="${w.id}" ${w.id === f.ws ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select>
      <select id="fs" aria-label="Status" style="width:160px"><option value="">All statuses</option>${opts(STATUSES, f.status)}</select>
      <label class="row" style="margin:0"><input type="checkbox" id="fa" style="width:auto" ${f.archived ? 'checked' : ''}> Show archived</label></div>
    <div class="card">${rows.length ? `<table><thead><tr><th>Project</th><th>Workspace</th><th>Status</th><th>Priority</th><th>Deadline</th><th>Contract value</th></tr></thead><tbody>
    ${rows.map(p => `<tr class="click" data-id="${p.id}"><td>${esc(p.name)}<div class="muted">${esc(p.clients?.name || '')}</div></td>
      <td><span class="dot" style="background:${esc(wsById(p.workspace_id)?.color)}"></span>${esc(wsById(p.workspace_id)?.name)}</td>
      <td><span class="badge b-${p.status}">${label(p.status)}</span></td><td>${label(p.priority)}</td>
      <td style="${p.deadline && p.deadline < t && ['planning', 'active'].includes(p.status) ? 'color:var(--bad)' : ''}">${fmtDate(p.deadline)}</td><td>${fmtMoney(p.contract_value_minor)}</td></tr>`).join('')}</tbody></table>`
      : `<div class="empty"><p>No projects match.</p><button id="np2" class="pri">Create a project</button></div>`}</div>`;
  $('#np').onclick = () => projectForm();
  $('#np2') && ($('#np2').onclick = () => projectForm());
  $('#fw').onchange = e => { f.ws = e.target.value; refresh(); };
  $('#fs').onchange = e => { f.status = e.target.value; refresh(); };
  $('#fa').onchange = e => { f.archived = e.target.checked; refresh(); };
  v.querySelectorAll('tr.click').forEach(tr => tr.onclick = () => (location.hash = '#/project/' + tr.dataset.id));
}

async function viewProject(v, id) {
  const p = await must(sb.from('projects').select('*, clients(name,email,phone)').eq('id', id).maybeSingle());
  if (!p) { v.innerHTML = '<div class="card empty">Project not found. <a href="#/projects">Back to projects</a></div>'; return; }
  const att = await must(sb.from('attachments').select('*').eq('project_id', id).order('created_at'));
  const w = wsById(p.workspace_id);
  const [tasks, acts, txs, invs] = await Promise.all([
    must(sb.from('tasks').select('*').eq('project_id', id).is('archived_at', null).order('due_date', { nullsFirst: false })),
    must(sb.from('activities').select('*').eq('project_id', id).is('archived_at', null).order('activity_date', { ascending: false })),
    must(sb.from('transactions').select('*').eq('project_id', id)),
    must(sb.from('invoices').select('*').eq('project_id', id))]);
  const pays = invs.length ? await must(sb.from('invoice_payments').select('*').in('invoice_id', invs.map(i => i.id))) : [];
  const data = { transactions: txs, invoices: invs, payments: pays };
  const fin = projectProfitability(p, data), fl = p.commission_type ? freelanceBreakdown(p, data) : null;
  const t0 = today();
  const extra = `
    <div class="grid" style="margin-bottom:12px">
      ${stat('Revenue (recognized)', fmtMoney(fin.revenue))}${stat('Cash collected', fmtMoney(fin.cashCollected), 'Money actually received')}
      ${stat('Outstanding', fmtMoney(fin.receivables), 'Invoiced, not yet paid')}${stat('Expenses', fmtMoney(fin.expenses))}
      ${stat('Profit', fmtMoney(fin.netProfit), 'Revenue minus expenses', fin.netProfit < 0 ? 'neg' : '')}${stat('Time tracked', fmtMins(trackedMinutes(acts)))}</div>
    ${fl ? `<div class="card" style="margin-bottom:12px"><h2>Freelance commission</h2><table><tbody>
      <tr><td>Gross project value</td><td>${fmtMoney(fl.gross)}</td></tr><tr><td>Intermediary commission (${p.commission_type === 'percent' ? p.commission_value + '%' : 'fixed'})</td><td>− ${fmtMoney(fl.commission)}</td></tr>
      <tr><td><b>My net amount</b></td><td><b>${fmtMoney(fl.net)}</b></td></tr><tr><td>Collected so far</td><td>${fmtMoney(fl.collected)}</td></tr><tr><td>Remaining</td><td>${fmtMoney(fl.remaining)}</td></tr></tbody></table></div>` : ''}
    <div class="card" style="margin-bottom:12px"><h2>Tasks (${tasks.length})</h2>${tasks.length ? `<table><tbody>${tasks.map(t => `<tr><td>${esc(t.title)}</td><td><span class="badge">${label(t.status)}</span></td><td style="${isOverdue(t, t0) ? 'color:var(--bad)' : ''}">${fmtDate(t.due_date)}</td></tr>`).join('')}</tbody></table>` : empty('No tasks linked to this project.')}</div>
    <div class="card" style="margin-bottom:12px"><h2>Activities (${acts.length})</h2>${acts.length ? `<table><tbody>${acts.slice(0, 15).map(a => `<tr><td>${fmtDate(a.activity_date)}</td><td>${esc(a.title)}</td><td>${label(a.activity_type)}</td><td>${fmtMins(activityMinutes(a))}</td></tr>`).join('')}</tbody></table>` : empty('No activities recorded.')}</div>
    <div class="card" style="margin-bottom:12px"><h2>Invoices &amp; payments</h2>${invs.length ? `<table><tbody>${invs.map(i => `<tr><td>${esc(i.invoice_no)}</td><td>${fmtMoney(i.total_minor)}</td><td>Outstanding ${fmtMoney(invoiceOutstanding(i, pays))}</td><td><span class="badge">${label(invoiceDisplayStatus(i, pays, t0))}</span></td></tr>`).join('')}</tbody></table>` : empty('No invoices for this project.')}</div>
    <div class="card"><h2>Timeline</h2>${(() => {
      const ev = [...tasks.map(t => ({ d: t.due_date || t.original_date, t: 'Task due: ' + t.title })), ...acts.map(a => ({ d: a.activity_date, t: 'Activity: ' + a.title })), ...txs.filter(x => x.status !== 'void').map(x => ({ d: x.txn_date, t: `${label(x.type)} ${fmtMoney(x.amount_minor)}` })), ...invs.map(i => ({ d: i.issue_date, t: 'Invoice ' + i.invoice_no }))].filter(e => e.d).sort((x, y) => y.d.localeCompare(x.d)).slice(0, 25);
      return ev.length ? `<table><tbody>${ev.map(e => `<tr><td style="width:120px">${fmtDate(e.d)}</td><td>${esc(e.t)}</td></tr>`).join('')}</tbody></table>` : empty('Nothing on the timeline yet.');
    })()}</div>`;
  v.innerHTML = `<a href="#/projects" class="muted">← Projects</a>
    <div class="row between"><div><h1>${esc(p.name)} ${p.archived_at ? '<span class="badge">Archived</span>' : ''}</h1>
      <div class="muted"><span class="dot" style="background:${esc(w?.color)}"></span>${esc(w?.name)} · <span class="badge b-${p.status}">${label(p.status)}</span> · ${label(p.priority)} priority</div></div>
      <div class="row"><button id="ed">Edit</button><button id="ar" class="${p.archived_at ? '' : 'danger'}">${p.archived_at ? 'Restore' : 'Archive'}</button></div></div>
    <div class="grid" style="margin:16px 0">
      <div class="card"><div class="muted">Contract value</div><div class="stat">${fmtMoney(p.contract_value_minor)}</div></div>
      <div class="card"><div class="muted">Budget</div><div class="stat">${fmtMoney(p.budget_minor)}</div></div>
      <div class="card"><div class="muted">Dates</div><div>Start: ${fmtDate(p.start_date)}</div><div>Deadline: ${fmtDate(p.deadline)}</div></div>
      <div class="card"><div class="muted">Client</div><div>${esc(p.clients?.name || '—')}</div><div class="muted">${esc([p.clients?.email, p.clients?.phone].filter(Boolean).join(' · '))}</div></div></div>
    <div class="card" style="margin-bottom:12px"><h2>Description</h2><p>${esc(p.description || 'No description.')}</p></div>
    <div class="card" style="margin-bottom:12px"><h2>Notes</h2><textarea id="notes" rows="4">${esc(p.notes || '')}</textarea><div style="margin-top:8px"><button id="sn" class="pri sm">Save notes</button></div></div>
    <div class="card" style="margin-bottom:12px"><div class="row between"><h2>Files &amp; URLs</h2><button id="aa" class="sm">+ Add</button></div>
      ${att.length ? `<table><tbody>${att.map(a => `<tr><td>${esc(label(a.kind))}</td><td>${a.kind === 'url' && safeUrl(a.location) ? `<a href="${esc(a.location)}" target="_blank" rel="noopener noreferrer">${esc(a.label)}</a>` : esc(a.label)}<div class="muted">${esc(a.location)}</div></td><td style="text-align:right"><button class="sm" data-del="${a.id}">Remove</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">No references yet.</div>'}</div>
    ${extra}`;
  $('#ed').onclick = () => projectForm(p);
  $('#ar').onclick = async () => {
    if (!p.archived_at && !(await confirmBox('Archive this project? It is hidden from lists but nothing is deleted.', 'Archive'))) return;
    try { await must(sb.from('projects').update({ archived_at: p.archived_at ? null : new Date().toISOString() }).eq('id', id)); toast(p.archived_at ? 'Restored' : 'Archived'); refresh(); } catch (e) { toast(e.message, true); }
  };
  $('#sn').onclick = async () => { try { await must(sb.from('projects').update({ notes: $('#notes').value }).eq('id', id)); toast('Notes saved'); } catch (e) { toast(e.message, true); } };
  $('#aa').onclick = () => {
    const m = modal('Add file or URL', `<form><div class="f"><label for="ak">Type</label><select id="ak"><option value="url">URL</option><option value="file">Local file path</option></select></div>
      <div class="f"><label for="al">Label</label><input id="al" required maxlength="120"></div><div class="f"><label for="ao">URL or path</label><input id="ao" required maxlength="1000"></div>
      <div class="row" style="justify-content:flex-end"><button type="button" id="c">Cancel</button><button class="pri">Add</button></div></form>`);
    $('#c', m.el).onclick = m.close;
    $('form', m.el).onsubmit = async e => {
      e.preventDefault();
      const kind = $('#ak', m.el).value, loc = $('#ao', m.el).value.trim();
      if (kind === 'url' && !safeUrl(loc)) return toast('URL must start with http:// or https://', true);
      try { await must(sb.from('attachments').insert({ project_id: id, kind, label: $('#al', m.el).value.trim(), location: loc })); m.close(); toast('Added'); refresh(); } catch (er) { toast(er.message, true); }
    };
  };
  v.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (!(await confirmBox('Remove this reference?', 'Remove'))) return;
    try { await must(sb.from('attachments').delete().eq('id', b.dataset.del)); toast('Removed'); refresh(); } catch (e) { toast(e.message, true); }
  });
}

async function findOrCreateClient(name) {
  name = name.trim();
  if (!name) return null;
  const found = await must(sb.from('clients').select('id').eq('name', name).maybeSingle());
  if (found) return found.id;
  return (await must(sb.from('clients').insert({ name }).select('id').single())).id;
}

export async function projectForm(p) {
  const wsList = activeWs().concat(p && wsById(p.workspace_id)?.archived_at ? [wsById(p.workspace_id)] : []);
  if (!wsList.length) return toast('Create a workspace first (Settings)', true);
  const clientName = p?.client_id ? (await must(sb.from('clients').select('name').eq('id', p.client_id).maybeSingle()))?.name || '' : '';
  const m = modal(p ? 'Edit project' : 'New project', `<form>
    <div class="f"><label for="pn">Project name</label><input id="pn" required maxlength="140" value="${esc(p?.name || '')}"></div>
    <div class="two"><div class="f"><label for="pw">Workspace</label><select id="pw">${wsList.map(w => `<option value="${w.id}" ${w.id === p?.workspace_id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select></div>
      <div class="f"><label for="pc">Client (optional)</label><input id="pc" maxlength="120" value="${esc(clientName)}"></div></div>
    <div class="two"><div class="f"><label for="ps">Status</label><select id="ps">${opts(STATUSES, p?.status || 'planning')}</select></div>
      <div class="f"><label for="pp">Priority</label><select id="pp">${opts(PRIORITIES, p?.priority || 'medium')}</select></div></div>
    <div class="two"><div class="f"><label for="sd">Start date</label><input id="sd" type="date" value="${p?.start_date || ''}"></div>
      <div class="f"><label for="dl">Deadline</label><input id="dl" type="date" value="${p?.deadline || ''}"></div></div>
    <div class="two"><div class="f"><label for="bg">Budget (EGP)</label><input id="bg" type="number" min="0" step="0.01" value="${p ? fromMinor(p.budget_minor) : ''}"></div>
      <div class="f"><label for="cv">Contract value (EGP)</label><input id="cv" type="number" min="0" step="0.01" value="${p ? fromMinor(p.contract_value_minor) : ''}"></div></div>
    <div class="two"><div class="f"><label for="ct">Intermediary commission</label><select id="ct"><option value="">None</option><option value="percent" ${p?.commission_type === 'percent' ? 'selected' : ''}>Percentage of contract</option><option value="fixed" ${p?.commission_type === 'fixed' ? 'selected' : ''}>Fixed amount (EGP)</option></select></div>
      <div class="f"><label for="cm">Commission value</label><input id="cm" type="number" min="0" step="0.01" value="${p?.commission_value ?? ''}"></div></div>
    <div class="f"><label for="pd">Description</label><textarea id="pd" rows="3">${esc(p?.description || '')}</textarea></div>
    <div class="row" style="justify-content:flex-end"><button type="button" id="c">Cancel</button><button class="pri" id="sv">Save project</button></div></form>`);
  $('#c', m.el).onclick = m.close;
  $('form', m.el).onsubmit = async e => {
    e.preventDefault();
    const g = id => $('#' + id, m.el).value;
    const name = g('pn').trim();
    if (!name) return toast('Project name is required', true);
    if (g('sd') && g('dl') && g('dl') < g('sd')) return toast('Deadline cannot be before the start date', true);
    if (toMinor(g('bg')) < 0 || toMinor(g('cv')) < 0) return toast('Amounts cannot be negative', true);
    if (g('ct') === 'percent' && Number(g('cm')) > 100) return toast('Commission cannot be more than 100%', true);
    const btn = $('#sv', m.el); btn.disabled = true;
    try {
      const row = { name, workspace_id: g('pw'), client_id: await findOrCreateClient(g('pc')), status: g('ps'), priority: g('pp'),
        start_date: g('sd') || null, deadline: g('dl') || null, budget_minor: toMinor(g('bg')), contract_value_minor: toMinor(g('cv')), description: g('pd').trim() || null,
        commission_type: g('ct') || null, commission_value: g('ct') && g('cm') !== '' ? Number(g('cm')) : null };
      const saved = p ? await must(sb.from('projects').update(row).eq('id', p.id).select('id').single()) : await must(sb.from('projects').insert(row).select('id').single());
      m.close(); toast('Project saved');
      location.hash === '#/project/' + saved.id ? refresh() : (location.hash = '#/project/' + saved.id);
    } catch (er) { btn.disabled = false; toast(er.message, true); }
  };
}


export function clientForm(c) {
  formModal(c ? 'Edit client' : 'New client', [
    { id: 'name', label: 'Name', required: true, value: c?.name, max: 120 }, { id: 'company', label: 'Company', value: c?.company },
    { id: 'email', label: 'Email', type: 'email', value: c?.email }, { id: 'phone', label: 'Phone', value: c?.phone },
    { id: 'notes', label: 'Notes', type: 'textarea', value: c?.notes }], async v => {
    if (c) await must(sb.from('clients').update(v).eq('id', c.id)); else await must(sb.from('clients').insert(v));
    toast('Client saved'); await loadLists(); refresh();
  });
}

routes.projects = async v => {
  await viewProjectsInner(v);
  v.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:16px"><div class="row between"><h2>Clients</h2><button id="nc" class="sm pri">+ New client</button></div>
    ${S.clients.length ? `<table><tbody>${S.clients.map(c => `<tr><td>${esc(c.name)}<div class="muted">${esc(c.company || '')}</div></td><td>${esc([c.email, c.phone].filter(Boolean).join(' · '))}</td><td style="text-align:right"><button class="sm" data-c="${c.id}">Edit</button></td></tr>`).join('')}</tbody></table>` : empty('No clients yet.')}</div>`);
  $('#nc', v).onclick = () => clientForm();
  v.querySelectorAll('[data-c]').forEach(b => b.onclick = () => clientForm(S.clients.find(c => c.id === b.dataset.c)));
};
routes.project = (v, id) => viewProject(v, id);
