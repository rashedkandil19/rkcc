import { sb, S, $, esc, must, toast, confirmBox, routes, savePref } from './core.js';
import { TABLES, buildBackup, validateBackup } from './backup.js';
import { downloadJSON } from './export.js';
import { applyLanguage } from './i18n.js';

const BACKUP_INTERVAL_DAYS = 7;

async function readAllTables() {
  const out = {};
  const pageSize = 1000;
  for (const table of TABLES) {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const page = await must(sb.from(table).select('*').order('created_at', { ascending: true }).range(from, from + pageSize - 1));
      rows.push(...page);
      if (page.length < pageSize) break;
    }
    out[table] = rows;
  }
  return out;
}

export async function exportFullBackup() {
  const tables = await readAllTables();
  const backup = buildBackup(tables);
  downloadJSON('rk-control-center-backup', backup);
  await savePref('last_backup', new Date().toISOString());
  toast('Backup exported successfully.');
}

export async function autoBackupIfDue() {
  if (!S.prefs.auto_backup) return;
  const last = S.prefs.last_backup ? new Date(S.prefs.last_backup).getTime() : 0;
  if (Date.now() - last < BACKUP_INTERVAL_DAYS * 86400000) return;
  // Browsers cannot guarantee unattended downloads; remind the user instead of falsely marking a backup complete.
  toast('Backup reminder: open Settings & Backup and export a fresh copy.');
}

async function restoreBackup(file) {
  const parsed = JSON.parse(await file.text());
  const check = validateBackup(parsed);
  if (!check.ok) throw new Error(check.errors.join('\n'));
  const counts = Object.entries(check.counts).filter(([, n]) => n).map(([t, n]) => `${t}: ${n}`).join('\n');
  const ok = await confirmBox(`Merge this backup into your account? Existing rows with matching IDs will be updated. Rows not in the backup will NOT be deleted.\n\n${counts || 'The backup is empty.'}`, 'Restore backup');
  if (!ok) return;
  for (const table of TABLES) {
    const rows = parsed.tables[table].map(row => ({ ...row, user_id: S.user.id }));
    if (!rows.length) continue;
    const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Restore stopped at ${table}: ${error.message}`);
  }
  toast('Backup merged. Reloading your data…');
  location.reload();
}

routes.settings = async v => {
  v.innerHTML = `<div class="row between"><div><h1>Settings & Backup</h1><p class="muted">Personal preferences, account and data safety.</p></div></div>
    <div class="two" style="margin-top:16px">
      <section class="card"><h2>Preferences</h2>
        <div class="f"><label for="language">Language</label><select id="language"><option value="en">English</option><option value="ar">العربية</option></select></div>
        <div class="f"><label for="currency">Currency</label><select id="currency"><option value="EGP">EGP — Egyptian Pound</option><option value="USD">USD — US Dollar</option></select></div>
        <div class="f"><label for="datefmt">Date format</label><select id="datefmt"><option>DD MMM YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></div>
        <div class="f"><label for="weekstart">Week starts on</label><select id="weekstart"><option value="saturday">Saturday</option><option value="sunday">Sunday</option><option value="monday">Monday</option></select></div>
        <div class="f"><label for="theme">Appearance</label><select id="theme"><option value="dark">Dark</option><option value="light">Light</option></select></div>
        <button class="pri" id="saveprefs">Save preferences</button>
      </section>
      <section class="card"><h2>Backup & Restore</h2><p class="muted">Export all your records to a JSON file. Keep a copy somewhere safe outside this device.</p>
        <label class="row" style="gap:8px"><input id="autobackup" type="checkbox" style="width:auto"> Attempt a browser backup every 7 days after sign-in</label>
        <p class="small muted">Last backup: <span id="lastbackup">—</span></p>
        <div class="row"><button class="pri" id="exportbackup">Export full backup</button><label class="sm" for="restorefile" style="margin:0;cursor:pointer"><span class="badge">Choose backup to restore</span></label><input id="restorefile" type="file" accept="application/json,.json" hidden></div>
        <p class="small muted">Restore merges records by ID. It does not delete records that are missing from the backup.</p>
      </section>
      <section class="card"><h2>Account</h2><p>${esc(S.email || '')}</p><button id="logout" class="danger">Sign out</button></section>
      <section class="card"><h2>About</h2><b>RK Control Center</b><p class="muted">Business & Life Operating System · Version 1.0</p><p class="small muted">Your data is stored in your Supabase project and protected by Row Level Security policies. Never share your service_role key.</p></section>
    </div>`;
  $('#language', v).value = S.prefs.language || 'en';
  $('#currency', v).value = S.prefs.currency || 'EGP';
  $('#datefmt', v).value = S.prefs.date_format || 'DD MMM YYYY';
  $('#weekstart', v).value = S.prefs.week_start || 'saturday';
  $('#theme', v).value = S.prefs.theme || 'dark';
  $('#autobackup', v).checked = !!S.prefs.auto_backup;
  $('#lastbackup', v).textContent = S.prefs.last_backup ? new Date(S.prefs.last_backup).toLocaleString() : 'Never';
  $('#saveprefs', v).onclick = async () => {
    const btn = $('#saveprefs', v); btn.disabled = true;
    try {
      for (const [k, el] of [['language', 'language'], ['currency', 'currency'], ['date_format', 'datefmt'], ['week_start', 'weekstart'], ['theme', 'theme']]) {
        const value = $('#' + el, v).value;
        await savePref(k, value);
      }
      await savePref('auto_backup', $('#autobackup', v).checked);
      applyLanguage(S.prefs.language); toast('Preferences saved.');
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
  };
  $('#autobackup', v).onchange = async e => {
    try { await savePref('auto_backup', e.target.checked); }
    catch (err) { e.target.checked = !e.target.checked; toast(err.message, true); }
  };
  $('#exportbackup', v).onclick = async () => {
    const b = $('#exportbackup', v); b.disabled = true;
    try { await exportFullBackup(); $('#lastbackup', v).textContent = new Date().toLocaleString(); }
    catch (e) { toast(e.message, true); }
    b.disabled = false;
  };
  $('#restorefile', v).onchange = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try { await restoreBackup(file); } catch (err) { toast(err.message, true); }
    e.target.value = '';
  };
  $('#logout', v).onclick = async () => {
    if (!(await confirmBox('Sign out of RK Control Center?'))) return;
    const { error } = await sb.auth.signOut(); if (error) toast(error.message, true);
  };
};
