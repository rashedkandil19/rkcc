import { sb, S, $, $$, esc, fmtDate, fmtMins, label, today, must, opts, wsDot, wsById, projById, empty, toast, modal, confirmBox, formModal, loadLists, refresh, routes, projectOptions, wsOptions } from './core.js';
import { isOverdue, isOpen, addDays, addMonths, weekStart, monthStart, parseDate, toISODate } from './logic.js';

const TYPES = ['must_do', 'additional', 'backlog'], PRIORITIES = ['low', 'medium', 'high', 'urgent'], STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];
const V = { view: 'list', ws: '', project: '', priority: '', status: 'open', type: '', q: '', month: today().slice(0, 7) + '-01' };

export function taskForm(t, defaults = {}) {
  const d = t || defaults;
  const cats = [['', '— none —'], ...S.categories.filter(c => c.kind === 'task').map(c => [c.id, c.name])];
  formModal(t ? 'Edit task' : 'New task', [
    { id: 'title', label: 'Title', required: true, full: true, value: d.title, max: 200 },
    { id: 'description', label: 'Description', type: 'textarea', value: d.description },
    { id: 'workspace_id', label: 'Workspace', type: 'select', options: wsOptions(), value: d.workspace_id || S.ws.find(w => !w.archived_at)?.id },
    { id: 'project_id', label: 'Project (sets workspace)', type: 'select', options: projectOptions(), value: d.project_id || '' },
    { id: 'task_type', label: 'Task type', type: 'select', options: TYPES, value: d.task_type || 'must_do' },
    { id: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, value: d.priority || 'medium' },
    { id: 'status', label: 'Status', type: 'select', options: STATUSES, value: d.status || 'todo' },
    { id: 'due_date', label: 'Due date', type: 'date', value: d.due_date ?? (t ? '' : today()) },
    { id: 'category_id', label: 'Category', type: 'select', options: cats, value: d.category_id || '' },
    { id: 'recurrence', label: 'Repeats', type: 'select', options: [['', 'Never'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']], value: d.recurrence || '' },
    { id: 'estimated_minutes', label: 'Estimated minutes', type: 'number', min: 0, value: d.estimated_minutes },
    { id: 'actual_minutes', label: 'Actual minutes', type: 'number', min: 0, value: d.actual_minutes ?? 0 },
    { id: 'notes', label: 'Notes', type: 'textarea', value: d.notes }], async v => {
    const p = v.project_id && projById(v.project_id);
    const row = { ...v, workspace_id: p ? p.workspace_id : v.workspace_id, project_id: v.project_id || null, category_id: v.category_id || null, recurrence: v.recurrence || null, actual_minutes: v.actual_minutes || 0 };
    if (row.status === 'done' && !t?.completed_at) row.completed_at = new Date().toISOString();
    if (row.status !== 'done') row.completed_at = null;
    if (t) await must(sb.from('tasks').update(row).eq('id', t.id)); else await must(sb.from('tasks').insert(row));
    toast('Task saved'); refresh();
  }, 'Save task', true);
}

const complete = async t => { try { await must(sb.rpc('complete_task', { p_task: t.id })); toast(t.recurrence ? 'Done. Next occurrence created' : 'Task completed'); refresh(); } catch (e) { toast(e.message, true); } };
function reschedule(t, to) {
  formModal('Move task to another date', [{ id: 'date', label: 'New due date', type: 'date', required: true, value: to || today() }, { id: 'note', label: 'Reason (optional)', value: '' }],
    async v => { await must(sb.rpc('reschedule_task', { p_task: t.id, p_date: v.date, p_note: v.note || '' })); toast('Task moved. History kept'); refresh(); }, 'Move task');
}
async function duplicate(t) {
  const { id, created_at, updated_at, completed_at, ...rest } = t;
  try { await must(sb.from('tasks').insert({ ...rest, title: t.title + ' (copy)', status: 'todo', actual_minutes: 0, original_date: today(), user_id: undefined })); toast('Task duplicated'); refresh(); } catch (e) { toast(e.message, true); }
}
async function archive(t) {
  if (!(await confirmBox(`Delete "${t.title}"? It is hidden from every list; linked activities are kept.`, 'Delete'))) return;
  try { await must(sb.from('tasks').update({ archived_at: new Date().toISOString() }).eq('id', t.id)); toast('Task deleted'); refresh(); } catch (e) { toast(e.message, true); }
}

function filtered(tasks) {
  const t0 = today(), q = V.q.toLowerCase();
  return tasks.filter(t => (!V.ws || t.workspace_id === V.ws) && (!V.project || t.project_id === V.project) && (!V.priority || t.priority === V.priority) && (!V.type || t.task_type === V.type)
    && (V.status === 'open' ? isOpen(t) : V.status === 'overdue' ? isOverdue(t, t0) : !V.status || t.status === V.status) && (!q || (t.title + ' ' + (t.description || '')).toLowerCase().includes(q)));
}

const actions = t => `<button class="sm" data-a="edit" title="Edit">Edit</button> ${isOpen(t) ? '<button class="sm" data-a="done">Done</button> <button class="sm" data-a="move">Move</button>' : ''} <button class="sm" data-a="dup">Copy</button> <button class="sm" data-a="del">Delete</button>`;
const badge = (t, t0, moves) => `${isOverdue(t, t0) ? '<span class="badge b-cancelled">Overdue</span> ' : ''}${moves[t.id] ? `<span class="badge" title="${esc(moves[t.id].join(' → '))}">↻ ${moves[t.id].length - 1}</span> ` : ''}`;

routes.tasks = async v => {
  const [tasks, hist] = await Promise.all([
    must(sb.from('tasks').select('*').is('archived_at', null).order('sort_order').order('created_at')),
    must(sb.from('task_history').select('task_id,from_date,to_date,created_at').eq('event', 'rescheduled').order('created_at'))]);
  const moves = {}; for (const h of hist) (moves[h.task_id] ||= [h.from_date ? fmtDate(h.from_date) : '—']).push(fmtDate(h.to_date));
  const t0 = today(), list = filtered(tasks), overdueAll = tasks.filter(t => isOverdue(t, t0));
  v.innerHTML = `<div class="row between"><div><h1>Tasks</h1><p class="muted">${list.length} shown · ${overdueAll.length} overdue</p></div>
    <div class="row">${overdueAll.length ? '<button id="cf">Carry overdue to today</button>' : ''}<button id="nt" class="pri">+ New Task</button></div></div>
    <div class="row" style="margin:12px 0">
      <div class="tabs">${['list', 'kanban', 'calendar'].map(x => `<button data-v="${x}" class="${V.view === x ? 'on' : ''}">${label(x)}</button>`).join('')}</div>
      <select id="fw" aria-label="Workspace"><option value="">All workspaces</option>${S.ws.map(w => `<option value="${w.id}" ${V.ws === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select>
      <select id="fp" aria-label="Project"><option value="">All projects</option>${S.projects.map(p => `<option value="${p.id}" ${V.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      <select id="fr" aria-label="Priority"><option value="">Any priority</option>${opts(PRIORITIES, V.priority)}</select>
      <select id="fs" aria-label="Status"><option value="open" ${V.status === 'open' ? 'selected' : ''}>Open</option><option value="overdue" ${V.status === 'overdue' ? 'selected' : ''}>Overdue</option><option value="">All</option>${opts(STATUSES, V.status)}</select>
      <select id="ft" aria-label="Type"><option value="">Any type</option>${opts(TYPES, V.type)}</select>
      <input id="fq" type="search" placeholder="Search tasks" value="${esc(V.q)}" style="width:180px"></div><div id="tv"></div>`;
  $('#nt').onclick = () => taskForm();
  $('#cf') && ($('#cf').onclick = async () => {
    if (!(await confirmBox(`Move ${overdueAll.length} overdue task(s) to today? Original dates and history are kept.`, 'Move'))) return;
    try { for (const t of overdueAll) await must(sb.rpc('reschedule_task', { p_task: t.id, p_date: t0, p_note: 'Carried forward' })); toast('Tasks carried forward'); refresh(); } catch (e) { toast(e.message, true); }
  });
  $$('[data-v]', v).forEach(b => b.onclick = () => { V.view = b.dataset.v; refresh(); });
  const bind = (id, key) => { $(id).onchange = e => { V[key] = e.target.value; refresh(); }; };
  bind('#fw', 'ws'); bind('#fp', 'project'); bind('#fr', 'priority'); bind('#fs', 'status'); bind('#ft', 'type');
  $('#fq').onkeydown = e => { if (e.key === 'Enter') { V.q = e.target.value; refresh(); } };
  $('#fq').onblur = e => { if (e.target.value !== V.q) { V.q = e.target.value; refresh(); } };
  const tv = $('#tv');
  (V.view === 'kanban' ? kanban : V.view === 'calendar' ? calendar : listView)(tv, list, tasks, moves, t0);
  const byId = Object.fromEntries(tasks.map(t => [t.id, t]));
  tv.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const t = byId[b.closest('[data-id]').dataset.id];
    ({ edit: () => taskForm(t), done: () => complete(t), move: () => reschedule(t), dup: () => duplicate(t), del: () => archive(t) })[b.dataset.a]();
  });
};

function listView(el, list, all, moves, t0) {
  if (!list.length) { el.innerHTML = `<div class="card">${empty('No tasks match these filters.', '<button id="nt2" class="pri">Create a task</button>')}</div>`; $('#nt2', el).onclick = () => taskForm(); return; }
  el.innerHTML = `<div class="card"><p class="muted small">Drag rows to reorder.</p><table><thead><tr><th>Task</th><th>Workspace / Project</th><th>Type</th><th>Priority</th><th>Due</th><th>Est. / Actual</th><th></th></tr></thead><tbody id="tb">
    ${list.map(t => `<tr draggable="true" data-id="${t.id}" class="${t.status === 'done' ? 'done' : ''}"><td>${badge(t, t0, moves)}${esc(t.title)}<div class="muted small">${label(t.status)}</div></td>
    <td>${wsDot(t.workspace_id)}<div class="muted small">${esc(projById(t.project_id)?.name || '')}</div></td><td>${label(t.task_type)}</td><td>${label(t.priority)}</td>
    <td style="${isOverdue(t, t0) ? 'color:var(--bad)' : ''}">${fmtDate(t.due_date)}</td><td>${t.estimated_minutes != null ? fmtMins(t.estimated_minutes) : '—'} / ${fmtMins(t.actual_minutes)}</td><td class="nowrap">${actions(t)}</td></tr>`).join('')}</tbody></table></div>`;
  let dragged = null;
  const rows = () => $$('#tb tr', el);
  rows().forEach(tr => {
    tr.ondragstart = () => { dragged = tr; tr.classList.add('drag'); };
    tr.ondragend = () => tr.classList.remove('drag');
    tr.ondragover = e => e.preventDefault();
    tr.ondrop = async e => {
      e.preventDefault(); if (!dragged || dragged === tr) return;
      const all = rows(), from = all.indexOf(dragged), to = all.indexOf(tr);
      from < to ? tr.after(dragged) : tr.before(dragged);
      const order = rows().map(r => r.dataset.id);
      try { await Promise.all(order.map((id, i) => must(sb.from('tasks').update({ sort_order: i + 1 }).eq('id', id)))); toast('Order saved'); } catch (er) { toast(er.message, true); }
    };
  });
}

function kanban(el, list, all, moves, t0) {
  el.innerHTML = `<div class="kanban">${STATUSES.map(s => `<div class="col" data-s="${s}"><h3>${label(s)} <span class="muted">${list.filter(t => t.status === s).length}</span></h3>
    ${list.filter(t => t.status === s).map(t => `<div class="kcard" draggable="true" data-id="${t.id}">${badge(t, t0, moves)}<b>${esc(t.title)}</b>
      <div class="muted small">${esc(wsById(t.workspace_id)?.name || '')} · ${fmtDate(t.due_date)} · ${label(t.priority)}</div><div class="kact">${actions(t)}</div></div>`).join('') || '<div class="muted small">Drop here</div>'}</div>`).join('')}</div>`;
  $$('.kcard', el).forEach(c => { c.ondragstart = e => e.dataTransfer.setData('text', c.dataset.id); });
  $$('.col', el).forEach(col => {
    col.ondragover = e => e.preventDefault();
    col.ondrop = async e => {
      e.preventDefault();
      const t = all.find(x => x.id === e.dataTransfer.getData('text')), s = col.dataset.s;
      if (!t || t.status === s) return;
      try {
        if (s === 'done') await must(sb.rpc('complete_task', { p_task: t.id }));
        else await must(sb.from('tasks').update({ status: s, completed_at: null }).eq('id', t.id));
        refresh();
      } catch (er) { toast(er.message, true); }
    };
  });
}

function calendar(el, list, all, moves, t0) {
  const first = V.month, startDay = S.prefs.week_start;
  const grid0 = weekStart(first, startDay), days = Array.from({ length: 42 }, (_, i) => addDays(grid0, i));
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], si = names.indexOf(startDay);
  const heads = Array.from({ length: 7 }, (_, i) => names[(si + i) % 7].slice(0, 3));
  el.innerHTML = `<div class="row between" style="margin-bottom:8px"><button id="pm">←</button><b>${parseDate(first).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b><button id="nm">→</button></div>
    <div class="cal">${heads.map(h => `<div class="calh">${h}</div>`).join('')}${days.map(d => {
      const ts = list.filter(t => t.due_date === d);
      return `<div class="cell ${d.slice(0, 7) !== first.slice(0, 7) ? 'off' : ''} ${d === t0 ? 'today' : ''}" data-d="${d}"><span class="dn">${+d.slice(8)}</span>
        ${ts.slice(0, 3).map(t => `<div class="ct ${isOverdue(t, t0) ? 'od' : ''} ${t.status === 'done' ? 'dn2' : ''}" data-id="${t.id}">${esc(t.title)}</div>`).join('')}${ts.length > 3 ? `<div class="muted small">+${ts.length - 3} more</div>` : ''}</div>`;
    }).join('')}</div>`;
  $('#pm', el).onclick = () => { V.month = addMonths(first, -1); refresh(); };
  $('#nm', el).onclick = () => { V.month = addMonths(first, 1); refresh(); };
  $$('.ct', el).forEach(c => c.onclick = e => { e.stopPropagation(); taskForm(all.find(t => t.id === c.dataset.id)); });
  $$('.cell', el).forEach(c => c.ondblclick = () => taskForm(null, { due_date: c.dataset.d }));
  el.insertAdjacentHTML('beforeend', '<p class="muted small">Double-click a day to add a task. Click a task to edit.</p>');
}
