import { sb, S, $, $$, esc, fmtDate, fmtTime, fmtMins, label, today, must, opts, wsDot, wsById, projById, empty, stat, bars, toast, confirmBox, formModal, refresh, routes, cleanups, projectOptions, wsOptions, localISO, timeOf, dateOf } from './core.js';
import { addDays, weekStart, trackedMinutes, activityMinutes, liveSeconds, timerStart, timerPause, timerResume, timerStop, parseDate } from './logic.js';
import { cycleHabit, workoutForm } from './fitness.js';

const TYPES = ['development', 'design', 'marketing', 'client_communication', 'administration', 'learning', 'personal', 'other'];
const MOODS = [['', '— not set —'], ['1', '1 · Rough'], ['2', '2 · Low'], ['3', '3 · Okay'], ['4', '4 · Good'], ['5', '5 · Great']];
const D = { date: today(), view: 'day' };
const friendly = e => /one_running_timer|duplicate key/.test(e.message) ? new Error('Another timer is already running. Pause or stop it first.') : e;

async function taskOptions() {
  const ts = await must(sb.from('tasks').select('id,title,project_id,workspace_id').in('status', ['todo', 'in_progress']).is('archived_at', null).order('title'));
  return { opts: [['', '— none —'], ...ts.map(t => [t.id, t.title])], byId: Object.fromEntries(ts.map(t => [t.id, t])) };
}
const place = (v, byId) => {
  const t = v.task_id && byId[v.task_id], p = (v.project_id || t?.project_id) && projById(v.project_id || t.project_id);
  return { workspace_id: p ? p.workspace_id : t ? t.workspace_id : v.workspace_id, project_id: v.project_id || t?.project_id || null, task_id: v.task_id || null };
};

export async function activityForm(a, defaults = {}) {
  if (a && (a.timer_state === 'running' || a.timer_state === 'paused')) return toast('Stop the timer before editing this activity', true);
  const tk = await taskOptions(), d = a || defaults;
  formModal(a ? 'Edit activity' : 'New activity', [
    { id: 'title', label: 'Title', required: true, full: true, value: d.title, max: 200 },
    { id: 'description', label: 'Description', type: 'textarea', value: d.description },
    { id: 'activity_date', label: 'Date', type: 'date', required: true, value: d.activity_date || D.date },
    { id: 'activity_type', label: 'Activity type', type: 'select', options: TYPES, value: d.activity_type || 'other' },
    { id: 'start_time', label: 'Start time', type: 'time', value: timeOf(d.start_at) },
    { id: 'end_time', label: 'End time', type: 'time', value: timeOf(d.end_at) },
    { id: 'duration_minutes', label: 'Duration (minutes, if no times)', type: 'number', min: 0, value: d.duration_minutes },
    { id: 'workspace_id', label: 'Workspace', type: 'select', options: wsOptions(), value: d.workspace_id || S.ws.find(w => !w.archived_at)?.id },
    { id: 'project_id', label: 'Project (sets workspace)', type: 'select', options: projectOptions(), value: d.project_id || '' },
    { id: 'task_id', label: 'Related task', type: 'select', options: tk.opts, value: d.task_id || '' },
    { id: 'notes', label: 'Notes', type: 'textarea', value: d.notes }], async v => {
    const start_at = localISO(v.activity_date, v.start_time), end_at = localISO(v.activity_date, v.end_time);
    if (!!start_at !== !!end_at) throw new Error('Enter both start and end time, or neither');
    let dur = v.duration_minutes;
    if (start_at) { if (end_at <= start_at) throw new Error('End time must be after start time'); dur = Math.round((new Date(end_at) - new Date(start_at)) / 60000); }
    if (!dur || dur <= 0) throw new Error('Enter start and end times, or a duration');
    const row = { title: v.title, description: v.description, activity_date: v.activity_date, activity_type: v.activity_type, notes: v.notes, start_at, end_at, duration_minutes: dur, ...place(v, tk.byId) };
    if (a) await must(sb.from('activities').update(row).eq('id', a.id)); else await must(sb.from('activities').insert(row));
    toast('Activity saved'); refresh();
  }, 'Save activity', true);
}

export function noteForm(date = D.date) {
  sb.from('daily_logs').select('*').eq('log_date', date).maybeSingle().then(({ data: log }) => {
    formModal(`Daily note · ${fmtDate(date)}`, [
      { id: 'mood', label: 'Mood', type: 'select', options: MOODS, value: log?.mood ?? '' }, { id: 'notes', label: 'Notes', type: 'textarea', rows: 6, value: log?.notes }],
      async v => { await must(sb.from('daily_logs').upsert({ user_id: S.user.id, log_date: date, mood: v.mood ? Number(v.mood) : null, notes: v.notes }, { onConflict: 'user_id,log_date' })); toast('Daily note saved'); refresh(); });
  });
}

async function startTimer() {
  const tk = await taskOptions();
  formModal('Start timer', [
    { id: 'title', label: 'What are you working on?', required: true, full: true, max: 200 },
    { id: 'activity_type', label: 'Type', type: 'select', options: TYPES, value: 'development' },
    { id: 'workspace_id', label: 'Workspace', type: 'select', options: wsOptions() },
    { id: 'project_id', label: 'Project (sets workspace)', type: 'select', options: projectOptions() },
    { id: 'task_id', label: 'Related task', type: 'select', options: tk.opts }], async v => {
    try { await must(sb.from('activities').insert({ title: v.title, activity_type: v.activity_type, activity_date: today(), ...place(v, tk.byId), ...timerStart(new Date()) })); } catch (e) { throw friendly(e); }
    toast('Timer started'); refresh();
  }, 'Start');
}
async function timerAction(a, kind) {
  const now = new Date();
  const patch = kind === 'pause' ? timerPause(a, now) : kind === 'resume' ? timerResume(a, now) : timerStop(a, now);
  try {
    await must(sb.from('activities').update(patch).eq('id', a.id).eq('timer_state', a.timer_state));
    if (kind === 'stop' && a.task_id) {
      const t = await must(sb.from('tasks').select('actual_minutes').eq('id', a.task_id).single());
      await must(sb.from('tasks').update({ actual_minutes: t.actual_minutes + patch.duration_minutes }).eq('id', a.task_id));
    }
    toast(kind === 'stop' ? `Saved ${fmtMins(patch.duration_minutes)}` : kind === 'pause' ? 'Paused' : 'Resumed'); refresh();
  } catch (e) { toast(friendly(e).message, true); }
}

const dayRange = d => [new Date(d + 'T00:00:00').toISOString(), new Date(addDays(d, 1) + 'T00:00:00').toISOString()];

routes.daily = async v => {
  const date = D.date, [from, to] = dayRange(date);
  const [timer] = await Promise.all([must(sb.from('activities').select('*').in('timer_state', ['running', 'paused']).limit(1))]);
  const active = timer[0];
  const head = `<div class="row between"><div><h1>Daily Log</h1><p class="muted">${parseDate(date).toLocaleDateString('en-GB', { weekday: 'long' })}, ${fmtDate(date)}</p></div>
    <div class="row"><div class="tabs"><button data-vw="day" class="${D.view === 'day' ? 'on' : ''}">Day</button><button data-vw="week" class="${D.view === 'week' ? 'on' : ''}">Week</button></div>
    <button id="pd">←</button><input type="date" id="dd" value="${date}" style="width:150px" aria-label="Date"><button id="nd">→</button><button id="td">Today</button></div></div>
    <div class="card timer" style="margin:12px 0">${active ? `<div class="row between"><div><span class="badge ${active.timer_state === 'running' ? 'b-active' : 'b-on_hold'}">${active.timer_state === 'running' ? 'Running' : 'Paused'}</span> <b>${esc(active.title)}</b>
      <div class="muted small">${esc(wsById(active.workspace_id)?.name || '')}${active.project_id ? ' · ' + esc(projById(active.project_id)?.name || '') : ''}</div></div>
      <div class="row"><span class="clock" id="clk">00:00:00</span>${active.timer_state === 'running' ? '<button id="tp">Pause</button>' : '<button id="tr" class="pri">Resume</button>'}<button id="ts" class="danger">Stop &amp; save</button></div></div>`
      : `<div class="row between"><span class="muted">No timer running. Timers survive closing the app: they are stored in your database.</span><div class="row"><button id="st" class="pri">▶ Start timer</button><button id="na">+ Manual activity</button></div></div>`}</div>`;
  v.innerHTML = head + '<div id="dv"></div>';
  $('#pd').onclick = () => { D.date = addDays(date, D.view === 'week' ? -7 : -1); refresh(); };
  $('#nd').onclick = () => { D.date = addDays(date, D.view === 'week' ? 7 : 1); refresh(); };
  $('#td').onclick = () => { D.date = today(); refresh(); };
  $('#dd').onchange = e => { if (e.target.value) { D.date = e.target.value; refresh(); } };
  $$('[data-vw]', v).forEach(b => b.onclick = () => { D.view = b.dataset.vw; refresh(); });
  if (active) {
    const tick = () => { const s = liveSeconds(active), c = $('#clk'); if (c) c.textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
    tick(); if (active.timer_state === 'running') { const i = setInterval(tick, 1000); cleanups.push(() => clearInterval(i)); }
    $('#tp') && ($('#tp').onclick = () => timerAction(active, 'pause')); $('#tr') && ($('#tr').onclick = () => timerAction(active, 'resume')); $('#ts').onclick = () => timerAction(active, 'stop');
  } else { $('#st').onclick = startTimer; $('#na').onclick = () => activityForm(); }
  await (D.view === 'week' ? weekView : dayView)($('#dv'), date, from, to);
};

async function dayView(el, date, from, to) {
  const [acts, due, done, log, workouts, habits, hlogs] = await Promise.all([
    must(sb.from('activities').select('*').eq('activity_date', date).is('archived_at', null).order('start_at', { nullsFirst: false }).order('created_at')),
    must(sb.from('tasks').select('*').eq('due_date', date).is('archived_at', null).neq('status', 'cancelled').order('sort_order')),
    must(sb.from('tasks').select('id,title').gte('completed_at', from).lt('completed_at', to).is('archived_at', null)),
    must(sb.from('daily_logs').select('*').eq('log_date', date).maybeSingle()),
    must(sb.from('workouts').select('*').eq('workout_date', date)),
    must(sb.from('habits').select('*').is('archived_at', null).order('name')),
    must(sb.from('habit_logs').select('*').eq('log_date', date))]);
  const mins = trackedMinutes(acts), logByHabit = Object.fromEntries(hlogs.map(l => [l.habit_id, l]));
  const wo = workouts[0], habitsDone = hlogs.filter(l => l.done).length;
  el.innerHTML = `<div class="grid">${stat('Planned tasks', due.length, `${due.filter(t => t.status === 'done').length} done`)}${stat('Completed today', done.length)}
    ${stat('Work time', fmtMins(mins), 'Overlaps counted once')}${stat('Workout', wo ? label(wo.status) : 'None logged', wo ? label(wo.workout_type) : '')}${stat('Habits', `${habitsDone}/${habits.length}`, hlogs.length < habits.length ? `${habits.length - hlogs.length} not logged` : '')}</div>
    <div class="two" style="margin-top:12px"><div class="card"><div class="row between"><h2>Planned tasks</h2></div>${due.length ? `<table><tbody>${due.map(t => `<tr><td style="width:30px"><input type="checkbox" data-t="${t.id}" ${t.status === 'done' ? 'checked disabled' : ''} aria-label="Complete ${esc(t.title)}" style="width:auto"></td><td class="${t.status === 'done' ? 'done' : ''}">${esc(t.title)}<div class="muted small">${label(t.task_type)} · ${esc(projById(t.project_id)?.name || wsById(t.workspace_id)?.name || '')}</div></td></tr>`).join('')}</tbody></table>` : empty('Nothing planned for this day.')}</div>
      <div class="card"><div class="row between"><h2>Mood &amp; notes</h2><button class="sm" id="en">${log ? 'Edit' : 'Add note'}</button></div>${log ? `<p>${log.mood ? 'Mood: ' + log.mood + '/5' : ''}</p><p style="white-space:pre-wrap">${esc(log.notes || '')}</p>` : empty('No note yet.')}</div></div>
    <div class="card" style="margin-top:12px"><div class="row between"><h2>Activities &amp; timeline</h2><button class="sm pri" id="aa">+ Activity</button></div>
      ${acts.length ? `<table><thead><tr><th>Time</th><th>Activity</th><th>Where</th><th>Type</th><th>Duration</th><th></th></tr></thead><tbody>${acts.map(a => `<tr><td class="nowrap">${a.start_at ? fmtTime(a.start_at) + '–' + fmtTime(a.end_at || a.start_at) : '—'}</td><td>${esc(a.title)}<div class="muted small">${esc(a.description || '')}</div></td>
      <td>${wsDot(a.workspace_id)}<div class="muted small">${esc(projById(a.project_id)?.name || '')}</div></td><td>${label(a.activity_type)}</td><td>${fmtMins(activityMinutes(a))}</td>
      <td class="nowrap"><button class="sm" data-e="${a.id}">Edit</button> <button class="sm" data-d="${a.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : empty('No activities logged for this day.')}</div>
    <div class="two" style="margin-top:12px"><div class="card"><div class="row between"><h2>Workout</h2><button class="sm" id="wo">${wo ? 'Edit' : 'Log workout'}</button></div>${wo ? `<p>${label(wo.workout_type)} · ${label(wo.status)}${wo.duration_minutes ? ' · ' + fmtMins(wo.duration_minutes) : ''}</p>` : empty('No workout logged.')}</div>
      <div class="card"><h2>Habits</h2>${habits.length ? habits.map(h => { const l = logByHabit[h.id]; return `<div class="row between" style="margin-bottom:6px"><span>${esc(h.name)}${l?.value != null ? ` <span class="muted">(${l.value} ${esc(h.unit || '')})</span>` : ''}</span><button class="sm habit" data-h="${h.id}">${l ? (l.done ? '✓ Done' : '✗ Missed') : '· Not logged'}</button></div>`; }).join('') : empty('No habits yet.')}</div></div>`;
  $('#en').onclick = () => noteForm(date); $('#aa').onclick = () => activityForm(); $('#wo').onclick = () => workoutForm(wo, { workout_date: date });
  $$('[data-t]', el).forEach(c => c.onchange = async () => { try { await must(sb.rpc('complete_task', { p_task: c.dataset.t })); toast('Task completed'); refresh(); } catch (e) { toast(e.message, true); } });
  $$('[data-e]', el).forEach(b => b.onclick = () => activityForm(acts.find(a => a.id === b.dataset.e)));
  $$('[data-d]', el).forEach(b => b.onclick = async () => { if (await confirmBox('Delete this activity?', 'Delete')) { try { await must(sb.from('activities').update({ archived_at: new Date().toISOString() }).eq('id', b.dataset.d)); toast('Activity deleted'); refresh(); } catch (e) { toast(e.message, true); } } });
  $$('.habit', el).forEach(b => b.onclick = () => cycleHabit(habits.find(h => h.id === b.dataset.h), date, logByHabit[b.dataset.h]));
}

async function weekView(el, date, from, to) {
  const ws = weekStart(date, S.prefs.week_start), days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const [acts, done] = await Promise.all([
    must(sb.from('activities').select('*').gte('activity_date', days[0]).lte('activity_date', days[6]).is('archived_at', null)),
    must(sb.from('tasks').select('id,completed_at').gte('completed_at', new Date(days[0] + 'T00:00:00').toISOString()).lt('completed_at', new Date(addDays(days[6], 1) + 'T00:00:00').toISOString()))]);
  const per = days.map(d => ({ d, a: acts.filter(a => a.activity_date === d), done: done.filter(t => dateOf(t.completed_at) === d).length }));
  const total = trackedMinutes(acts);
  const byWs = S.ws.map(w => ({ label: w.name, value: trackedMinutes(acts.filter(a => a.workspace_id === w.id)), color: w.color })).filter(x => x.value > 0);
  el.innerHTML = `<div class="grid">${stat('Week total', fmtMins(total), `${fmtDate(days[0])} – ${fmtDate(days[6])}`)}${stat('Activities', acts.length)}${stat('Tasks completed', done.length)}</div>
    <div class="card" style="margin-top:12px"><h2>Timeline</h2>${bars(per.map(p => ({ label: parseDate(p.d).toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + p.d.slice(8), value: trackedMinutes(p.a) })), fmtMins)}
      <table style="margin-top:8px"><tbody>${per.map(p => `<tr class="click" data-d="${p.d}"><td style="width:140px">${fmtDate(p.d)}</td><td>${p.a.length} activities · ${p.done} tasks done</td><td>${esc(p.a.slice(0, 3).map(a => a.title).join(', '))}</td></tr>`).join('')}</tbody></table></div>
    <div class="card" style="margin-top:12px"><h2>Time by workspace</h2>${bars(byWs, fmtMins)}</div>`;
  $$('tr.click', el).forEach(r => r.onclick = () => { D.date = r.dataset.d; D.view = 'day'; refresh(); });
}
