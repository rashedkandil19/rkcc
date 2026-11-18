-- RK Control Center: full schema (Supabase / Postgres). Run once in SQL Editor.
-- Money is stored as integer minor units (piasters). 100 = 1.00 EGP.
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, color text not null default '#06B6D4', sort_order int not null default 0,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name));

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, company text, email text, phone text, notes text,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name));

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id),
  client_id uuid references clients(id),
  name text not null, description text, start_date date, deadline date,
  status text not null default 'planning' check (status in ('planning','active','on_hold','completed','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  budget_minor bigint not null default 0 check (budget_minor >= 0),
  contract_value_minor bigint not null default 0 check (contract_value_minor >= 0),
  commission_type text check (commission_type in ('fixed','percent')),
  commission_value numeric check (commission_value >= 0),
  notes text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (deadline is null or start_date is null or deadline >= start_date));

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, kind text not null check (kind in ('task','transaction','activity')),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, kind, name));

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, type text not null default 'cash' check (type in ('cash','bank','wallet','other')),
  currency text not null default 'EGP', opening_balance_minor bigint not null default 0,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name));

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id),
  project_id uuid references projects(id), category_id uuid references categories(id),
  title text not null, description text,
  task_type text not null default 'additional' check (task_type in ('must_do','additional','backlog')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  original_date date not null default current_date, due_date date,
  estimated_minutes int check (estimated_minutes >= 0), actual_minutes int not null default 0 check (actual_minutes >= 0),
  sort_order double precision not null default 0, recurrence text, notes text,
  completed_at timestamptz, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table task_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  event text not null, from_date date, to_date date, note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id),
  project_id uuid references projects(id), task_id uuid references tasks(id),
  title text not null, description text, activity_date date not null default current_date,
  start_at timestamptz, end_at timestamptz,
  duration_minutes int not null default 0 check (duration_minutes >= 0),
  activity_type text not null default 'other' check (activity_type in ('development','design','marketing','client_communication','administration','learning','personal','other')),
  timer_state text check (timer_state in ('running','paused','stopped')),
  timer_started_at timestamptz, accumulated_seconds int not null default 0,
  notes text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_at is null or start_at is null or end_at >= start_at));
create unique index one_running_timer on activities (user_id) where timer_state = 'running';

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null, mood smallint check (mood between 1 and 5), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, log_date));

create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id),
  client_id uuid references clients(id), project_id uuid references projects(id),
  invoice_no text not null, issue_date date not null default current_date, due_date date,
  total_minor bigint not null default 0 check (total_minor >= 0),
  status text not null default 'draft' check (status in ('draft','sent','partially_paid','paid','overdue','cancelled')),
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, invoice_no));

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null, quantity numeric not null default 1 check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  txn_date date not null default current_date,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'EGP',
  type text not null check (type in ('income','expense','receivable','payable','owner_contribution','owner_withdrawal','account_transfer','refund')),
  workspace_id uuid not null references workspaces(id),
  project_id uuid references projects(id), invoice_id uuid references invoices(id),
  category_id uuid references categories(id),
  account_id uuid references accounts(id), to_account_id uuid references accounts(id),
  payment_method text, status text not null default 'posted' check (status in ('pending','posted','void')),
  description text, reference_no text, notes text,
  voided_at timestamptz, void_reason text,
  settles_txn_id uuid references transactions(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (type <> 'account_transfer' or (account_id is not null and to_account_id is not null and account_id <> to_account_id)),
  check (status <> 'void' or voided_at is not null));
create unique index txn_unique_ref on transactions (user_id, reference_no) where reference_no is not null and status <> 'void';

create table invoice_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id),
  account_id uuid references accounts(id), transaction_id uuid references transactions(id),
  paid_on date not null default current_date,
  amount_minor bigint not null check (amount_minor > 0),
  reference_no text, voided_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index payment_no_dupes on invoice_payments (user_id, invoice_id, paid_on, amount_minor, coalesce(reference_no,'')) where voided_at is null;

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_date date not null default current_date,
  workout_type text not null check (workout_type in ('chest','back','shoulders','biceps','triceps','legs','abs','push','pull','upper','lower','cardio','rest','other')),
  duration_minutes int check (duration_minutes >= 0),
  status text not null default 'planned' check (status in ('planned','done','skipped')),
  exercises jsonb, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, target_value numeric, unit text, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name));

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null, done boolean not null, value numeric,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (habit_id, log_date));

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid references workspaces(id), title text not null, description text,
  target_date date, status text not null default 'active' check (status in ('active','achieved','dropped')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade, task_id uuid references tasks(id) on delete cascade,
  kind text not null check (kind in ('file','url')), label text not null, location text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null, value jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, key));

create table products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null, sku text,
  selling_price_minor bigint not null default 0 check (selling_price_minor >= 0),
  unit_cost_minor bigint not null default 0 check (unit_cost_minor >= 0),
  packaging_minor bigint not null default 0 check (packaging_minor >= 0),
  delivery_minor bigint not null default 0 check (delivery_minor >= 0),
  processing_minor bigint not null default 0 check (processing_minor >= 0),
  ad_minor bigint not null default 0 check (ad_minor >= 0),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name));

-- Order costs are snapshots, so later product price changes never rewrite history.
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id),
  order_date date not null default current_date,
  customer_name text, customer_phone text, customer_address text,
  quantity int not null default 1 check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  unit_cost_minor bigint not null default 0 check (unit_cost_minor >= 0),
  packaging_minor bigint not null default 0 check (packaging_minor >= 0),
  delivery_minor bigint not null default 0 check (delivery_minor >= 0),
  processing_minor bigint not null default 0 check (processing_minor >= 0),
  ad_minor bigint not null default 0 check (ad_minor >= 0),
  refund_minor bigint not null default 0 check (refund_minor >= 0),
  status text not null default 'new' check (status in ('new','paid','shipped','delivered','returned','cancelled')),
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index on projects (user_id, workspace_id, status);
create index on tasks (user_id, status, due_date);
create index on tasks (project_id);
create index on activities (user_id, activity_date);
create index on transactions (user_id, txn_date);
create index on transactions (workspace_id, type);
create index on invoices (user_id, status, due_date);
create index on invoice_payments (invoice_id);
create index on habit_logs (habit_id, log_date);

-- Row-level security + updated_at trigger on every table
do $$
declare t text;
begin
  foreach t in array array['workspaces','clients','projects','categories','accounts','tasks','task_history','activities','daily_logs','invoices','invoice_items','transactions','invoice_payments','workouts','habits','habit_logs','goals','attachments','settings','products','orders']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own rows" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger trg_updated before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- First-login defaults (idempotent)
create or replace function seed_defaults() returns void language plpgsql security invoker as $$
begin
  if exists (select 1 from workspaces where user_id = auth.uid()) then return; end if;
  insert into workspaces (name, color, sort_order) values
    ('Main Job','#F59E0B',1),('RK Tech','#06B6D4',2),('RK Store','#22C55E',3),('Freelance','#A78BFA',4),('Personal','#F472B6',5);
  insert into accounts (name, type) values ('Cash','cash'),('Bank Account','bank'),('Wallet','wallet');
  insert into habits (name, target_value, unit) values ('Gym Workout',null,null),('Learning',null,null),('Sleep Target',8,'hours'),('Personal Time',null,null);
  insert into categories (name, kind) values ('Design','task'),('Development','task'),('Admin','task'),('Marketing','task'),('Sales','transaction'),('Salary','transaction'),('Materials','transaction'),('Advertising','transaction'),('Software','transaction'),('Packaging','transaction'),('Delivery','transaction'),('Personal','transaction');
  insert into settings (key, value) values ('currency','"EGP"'),('date_format','"DD MMM YYYY"'),('week_start','"saturday"');
end $$;


-- ===================== Multi-row operations (all atomic) =====================

create or replace function create_invoice(p jsonb) returns uuid language plpgsql as $$
declare inv_id uuid; n int; total bigint := 0; it jsonb; no text;
begin
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) = 0 then raise exception 'Add at least one invoice item'; end if;
  no := nullif(trim(p->>'invoice_no'),'');
  if no is null then
    select coalesce(max(substring(invoice_no from '\d+$')::int),0)+1 into n from invoices where user_id = auth.uid() and invoice_no ~ '^INV-\d{4}-\d+$';
    no := 'INV-' || to_char(now(),'YYYY') || '-' || lpad(n::text,4,'0');
  end if;
  for it in select * from jsonb_array_elements(p->'items') loop
    total := total + round((it->>'quantity')::numeric * (it->>'unit_price_minor')::numeric);
  end loop;
  insert into invoices (workspace_id, client_id, project_id, invoice_no, issue_date, due_date, total_minor, status, notes)
  values ((p->>'workspace_id')::uuid, nullif(p->>'client_id','')::uuid, nullif(p->>'project_id','')::uuid, no,
          coalesce(nullif(p->>'issue_date','')::date, current_date), nullif(p->>'due_date','')::date, total,
          coalesce(p->>'status','draft'), p->>'notes') returning id into inv_id;
  for it in select * from jsonb_array_elements(p->'items') loop
    insert into invoice_items (invoice_id, description, quantity, unit_price_minor)
    values (inv_id, it->>'description', (it->>'quantity')::numeric, (it->>'unit_price_minor')::bigint);
  end loop;
  return inv_id;
end $$;

create or replace function set_invoice_status(p_invoice uuid, p_status text) returns void language plpgsql as $$
declare inv invoices; paid bigint;
begin
  select * into inv from invoices where id = p_invoice for update;
  if not found then raise exception 'Invoice not found'; end if;
  select coalesce(sum(amount_minor),0) into paid from invoice_payments where invoice_id = p_invoice and voided_at is null;
  if p_status = 'cancelled' and paid > 0 then raise exception 'Void the payments before cancelling this invoice'; end if;
  if p_status = 'sent' and inv.status <> 'draft' then raise exception 'Only draft invoices can be marked as sent'; end if;
  if p_status not in ('sent','cancelled') then raise exception 'Unsupported status change'; end if;
  update invoices set status = p_status where id = p_invoice;
end $$;

create or replace function record_invoice_payment(p_invoice uuid, p_account uuid, p_amount bigint, p_date date, p_ref text)
returns uuid language plpgsql as $$
declare inv invoices; paid bigint; tid uuid; pid uuid;
begin
  select * into inv from invoices where id = p_invoice for update;
  if not found then raise exception 'Invoice not found'; end if;
  if inv.status in ('draft','cancelled') then raise exception 'Mark the invoice as sent before recording payments'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  select coalesce(sum(amount_minor),0) into paid from invoice_payments where invoice_id = p_invoice and voided_at is null;
  if paid + p_amount > inv.total_minor then raise exception 'Payment is larger than the outstanding amount'; end if;
  insert into transactions (txn_date, amount_minor, type, workspace_id, project_id, invoice_id, account_id, status, description)
  values (p_date, p_amount, 'income', inv.workspace_id, inv.project_id, p_invoice, p_account, 'posted', 'Payment for ' || inv.invoice_no)
  returning id into tid;
  insert into invoice_payments (invoice_id, account_id, transaction_id, paid_on, amount_minor, reference_no)
  values (p_invoice, p_account, tid, p_date, p_amount, nullif(p_ref,'')) returning id into pid;
  update invoices set status = case when paid + p_amount = inv.total_minor then 'paid' else 'partially_paid' end where id = p_invoice;
  return pid;
end $$;

create or replace function void_invoice_payment(p_payment uuid, p_reason text) returns void language plpgsql as $$
declare pay invoice_payments; inv invoices; paid bigint;
begin
  select * into pay from invoice_payments where id = p_payment and voided_at is null for update;
  if not found then raise exception 'Payment not found or already voided'; end if;
  select * into inv from invoices where id = pay.invoice_id for update;
  update invoice_payments set voided_at = now() where id = p_payment;
  update transactions set status = 'void', voided_at = now(), void_reason = coalesce(nullif(p_reason,''),'Payment voided') where id = pay.transaction_id;
  select coalesce(sum(amount_minor),0) into paid from invoice_payments where invoice_id = pay.invoice_id and voided_at is null;
  update invoices set status = case when paid = 0 then 'sent' when paid < inv.total_minor then 'partially_paid' else 'paid' end where id = pay.invoice_id;
end $$;

-- Settle a pending receivable/payable: records the cash movement and closes the original.
create or replace function settle_txn(p_txn uuid, p_account uuid, p_date date) returns uuid language plpgsql as $$
declare t transactions; nid uuid;
begin
  select * into t from transactions where id = p_txn for update;
  if not found or t.type not in ('receivable','payable') or t.status <> 'pending' then raise exception 'Only pending receivables or payables can be settled'; end if;
  insert into transactions (txn_date, amount_minor, type, workspace_id, project_id, category_id, account_id, status, description, settles_txn_id)
  values (p_date, t.amount_minor, case when t.type = 'receivable' then 'income' else 'expense' end, t.workspace_id, t.project_id, t.category_id, p_account, 'posted',
          'Settled: ' || coalesce(t.description,''), t.id) returning id into nid;
  update transactions set status = 'posted' where id = p_txn;
  return nid;
end $$;

-- Voiding keeps the row (history is never lost).
create or replace function void_txn(p_txn uuid, p_reason text) returns void language plpgsql as $$
declare t transactions;
begin
  select * into t from transactions where id = p_txn for update;
  if not found or t.status = 'void' then raise exception 'Transaction not found or already void'; end if;
  if t.invoice_id is not null and t.type = 'income' then raise exception 'Void the invoice payment instead'; end if;
  update transactions set status = 'void', voided_at = now(), void_reason = coalesce(nullif(p_reason,''),'Voided') where id = p_txn;
  if t.settles_txn_id is not null then update transactions set status = 'pending' where id = t.settles_txn_id; end if;
end $$;

create or replace function reschedule_task(p_task uuid, p_date date, p_note text) returns void language plpgsql as $$
declare t tasks;
begin
  select * into t from tasks where id = p_task for update;
  if not found then raise exception 'Task not found'; end if;
  if t.status in ('done','cancelled') then raise exception 'Finished tasks cannot be rescheduled'; end if;
  insert into task_history (task_id, event, from_date, to_date, note) values (p_task, 'rescheduled', t.due_date, p_date, p_note);
  update tasks set due_date = p_date where id = p_task;
end $$;

create or replace function complete_task(p_task uuid) returns uuid language plpgsql as $$
declare t tasks; nid uuid; nd date;
begin
  select * into t from tasks where id = p_task for update;
  if not found then raise exception 'Task not found'; end if;
  if t.status = 'done' then return null; end if;
  update tasks set status = 'done', completed_at = now() where id = p_task;
  insert into task_history (task_id, event, note) values (p_task, 'completed', null);
  if t.recurrence in ('daily','weekly','monthly') then
    nd := coalesce(t.due_date, current_date) + case t.recurrence when 'daily' then interval '1 day' when 'weekly' then interval '7 days' else interval '1 month' end;
    insert into tasks (workspace_id, project_id, category_id, title, description, task_type, priority, status, due_date, estimated_minutes, recurrence, notes)
    values (t.workspace_id, t.project_id, t.category_id, t.title, t.description, t.task_type, t.priority, 'todo', nd, t.estimated_minutes, t.recurrence, t.notes) returning id into nid;
    insert into task_history (task_id, event, to_date, note) values (nid, 'created_from_recurrence', nd, null);
  end if;
  return nid;
end $$;

-- Muscle-group workout categories (safe to re-run on existing projects).
alter table workouts drop constraint if exists workouts_workout_type_check;
alter table workouts add constraint workouts_workout_type_check
  check (workout_type in ('chest','back','shoulders','biceps','triceps','legs','abs','push','pull','upper','lower','cardio','rest','other'));
