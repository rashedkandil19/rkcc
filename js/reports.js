import { sb, S, $, $$, esc, fmtDate, fmtMonth, fmtMoney, fmtMins, label, today, must, wsDot, wsById, projById, empty, stat, bars, toast, refresh, routes, dateOf } from './core.js';

import { addDays, addMonths, weekStart, monthStart, monthEnd, trackedMinutes, isOverdue, isOpen, taskStats, habitStreak, consistency } from './logic.js';
import {
  summarize,
  freelanceBreakdown,
  projectProfitability,
  productPerformance,
  monthlyCashFlow,
} from "./finance-calc.js";
import {
  downloadCSV,
  downloadJSON,
  downloadXLSX,
  reportJSON,
} from "./export.js";

const R = { from: monthStart(today()), to: monthEnd(today()), ws: "" };
const inR = (d) => d && d >= R.from && d <= R.to;
const rangeBar =
  () => `<div class="row" style="margin-bottom:12px"><label class="row" style="margin:0">From <input type="date" id="rf" value="${R.from}" style="width:150px"></label><label class="row" style="margin:0">To <input type="date" id="rt" value="${R.to}" style="width:150px"></label>
  <button class="sm" id="r1">This month</button><button class="sm" id="r2">Last 30 days</button><button class="sm" id="r3">This year</button></div>`;
function bindRange(el) {
  const set = (f, t) => {
      R.from = f;
      R.to = t;
      refresh();
    },
    t0 = today();
  $("#rf", el).onchange = (e) => e.target.value && set(e.target.value, R.to);
  $("#rt", el).onchange = (e) => e.target.value && set(R.from, e.target.value);
  $("#r1", el).onclick = () => set(monthStart(t0), monthEnd(t0));
  $("#r2", el).onclick = () => set(addDays(t0, -29), t0);
  $("#r3", el).onclick = () =>
    set(t0.slice(0, 4) + "-01-01", t0.slice(0, 4) + "-12-31");
}
const fetchAll = () =>
  // Keep operational balances complete: old open receivables/payables and
  // partial invoice payments must be included even when the report period changes.
  Promise.all([
    must(sb.from("tasks").select("*").is("archived_at", null).limit(10000)),
    must(sb.from("activities").select("*").is("archived_at", null).gte("activity_date", R.from).lte("activity_date", R.to).limit(5000)),
    must(sb.from("transactions").select("*").limit(10000)),
    must(sb.from("invoices").select("*").limit(5000)),
    must(sb.from("invoice_payments").select("*").limit(10000)),
  ]);

/* ================= Overview dashboard ================= */
routes.overview = async (v) => {
  const t0 = today(),
    wk = weekStart(t0, S.prefs.week_start);
<<<<<<< HEAD
  const [[allTasks, acts, transactions, invoices, payments], workouts, todayActs] = await Promise.all([
    fetchAll(),
    must(sb.from("workouts").select("*").eq("workout_date", t0)),
    must(sb.from("activities").select("*").is("archived_at", null).eq("activity_date", t0).limit(2000)),
=======
  const [[tasks, acts, transactions, invoices, payments], workouts] = await Promise.all([
    fetchAll(),
    must(sb.from("workouts").select("*").eq("workout_date", t0)),
>>>>>>> f88c2b49f3c3e5afc8cc526a285d069f1e10ff23
  ]);
  const data = { transactions, invoices, payments },
    ws = R.ws || undefined;
  const tasks = R.ws ? allTasks.filter((t) => t.workspace_id === R.ws) : allTasks;
  const live = tasks.filter((t) => t.status !== "cancelled");
  const dueToday = live.filter((t) => t.due_date === t0),
    doneToday = tasks.filter(
      (t) => t.completed_at && dateOf(t.completed_at) === t0,
    );
  const mustLeft = dueToday.filter(
      (t) => t.task_type === "must_do" && isOpen(t),
    ),
    overdue = tasks.filter((t) => isOverdue(t, t0));
  const todayMins = trackedMinutes(todayActs.filter((a) => !R.ws || a.workspace_id === R.ws));
  const s = summarize(data, { from: R.from, to: R.to, workspace_id: ws });
  const rangeActs = acts.filter(
    (a) => inR(a.activity_date) && (!R.ws || a.workspace_id === R.ws),
  );
  const week = taskStats(
    live.filter((t) => t.due_date >= wk && t.due_date <= addDays(wk, 6)),
  );
  const inRange = live.filter((t) => inR(t.due_date)),
    rate = (ty) => taskStats(inRange.filter((t) => t.task_type === ty));
  const dailyPct = dueToday.length
    ? Math.round(
        (dueToday.filter((t) => t.status === "done").length / dueToday.length) *
          100,
      )
    : null;
  const recent = [
    ...acts.map((a) => ({
      ts: a.created_at,
      t: `Activity: ${a.title} (${fmtMins(a.duration_minutes)})`,
    })),
    ...tasks.map((t) => ({
      ts: t.updated_at,
      t: `Task ${t.status === "done" ? "completed" : "updated"}: ${t.title}`,
    })),
    ...transactions.map((x) => ({
      ts: x.created_at,
      t: `${label(x.type)} ${fmtMoney(x.amount_minor)}${x.description ? " · " + x.description : ""}`,
    })),
  ]
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .slice(0, 8);
  const wo = workouts[0];
  v.innerHTML = `<div class="row between"><div><h1>Overview</h1><p class="muted">Everything below is calculated from your records.</p></div>
    <select id="ow" style="width:190px" aria-label="Workspace filter"><option value="">All workspaces</option>${S.ws.map((w) => `<option value="${w.id}" ${R.ws === w.id ? "selected" : ""}>${esc(w.name)}</option>`).join("")}</select></div>
    <h2 style="margin-top:16px">Today</h2><div class="grid">${stat("Tasks today", dueToday.length)}${stat("Completed", doneToday.length)}${stat("Must Do remaining", mustLeft.length, "", mustLeft.length ? "warn" : "")}${stat("Overdue", overdue.length, "", overdue.length ? "neg" : "")}${stat("Tracked time", fmtMins(todayMins))}${stat("Workout", wo ? label(wo.status) : "Not logged", wo ? label(wo.workout_type) : "")}</div>
    <h2 style="margin-top:20px">Businesses</h2><div class="grid" id="bz"></div>
    <h2 style="margin-top:20px">Financial snapshot</h2>${rangeBar()}<div class="grid">${stat("Revenue", fmtMoney(s.revenue), "Recognized in period")}${stat("Cash collected", fmtMoney(s.cashCollected))}${stat("Expenses", fmtMoney(s.expenses))}${stat("Net cash flow", fmtMoney(s.netCashFlow), "", s.netCashFlow < 0 ? "neg" : "")}${stat("Receivables", fmtMoney(s.receivables), "Outstanding, not cash")}${stat("Payables", fmtMoney(s.payables))}${stat("Net profit", fmtMoney(s.netProfit), "", s.netProfit < 0 ? "neg" : "")}</div>
    <h2 style="margin-top:20px">Productivity</h2><div class="grid">${stat("Today completion", dailyPct == null ? "—" : dailyPct + "%", dueToday.length ? `${dueToday.filter((t) => t.status === "done").length} of ${dueToday.length}` : "No tasks due today")}${stat("This week", week.total ? week.rate + "%" : "—", `${week.done} of ${week.total} tasks`)}${stat("Must Do (period)", rate("must_do").total ? rate("must_do").rate + "%" : "—", `${rate("must_do").done}/${rate("must_do").total}`)}${stat("Additional (period)", rate("additional").total ? rate("additional").rate + "%" : "—", `${rate("additional").done}/${rate("additional").total}`)}</div>
    <div class="two" style="margin-top:12px"><div class="card"><h2>Time by workspace</h2>${bars(
      S.ws
        .map((w) => ({
          label: w.name,
          value: trackedMinutes(
            rangeActs.filter((a) => a.workspace_id === w.id),
          ),
          color: w.color,
        }))
        .filter((x) => x.value > 0),
      fmtMins,
    )}</div>
    <div class="card"><h2>Recent activity</h2>${recent.length ? `<table><tbody>${recent.map((r) => `<tr><td>${esc(r.t)}</td><td class="muted small nowrap">${fmtDate(r.ts.slice(0, 10))}</td></tr>`).join("")}</tbody></table>` : empty("Nothing yet. Use Quick Add to log your first task or activity.")}</div></div>`;
  $("#bz", v).innerHTML =
    S.ws
      .filter((w) => !w.archived_at)
      .map((w) => {
        const fs = summarize(data, {
            from: R.from,
            to: R.to,
            workspace_id: w.id,
          }),
          act = S.projects.filter(
            (p) => p.workspace_id === w.id && p.status === "active",
          ).length,
          open = tasks.filter(
            (t) => t.workspace_id === w.id && isOpen(t),
          ).length;
        const ra = acts
          .filter((a) => a.workspace_id === w.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 2);
        return `<div class="card"><div><span class="dot" style="background:${esc(w.color)}"></span><b>${esc(w.name)}</b></div><div class="row" style="margin:8px 0"><div><div class="stat">${act}</div><div class="muted small">active projects</div></div><div><div class="stat">${open}</div><div class="muted small">open tasks</div></div></div>
      <div class="small">Revenue ${fmtMoney(fs.revenue)}<br>Expenses ${fmtMoney(fs.expenses)}<br><b class="${fs.netProfit < 0 ? "neg" : ""}">Profit ${fmtMoney(fs.netProfit)}</b></div>
      <div class="muted small" style="margin-top:6px">${ra.length ? ra.map((a) => esc(a.title)).join(" · ") : "No recent activity"}</div></div>`;
      })
      .join("") || empty("No workspaces.");
  $("#ow").onchange = (e) => {
    R.ws = e.target.value;
    refresh();
  };
  bindRange(v);
};

/* ================= Reports ================= */
const C = (k, l, t = "text") => ({ k, l, t });
const fmtCell = (c, v) =>
  v == null
    ? "—"
    : c.t === "money"
      ? fmtMoney(v)
      : c.t === "mins"
        ? fmtMins(v)
        : c.t === "date"
          ? fmtDate(v)
          : c.t === "pct"
            ? v + "%"
            : c.t === "month"
              ? fmtMonth(v)
              : esc(v);
const groupBy = (arr, f) => {
  const m = {};
  arr.forEach((x) => (m[f(x)] ||= []).push(x));
  return m;
};

routes.reports = async (v) => {
  const t0 = today();
  const [tasks, acts, transactions, invoices, payments] = await fetchAll();
  const [workouts, habits, hlogs, products, orders] = await Promise.all([
    must(
      sb
        .from("workouts")
        .select("*")
        .gte("workout_date", R.from)
        .lte("workout_date", R.to),
    ),
    must(sb.from("habits").select("*").is("archived_at", null)),
    must(
      sb.from("habit_logs").select("*").gte("log_date", addDays(R.from, -400)),
    ),
    must(sb.from("products").select("*")),
    must(
      sb
        .from("orders")
        .select("*")
        .gte("order_date", R.from)
        .lte("order_date", R.to),
    ),
  ]);
  const data = { transactions, invoices, payments },
    ra = acts.filter((a) => inR(a.activity_date));
  const group = (f, name) =>
    Object.entries(groupBy(ra, f))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, list]) => ({
        [name]: k,
        count: list.length,
        minutes: trackedMinutes(list),
      }));
  const months = [];
  for (let m = monthStart(R.from); m <= R.to; m = addMonths(m, 1))
    months.push(m);
  const rangeTasks = tasks.filter(
    (t) =>
      t.status !== "cancelled" &&
      (inR(t.due_date) || (!t.due_date && inR(t.created_at.slice(0, 10)))),
  );
  const R_ = [
    [
      "Productivity",
      "Daily activity",
      [
        C("date", "Date", "date"),
        C("count", "Activities", "num"),
        C("minutes", "Tracked time", "mins"),
      ],
      group((a) => a.activity_date, "date"),
    ],
    [
      "Productivity",
      "Weekly activity",
      [
        C("week", "Week starting", "date"),
        C("count", "Activities", "num"),
        C("minutes", "Tracked time", "mins"),
      ],
      group((a) => weekStart(a.activity_date, S.prefs.week_start), "week"),
    ],
    [
      "Productivity",
      "Monthly activity",
      [
        C("month", "Month", "month"),
        C("count", "Activities", "num"),
        C("minutes", "Tracked time", "mins"),
      ],
      group((a) => a.activity_date.slice(0, 7), "month"),
    ],
    [
      "Productivity",
      "Work hours by workspace",
      [
        C("workspace", "Workspace"),
        C("count", "Activities", "num"),
        C("minutes", "Tracked time", "mins"),
      ],
      S.ws
        .map((w) => ({
          workspace: w.name,
          ...((l) => ({ count: l.length, minutes: trackedMinutes(l) }))(
            ra.filter((a) => a.workspace_id === w.id),
          ),
        }))
        .filter((r) => r.count),
    ],
    [
      "Productivity",
      "Task completion rate",
      [
        C("workspace", "Workspace"),
        C("total", "Tasks", "num"),
        C("done", "Done", "num"),
        C("rate", "Completion", "pct"),
      ],
      S.ws
        .map((w) => ({
          workspace: w.name,
          ...taskStats(rangeTasks.filter((t) => t.workspace_id === w.id)),
        }))
        .filter((r) => r.total),
    ],
    [
      "Productivity",
      "Estimated vs actual time",
      [
        C("title", "Task"),
        C("est", "Estimated", "mins"),
        C("actual", "Actual", "mins"),
        C("diff", "Difference", "mins"),
      ],
      rangeTasks
        .filter((t) => t.status === "done" && t.estimated_minutes != null)
        .map((t) => ({
          title: t.title,
          est: t.estimated_minutes,
          actual: t.actual_minutes,
          diff: t.actual_minutes - t.estimated_minutes,
        })),
    ],
    [
      "Productivity",
      "Overdue tasks",
      [
        C("title", "Task"),
        C("workspace", "Workspace"),
        C("due", "Due", "date"),
        C("days", "Days overdue", "num"),
      ],
      tasks
        .filter((t) => isOverdue(t, t0))
        .map((t) => ({
          title: t.title,
          workspace: wsById(t.workspace_id)?.name,
          due: t.due_date,
          days: Math.round((new Date(t0) - new Date(t.due_date)) / 864e5),
        })),
    ],
    [
      "Business",
      "Revenue by workspace",
      [
        C("workspace", "Workspace"),
        C("revenue", "Revenue", "money"),
        C("expenses", "Expenses", "money"),
        C("profit", "Net profit", "money"),
        C("cash", "Cash collected", "money"),
        C("rec", "Receivables", "money"),
      ],
      S.ws.map((w) => {
        const s = summarize(data, {
          from: R.from,
          to: R.to,
          workspace_id: w.id,
        });
        return {
          workspace: w.name,
          revenue: s.revenue,
          expenses: s.expenses,
          profit: s.netProfit,
          cash: s.cashCollected,
          rec: s.receivables,
        };
      }),
    ],
    [
      "Business",
      "Project profitability",
      [
        C("project", "Project"),
        C("workspace", "Workspace"),
        C("contract", "Contract value", "money"),
        C("revenue", "Revenue", "money"),
        C("cash", "Collected", "money"),
        C("expenses", "Expenses", "money"),
        C("profit", "Profit", "money"),
      ],
      S.projects
        .map((p) => {
          const s = projectProfitability(p, {
            ...data,
            transactions: transactions.filter(
              (t) => t.txn_date >= R.from && t.txn_date <= R.to,
            ),
          });
          return {
            project: p.name,
            workspace: wsById(p.workspace_id)?.name,
            contract: s.contract,
            revenue: s.revenue,
            cash: s.cashCollected,
            expenses: s.expenses,
            profit: s.netProfit,
          };
        })
        .filter((r) => r.revenue || r.expenses),
    ],
    [
      "Business",
      "Monthly business performance",
      [
        C("month", "Month", "month"),
        C("revenue", "Revenue", "money"),
        C("expenses", "Expenses", "money"),
        C("profit", "Net profit", "money"),
        C("cin", "Cash in", "money"),
        C("cout", "Cash out", "money"),
      ],
      months.map((m) => {
        const s = summarize(data, {
          from: m < R.from ? R.from : m,
          to: monthEnd(m) > R.to ? R.to : monthEnd(m),
        });
        return {
          month: m.slice(0, 7),
          revenue: s.revenue,
          expenses: s.expenses,
          profit: s.netProfit,
          cin: s.cashIn + s.contributions,
          cout: s.cashOut + s.withdrawals + s.refunds,
        };
      }),
    ],
    [
      "Business",
      "RK Store product performance",
      [
        C("product", "Product"),
        C("orders", "Orders", "num"),
        C("units", "Units", "num"),
        C("revenue", "Revenue", "money"),
        C("gross", "Gross profit", "money"),
        C("net", "Net profit", "money"),
        C("margin", "Net margin", "pct"),
      ],
      productPerformance(products, orders)
        .filter((r) => r.orders)
        .map((r) => ({
          product: r.product.name,
          orders: r.orders,
          units: r.units,
          revenue: r.revenue,
          gross: r.gross,
          net: r.net,
          margin: r.margin,
        })),
    ],
    [
      "Business",
      "Freelance commission analysis",
      [
        C("project", "Project"),
        C("gross", "Gross value", "money"),
        C("commission", "Intermediary commission", "money"),
        C("net", "My net", "money"),
        C("collected", "Collected", "money"),
        C("remaining", "Remaining", "money"),
      ],
      S.projects
        .filter((p) => p.commission_type)
        .map((p) => ({ project: p.name, ...freelanceBreakdown(p, data) })),
    ],
    [
      "Personal",
      "Workout frequency",
      [
        C("type", "Workout type"),
        C("sessions", "Sessions done", "num"),
        C("minutes", "Total time", "mins"),
      ],
      Object.entries(
        groupBy(
          workouts.filter((w) => w.status === "done"),
          (w) => w.workout_type,
        ),
      ).map(([k, l]) => ({
        type: label(k),
        sessions: l.length,
        minutes: l.reduce((s, w) => s + (w.duration_minutes || 0), 0),
      })),
    ],
    [
      "Personal",
      "Habit consistency",
      [
        C("habit", "Habit"),
        C("logged", "Days logged", "num"),
        C("done", "Days done", "num"),
        C("pct", "Consistency", "pct"),
        C("streak", "Current streak (days)", "num"),
      ],
      habits.map((h) => {
        const l = hlogs.filter((x) => x.habit_id === h.id),
          c = consistency(l, R.from, R.to);
        return {
          habit: h.name,
          logged: c.logged,
          done: c.done,
          pct: c.pct,
          streak: habitStreak(l, t0),
        };
      }),
    ],
    [
      "Personal",
      "Sleep trends",
      [
        C("date", "Date", "date"),
        C("hours", "Hours slept", "num"),
        C("target", "Target", "num"),
      ],
      habits
        .filter((h) => h.unit === "hours")
        .flatMap((h) =>
          hlogs
            .filter(
              (l) => l.habit_id === h.id && l.value != null && inR(l.log_date),
            )
            .map((l) => ({
              date: l.log_date,
              hours: Number(l.value),
              target: h.target_value != null ? Number(h.target_value) : null,
            })),
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    ],
  ];
  v.innerHTML = `<div class="row between"><div><h1>Reports</h1><p class="muted">Built from your real records for the chosen dates. Exports match what you see.</p></div><div class="row"><button id="xa" class="pri">Export all (Excel)</button><button id="ja">Export all (JSON)</button></div></div>${rangeBar()}
    ${["Productivity", "Business", "Personal"]
      .map(
        (g) =>
          `<h2 style="margin-top:20px">${g}</h2>${R_.map((r, i) => [r, i])
            .filter(([r]) => r[0] === g)
            .map(
              ([
                [, title, cols, rows],
                i,
              ]) => `<div class="card" style="margin-bottom:12px"><div class="row between"><h3>${esc(title)}</h3>
      <div class="row"><button class="sm" data-x="csv" data-i="${i}">CSV</button><button class="sm" data-x="xlsx" data-i="${i}">Excel</button><button class="sm" data-x="json" data-i="${i}">JSON</button></div></div>
      ${rows.length ? `<div style="overflow-x:auto"><table><thead><tr>${cols.map((c) => `<th>${esc(c.l)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${fmtCell(c, r[c.k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : empty("No data for these dates.")}</div>`,
            )
            .join("")}`,
      )
      .join("")}`;
  bindRange(v);
  const fname = (i) => R_[i][1].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  $$("[data-x]", v).forEach(
    (b) =>
      (b.onclick = async () => {
        const [, title, cols, rows] = R_[b.dataset.i];
        try {
          b.dataset.x === "csv"
            ? downloadCSV(fname(b.dataset.i), cols, rows)
            : b.dataset.x === "json"
              ? downloadJSON(fname(b.dataset.i), {
                  report: title,
                  from: R.from,
                  to: R.to,
                  rows: reportJSON(cols, rows),
                })
              : await downloadXLSX(fname(b.dataset.i), [
                  { name: title, cols, rows },
                ]);
        } catch (e) {
          toast(e.message, true);
        }
      }),
  );
  $("#xa").onclick = async () => {
    try {
      await downloadXLSX(
        "rk-reports",
        R_.map(([, name, cols, rows]) => ({ name, cols, rows })),
      );
    } catch (e) {
      toast(e.message, true);
    }
  };
  $("#ja").onclick = () =>
    downloadJSON("rk-reports", {
      from: R.from,
      to: R.to,
      reports: Object.fromEntries(
        R_.map(([, name, cols, rows]) => [name, reportJSON(cols, rows)]),
      ),
    });
};
