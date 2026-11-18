import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { toISODate } from './logic.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const S = { ws: [], projects: [], clients: [], accounts: [], categories: [], email: '', user: null,
  prefs: { currency: 'EGP', date_format: 'DD MMM YYYY', week_start: 'saturday', theme: 'dark', auto_backup: false, last_backup: null, language: null } };
export const routes = {};            // page -> async (container, arg)
export const cleanups = [];          // functions run on navigation (timers etc.)

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = d => {
  if (!d) return '—';
  const [y, m, dd] = String(d).slice(0, 10).split('-'), f = S.prefs.date_format;
  return f === 'YYYY-MM-DD' ? `${y}-${m}-${dd}` : f === 'DD/MM/YYYY' ? `${dd}/${m}/${y}` : `${dd} ${MON[+m - 1]} ${y}`;
};
export const fmtMonth = m => `${MON[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
export const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
export const fmtMoney = m => (Number(m || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + S.prefs.currency;
export const fmtMins = m => { m = Math.round(m || 0); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`; };
export const toMinor = v => Math.round(parseFloat(v || 0) * 100);
export const fromMinor = m => (Number(m || 0) / 100).toFixed(2);
export const label = s => String(s).replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
export const today = () => toISODate(new Date());
export const must = async q => { const { data, error } = await q; if (error) throw new Error(error.message); return data; };
export const opts = (arr, sel) => arr.map(v => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label(v))}</option>`).join('');
export const safeUrl = u => /^https?:\/\//i.test(u) ? u : null;
export const wsById = id => S.ws.find(w => w.id === id);
export const activeWs = () => S.ws.filter(w => !w.archived_at);
export const projById = id => S.projects.find(p => p.id === id);
export const wsDot = id => { const w = wsById(id); return w ? `<span class="dot" style="background:${esc(w.color)}"></span>${esc(w.name)}` : '—'; };
export const localISO = (date, time) => date && time ? new Date(`${date}T${time}`).toISOString() : null;
export const timeOf = iso => iso ? new Date(iso).toTimeString().slice(0, 5) : '';
export const dateOf = iso => iso ? toISODate(new Date(iso)) : null;
export const empty = (msg, btn = '') => `<div class="empty"><p>${esc(msg)}</p>${btn}</div>`;

export function toast(msg, err = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), err ? 6000 : 3000);
}
export function modal(title, body, wide = false) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${body}</div>`;
  const close = () => bg.remove();
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  bg.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.body.append(bg);
  bg.querySelector('input,select,textarea,button')?.focus();
  return { el: bg.firstElementChild, close };
}
export function confirmBox(message, okLabel = 'Confirm') {
  return new Promise(resolve => {
    const m = modal('Please confirm', `<p>${esc(message)}</p><div class="row end"><button id="no">Cancel</button><button id="yes" class="danger">${esc(okLabel)}</button></div>`);
    $('#no', m.el).onclick = () => { m.close(); resolve(false); };
    $('#yes', m.el).onclick = () => { m.close(); resolve(true); };
  });
}

/** Generic form dialog. field: {id,label,type(text|number|money|date|time|select|textarea|checkbox),options,value,required,full,min,step}
 *  select options: ['a','b'] or [['value','Text']]. onSubmit(values) may throw to show an error; return false to keep open. */
export function formModal(title, fields, onSubmit, submitLabel = 'Save', wide = false) {
  const html = fields.map(f => {
    const id = 'f_' + f.id, v = f.value ?? '';
    let input;
    if (f.type === 'select') input = `<select id="${id}">${f.options.map(o => { const [val, t] = Array.isArray(o) ? o : [o, label(o)]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
    else if (f.type === 'textarea') input = `<textarea id="${id}" rows="${f.rows || 3}">${esc(v)}</textarea>`;
    else if (f.type === 'checkbox') input = `<input id="${id}" type="checkbox" style="width:auto" ${v ? 'checked' : ''}>`;
    else if (f.type === 'money') input = `<input id="${id}" type="number" min="0" step="0.01" ${f.required ? 'required' : ''} value="${v === '' || v == null ? '' : fromMinor(v)}">`;
    else input = `<input id="${id}" type="${f.type || 'text'}" ${f.required ? 'required' : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${f.max ? `maxlength="${f.max}"` : ''} value="${esc(v)}">`;
    return `<div class="f ${f.full || f.type === 'textarea' ? 'full' : ''}"><label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>${input}</div>`;
  }).join('');
  const m = modal(title, `<form class="fg">${html}<div class="row end full"><button type="button" id="cx">Cancel</button><button class="pri" id="ok">${esc(submitLabel)}</button></div></form>`, wide);
  $('#cx', m.el).onclick = m.close;
  $('form', m.el).onsubmit = async e => {
    e.preventDefault();
    const vals = {};
    for (const f of fields) {
      const el = $('#f_' + f.id, m.el);
      vals[f.id] = f.type === 'checkbox' ? el.checked : f.type === 'money' ? (el.value === '' ? null : toMinor(el.value))
        : f.type === 'number' ? (el.value === '' ? null : Number(el.value)) : (el.value.trim() === '' ? null : el.value.trim());
    }
    const btn = $('#ok', m.el); btn.disabled = true;
    try { if ((await onSubmit(vals, m)) !== false) m.close(); }
    catch (er) { toast(er.message || String(er), true); }
    btn.disabled = false;
  };
  return m;
}

/* ---- data lists shared by forms ---- */
let listsCacheAt = 0;
let listsRequest = null;
export async function loadLists(force = false) {
  // Reuse lookup data while navigating instead of downloading five tables on every page.
  if (!force && listsCacheAt && Date.now() - listsCacheAt < 30000) return;
  if (listsRequest) return listsRequest;
  listsRequest = (async () => {
    const [ws, projects, clients, accounts, categories] = await Promise.all([
      must(sb.from('workspaces').select('id,name,color,sort_order,archived_at').order('sort_order').order('name')),
      must(sb.from('projects').select('id,name,workspace_id,client_id,status,commission_type,commission_value,contract_value_minor,budget_minor,archived_at').is('archived_at', null).order('name')),
      must(sb.from('clients').select('id,name,email,phone,company,notes,archived_at').is('archived_at', null).order('name')),
      must(sb.from('accounts').select('*').order('name')),
      must(sb.from('categories').select('id,name,kind,color,archived_at').is('archived_at', null).order('name'))]);
    Object.assign(S, { ws, projects, clients, accounts, categories });
    listsCacheAt = Date.now();
  })();
  try { await listsRequest; } finally { listsRequest = null; }
}
export function invalidateLists() { listsCacheAt = 0; }
export const loadWs = loadLists;
export const projectOptions = (withNone = true) => [...(withNone ? [['', '— none —']] : []), ...S.projects.map(p => [p.id, p.name])];
export const wsOptions = () => activeWs().map(w => [w.id, w.name]);

/* ---- preferences (settings table) ---- */
export async function loadPrefs() {
  const rows = await must(sb.from('settings').select('key,value'));
  for (const r of rows) if (r.key in S.prefs) S.prefs[r.key] = r.value;
  applyTheme();
}
export async function savePref(key, value) {
  await must(sb.from('settings').upsert({ user_id: S.user.id, key, value }, { onConflict: 'user_id,key' }));
  S.prefs[key] = value; applyTheme();
}
export const applyTheme = () => { document.documentElement.dataset.theme = S.prefs.theme === 'light' ? 'light' : 'dark'; };

/* ---- tiny SVG-free bar chart ---- */
export function bars(items, fmt = String) {
  const max = Math.max(1, ...items.map(i => Math.abs(i.value)));
  return items.length ? `<div class="bars">${items.map(i => `<div class="bar-row"><span class="bar-l">${esc(i.label)}</span><span class="bar-t"><i style="width:${Math.max(2, Math.abs(i.value) / max * 100)}%;background:${i.value < 0 ? 'var(--bad)' : (i.color || 'var(--accent)')}"></i></span><span class="bar-v">${esc(fmt(i.value))}</span></div>`).join('')}</div>` : '<div class="empty">No data in this period.</div>';
}
export const stat = (title, value, note = '', cls = '') => `<div class="card"><div class="muted">${esc(title)}</div><div class="stat ${cls}">${value}</div>${note ? `<div class="muted small">${esc(note)}</div>` : ''}</div>`;
export const refresh = () => { invalidateLists(); window.dispatchEvent(new Event('hashchange')); };
