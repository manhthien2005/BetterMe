create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  start_date date not null default current_date,
  tracker_days integer not null default 90 check (tracker_days > 0),
  target_completion_rate numeric(4, 3) not null default 0.8 check (target_completion_rate >= 0 and target_completion_rate <= 1),
  selected_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  name text not null,
  category text not null default '',
  max_score numeric(8, 2) not null default 1 check (max_score >= 0),
  active boolean not null default true,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create table if not exists public.daily_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  daily_note text not null default '',
  problem_today text not null default '',
  tomorrow_focus text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists public.habit_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);

create index if not exists habits_user_sort_idx on public.habits (user_id, sort_order);
create index if not exists daily_entries_user_date_idx on public.daily_entries (user_id, date);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

drop trigger if exists daily_entries_set_updated_at on public.daily_entries;
create trigger daily_entries_set_updated_at
before update on public.daily_entries
for each row execute function public.set_updated_at();

drop trigger if exists habit_logs_set_updated_at on public.habit_logs;
create trigger habit_logs_set_updated_at
before update on public.habit_logs
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.daily_entries enable row level security;
alter table public.habit_logs enable row level security;

drop policy if exists "Profiles are private" on public.profiles;
create policy "Profiles are private" on public.profiles
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Habits are private" on public.habits;
create policy "Habits are private" on public.habits
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Daily entries are private" on public.daily_entries;
create policy "Daily entries are private" on public.daily_entries
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Habit logs are private" on public.habit_logs;
create policy "Habit logs are private" on public.habit_logs
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);
