import { sb, S, $, $$, esc, fmtDate, fmtMins, label, today, must, empty, stat, toast, confirmBox, formModal, refresh, routes } from './core.js';
import { addDays, weekStart, monthStart, habitStreak, consistency } from './logic.js';
import { getLang } from './i18n.js';

const WTYPES = ['push', 'pull', 'legs', 'upper', 'lower', 'cardio', 'rest', 'other'], WSTATUS = ['planned', 'done', 'skipped'];
const T = { tab: 'workouts' };

export function workoutForm(w, defaults = {}) {
  const d = w || defaults;
  const m = formModal(w ? 'Edit workout' : 'New workout', [
    { id: 'workout_date', label: 'Date', type: 'date', required: true, value: d.workout_date || today() },
    { id: 'workout_type', label: 'Workout type', type: 'select', options: WTYPES, value: d.workout_type || 'push' },
    { id: 'duration_minutes', label: 'Duration (minutes)', type: 'number', min: 0, value: d.duration_minutes },
    { id: 'status', label: 'Status', type: 'select', options: WSTATUS, value: d.status || 'done' },
    { id: 'exercises', label: 'Exercises (optional, one per line: name, sets x reps, weight)', type: 'textarea', rows: 5, value: Array.isArray(d.exercises) ? d.exercises.join('\n') : '' },
    { id: 'notes', label: 'Notes', type: 'textarea', value: d.notes }], async v => {
    const row = { ...v, exercises: v.exercises ? v.exercises.split('\n').map(s => s.trim()).filter(Boolean) : null };
    if (w) await must(sb.from('workouts').update(row).eq('id', w.id)); else await must(sb.from('workouts').insert(row));
    toast('Workout saved'); refresh();
  }, 'Save workout', true);
  attachMusclePicker(m.el);
}

/* ---- Muscle-by-muscle exercise picker (workout form) ----
   Each muscle has its own list. Ticking an exercise adds a line to the existing "Exercises" box, unticking removes it,
   and editing the box by hand updates the ticks. Nothing new is stored: it is the same `exercises` field as before,
   so the database and old workouts are unaffected. Second value is the Arabic display name. */
const MUSCLES = [
  { k: 'chest', n: 'Chest', x: [['Barbell Bench Press', 'بنش برس بالبار'], ['Incline Bench Press', 'بنش برس مائل'], ['Dumbbell Bench Press', 'بنش برس بالدمبل'], ['Incline Dumbbell Press', 'ضغط دمبل مائل'],
    ['Decline Bench Press', 'بنش برس منحدر'], ['Dumbbell Flyes', 'فلاي دمبل'], ['Cable Crossover', 'كروس أوفر كابل'], ['Chest Press Machine', 'جهاز ضغط الصدر'], ['Pec Deck Fly', 'جهاز بيك ديك'],
    ['Push-ups', 'تمرين الضغط'], ['Chest Dips', 'متوازي للصدر']] },
  { k: 'back', n: 'Back', x: [['Pull-ups', 'عقلة'], ['Lat Pulldown', 'سحب أمامي'], ['Close-Grip Pulldown', 'سحب أمامي ضيق'], ['Barbell Row', 'تجديف بالبار'], ['One-Arm Dumbbell Row', 'تجديف دمبل ذراع واحدة'],
    ['Seated Cable Row', 'تجديف كابل جلوس'], ['T-Bar Row', 'تجديف تي بار'], ['Deadlift', 'ديدلفت'], ['Straight-Arm Pulldown', 'سحب بذراع مستقيمة'], ['Back Extension', 'تمديد الظهر']] },
  { k: 'shoulders', n: 'Shoulders', x: [['Overhead Press', 'ضغط أكتاف بالبار'], ['Dumbbell Shoulder Press', 'ضغط أكتاف دمبل'], ['Arnold Press', 'أرنولد برس'], ['Lateral Raises', 'رفرفة جانبية'],
    ['Front Raises', 'رفرفة أمامية'], ['Rear Delt Fly', 'رفرفة خلفية'], ['Face Pulls', 'فيس بول'], ['Upright Row', 'سحب عمودي'], ['Shrugs', 'شراجز'], ['Machine Shoulder Press', 'جهاز ضغط الأكتاف']] },
  { k: 'biceps', n: 'Biceps', x: [['Barbell Curl', 'بايسبس بار'], ['Dumbbell Curl', 'بايسبس دمبل'], ['Hammer Curl', 'هامر كيرل'], ['Preacher Curl', 'بريتشر كيرل'],
    ['Incline Dumbbell Curl', 'بايسبس دمبل مائل'], ['Cable Curl', 'بايسبس كابل'], ['Concentration Curl', 'كيرل تركيز'], ['EZ-Bar Curl', 'بايسبس بار EZ']] },
  { k: 'triceps', n: 'Triceps', x: [['Triceps Pushdown', 'سحب ترايسبس كابل'], ['Rope Pushdown', 'سحب ترايسبس بالحبل'], ['Skull Crushers', 'سكل كراشر'], ['Overhead Triceps Extension', 'تمديد ترايسبس فوق الرأس'],
    ['Close-Grip Bench Press', 'بنش برس ضيق'], ['Triceps Dips', 'متوازي ترايسبس'], ['Triceps Kickback', 'كيك باك ترايسبس'], ['Bench Dips', 'ديبس على البنش']] },
  { k: 'forearms', n: 'Forearms', x: [['Wrist Curl', 'ثني الرسغ'], ['Reverse Wrist Curl', 'ثني الرسغ عكسي'], ['Reverse Curl', 'بايسبس عكسي'], ["Farmer's Walk", 'مشي المزارع']] },
  { k: 'legs', n: 'Legs', x: [['Barbell Squat', 'سكوات بالبار'], ['Front Squat', 'سكوات أمامي'], ['Leg Press', 'ضغط أرجل'], ['Hack Squat', 'هاك سكوات'], ['Lunges', 'اندفاع'],
    ['Bulgarian Split Squat', 'سكوات بلغاري'], ['Romanian Deadlift', 'رومانيان ديدلفت'], ['Leg Extension', 'تمديد الأرجل'], ['Leg Curl', 'ثني الأرجل'],
    ['Standing Calf Raise', 'سمانة واقف'], ['Seated Calf Raise', 'سمانة جالس']] },
  { k: 'glutes', n: 'Glutes', x: [['Hip Thrust', 'هيب ثرست'], ['Glute Bridge', 'جسر الأرداف'], ['Cable Kickback', 'كيك باك كابل'], ['Sumo Deadlift', 'سومو ديدلفت'], ['Step-ups', 'صعود الدرجة']] },
  { k: 'abs', n: 'Abs', x: [['Crunches', 'كرانش'], ['Plank', 'بلانك'], ['Hanging Leg Raise', 'رفع الأرجل من التعلق'], ['Leg Raises', 'رفع الأرجل'], ['Cable Crunch', 'كرانش كابل'],
    ['Russian Twist', 'روسيان تويست'], ['Bicycle Crunch', 'كرانش الدراجة'], ['Ab Wheel Rollout', 'عجلة البطن'], ['Mountain Climbers', 'متسلق الجبال'], ['Side Plank', 'بلانك جانبي']] },
  { k: 'cardio', n: 'Cardio', x: [['Treadmill', 'جهاز المشي'], ['Running', 'جري'], ['Walking', 'مشي'], ['Cycling', 'دراجة'], ['Rowing Machine', 'جهاز التجديف'], ['Elliptical', 'إليبتيكال'],
    ['Stair Climber', 'جهاز السلالم'], ['Jump Rope', 'نط الحبل'], ['HIIT', 'تمارين عالية الشدة'], ['Swimming', 'سباحة']] },
];
const TYPE_MUSCLE = { push: 'chest', pull: 'back', legs: 'legs', upper: 'chest', lower: 'legs', cardio: 'cardio' };
const nameRx = n => new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:$|[,:;|(×x\\-–—@\\d])', 'i');

function attachMusclePicker(root) {
  const box = $('#f_exercises', root), typeSel = $('#f_workout_type', root);
  if (!box) return;
  const ar = getLang() === 'ar';
  const lines = () => box.value.split('\n');
  const has = name => lines().some(l => nameRx(name).test(l.trim()));
  let active = TYPE_MUSCLE[typeSel?.value] || 'chest', picked = false;
  const first = MUSCLES.find(m => m.x.some(([n]) => has(n)));
  if (first) active = first.k;

  const wrap = document.createElement('div');
  wrap.className = 'f full mpick';
  box.closest('.f').before(wrap);

  const render = () => {
    const m = MUSCLES.find(x => x.k === active) || MUSCLES[0];
    wrap.innerHTML = `<label>Pick the exercises you did</label>
      <div class="mchips" role="tablist">${MUSCLES.map(x => { const c = x.x.filter(([n]) => has(n)).length;
        return `<button type="button" role="tab" class="chip ${x.k === m.k ? 'on' : ''}" data-m="${x.k}" aria-selected="${x.k === m.k}">${x.n}${c ? ` <b class="cnt" translate="no">${c}</b>` : ''}</button>`; }).join('')}</div>
      <div class="mlist">${m.x.map(([n, a]) => `<label class="chk"><input type="checkbox" data-x="${esc(n)}" ${has(n) ? 'checked' : ''}><span translate="no">${esc(ar ? a : n)}</span></label>`).join('')}</div>
      <p class="muted small" style="margin:6px 0 0">Tick the exercises you did. They are added to the exercises box below.</p>`;
  };
  wrap.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    active = b.dataset.m; picked = true; render();
  });
  wrap.addEventListener('change', e => {
    const cb = e.target.closest('input[data-x]'); if (!cb) return;
    const name = cb.dataset.x, rx = nameRx(name);
    let ls = lines();
    if (cb.checked) { if (!has(name)) { while (ls.length && !ls[ls.length - 1].trim()) ls.pop(); ls.push(name); } }
    else ls = ls.filter(l => !rx.test(l.trim()));
    box.value = ls.join('\n').replace(/^\n+/, '');
    render();                                          // refresh the counters on the muscle chips
    wrap.querySelector(`input[data-x="${CSS.escape(name)}"]`)?.focus();
  });
  box.addEventListener('input', render);               // typing in the box updates the ticks
  typeSel?.addEventListener('change', () => { if (!picked && TYPE_MUSCLE[typeSel.value]) { active = TYPE_MUSCLE[typeSel.value]; render(); } });
  render();
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
