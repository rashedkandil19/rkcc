import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { sb, S, $, $$, esc, label, must, toast, modal, loadLists, loadPrefs, routes, cleanups, fmtDate, fmtMoney, today } from './core.js';
import { projectForm, clientForm } from './projects.js';
import { taskForm } from './tasks.js';
import { activityForm, noteForm } from './daily.js';
import { workoutForm } from './fitness.js';
import { txnForm } from './finance.js';
import './reports.js';
import { autoBackupIfDue } from './settings.js';

const app = $('#app');
const NAV = [['overview', 'Overview'], ['daily', 'Daily Log'], ['tasks', 'Tasks'], ['projects', 'Projects & Workspaces'], ['finance', 'Finance'], ['fitness', 'Fitness & Habits'], ['reports', 'Reports'], ['settings', 'Settings & Backup']];

if (SUPABASE_URL.includes('YOUR-PROJECT') || SUPABASE_ANON_KEY.includes('YOUR-ANON')) {
  app.innerHTML = `<div class="login"><h1>Setup needed</h1><p class="muted">Open <code>js/config.js</code>, paste your Supabase URL and anon key, then reload.</p></div>`;
} else {
  sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') showLogin(); });
  const { data: { session } } = await sb.auth.getSession();
  session ? start(session.user) : showLogin();
}

function showLogin() {
  app.innerHTML = `<form class="login card" id="lf"><h1>RK Control Center</h1><p class="muted">Personal Business &amp; Life Operating System</p>
    <div class="f"><label for="em">Email</label><input id="em" type="email" required autocomplete="username"></div>
    <div class="f"><label for="pw">Password</label><input id="pw" type="password" required autocomplete="current-password"></div>
    <div id="le" class="err-text" role="alert"></div><button class="pri" style="width:100%">Sign in</button></form>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    const btn = $('button', e.target); btn.disabled = true;
    const { data, error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    btn.disabled = false;
    if (error) return ($('#le').textContent = error.message);
    start(data.user);
  };
}

async function start(user) {
  S.user = user; S.email = user.email;
  try { await must(sb.rpc('seed_defaults')); await loadPrefs(); await loadLists(); }
  catch (e) {
    app.innerHTML = `<div class="login"><h1>Database not ready</h1><p class="err-text">${esc(e.message)}</p><p class="muted">Run <code>supabase/schema.sql</code> in the Supabase SQL Editor, then reload.</p></div>`;
    return;
  }
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand">RK Control Center<small>Business &amp; Life OS</small></div>
    <nav class="nav">${NAV.map(([k, t]) => `<a href="#/${k}" data-k="${k}">${esc(t)}</a>`).join('')}</nav></aside>
    <div class="main"><div class="top"><input id="q" type="search" placeholder="Search projects, tasks, clients, transactions (Ctrl+K)" aria-label="Global search"><button id="qa" class="pri">+ Quick Add</button><div id="res" class="results" hidden></div></div>
    <main class="content" id="view"></main></div></div>`;
  $('#qa').onclick = quickAdd;
  let timer;
  $('#q').oninput = e => { clearTimeout(timer); timer = setTimeout(() => search(e.target.value.trim()), 250); };
  document.addEventListener('click', e => { if (!e.target.closest('.results,#q')) $('#res').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#q').focus(); }
    if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); quickAdd(); }
  });
  window.onhashchange = route;
  route();
  autoBackupIfDue().catch(() => {});
}

let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  cleanups.splice(0).forEach(fn => fn());
  const [, page = 'overview', arg] = location.hash.split('/');
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.k === (page === 'project' ? 'projects' : page)));
  const v = $('#view');
  v.innerHTML = '<p class="muted">Loading…</p>';
  try {
    await loadLists();
    if (seq !== routeSeq) return;
    const fn = routes[page];
    if (!fn) { v.innerHTML = '<div class="card empty">Page not found.</div>'; return; }
    await fn(v, arg);
  } catch (e) {
    if (seq === routeSeq) v.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="err-text">${esc(e.message)}</p><button onclick="location.reload()">Reload</button></div>`;
  }
}

function quickAdd() {
  const items = [['New Task', () => taskForm()], ['New Activity', () => activityForm()], ['New Project', () => projectForm()], ['New Transaction', () => txnForm()],
    ['New Client', () => clientForm()], ['New Workout', () => workoutForm()], ['New Daily Note', () => noteForm()]];
  const m = modal('Quick Add', `<div class="grid" style="grid-template-columns:1fr 1fr">${items.map(([t], i) => `<button data-i="${i}" ${i === 0 ? 'class="pri"' : ''}>${t}</button>`).join('')}</div><p class="muted small">Shortcut: Alt+N</p>`);
  $$('[data-i]', m.el).forEach(b => b.onclick = () => { m.close(); items[b.dataset.i][1](); });
}

async function search(term) {
  const box = $('#res');
  if (term.length < 2) { box.hidden = true; return; }
  try {
    const like = `%${term.replace(/[%,()]/g, ' ')}%`;
    const [p, t, c, x] = await Promise.all([
      must(sb.from('projects').select('id,name').ilike('name', like).limit(5)),
      must(sb.from('tasks').select('id,title,due_date').ilike('title', like).is('archived_at', null).limit(5)),
      must(sb.from('clients').select('id,name').ilike('name', like).limit(5)),
      must(sb.from('transactions').select('id,description,amount_minor,txn_date,type').ilike('description', like).limit(5))]);
    const rows = [...p.map(r => [`#/project/${r.id}`, 'Project', r.name]), ...t.map(r => ['#/tasks', 'Task', `${r.title} (${fmtDate(r.due_date)})`]),
      ...c.map(r => ['#/projects', 'Client', r.name]), ...x.map(r => ['#/finance', 'Transaction', `${r.description || label(r.type)} · ${fmtMoney(r.amount_minor)} · ${fmtDate(r.txn_date)}`])];
    box.innerHTML = rows.length ? rows.map(([h, k, n]) => `<a href="${h}"><span class="badge">${k}</span> ${esc(n)}</a>`).join('') : '<div class="empty">No matches.</div>';
    box.hidden = false; box.onclick = () => (box.hidden = true);
  } catch (e) { toast(e.message, true); }
}
