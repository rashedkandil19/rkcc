// Pure business logic (no DOM, no database). Mirrors the SQL functions and is unit-tested.
const pad = (n) => String(n).padStart(2, "0");
export const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
export const addMonths = (s, n) => {
  const d = parseDate(s),
    day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISODate(d);
};
const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
export function weekStart(s, startDay = "saturday") {
  const d = parseDate(s),
    target = DAYS.indexOf(startDay);
  return addDays(s, -((d.getDay() - target + 7) % 7));
}
export const monthStart = (s) => s.slice(0, 7) + "-01";
export const monthEnd = (s) => {
  const d = parseDate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

/* ---- tasks ---- */
export const isOpen = (t) => t.status === "todo" || t.status === "in_progress";
export const isOverdue = (t, today) =>
  !t.archived_at && isOpen(t) && !!t.due_date && t.due_date < today;
export function nextDue(due, rule, today) {
  const base = due || today;
  if (rule === "daily") return addDays(base, 1);
  if (rule === "weekly") return addDays(base, 7);
  if (rule === "monthly") return addMonths(base, 1);
  return null;
}
export function completeTask(t, now = new Date()) {
  if (t.status === "done") return { task: t, next: null, history: [] };
  const task = { ...t, status: "done", completed_at: now.toISOString() };
  const nd = nextDue(t.due_date, t.recurrence, toISODate(now));
  const next = nd
    ? { ...t, id: undefined, status: "todo", completed_at: null, due_date: nd }
    : null;
  return { task, next, history: [{ event: "completed" }] };
}
export function rescheduleTask(t, newDate, note = "") {
  if (t.status === "done" || t.status === "cancelled")
    throw new Error("Finished tasks cannot be rescheduled");
  // original_date (creation/first planned date) is never touched.
  return {
    task: { ...t, due_date: newDate },
    history: [
      { event: "rescheduled", from_date: t.due_date, to_date: newDate, note },
    ],
  };
}
export function taskStats(tasks) {
  const live = tasks.filter((t) => t.status !== "cancelled");
  const done = live.filter((t) => t.status === "done").length;
  return {
    total: live.length,
    done,
    rate: live.length ? Math.round((done / live.length) * 100) : 0,
  };
}

/* ---- time tracking ---- */
export const timerStart = (now) => ({
  timer_state: "running",
  timer_started_at: now.toISOString(),
  start_at: now.toISOString(),
  accumulated_seconds: 0,
  duration_minutes: 0,
});
export const liveSeconds = (a, now = new Date()) =>
  (a.accumulated_seconds || 0) +
  (a.timer_state === "running"
    ? Math.max(0, Math.floor((now - new Date(a.timer_started_at)) / 1000))
    : 0);
export const timerPause = (a, now) => ({
  timer_state: "paused",
  accumulated_seconds: liveSeconds(a, now),
  timer_started_at: null,
});
export const timerResume = (a, now) => ({
  timer_state: "running",
  timer_started_at: now.toISOString(),
});
export function timerStop(a, now) {
  const secs = liveSeconds(a, now);
  return {
    timer_state: "stopped",
    accumulated_seconds: secs,
    timer_started_at: null,
    end_at: now.toISOString(),
    duration_minutes: Math.round(secs / 60),
  };
}
/** Minutes of one activity (running/paused timers use live seconds). */
export const activityMinutes = (a, now = new Date()) =>
  a.timer_state === "running" || a.timer_state === "paused"
    ? liveSeconds(a, now) / 60
    : a.duration_minutes || 0;
/** Total tracked minutes without double counting: entries with a start time are merged as
 *  intervals [start, start + duration]; entries without one are simply added. */
export function trackedMinutes(acts, now = new Date()) {
  const spans = [];
  let loose = 0;
  for (const a of acts) {
    const m = activityMinutes(a, now);
    if (a.start_at)
      spans.push([
        new Date(a.start_at).getTime(),
        new Date(a.start_at).getTime() + m * 60000,
      ]);
    else loose += m;
  }
  spans.sort((x, y) => x[0] - y[0]);
  let total = 0,
    curS = null,
    curE = null;
  for (const [s, e] of spans) {
    if (curS === null) {
      curS = s;
      curE = e;
    } else if (s <= curE) curE = Math.max(curE, e);
    else {
      total += curE - curS;
      curS = s;
      curE = e;
    }
  }
  if (curS !== null) total += curE - curS;
  return Math.round((total / 60000 + loose) * 100) / 100;
}

/* ---- habits ---- */
export function habitStreak(logs, today) {
  const done = new Set(logs.filter((l) => l.done).map((l) => l.log_date));
  let d = done.has(today) ? today : addDays(today, -1),
    n = 0;
  while (done.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
/** Only days that were actually logged count; a missing day is "no data", not a failure. */
export function consistency(logs, from, to) {
  const inRange = logs.filter((l) => l.log_date >= from && l.log_date <= to);
  const done = inRange.filter((l) => l.done).length;
  return {
    done,
    logged: inRange.length,
    pct: inRange.length ? Math.round((done / inRange.length) * 100) : null,
  };
}
