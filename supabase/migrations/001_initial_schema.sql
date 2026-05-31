-- Personal finance app schema

create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_currency text not null default 'NGN' check (home_currency in ('NGN', 'USD')),
  ngn_per_usd numeric not null default 1600,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  default_currency text not null check (default_currency in ('NGN', 'USD')),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount > 0),
  currency text not null check (currency in ('NGN', 'USD')),
  type text not null check (type in ('expense', 'income')),
  category text not null,
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  period_type text not null check (period_type in ('week', 'month', 'quarter')),
  period_key text not null,
  item_name text not null,
  estimated_cost numeric not null check (estimated_cost > 0),
  currency text not null check (currency in ('NGN', 'USD')),
  justification text,
  created_at timestamptz not null default now()
);

create table projection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  period_type text not null check (period_type in ('week', 'month', 'quarter')),
  period_key text not null,
  source_name text not null,
  expected_amount numeric not null check (expected_amount > 0),
  currency text not null check (currency in ('NGN', 'USD')),
  created_at timestamptz not null default now()
);

create table account_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null references entities(id) on delete cascade,
  currency text not null check (currency in ('NGN', 'USD')),
  amount numeric not null,
  updated_at timestamptz not null default now(),
  unique (user_id, entity_id, currency)
);

create index transactions_user_date_idx on transactions (user_id, date desc);
create index transactions_entity_idx on transactions (entity_id);
create index budget_items_period_idx on budget_items (user_id, period_type, period_key);
create index projection_items_period_idx on projection_items (user_id, period_type, period_key);

alter table settings enable row level security;
alter table entities enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budget_items enable row level security;
alter table projection_items enable row level security;
alter table account_balances enable row level security;

create policy "settings_select" on settings for select using (user_id = auth.uid());
create policy "settings_insert" on settings for insert with check (user_id = auth.uid());
create policy "settings_update" on settings for update using (user_id = auth.uid());
create policy "settings_delete" on settings for delete using (user_id = auth.uid());

create policy "entities_select" on entities for select using (user_id = auth.uid());
create policy "entities_insert" on entities for insert with check (user_id = auth.uid());
create policy "entities_update" on entities for update using (user_id = auth.uid());
create policy "entities_delete" on entities for delete using (user_id = auth.uid());

create policy "categories_select" on categories for select using (user_id = auth.uid());
create policy "categories_insert" on categories for insert with check (user_id = auth.uid());
create policy "categories_update" on categories for update using (user_id = auth.uid());
create policy "categories_delete" on categories for delete using (user_id = auth.uid());

create policy "transactions_select" on transactions for select using (user_id = auth.uid());
create policy "transactions_insert" on transactions for insert with check (user_id = auth.uid());
create policy "transactions_update" on transactions for update using (user_id = auth.uid());
create policy "transactions_delete" on transactions for delete using (user_id = auth.uid());

create policy "budget_items_select" on budget_items for select using (user_id = auth.uid());
create policy "budget_items_insert" on budget_items for insert with check (user_id = auth.uid());
create policy "budget_items_update" on budget_items for update using (user_id = auth.uid());
create policy "budget_items_delete" on budget_items for delete using (user_id = auth.uid());

create policy "projection_items_select" on projection_items for select using (user_id = auth.uid());
create policy "projection_items_insert" on projection_items for insert with check (user_id = auth.uid());
create policy "projection_items_update" on projection_items for update using (user_id = auth.uid());
create policy "projection_items_delete" on projection_items for delete using (user_id = auth.uid());

create policy "account_balances_select" on account_balances for select using (user_id = auth.uid());
create policy "account_balances_insert" on account_balances for insert with check (user_id = auth.uid());
create policy "account_balances_update" on account_balances for update using (user_id = auth.uid());
create policy "account_balances_delete" on account_balances for delete using (user_id = auth.uid());
