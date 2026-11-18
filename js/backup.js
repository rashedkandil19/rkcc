// Backup format + validation (pure). Restore order respects foreign keys.
export const TABLES = ['workspaces', 'clients', 'projects', 'categories', 'accounts', 'tasks', 'task_history', 'activities', 'daily_logs', 'invoices', 'invoice_items', 'transactions', 'invoice_payments', 'workouts', 'habits', 'habit_logs', 'goals', 'attachments', 'settings', 'products', 'orders'];
export const APP = 'rk-control-center', VERSION = 1;
const FKS = { projects: [['workspace_id', 'workspaces'], ['client_id', 'clients']], tasks: [['workspace_id', 'workspaces'], ['project_id', 'projects']], activities: [['workspace_id', 'workspaces'], ['project_id', 'projects'], ['task_id', 'tasks']],
  invoices: [['workspace_id', 'workspaces']], invoice_items: [['invoice_id', 'invoices']], transactions: [['workspace_id', 'workspaces'], ['project_id', 'projects'], ['account_id', 'accounts'], ['invoice_id', 'invoices']],
  invoice_payments: [['invoice_id', 'invoices'], ['transaction_id', 'transactions']], habit_logs: [['habit_id', 'habits']], orders: [['product_id', 'products']], task_history: [['task_id', 'tasks']] };

export const buildBackup = (tables, now = new Date()) => ({ app: APP, version: VERSION, created_at: now.toISOString(), tables });

export function validateBackup(b) {
  const errors = [], counts = {};
  if (!b || typeof b !== 'object') return { ok: false, errors: ['Not a valid backup file'], counts };
  if (b.app !== APP) errors.push('This file was not created by RK Control Center');
  if (b.version !== VERSION) errors.push(`Unsupported backup version: ${b.version}`);
  if (!b.tables || typeof b.tables !== 'object') { errors.push('Backup has no tables'); return { ok: false, errors, counts }; }
  const ids = {};
  for (const t of TABLES) {
    const rows = b.tables[t];
    if (rows === undefined) { errors.push(`Missing table: ${t}`); continue; }
    if (!Array.isArray(rows)) { errors.push(`Table ${t} is not a list`); continue; }
    counts[t] = rows.length;
    ids[t] = new Set(rows.map(r => r.id));
    if (rows.some(r => !r.id)) errors.push(`Table ${t} has rows without an id`);
    if (ids[t].size !== rows.length) errors.push(`Table ${t} has duplicate ids`);
  }
  for (const [t, fks] of Object.entries(FKS)) for (const r of b.tables[t] || []) for (const [col, ref] of fks)
    if (r[col] && ids[ref] && !ids[ref].has(r[col])) errors.push(`${t}.${col} points to a missing ${ref} row`);
  return { ok: errors.length === 0, errors: [...new Set(errors)].slice(0, 20), counts };
}
