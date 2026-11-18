import { sb, S, $, $$, esc, fmtDate, fmtMins, label, today, must, empty, stat, toast, confirmBox, formModal, refresh, routes } from './core.js';
import { addDays, weekStart, monthStart, habitStreak, consistency } from './logic.js';

const WTYPES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'cardio', 'rest', 'other', 'push', 'pull', 'upper', 'lower'], WSTATUS = ['planned', 'done', 'skipped'];
const T = { tab: 'workouts' };
const SPLIT = [
  ['chest','Chest'],['back','Back'],['shoulders','Shoulders'],['biceps','Biceps'],
  ['triceps','Triceps'],['legs','Legs'],['rest','Rest / Abs & Recovery']
];

export function workoutForm(w, defaults = {}) {
  const d = w || defaults;
  formModal(w ? 'Edit workout' : 'New workout', [
    { id: 'workout_date', label: 'Date', type: 'date', required: true, value: d.workout_date || today() },
    { id: 'workout_type', label: 'Muscle group / workout type', type: 'select', options: WTYPES, value: d.workout_type || 'chest' },
    { id: 'duration_minutes', label: 'Duration (minutes)', type: 'number', min: 0, value: d.duration_minutes },
    { id: 'status', label: 'Status', type: 'select', options: WSTATUS, value: d.status || 'done' },
    { id: 'exercises', label: 'Exercises (optional, one per line: name, sets x reps, weight)', type: 'textarea', rows: 5, value: Array.isArray(d.exercises) ? d.exercises.join('\n') : '' },
    { id: 'notes', label: 'Notes', type: 'textarea', value: d.notes }], async v => {
    const row = { ...v, exercises: v.exercises ? v.exercises.split('\n').map(s => s.trim()).filter(Boolean) : null };
    if (w) await must(sb.from('workouts').update(row).eq('id', w.id)); else await must(sb.from('workouts').insert(row));
    toast('Workout saved'); refresh();
  }, 'Save workout', true);
}

/** none -> done -> missed -> none. Hour-based habits (sleep) ask for the value instead. */
export async function cycleHabit(habit, date, log) {
  const save = async row => must(sb.from('habit_logs').upsert({ user_id: S.user.id, habit_id: habit.id, log_date: date, ...row }, { onConflict: 'habit_id,log_date' }));
  try {
    if (habit.unit === 'hours') {
      formModal(`${habit.name} · ${fmtDate(date)}`, [{ id: 'value', label: `Hours slept${habit.target_value ? ` (target ${habit.target_value})` : ''}. Leave empty to clear`, type: 'number', min: 0, step: '0.25', value: log?.value }], async v => {
        if (v.value == null) { if (log) await must(sb.from('habit_logs').delete().eq('id', log.id)); }
        else await save({ value: v.value, done: habit.target_value ? v.value >= Number(habit.target_value) : true });
        refresh();
      });
    } else if (!log) { await save({ done: true }); refresh(); }
    else if (log.done) { await save({ done: false }); refresh(); }
    else { await must(sb.from('habit_logs').delete().eq('id', log.id)); refresh(); }
  } catch (e) { toast(e.message, true); }
}

function habitForm(h) {
  formModal(h ? 'Edit habit' : 'New habit', [{ id: 'name', label: 'Name', required: true, value: h?.name, max: 80 },
    { id: 'target_value', label: 'Daily target (optional)', type: 'number', min: 0, step: '0.25', value: h?.target_value }, { id: 'unit', label: 'Unit (use "hours" to log values)', value: h?.unit }],
    async v => { if (h) await must(sb.from('habits').update(v).eq('id', h.id)); else await must(sb.from('habits').insert(v)); toast('Habit saved'); refresh(); });
}

routes.fitness = async v => {
  v.innerHTML = `<div class="row between"><div><h1>Fitness &amp; Habits</h1><p class="muted">A missing entry is "no data", never a failure.</p></div><div class="tabs">${['workouts', 'habits'].map(x => `<button data-t="${x}" class="${T.tab === x ? 'on' : ''}">${label(x)}</button>`).join('')}</div></div><div id="fv" style="margin-top:12px"></div>`;
  $$('[data-t]', v).forEach(b => b.onclick = () => { T.tab = b.dataset.t; refresh(); });
  await (T.tab === 'workouts' ? workouts : habitsTab)($('#fv'));
};

async function workouts(el) {
  const t0 = today(), ws = weekStart(t0, S.prefs.week_start), ms = monthStart(t0);
  const rows = await must(sb.from('workouts').select('*').order('workout_date', { ascending: false }).limit(120));
  const done = rows.filter(w => w.status === 'done' && w.workout_type !== 'rest');
  const week = done.filter(w => w.workout_date >= ws), month = done.filter(w => w.workout_date >= ms);
  el.innerHTML = `<div class="grid">${stat('This week', week.length, 'workouts done')}${stat('This month', month.length, 'workouts done')}${stat('Minutes this month', fmtMins(month.reduce((s, w) => s + (w.duration_minutes || 0), 0)))}</div>
    <section class="card" style="margin-top:12px"><h2>Muscle-group split</h2><p class="muted small">One primary muscle group per day. Adjust rest days and exercise volume to your recovery.</p><div class="grid split-grid">${SPLIT.map(([k,n],i)=>`<div class="split-day"><b>Day ${i+1}</b><div>${n}</div></div>`).join('')}</div></section>
    <div class="card" style="margin-top:12px"><div class="row between"><h2>Workouts</h2><button class="pri sm" id="nw">+ Workout</button></div>
    ${rows.length ? `<table><thead><tr><th>Date</th><th>Type</th><th>Status</th><th>Duration</th><th>Notes</th><th></th></tr></thead><tbody>${rows.map(w => `<tr><td>${fmtDate(w.workout_date)}</td><td>${label(w.workout_type)}</td><td><span class="badge">${label(w.status)}</span></td><td>${w.duration_minutes ? fmtMins(w.duration_minutes) : '—'}</td>
      <td>${esc(w.notes || '')}${Array.isArray(w.exercises) && w.exercises.length ? `<div class="muted small">${w.exercises.length} exercises</div>` : ''}</td><td class="nowrap"><button class="sm" data-e="${w.id}">Edit</button> <button class="sm" data-d="${w.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : empty('No workouts logged yet.')}</div>`;
  $('#nw').onclick = () => workoutForm();
  $$('[data-e]', el).forEach(b => b.onclick = () => workoutForm(rows.find(w => w.id === b.dataset.e)));
  $$('[data-d]', el).forEach(b => b.onclick = async () => { if (await confirmBox('Delete this workout?', 'Delete')) { try { await must(sb.from('workouts').delete().eq('id', b.dataset.d)); toast('Workout deleted'); refresh(); } catch (e) { toast(e.message, true); } } });
}

async function habitsTab(el) {
  const t0 = today(), since = addDays(t0, -59);
  const [habits, logs] = await Promise.all([must(sb.from('habits').select('*').is('archived_at', null).order('name')), must(sb.from('habit_logs').select('*').gte('log_date', since))]);
  const days = Array.from({ length: 14 }, (_, i) => addDays(t0, i - 13));
  el.innerHTML = `<div class="card"><div class="row between"><h2>Habits</h2><button class="pri sm" id="nh">+ Habit</button></div>
    ${habits.length ? `<div style="overflow-x:auto"><table><thead><tr><th>Habit</th>${days.map(d => `<th class="c">${d.slice(8)}</th>`).join('')}<th>Streak</th><th>7 days</th><th>30 days</th><th></th></tr></thead><tbody>
    ${habits.map(h => {
      const hl = logs.filter(l => l.habit_id === h.id), by = Object.fromEntries(hl.map(l => [l.log_date, l]));
      const c7 = consistency(hl, addDays(t0, -6), t0), c30 = consistency(hl, addDays(t0, -29), t0), vals = hl.filter(l => l.value != null && l.log_date >= addDays(t0, -29));
      const pct = c => c.pct == null ? '—' : `${c.pct}% <span class="muted small">(${c.done}/${c.logged})</span>`;
      return `<tr><td>${esc(h.name)}${h.unit === 'hours' && vals.length ? `<div class="muted small">avg ${(vals.reduce((s, l) => s + Number(l.value), 0) / vals.length).toFixed(1)}h</div>` : ''}</td>
      ${days.map(d => { const l = by[d]; return `<td class="c"><button class="cellb ${l ? (l.done ? 'ok' : 'miss') : ''}" data-h="${h.id}" data-d="${d}" title="${fmtDate(d)}${l?.value != null ? ' · ' + l.value + 'h' : ''}">${l ? (l.done ? '✓' : '✗') : '·'}</button></td>`; }).join('')}
      <td>${habitStreak(hl, t0)} d</td><td>${pct(c7)}</td><td>${pct(c30)}</td><td class="nowrap"><button class="sm" data-eh="${h.id}">Edit</button> <button class="sm" data-ah="${h.id}">Archive</button></td></tr>`;
    }).join('')}</tbody></table></div>` : empty('No habits yet. Add one to start tracking.')}</div>`;
  $('#nh').onclick = () => habitForm();
  $$('.cellb', el).forEach(b => b.onclick = () => { const h = habits.find(x => x.id === b.dataset.h); cycleHabit(h, b.dataset.d, logs.find(l => l.habit_id === h.id && l.log_date === b.dataset.d)); });
  $$('[data-eh]', el).forEach(b => b.onclick = () => habitForm(habits.find(h => h.id === b.dataset.eh)));
  $$('[data-ah]', el).forEach(b => b.onclick = async () => { if (await confirmBox('Archive this habit? Its history is kept.', 'Archive')) { try { await must(sb.from('habits').update({ archived_at: new Date().toISOString() }).eq('id', b.dataset.ah)); refresh(); } catch (e) { toast(e.message, true); } } });
}
