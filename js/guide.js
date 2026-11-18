import { routes, $, S, savePref, toast } from './core.js';

routes.guide = async v => {
  v.innerHTML = `<div class="row between"><div><h1>Getting Started</h1><p class="muted">A practical walkthrough for setting up and using RK Control Center.</p></div><span class="badge">Quick guide</span></div>
  <div class="grid guide-grid" style="margin-top:16px">
    <section class="card"><h2>Your daily workflow</h2><ol><li>Open Overview to see priorities and current status.</li><li>Use Quick Add to capture tasks, activities, projects, transactions, workouts or notes.</li><li>Start the day by choosing the few tasks that matter most.</li><li>Update task status and log work as you go.</li><li>Review Finance and Reports weekly.</li></ol></section>
    <section class="card"><h2>Tasks &amp; projects</h2><p>Create a workspace for each business or life area, then create projects inside it. Break projects into tasks, set priorities and due dates, and update status as work progresses.</p><p class="muted small">Tip: use one project per client engagement or meaningful outcome; avoid turning every tiny action into a project.</p></section>
    <section class="card"><h2>Money &amp; finance</h2><p>Record income, expenses, client payments, commissions and business costs. Create accounts such as Cash, Bank and Wallet to track balances. Separate contract value from cash actually collected, and record partial payments when they happen.</p><p class="muted small">Tip: enter transactions on the date money actually moved. Review receivables and payables separately from cash.</p></section>
    <section class="card"><h2>Time tracking</h2><p>Use Daily Log to add activities or run a timer. Link activities to a workspace, project or task when useful. Review the time totals to understand where your working hours go.</p></section>
    <section class="card"><h2>Fitness tracking</h2><p>Log each workout by muscle group. The suggested split is Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs, then Rest / Recovery. Add exercises, sets, reps and weights in the exercise details or notes.</p><p class="muted small">This is a tracking template, not a requirement to train seven days in a row. Adjust rest days and volume to your recovery.</p></section>
    <section class="card"><h2>Habits</h2><p>Create habits you want to monitor, then tap the day cells to log them. For sleep, set the unit to <code>hours</code> to record the number of hours slept. Missing days remain unrecorded rather than being treated as failures.</p></section>
    <section class="card"><h2>Data safety</h2><p>Export a JSON backup regularly from Settings &amp; Backup and keep it outside this device. Restore merges records by ID; it does not delete records missing from the backup.</p><p class="muted small">Your data lives in Supabase. Never put the service_role key in browser code or share it.</p></section>
    <section class="card"><h2>Setup checklist</h2><ul class="checklist"><li>Create your workspaces</li><li>Add your accounts and starting balances</li><li>Set your language and preferences</li><li>Create your first project and tasks</li><li>Add your current habits</li><li>Save your first backup</li></ul></section>
  </div>
  <div class="card row between" style="margin-top:14px"><div><b>Ready to get started?</b><div class="muted small">You can revisit this guide anytime from the sidebar.</div></div><button class="pri" id="finishguide">Finish setup &amp; open Overview</button></div>`;
  $('#finishguide', v).onclick = async () => {
    try { await savePref('setup_complete', true); toast('Setup completed.'); location.hash = '#/overview'; }
    catch (e) { toast(e.message, true); }
  };
};
