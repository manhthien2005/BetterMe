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

-- =====================================================================
-- ===== Social Garden Phase 0: sync =====
-- Spec: docs/superpowers/specs/2026-07-08-social-garden-spec.md §2.3–§2.4
-- Idempotent — safe to re-run. The client sync engine (src/lib/sync/*)
-- builds against the RPC contracts documented inline below.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.companions (
  user_id          uuid not null references auth.users(id) on delete cascade,
  species          text not null check (species in ('dog', 'cat')),
  name             text not null check (char_length(name) between 1 and 20),
  -- Client-stamped LWW timestamp for `name` (clientTs at rename). The generic
  -- set_updated_at trigger never touches this column.
  name_updated_at  timestamptz not null default now(),
  adopted_on       date not null,
  -- Sanity ceilings: 1 growth day/day × ~10 years; ~50 bond/day × ~10 years.
  growth_days      integer not null default 0 check (growth_days between 0 and 4000),
  bond             integer not null default 0 check (bond between 0 and 200000),
  last_growth_date date,
  pets_today       integer not null default 0,
  pets_today_date  date,
  reset_at         timestamptz, -- null = never reset (see reset_companion)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, species)
);

create table if not exists public.companion_meta (
  user_id                    uuid primary key references auth.users(id) on delete cascade,
  active_species             text check (active_species in ('dog', 'cat')),
  -- Client-stamped LWW timestamp for active_species (clientTs at switch).
  active_species_updated_at  timestamptz not null default now(),
  -- FOOD ECONOMY = append-only ledgers + one carryover. There is deliberately
  -- NO food balance column. Balance is always derived:
  --   clamp(carryover + Σ granted + Σ gifts_received − Σ |spent_events|, 0, 21)
  -- A max()-merged counter would refund spends from stale replicas (spec §2.3).
  food_granted_by_date       jsonb not null default '{}', -- {date: n}
  food_gifts_received        jsonb not null default '{}', -- {"date:visitId": n}
  food_spent_events          jsonb not null default '{}', -- {date: [eventId, ...]}
  food_carryover             integer not null default 0 check (food_carryover between 0 and 21),
  gift_overflow_bond_by_date jsonb not null default '{}', -- {date: n} — Phase 2 cap ledger
  all_done_bonus_dates       jsonb not null default '{}',
  last_seen_date             date,
  pending_gift               boolean not null default false,
  updated_at                 timestamptz not null default now()
);

-- habits: soft-delete tombstone for merge (§2.4).
alter table public.habits add column if not exists deleted_at timestamptz;
-- habits: client-stamped LWW timestamp. LWW must compare client clocks to
-- client clocks — `updated_at` is server receipt time (bumped by the
-- set_updated_at trigger on every write) and would mis-order offline edits.
alter table public.habits add column if not exists client_updated_at timestamptz;
-- habit_logs: per-cell LWW stamp (§2.4).
alter table public.habit_logs add column if not exists mutated_at timestamptz not null default now();

-- habit_logs: v3 detail (Amendment 2026-07-27). `done` stays the boolean
-- truth — the client computes it with isEntryComplete because only the client
-- knows the tracking rule, and refresh_my_summary (§5.2) / shared_rhythms
-- (§5.1) read `done` directly. These two columns are additive detail, never a
-- substitute for it.
--   value        NULL = written by a pre-v3 client (or under an old schema);
--                the merge then falls back to "a remote tick keeps whatever
--                richer value that device already had".
--   completed_at LOCAL "HH:mm" only. The day already lives in `date`, and
--                keeping it clock-only sidesteps timezone drift on the wire.
alter table public.habit_logs add column if not exists value integer;
alter table public.habit_logs add column if not exists completed_at text;

-- habits: the v3 definition (Amendment 2026-07-27). Until now a habit that
-- travelled between devices arrived as a v2 shadow and was re-defaulted
-- locally — the other device never learned it was a 5-step checklist every
-- Tuesday evening.
-- paused_at / archived_at are text, not date: the client compares them as
-- plain ISO labels (`date >= habit.pausedAt`) and never does date arithmetic
-- server-side, so text keeps a malformed value harmless instead of turning it
-- into a 22007 permanent-error drop that would silently lose a pause.
alter table public.habits add column if not exists icon text not null default '';
alter table public.habits add column if not exists tracking_type text not null default 'check';
alter table public.habits add column if not exists target numeric(8, 2) not null default 1;
alter table public.habits add column if not exists unit text;
alter table public.habits add column if not exists steps jsonb not null default '[]'::jsonb;
alter table public.habits add column if not exists repeat_days jsonb not null default '[1,2,3,4,5,6,7]'::jsonb;
alter table public.habits add column if not exists times_of_day jsonb not null default '["anytime"]'::jsonb;
alter table public.habits add column if not exists scheduled_at text;
alter table public.habits add column if not exists color text not null default 'clay';
alter table public.habits add column if not exists motivation text not null default '';
alter table public.habits add column if not exists paused_at text;
alter table public.habits add column if not exists archived_at text;

drop trigger if exists companions_set_updated_at on public.companions;
create trigger companions_set_updated_at
before update on public.companions
for each row execute function public.set_updated_at();

drop trigger if exists companion_meta_set_updated_at on public.companion_meta;
create trigger companion_meta_set_updated_at
before update on public.companion_meta
for each row execute function public.set_updated_at();

alter table public.companions enable row level security;
alter table public.companion_meta enable row level security;

drop policy if exists "Companions are private" on public.companions;
drop policy if exists "Companions are selectable by owner" on public.companions;
create policy "Companions are selectable by owner" on public.companions
for select using (auth.uid() = user_id);
drop policy if exists "Companions are insertable by owner" on public.companions;
create policy "Companions are insertable by owner" on public.companions
for insert with check (auth.uid() = user_id);
drop policy if exists "Companions are updatable by owner" on public.companions;
create policy "Companions are updatable by owner" on public.companions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No DELETE policy: the only sanctioned decrease is reset_companion (which
-- stamps reset_at); a DELETE + re-INSERT would erase reset_at and disarm the
-- reset-supremacy check in merge_companion_state. Account deletion still
-- cascades from auth.users (referential actions bypass RLS). No BEFORE DELETE
-- trigger here — that cascade fires row triggers and account deletion would
-- start failing.
revoke delete on table public.companions from anon, authenticated;

drop policy if exists "Companion meta is private" on public.companion_meta;
create policy "Companion meta is private" on public.companion_meta
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- No-decay invariant (spec §0.2, §2.4): growth/bond are monotonic. The only
-- sanctioned decrease is reset_companion, which flips a transaction-local
-- setting before updating.
-- ---------------------------------------------------------------------

create or replace function public.enforce_companion_no_decay()
returns trigger
language plpgsql
as $$
begin
  if current_setting('betterme.companion_reset', true) is distinct from 'on' then
    if new.growth_days < old.growth_days or new.bond < old.bond then
      raise exception 'no-decay violation: growth_days/bond must be monotonic';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists companions_no_decay on public.companions;
create trigger companions_no_decay
before update on public.companions
for each row execute function public.enforce_companion_no_decay();

create or replace function public.reset_companion(p_species text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_species is null or p_species not in ('dog', 'cat') then
    raise exception using errcode = 'P0004', message = 'invalid-species';
  end if;
  -- Same per-user lock as merge_companion_state: without it a reset committing
  -- between merge's read and write would let merge's greatest() resurrect
  -- pre-reset values (its reset-supremacy check ran against the stale row).
  perform pg_advisory_xact_lock(hashtext('betterme.companion:' || auth.uid()::text));
  -- Transaction-local escape hatch for the no-decay trigger. This RPC is the
  -- ONLY decay path; direct UPDATEs stay blocked.
  perform set_config('betterme.companion_reset', 'on', true);
  update public.companions
  set growth_days = 0,
      bond = 0,
      last_growth_date = null,
      pets_today = 0,
      pets_today_date = null,
      reset_at = now()
  where user_id = auth.uid() and species = p_species;
end;
$$;

-- ---------------------------------------------------------------------
-- Safe-cast + jsonb merge helpers (tolerate malformed payloads: bad values
-- are dropped or defaulted, never corrupt rows, never leak internals).
-- ---------------------------------------------------------------------

create or replace function public.safe_int(t text, fallback integer)
returns integer
language plpgsql
immutable
as $$
begin
  return coalesce(t::integer, fallback);
exception when others then
  return fallback;
end;
$$;

create or replace function public.safe_date(t text)
returns date
language plpgsql
immutable
as $$
begin
  return t::date;
exception when others then
  return null;
end;
$$;

create or replace function public.safe_ts(t text)
returns timestamptz
language plpgsql
immutable
as $$
begin
  return t::timestamptz;
exception when others then
  return null;
end;
$$;

-- Union of two {key: number} maps, value = max, clamped to [lo, hi] per key.
-- Non-numeric values dropped; the {1,15}-digit bound also protects the
-- ::numeric cast itself from absurd inputs. Callers pass domain caps so an
-- oversized ledger value can never persist and later overflow the prune's
-- integer math (SQLSTATE 22003 would brick merge_companion_state).
drop function if exists public.jsonb_union_max(jsonb, jsonb);
create or replace function public.jsonb_union_max(a jsonb, b jsonb, lo numeric default 0, hi numeric default 1000000)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(k, to_jsonb(least(greatest(mx, lo), hi))), '{}'::jsonb)
  from (
    select k, max(v) as mx
    from (
      select key as k, value::numeric as v
      from jsonb_each_text(case when jsonb_typeof(a) = 'object' then a else '{}'::jsonb end)
      where value ~ '^-?[0-9]{1,15}(\.[0-9]+)?$'
      union all
      select key, value::numeric
      from jsonb_each_text(case when jsonb_typeof(b) = 'object' then b else '{}'::jsonb end)
      where value ~ '^-?[0-9]{1,15}(\.[0-9]+)?$'
    ) u
    group by k
  ) m;
$$;

-- Union of key sets, every value literal true (all_done_bonus_dates).
create or replace function public.jsonb_union_true(a jsonb, b jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(k, to_jsonb(true)), '{}'::jsonb)
  from (
    select key as k from jsonb_each(case when jsonb_typeof(a) = 'object' then a else '{}'::jsonb end)
    union
    select key from jsonb_each(case when jsonb_typeof(b) = 'object' then b else '{}'::jsonb end)
  ) u;
$$;

-- Union of {date: [id, ...]} maps: per key, set-union of ids (deduped).
-- The ONLY merge shape under which a spend can never be refunded (spec §2.3).
create or replace function public.jsonb_union_idset(a jsonb, b jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(k, ids), '{}'::jsonb)
  from (
    select k, jsonb_agg(distinct id) as ids
    from (
      select e.key as k, el.value #>> '{}' as id
      from jsonb_each(case when jsonb_typeof(a) = 'object' then a else '{}'::jsonb end) e
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(e.value) = 'array' then e.value else '[]'::jsonb end) el
      union
      select e.key, el.value #>> '{}'
      from jsonb_each(case when jsonb_typeof(b) = 'object' then b else '{}'::jsonb end) e
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(e.value) = 'array' then e.value else '[]'::jsonb end) el
    ) u
    where id is not null
    group by k
  ) m;
$$;

-- ---------------------------------------------------------------------
-- Sync RPCs — habit path
-- Error contract (client queue policy, spec §2.1): P0002 'habit-not-found'
-- and P0003 'habit-tombstoned' are PERMANENT errors — the client drops the
-- mutation and continues (no head-of-line blocking). Everything else retries.
-- ---------------------------------------------------------------------

-- Signature widened in U1c. `create or replace` with a new argument list would
-- OVERLOAD the old function rather than replace it, and PostgREST's
-- named-argument call would then fail with 42725 'function is not unique' —
-- so the old one is dropped first. Dropping also drops its grants; the new
-- signature is re-granted in the grants block below.
drop function if exists public.apply_habit_log(text, date, boolean, timestamptz);

-- Per-cell LWW upsert (spec §2.4): newer mutated_at wins; equal stamps -> tick
-- (done = true) wins. Stale writes are silently skipped, never overwrite.
-- p_value / p_completed_at ride along with the cell under the SAME stamp:
-- there is one LWW decision per cell, not one per column.
create or replace function public.apply_habit_log(
  p_habit_key text, p_date date, p_done boolean, p_mutated_at timestamptz,
  p_value integer default null, p_completed_at text default null)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_habit public.habits%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_habit_key is null or p_date is null or p_done is null then
    raise exception using errcode = 'P0004', message = 'invalid-args';
  end if;
  select * into v_habit from public.habits
  where user_id = auth.uid() and key = p_habit_key;
  if not found then
    raise exception using errcode = 'P0002', message = 'habit-not-found';
  end if;
  if v_habit.deleted_at is not null then
    raise exception using errcode = 'P0003', message = 'habit-tombstoned';
  end if;
  insert into public.habit_logs as l
    (user_id, habit_id, date, done, mutated_at, value, completed_at)
  values
    (auth.uid(), v_habit.id, p_date, p_done, coalesce(p_mutated_at, now()),
     p_value, p_completed_at)
  on conflict (user_id, habit_id, date) do update
    set done = excluded.done,
        mutated_at = excluded.mutated_at,
        value = excluded.value,
        completed_at = excluded.completed_at
    where l.mutated_at < excluded.mutated_at
       or (l.mutated_at = excluded.mutated_at and excluded.done);
end;
$$;

-- LWW habit upsert. Returns jsonb {status}: 'inserted' | 'updated' |
-- 'stale-skipped' | 'tombstone-blocked' | 'name-collision' (+ server:{key,name}).
-- p_expect_create = true marks a client-side CREATE: an existing live row with
-- a different name is then a slug collision (two devices invented the same
-- key for different habits) — the client must re-key, never merge silently.
-- Signature widened in U1c — same overload hazard as apply_habit_log above.
drop function if exists public.upsert_habit(
  text, text, text, numeric, boolean, text, integer, timestamptz, boolean);

-- The v3 block (p_icon .. p_archived_at) is written under the same
-- client_updated_at stamp as the v2 fields: one habit, one LWW decision.
create or replace function public.upsert_habit(
  p_key text, p_name text, p_category text, p_max_score numeric, p_active boolean,
  p_description text, p_sort_order integer, p_client_ts timestamptz,
  p_expect_create boolean default false,
  p_icon text default '', p_tracking_type text default 'check',
  p_target numeric default 1, p_unit text default null,
  p_steps jsonb default '[]'::jsonb,
  p_repeat_days jsonb default '[1,2,3,4,5,6,7]'::jsonb,
  p_times_of_day jsonb default '["anytime"]'::jsonb,
  p_scheduled_at text default null, p_color text default 'clay',
  p_motivation text default '', p_paused_at text default null,
  p_archived_at text default null)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_row public.habits%rowtype;
  v_ts timestamptz := coalesce(p_client_ts, now());
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_key is null or btrim(p_key) = '' or p_name is null or btrim(p_name) = '' then
    raise exception using errcode = 'P0004', message = 'invalid-habit';
  end if;
  select * into v_row from public.habits
  where user_id = auth.uid() and key = p_key;
  if not found then
    insert into public.habits
      (user_id, key, name, category, max_score, active, description, sort_order,
       client_updated_at, icon, tracking_type, target, unit, steps, repeat_days,
       times_of_day, scheduled_at, color, motivation, paused_at, archived_at)
    values
      (auth.uid(), p_key, p_name, coalesce(p_category, ''), coalesce(p_max_score, 1),
       coalesce(p_active, true), coalesce(p_description, ''), coalesce(p_sort_order, 0), v_ts,
       coalesce(p_icon, ''), coalesce(p_tracking_type, 'check'), coalesce(p_target, 1),
       p_unit, coalesce(p_steps, '[]'::jsonb),
       coalesce(p_repeat_days, '[1,2,3,4,5,6,7]'::jsonb),
       coalesce(p_times_of_day, '["anytime"]'::jsonb), p_scheduled_at,
       coalesce(p_color, 'clay'), coalesce(p_motivation, ''), p_paused_at, p_archived_at);
    return jsonb_build_object('status', 'inserted');
  end if;
  if p_expect_create and v_row.deleted_at is null and v_row.name <> p_name then
    return jsonb_build_object('status', 'name-collision',
      'server', jsonb_build_object('key', v_row.key, 'name', v_row.name));
  end if;
  if v_row.deleted_at is not null and v_row.deleted_at >= v_ts then
    return jsonb_build_object('status', 'tombstone-blocked');
  end if;
  if v_row.client_updated_at is not null and v_row.client_updated_at > v_ts then
    return jsonb_build_object('status', 'stale-skipped');
  end if;
  update public.habits
  set name = p_name,
      category = coalesce(p_category, ''),
      max_score = coalesce(p_max_score, 1),
      active = coalesce(p_active, true),
      description = coalesce(p_description, ''),
      sort_order = coalesce(p_sort_order, 0),
      icon = coalesce(p_icon, ''),
      tracking_type = coalesce(p_tracking_type, 'check'),
      target = coalesce(p_target, 1),
      unit = p_unit,
      steps = coalesce(p_steps, '[]'::jsonb),
      repeat_days = coalesce(p_repeat_days, '[1,2,3,4,5,6,7]'::jsonb),
      times_of_day = coalesce(p_times_of_day, '["anytime"]'::jsonb),
      scheduled_at = p_scheduled_at,
      color = coalesce(p_color, 'clay'),
      motivation = coalesce(p_motivation, ''),
      paused_at = p_paused_at,
      archived_at = p_archived_at,
      client_updated_at = v_ts,
      deleted_at = null -- re-create after tombstone: newer client_ts wins (§2.4)
  where user_id = auth.uid() and key = p_key;
  return jsonb_build_object('status', 'updated');
end;
$$;

-- Tombstone a habit. No-op ('skipped') when a newer edit or newer tombstone
-- already exists — tombstone wins only over strictly older state (§2.4).
create or replace function public.delete_habit(p_key text, p_deleted_at timestamptz)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_ts timestamptz := coalesce(p_deleted_at, now());
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  update public.habits
  set deleted_at = v_ts
  where user_id = auth.uid() and key = p_key
    and (client_updated_at is null or client_updated_at <= v_ts)
    and (deleted_at is null or deleted_at < v_ts);
  if not found then
    return jsonb_build_object('status', 'skipped');
  end if;
  return jsonb_build_object('status', 'deleted');
end;
$$;

-- ---------------------------------------------------------------------
-- Sync RPCs — companion path
-- ---------------------------------------------------------------------

-- Own companion state in the exact jsonb shape merge_companion_state accepts
-- and returns: { activeSpecies, activeSpeciesUpdatedAt, foodGrantedByDate,
-- foodGiftsReceived, foodSpentEvents, foodCarryover, giftOverflowBondByDate,
-- allDoneBonusDates, lastSeenDate, pendingGift, pets: { dog?: { name,
-- nameUpdatedAt, adoptedOn, growthDays, bond, lastGrowthDate, petsToday,
-- petsTodayDate, resetAt }, cat?: {...} } }. Null when the user has no
-- companion_meta row yet. Scoped to auth.uid() — safe to expose.
create or replace function public.companion_state_jsonb()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'activeSpecies', m.active_species,
    'activeSpeciesUpdatedAt', m.active_species_updated_at,
    'foodGrantedByDate', m.food_granted_by_date,
    'foodGiftsReceived', m.food_gifts_received,
    'foodSpentEvents', m.food_spent_events,
    'foodCarryover', m.food_carryover,
    'giftOverflowBondByDate', m.gift_overflow_bond_by_date,
    'allDoneBonusDates', m.all_done_bonus_dates,
    'lastSeenDate', m.last_seen_date,
    'pendingGift', m.pending_gift,
    'pets', coalesce((
      select jsonb_object_agg(c.species, jsonb_build_object(
        'name', c.name,
        'nameUpdatedAt', c.name_updated_at,
        'adoptedOn', c.adopted_on,
        'growthDays', c.growth_days,
        'bond', c.bond,
        'lastGrowthDate', c.last_growth_date,
        'petsToday', c.pets_today,
        'petsTodayDate', c.pets_today_date,
        'resetAt', c.reset_at))
      from public.companions c
      where c.user_id = auth.uid()), '{}'::jsonb)
  )
  from public.companion_meta m
  where m.user_id = auth.uid();
$$;

-- Merge a full client companion snapshot into server state (spec §2.4) and
-- return the merged server state (companion_state_jsonb shape, plus a
-- top-level "serverTime": now() the client persists as its lastSyncedAt
-- watermark — reset supremacy compares reset_at against it, so it MUST come
-- from the server clock, never the client's). Payload p:
--   { lastSyncedAt, activeSpecies, activeSpeciesUpdatedAt, foodGrantedByDate,
--     foodGiftsReceived, foodSpentEvents, foodCarryover, giftOverflowBondByDate,
--     allDoneBonusDates, lastSeenDate, pendingGift, pets: {dog?, cat?} }
-- Laws: growth/bond monotonic greatest() — EXCEPT a server reset newer than
-- the client's lastSyncedAt wins wholesale for that pet; dates greatest;
-- ledgers union (values max / id-set union); name + active_species per-field
-- LWW by client stamps; balance is NEVER merged (derived from ledgers).
-- Bounded imprecision, accepted deliberately: if one replica pruned/folded a
-- ledger day the other still carries raw, that day's net can be counted twice
-- after union (needs >30-day divergence; clamped by the cap at derive time;
-- spends themselves are never lost — they live in the id-set union).
create or replace function public.merge_companion_state(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_last_synced timestamptz;
  v_species text;
  v_pet jsonb;
  v_row public.companions%rowtype;
  v_meta public.companion_meta%rowtype;
  v_granted jsonb;
  v_gifts jsonb;
  v_spent jsonb;
  v_overflow jsonb;
  v_alldone jsonb;
  v_carry integer;
  v_cutoff text;
  v_day text;
  v_net integer;
  v_cli_active text;
  v_cli_active_ts timestamptz;
  v_active text;
  v_active_ts timestamptz;
  v_cli_seen date;
  v_seen date;
  v_pending boolean;
  v_name text;
  v_name_ts timestamptz;
begin
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception using errcode = 'P0004', message = 'bad-payload';
  end if;

  perform pg_advisory_xact_lock(hashtext('betterme.companion:' || v_uid::text));
  v_last_synced := public.safe_ts(p->>'lastSyncedAt');

  -- ---- pets: monotonic merge with reset supremacy ----
  foreach v_species in array array['dog', 'cat'] loop
    v_pet := p->'pets'->v_species;
    continue when v_pet is null or jsonb_typeof(v_pet) <> 'object';

    select * into v_row from public.companions
    where user_id = v_uid and species = v_species;

    if not found then
      insert into public.companions
        (user_id, species, name, name_updated_at, adopted_on, growth_days, bond,
         last_growth_date, pets_today, pets_today_date)
      values (
        v_uid,
        v_species,
        coalesce(nullif(left(btrim(coalesce(v_pet->>'name', '')), 20), ''),
                 case v_species when 'dog' then 'Xoài' else 'Mochi' end),
        coalesce(public.safe_ts(v_pet->>'nameUpdatedAt'), now()),
        coalesce(public.safe_date(v_pet->>'adoptedOn'), current_date),
        least(greatest(public.safe_int(v_pet->>'growthDays', 0), 0), 4000),
        least(greatest(public.safe_int(v_pet->>'bond', 0), 0), 200000),
        public.safe_date(v_pet->>'lastGrowthDate'),
        greatest(public.safe_int(v_pet->>'petsToday', 0), 0),
        public.safe_date(v_pet->>'petsTodayDate'));
      continue;
    end if;

    -- Reset supremacy: a reset newer than the client's last sync wins
    -- wholesale; the stale device must not resurrect pre-reset values.
    if v_row.reset_at is not null
       and (v_last_synced is null or v_row.reset_at > v_last_synced) then
      continue;
    end if;

    v_name_ts := public.safe_ts(v_pet->>'nameUpdatedAt');
    v_name := nullif(left(btrim(coalesce(v_pet->>'name', '')), 20), '');

    update public.companions c
    set growth_days = greatest(c.growth_days,
          least(greatest(public.safe_int(v_pet->>'growthDays', 0), 0), 4000)),
        bond = greatest(c.bond,
          least(greatest(public.safe_int(v_pet->>'bond', 0), 0), 200000)),
        adopted_on = least(c.adopted_on,
          coalesce(public.safe_date(v_pet->>'adoptedOn'), c.adopted_on)),
        last_growth_date = nullif(greatest(
          coalesce(c.last_growth_date, '-infinity'::date),
          coalesce(public.safe_date(v_pet->>'lastGrowthDate'), '-infinity'::date)),
          '-infinity'::date),
        pets_today = case
          when coalesce(public.safe_date(v_pet->>'petsTodayDate'), '-infinity'::date)
               > coalesce(c.pets_today_date, '-infinity'::date)
            then greatest(public.safe_int(v_pet->>'petsToday', 0), 0)
          when coalesce(public.safe_date(v_pet->>'petsTodayDate'), '-infinity'::date)
               = coalesce(c.pets_today_date, '-infinity'::date)
            then greatest(c.pets_today, public.safe_int(v_pet->>'petsToday', 0))
          else c.pets_today
        end,
        pets_today_date = nullif(greatest(
          coalesce(c.pets_today_date, '-infinity'::date),
          coalesce(public.safe_date(v_pet->>'petsTodayDate'), '-infinity'::date)),
          '-infinity'::date),
        name = case
          when v_name is not null and v_name_ts is not null and v_name_ts > c.name_updated_at
            then v_name else c.name
        end,
        name_updated_at = case
          when v_name is not null and v_name_ts is not null and v_name_ts > c.name_updated_at
            then v_name_ts else c.name_updated_at
        end
    where c.user_id = v_uid and c.species = v_species;
  end loop;

  -- ---- meta: ledger unions + per-field LWW ----
  insert into public.companion_meta (user_id) values (v_uid)
  on conflict (user_id) do nothing;
  select * into v_meta from public.companion_meta where user_id = v_uid;

  -- Caps mirror the domains: food ledgers 0-21 (the derived-balance cap),
  -- overflow-bond 0-2 (the Phase 2 per-day cap).
  v_granted := public.jsonb_union_max(v_meta.food_granted_by_date, p->'foodGrantedByDate', 0, 21);
  v_gifts := public.jsonb_union_max(v_meta.food_gifts_received, p->'foodGiftsReceived', 0, 21);
  v_spent := public.jsonb_union_idset(v_meta.food_spent_events, p->'foodSpentEvents');
  v_overflow := public.jsonb_union_max(v_meta.gift_overflow_bond_by_date, p->'giftOverflowBondByDate', 0, 2);
  v_alldone := public.jsonb_union_true(v_meta.all_done_bonus_dates, p->'allDoneBonusDates');
  v_carry := greatest(v_meta.food_carryover,
    least(greatest(public.safe_int(p->>'foodCarryover', 0), 0), 21));

  -- Pair-wise prune (spec §2.3): fold ledger days older than 30 days into the
  -- carryover so the derived balance is unchanged by pruning.
  v_cutoff := to_char(current_date - 30, 'YYYY-MM-DD');
  for v_day in
    select d from (
      select key as d from jsonb_each(v_granted) where key < v_cutoff
      union
      select substr(key, 1, 10) from jsonb_each(v_gifts) where substr(key, 1, 10) < v_cutoff
      union
      select key from jsonb_each(v_spent) where key < v_cutoff
    ) s
    order by d
  loop
    -- Computed in numeric space and clamped to [-21, 21] BEFORE the integer
    -- assignment: v_carry is clamped to [0, 21] right after, so this is
    -- semantics-preserving — and a row that already holds an oversized
    -- committed value prunes cleanly (saturates at 21, poisoned key dropped)
    -- instead of raising 22003 forever.
    v_net := greatest(-21, least(21,
        public.safe_int(v_granted->>v_day, 0)::numeric
      + coalesce((select sum(value::numeric)
          from jsonb_each_text(v_gifts)
          where substr(key, 1, 10) = v_day and value ~ '^-?[0-9]{1,15}$'), 0)
      - coalesce((select sum(jsonb_array_length(value))
          from jsonb_each(v_spent)
          where key = v_day and jsonb_typeof(value) = 'array'), 0)))::integer;
    v_carry := greatest(0, least(21, v_carry + v_net));
    v_granted := v_granted - v_day;
    v_spent := v_spent - v_day;
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_gifts
    from jsonb_each(v_gifts) where substr(key, 1, 10) <> v_day;
  end loop;
  -- Bookkeeping-only ledgers: just drop expired days (not part of the balance).
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_overflow
  from jsonb_each(v_overflow) where key >= v_cutoff;
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_alldone
  from jsonb_each(v_alldone) where key >= v_cutoff;

  -- active_species: per-field LWW. First-sync exception: a null server species
  -- never "wins" by timestamp over a real client species (fresh meta rows get
  -- active_species_updated_at = now() which would otherwise beat any client stamp).
  v_cli_active_ts := public.safe_ts(p->>'activeSpeciesUpdatedAt');
  v_cli_active := case when p->>'activeSpecies' in ('dog', 'cat') then p->>'activeSpecies' else null end;
  if v_cli_active is not null
     and (v_meta.active_species is null
          or (v_cli_active_ts is not null and v_cli_active_ts > v_meta.active_species_updated_at)) then
    v_active := v_cli_active;
    v_active_ts := coalesce(v_cli_active_ts, now());
  else
    v_active := v_meta.active_species;
    v_active_ts := v_meta.active_species_updated_at;
  end if;

  -- last_seen/pending_gift: side with the newer last_seen_date wins; on a tie,
  -- pending OR-merges (safe: the comeback gift ledger key "date:comeback" is
  -- idempotent, so a resurrected gift can never double-grant food).
  v_cli_seen := public.safe_date(p->>'lastSeenDate');
  if coalesce(v_cli_seen, '-infinity'::date) > coalesce(v_meta.last_seen_date, '-infinity'::date) then
    v_seen := v_cli_seen;
    v_pending := coalesce((p->>'pendingGift') = 'true', false);
  elsif coalesce(v_cli_seen, '-infinity'::date) = coalesce(v_meta.last_seen_date, '-infinity'::date) then
    v_seen := v_meta.last_seen_date;
    v_pending := v_meta.pending_gift or coalesce((p->>'pendingGift') = 'true', false);
  else
    v_seen := v_meta.last_seen_date;
    v_pending := v_meta.pending_gift;
  end if;

  update public.companion_meta
  set active_species = v_active,
      active_species_updated_at = coalesce(v_active_ts, now()),
      food_granted_by_date = v_granted,
      food_gifts_received = v_gifts,
      food_spent_events = v_spent,
      food_carryover = v_carry,
      gift_overflow_bond_by_date = v_overflow,
      all_done_bonus_dates = v_alldone,
      last_seen_date = v_seen,
      pending_gift = v_pending
  where user_id = v_uid;

  -- Top-level serverTime rides on the merged state (the meta row is
  -- guaranteed to exist at this point, so the jsonb is never null here).
  return public.companion_state_jsonb() || jsonb_build_object('serverTime', now());
end;
$$;

-- One-round-trip hydrate: everything the client merge needs.
-- Returns { habits: [{key,name,category,maxScore,active,description,sortOrder,
-- clientUpdatedAt,deletedAt}], logs: [{habitKey,date,done,mutatedAt}],
-- companion: companion_state_jsonb() | null, serverTime: now() }.
-- serverTime is the client's lastSyncedAt watermark (server clock — client
-- clocks skew and would defeat reset supremacy).
create or replace function public.get_sync_snapshot()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'habits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', h.key,
        'name', h.name,
        'category', h.category,
        'maxScore', h.max_score,
        'active', h.active,
        'description', h.description,
        'sortOrder', h.sort_order,
        'clientUpdatedAt', h.client_updated_at,
        'deletedAt', h.deleted_at,
        'icon', h.icon,
        'trackingType', h.tracking_type,
        'target', h.target,
        'unit', h.unit,
        'steps', h.steps,
        'repeatDays', h.repeat_days,
        'timesOfDay', h.times_of_day,
        'scheduledAt', h.scheduled_at,
        'color', h.color,
        'motivation', h.motivation,
        'pausedAt', h.paused_at,
        'archivedAt', h.archived_at) order by h.sort_order)
      from public.habits h
      where h.user_id = auth.uid()), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'habitKey', h.key,
        'date', l.date,
        'done', l.done,
        'mutatedAt', l.mutated_at,
        'value', l.value,
        'completedAt', l.completed_at))
      from public.habit_logs l
      join public.habits h on h.id = l.habit_id and h.user_id = l.user_id
      where l.user_id = auth.uid()), '[]'::jsonb),
    'companion', public.companion_state_jsonb(),
    'serverTime', now()
  );
$$;

-- ---------------------------------------------------------------------
-- Grants: sync RPCs are for signed-in users only.
-- ---------------------------------------------------------------------

revoke execute on function public.reset_companion(text) from public, anon;
grant execute on function public.reset_companion(text) to authenticated;
revoke execute on function public.merge_companion_state(jsonb) from public, anon;
grant execute on function public.merge_companion_state(jsonb) to authenticated;
-- NOTE: revoking from anon alone is a no-op — functions get EXECUTE granted
-- to PUBLIC by default and anon inherits it, so every revoke below must name
-- `public, anon` (matching reset_companion/merge_companion_state above).
-- U1c widened these two signatures; the old ones were dropped above, which
-- also dropped their grants. A function is EXECUTE-granted to PUBLIC by
-- default, so forgetting to re-grant here leaves the new one open to anon.
revoke execute on function public.apply_habit_log(text, date, boolean, timestamptz, integer, text) from public, anon;
grant execute on function public.apply_habit_log(text, date, boolean, timestamptz, integer, text) to authenticated;
revoke execute on function public.upsert_habit(text, text, text, numeric, boolean, text, integer, timestamptz, boolean, text, text, numeric, text, jsonb, jsonb, jsonb, text, text, text, text, text) from public, anon;
grant execute on function public.upsert_habit(text, text, text, numeric, boolean, text, integer, timestamptz, boolean, text, text, numeric, text, jsonb, jsonb, jsonb, text, text, text, text, text) to authenticated;
revoke execute on function public.delete_habit(text, timestamptz) from public, anon;
grant execute on function public.delete_habit(text, timestamptz) to authenticated;
revoke execute on function public.get_sync_snapshot() from public, anon;
grant execute on function public.get_sync_snapshot() to authenticated;
-- companion_state_jsonb is called from get_sync_snapshot/merge_companion_state,
-- which run with invoker rights as `authenticated` — this grant keeps those
-- internal calls working.
revoke execute on function public.companion_state_jsonb() from public, anon;
grant execute on function public.companion_state_jsonb() to authenticated;

-- =====================================================================
-- ===== Social Garden Phase 1: identity & friending =====
-- Spec: docs/superpowers/specs/2026-07-08-social-garden-spec.md §3
-- Idempotent — safe to re-run. Friend requests burn quota (including wrong codes).
-- Friending exposes ZERO habit/pet data in Phase 1 (summary projection comes in Phase 2).
-- =====================================================================

-- Constants used throughout Phase 1 (inline in code below):
-- MAX_FRIENDS = 50 (per user)
-- RATE_LIMIT = 10 requests per 24 hours (per user)
-- ATTEMPT_RETENTION = 7 days (prune old attempts)

-- ---------------------------------------------------------------------
-- Extension: profiles table (§3.1)
-- ---------------------------------------------------------------------

-- display_name: 30 char max, empty string allowed (clears to default).
alter table public.profiles add column if not exists display_name text not null default '';

-- Add CHECK constraint via DO block (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_display_name_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_display_name_length
      check (char_length(display_name) <= 30);
  end if;
end $$;

-- avatar_kind: 'nep' (mascot) | 'dog' | 'cat' (user's pet).
alter table public.profiles add column if not exists avatar_kind text not null default 'nep';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_avatar_kind_values'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_kind_values
      check (avatar_kind in ('nep', 'dog', 'cat'));
  end if;
end $$;

-- invite_code: 16 hex chars (64-bit), set by trigger below, unique.
alter table public.profiles add column if not exists invite_code text;
create unique index if not exists profiles_invite_code_key on public.profiles (invite_code);

-- sharing_enabled: opt-in for summary projection (Phase 2). Phase 1 friending
-- does NOT expose any data yet — this column is safe to add now.
alter table public.profiles add column if not exists sharing_enabled boolean not null default false;

-- fair_opt_in: opt-in for the weekend Garden Fair (Phase 3 §5.2) — a SEPARATE
-- consent from sharing. Enforced at the WRITE layer: refresh_my_summary only
-- populates the fair columns of published_summaries when this is true, else
-- leaves them NULL (§8) — a NULL weekly_good_days means "not in the fair".
alter table public.profiles add column if not exists fair_opt_in boolean not null default false;

-- Invite code generator trigger (§3.1): re-rolls upper(encode(gen_random_bytes(8),'hex'))
-- until unique. The unique index above is the backstop for a rare race; the
-- re-roll loop makes a collision astronomically unlikely (64-bit space).
create or replace function public.set_invite_code()
returns trigger
language plpgsql
as $$
begin
  loop
    new.invite_code := upper(encode(extensions.gen_random_bytes(8), 'hex')); -- 16 hex, 64 bit
    exit when not exists (
      select 1 from public.profiles where invite_code = new.invite_code
    );
  end loop;
  return new;
end;
$$;

-- BEFORE INSERT only, and only when invite_code is null (rows are always
-- inserted without a code; the column is never set NOT NULL so re-runs stay safe).
drop trigger if exists profiles_set_invite_code on public.profiles;
create trigger profiles_set_invite_code
before insert on public.profiles
for each row when (new.invite_code is null)
execute function public.set_invite_code();

-- Backfill existing rows (loop-safe, same re-roll expression as the trigger).
-- Direct UPDATE — the INSERT trigger does not fire on these. Idempotent: only
-- touches rows still missing a code.
do $$
declare
  v_row record;
  v_code text;
begin
  for v_row in select user_id from public.profiles where invite_code is null loop
    loop
      v_code := upper(encode(extensions.gen_random_bytes(8), 'hex'));
      exit when not exists (
        select 1 from public.profiles where invite_code = v_code
      );
    end loop;
    update public.profiles set invite_code = v_code where user_id = v_row.user_id;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Table: friendships (§3.2)
-- Canonical pair: user_a < user_b (lexicographically). Status: pending | accepted.
-- ---------------------------------------------------------------------

create table if not exists public.friendships (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  requested_by uuid not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b),                       -- canonical pair, no two-way dupes
  check (requested_by in (user_a, user_b))
);

-- PK (user_a, user_b) already indexes user_a-leading lookups; add user_b for
-- the reverse-direction scans in get_friends_overview.
create index if not exists friendships_user_b_idx on public.friendships (user_b);

alter table public.friendships enable row level security;

-- RLS: users can SELECT their own friendships (both directions).
drop policy if exists "Users can view their friendships" on public.friendships;
create policy "Users can view their friendships" on public.friendships
for select using (auth.uid() in (user_a, user_b));

-- RLS: users can DELETE their own friendships (unfriend).
drop policy if exists "Users can delete their friendships" on public.friendships;
create policy "Users can delete their friendships" on public.friendships
for delete using (auth.uid() in (user_a, user_b));

-- No INSERT/UPDATE policies: writes only via send_friend_request/respond_friend_request RPCs.

-- ---------------------------------------------------------------------
-- Table: friend_request_attempts (§3.2)
-- Rate-limit ledger: every send_friend_request call logs here FIRST (before
-- code lookup), so wrong codes burn quota too. Prune > 7 days on write.
-- ---------------------------------------------------------------------

create table if not exists public.friend_request_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists friend_request_attempts_user_date_idx
on public.friend_request_attempts (user_id, created_at);

alter table public.friend_request_attempts enable row level security;

-- RLS: NO policies (default deny). Only RPCs write/read this table.

-- ---------------------------------------------------------------------
-- RPC: send_friend_request (§3.3)
-- Returns jsonb with "status" field. Possible status values:
--   "rate-limited"        — exceeded 10 requests/24h
--   "not-found"           — code does not exist (generic, no info leak)
--   "self"                — user entered their own code
--   "cap-reached"         — sender has 50 accepted friends
--   "their-cap-reached"   — recipient has 50 accepted friends
--   "already-pending"     — request already pending (includes "direction": "sent"|"received")
--   "already-friends"     — already accepted friends
--   "sent"                — request sent successfully (includes "displayName", "otherUserId")
-- ---------------------------------------------------------------------

create or replace function public.send_friend_request(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_recipient_id uuid;
  v_recipient_name text;
  v_code_normalized text;
  v_attempts_24h integer;
  v_sender_count integer;
  v_recipient_count integer;
  v_user_a uuid;
  v_user_b uuid;
  v_existing record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  -- Step 1: Advisory lock on sender (serialize quota checks).
  perform pg_advisory_xact_lock(hashtext('betterme.friend_request:' || v_uid::text));

  -- Step 2: Log attempt FIRST (before any code lookup — wrong codes burn quota).
  insert into public.friend_request_attempts (user_id) values (v_uid);

  -- Prune old attempts (> 7 days) for this user.
  delete from public.friend_request_attempts
  where user_id = v_uid and created_at < now() - interval '7 days';

  -- Step 3: Rate limit check (10 requests per 24 hours).
  select count(*) into v_attempts_24h
  from public.friend_request_attempts
  where user_id = v_uid and created_at >= now() - interval '24 hours';

  if v_attempts_24h > 10 then
    return jsonb_build_object('status', 'rate-limited');
  end if;

  -- Step 4: Normalize code and lookup recipient.
  v_code_normalized := upper(trim(coalesce(p_code, '')));
  select user_id, display_name into v_recipient_id, v_recipient_name
  from public.profiles
  where invite_code = v_code_normalized;

  if v_recipient_id is null then
    return jsonb_build_object('status', 'not-found');
  end if;

  if v_recipient_id = v_uid then
    return jsonb_build_object('status', 'self');
  end if;

  -- Step 5: Canonical pair lock (serialize friendship mutations for this pair).
  if v_uid < v_recipient_id then
    v_user_a := v_uid;
    v_user_b := v_recipient_id;
  else
    v_user_a := v_recipient_id;
    v_user_b := v_uid;
  end if;
  perform pg_advisory_xact_lock(hashtext('betterme.friendship:' || v_user_a::text || ':' || v_user_b::text));

  -- Step 6: Friend cap checks (MAX_FRIENDS = 50).
  select count(*) into v_sender_count
  from public.friendships
  where (user_a = v_uid or user_b = v_uid) and status = 'accepted';

  if v_sender_count >= 50 then
    return jsonb_build_object('status', 'cap-reached');
  end if;

  select count(*) into v_recipient_count
  from public.friendships
  where (user_a = v_recipient_id or user_b = v_recipient_id) and status = 'accepted';

  if v_recipient_count >= 50 then
    return jsonb_build_object('status', 'their-cap-reached');
  end if;

  -- Step 7: Check for existing friendship.
  select * into v_existing from public.friendships
  where user_a = v_user_a and user_b = v_user_b;

  if found then
    if v_existing.status = 'pending' then
      return jsonb_build_object(
        'status', 'already-pending',
        'direction', case when v_existing.requested_by = v_uid then 'sent' else 'received' end
      );
    elsif v_existing.status = 'accepted' then
      return jsonb_build_object('status', 'already-friends');
    end if;
  end if;

  -- Step 8: Insert friendship (canonical order, status pending).
  insert into public.friendships (user_a, user_b, status, requested_by)
  values (v_user_a, v_user_b, 'pending', v_uid);

  return jsonb_build_object(
    'status', 'sent',
    'displayName', v_recipient_name,
    'otherUserId', v_recipient_id
  );
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: respond_friend_request (§3.3)
-- Only the NON-requester can respond. Returns jsonb with "status" field:
--   "accepted"   — request accepted (includes "displayName" of other user)
--   "declined"   — request declined (row deleted, silent to requester)
-- Raises P0004 if caller is not the recipient or if friendship not found.
-- ---------------------------------------------------------------------

create or replace function public.respond_friend_request(p_other uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_existing record;
  v_other_name text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_other is null then
    raise exception using errcode = 'P0004', message = 'invalid-args';
  end if;

  -- Canonical pair.
  if v_uid < p_other then
    v_user_a := v_uid;
    v_user_b := p_other;
  else
    v_user_a := p_other;
    v_user_b := v_uid;
  end if;

  -- Lock pair.
  perform pg_advisory_xact_lock(hashtext('betterme.friendship:' || v_user_a::text || ':' || v_user_b::text));

  -- Lookup friendship.
  select * into v_existing from public.friendships
  where user_a = v_user_a and user_b = v_user_b;

  if not found or v_existing.status != 'pending' then
    raise exception using errcode = 'P0004', message = 'invalid-request';
  end if;

  -- Only the NON-requester can respond.
  if v_existing.requested_by = v_uid then
    raise exception using errcode = 'P0004', message = 'cannot-respond-to-own-request';
  end if;

  -- Fetch other user's display name.
  select display_name into v_other_name from public.profiles where user_id = p_other;

  if p_accept then
    update public.friendships
    set status = 'accepted', accepted_at = now()
    where user_a = v_user_a and user_b = v_user_b;

    return jsonb_build_object('status', 'accepted', 'displayName', v_other_name);
  else
    delete from public.friendships
    where user_a = v_user_a and user_b = v_user_b;

    return jsonb_build_object('status', 'declined');
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: get_friends_overview (§3.1)
-- Returns jsonb with "me" and "friends" fields. This is the ONLY RPC that
-- cross-looks up profiles (profiles RLS stays owner-only; this SECURITY DEFINER
-- RPC is the sanctioned path).
-- Shape:
--   {
--     "me": {"displayName", "avatarKind", "inviteCode", "sharingEnabled"},
--     "friends": [
--       {"otherUserId", "displayName", "avatarKind", "status", "requestedByMe", "acceptedAt"}
--     ]
--   }
-- Friends ordered by accepted_at (nulls last), then created_at.
-- ---------------------------------------------------------------------

create or replace function public.get_friends_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_me jsonb;
  v_friends jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  -- Fetch own profile.
  select jsonb_build_object(
    'displayName', display_name,
    'avatarKind', avatar_kind,
    'inviteCode', invite_code,
    'sharingEnabled', sharing_enabled
  ) into v_me
  from public.profiles
  where user_id = v_uid;

  -- Fetch friends (both directions, pending + accepted).
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'otherUserId', f.other_id,
      'displayName', p.display_name,
      'avatarKind', p.avatar_kind,
      'status', f.status,
      'requestedByMe', f.requested_by = v_uid,
      'acceptedAt', f.accepted_at
    ) order by f.accepted_at nulls last, f.created_at
  ), '[]'::jsonb) into v_friends
  from (
    select user_b as other_id, status, requested_by, accepted_at, created_at
    from public.friendships
    where user_a = v_uid
    union all
    select user_a as other_id, status, requested_by, accepted_at, created_at
    from public.friendships
    where user_b = v_uid
  ) f
  join public.profiles p on p.user_id = f.other_id;

  return jsonb_build_object('me', v_me, 'friends', v_friends);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: update_my_profile (§3.1)
-- Updates display_name and avatar_kind. Returns {"status": "ok"}.
-- Can be SECURITY INVOKER (own row, RLS applies), but kept as DEFINER so
-- Phase 2 can hook refresh_my_summary here (per spec §4.1).
-- ---------------------------------------------------------------------

create or replace function public.update_my_profile(p_display_name text, p_avatar_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_name text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  -- Validate and trim display_name (empty allowed = clears to default).
  v_name := trim(coalesce(p_display_name, ''));
  if char_length(v_name) > 30 then
    raise exception using errcode = 'P0004', message = 'display-name-too-long';
  end if;

  -- Validate avatar_kind.
  if p_avatar_kind is null or p_avatar_kind not in ('nep', 'dog', 'cat') then
    raise exception using errcode = 'P0004', message = 'invalid-avatar-kind';
  end if;

  update public.profiles
  set display_name = v_name, avatar_kind = p_avatar_kind
  where user_id = v_uid;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- ---------------------------------------------------------------------
-- Hardening: revoke DELETE on companion_meta (mirror of companions lockout).
-- Account deletion still cascades from auth.users (referential actions bypass RLS).
-- ---------------------------------------------------------------------

revoke delete on table public.companion_meta from anon, authenticated;

-- ---------------------------------------------------------------------
-- Grants: all Phase 1 RPCs are for authenticated users only.
-- Unfriend needs no RPC — the DELETE policy on friendships covers it.
-- ---------------------------------------------------------------------

revoke execute on function public.send_friend_request(text) from public, anon;
grant execute on function public.send_friend_request(text) to authenticated;

revoke execute on function public.respond_friend_request(uuid, boolean) from public, anon;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

revoke execute on function public.get_friends_overview() from public, anon;
grant execute on function public.get_friends_overview() to authenticated;

revoke execute on function public.update_my_profile(text, text) from public, anon;
grant execute on function public.update_my_profile(text, text) to authenticated;

-- =====================================================================
-- ===== Social Garden Phase 2: garden visits & cheers =====
-- Spec: docs/superpowers/specs/2026-07-08-social-garden-spec.md §4
-- Idempotent — safe to re-run. Phase 2 builds the read-only projection
-- (published_summaries) and gift/cheer mailbox (garden_visits). All writes
-- flow through RPCs; no direct INSERT/UPDATE policies on these tables.
-- =====================================================================

-- Constants (inline, referenced in comments):
-- OVERFLOW_BOND_CAP: 2 gifts/day that contribute overflow bond to host —
--   enforced HOST-client-side at mailbox-apply time (spec §4.2.1), not here.
-- PET_CAP_PER_DAY: 3 pets per (visitor, host) per day (§4.2)
-- FEED_RETENTION: 72 hours for applied visits (pruned in ack RPC)

-- ---------------------------------------------------------------------
-- Helper: a user's local calendar date (§3.1 — profiles.timezone is the
-- canonical clock for every social day label). profiles.timezone is
-- owner-writable, so an invalid name must degrade to the default rather
-- than break every RPC that labels a day.
-- ---------------------------------------------------------------------

create or replace function public.local_date_in(p_timezone text)
returns date
language plpgsql
stable
as $$
begin
  return (now() at time zone coalesce(p_timezone, 'Asia/Ho_Chi_Minh'))::date;
exception when others then
  return (now() at time zone 'Asia/Ho_Chi_Minh')::date;
end;
$$;

-- ---------------------------------------------------------------------
-- Migration: retire profiles.milestones. Milestones are SERVER-derived
-- inside refresh_my_summary by diffing against the previously published row
-- (spec §4.1: "client không bao giờ cung cấp nội dung milestone") — an
-- owner-writable column let any JWT publish fabricated content verbatim,
-- and nothing legitimate ever wrote it.
-- ---------------------------------------------------------------------

drop trigger if exists profiles_validate_milestones on public.profiles;
alter table public.profiles drop column if exists milestones;

-- ---------------------------------------------------------------------
-- Table: published_summaries (§4.1)
-- Read-only projection for friends. Owner writes only via refresh_my_summary RPC.
-- Structural invariant (§0.3): NO column may let a friend infer miss days or
-- inactive time — no streak counters, no last_refreshed/last_active stamps.
-- Every opt-out column (all except user_id) must CHECK-allow NULL.
-- ---------------------------------------------------------------------

create table if not exists public.published_summaries (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text check (display_name is null or char_length(display_name) <= 30),
  pet_name      text check (pet_name is null or char_length(pet_name) <= 20),
  pet_species   text check (pet_species is null or pet_species in ('dog', 'cat')),
  -- AS-BUILT vocabularies (spec §4.1/§4.3 "đúng growth stage thật"):
  -- keep in lockstep with dashboard-data.ts PET_STAGE_THRESHOLDS /
  -- BOND_TIER_THRESHOLDS — friends render the pet exactly as the owner sees it.
  pet_stage     text check (pet_stage is null or pet_stage in ('baby', 'kid', 'junior', 'teen', 'adult')),
  pet_bond_tier integer check (pet_bond_tier is null or pet_bond_tier between 1 and 5),
  milestones    jsonb not null default '[]' -- shape validated by trigger below
);

-- Migration for already-provisioned databases (the create above is a no-op
-- there): drop the leaky columns and re-align the pet columns. Nulled pet
-- values self-heal on each owner's next refresh_my_summary call.
alter table public.published_summaries drop column if exists current_streak;
alter table public.published_summaries drop column if exists best_streak;
alter table public.published_summaries drop column if exists last_refreshed;

do $$
begin
  -- pet_bond_tier text ('sprout'|'bloom'|'fruit') -> integer 1..5.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'published_summaries'
      and column_name = 'pet_bond_tier' and data_type = 'text'
  ) then
    alter table public.published_summaries
      drop constraint if exists published_summaries_pet_bond_tier_check;
    alter table public.published_summaries
      alter column pet_bond_tier type integer using null::integer;
    alter table public.published_summaries
      add constraint published_summaries_pet_bond_tier_check
      check (pet_bond_tier is null or pet_bond_tier between 1 and 5);
  end if;
end $$;

update public.published_summaries set pet_stage = null
where pet_stage is not null
  and pet_stage not in ('baby', 'kid', 'junior', 'teen', 'adult');

alter table public.published_summaries
  drop constraint if exists published_summaries_pet_stage_check;
alter table public.published_summaries
  add constraint published_summaries_pet_stage_check
  check (pet_stage is null or pet_stage in ('baby', 'kid', 'junior', 'teen', 'adult'));

-- Phase 3 (§5.2) — weekend Garden Fair columns. weekly_good_days = distinct
-- days with >=1 habit tick in the current ISO week (Monday start, owner's tz),
-- capped 0..7. week_start = that week's Monday (owner tz). prev_week_* carry the
-- prior week forward for the self-verifying lantern read (§5.2). All four are
-- NULL unless fair_opt_in (write-layer opt-out §8) — NULL weekly_good_days
-- means "not in the fair". No streak/last-active shape is introduced (§0.3):
-- these are positive weekly counts only.
alter table public.published_summaries add column if not exists week_start date;
alter table public.published_summaries add column if not exists weekly_good_days integer;
alter table public.published_summaries add column if not exists prev_week_start date;
alter table public.published_summaries add column if not exists prev_week_good_days integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'published_summaries_weekly_good_days_check'
      and conrelid = 'public.published_summaries'::regclass
  ) then
    alter table public.published_summaries
      add constraint published_summaries_weekly_good_days_check
      check (weekly_good_days is null or (weekly_good_days between 0 and 7));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'published_summaries_prev_week_good_days_check'
      and conrelid = 'public.published_summaries'::regclass
  ) then
    alter table public.published_summaries
      add constraint published_summaries_prev_week_good_days_check
      check (prev_week_good_days is null or (prev_week_good_days between 0 and 7));
  end if;
end $$;

alter table public.published_summaries enable row level security;

-- ---------------------------------------------------------------------
-- RLS (§4.1/§8): owner gets SELECT + DELETE (DELETE keeps opt-out silent and
-- user-reachable even when refresh_my_summary never runs). Nobody has
-- INSERT/UPDATE — writes are RPC-only.
-- ---------------------------------------------------------------------

drop policy if exists "Published summaries are readable by owner" on public.published_summaries;
create policy "Published summaries are readable by owner" on public.published_summaries
for select using (auth.uid() = user_id);

drop policy if exists "Published summaries are deletable by owner" on public.published_summaries;
create policy "Published summaries are deletable by owner" on public.published_summaries
for delete using (auth.uid() = user_id);

-- Helper for the friend policy below: profiles RLS is owner-only, so a bare
-- subquery inside the policy would run under the querying FRIEND's RLS and
-- always come back empty. SECURITY DEFINER exposes exactly one boolean.
create or replace function public.is_sharing(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select sharing_enabled from public.profiles where user_id = p_user_id),
    false);
$$;

revoke execute on function public.is_sharing(uuid) from public, anon;
grant execute on function public.is_sharing(uuid) to authenticated;

-- Friends: SELECT only while accepted AND the owner is still sharing (§8
-- "accepted + owner đang share") — opt-out is structural at read time, not
-- just a write-time delete that a dropped RPC call could miss.
drop policy if exists "Published summaries are readable by friends" on public.published_summaries;
create policy "Published summaries are readable by friends" on public.published_summaries
for select using (
  public.is_sharing(published_summaries.user_id)
  and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.user_a = auth.uid() and f.user_b = published_summaries.user_id)
        or (f.user_b = auth.uid() and f.user_a = published_summaries.user_id))
  )
);

-- ---------------------------------------------------------------------
-- Milestone shape validation (§4.1): BEFORE insert/update on
-- published_summaries. Milestones are server-built inside refresh_my_summary;
-- this trigger is defense-in-depth (there is no direct write path). Shape:
-- array of {id, kind, at} plus an optional enum-ish 'detail', max 10 items,
-- kind in the fixed spec vocabulary, and NO free-text 'value' key — the
-- positive-only invariant is structural: content never comes from a client.
-- ---------------------------------------------------------------------

create or replace function public.validate_milestones()
returns trigger
language plpgsql
as $$
declare
  v_elem jsonb;
  v_key text;
begin
  if new.milestones is null then
    new.milestones := '[]'::jsonb;
  end if;
  if jsonb_typeof(new.milestones) != 'array' then
    raise exception using errcode = 'P0004', message = 'milestones-must-be-array';
  end if;
  if jsonb_array_length(new.milestones) > 10 then
    raise exception using errcode = 'P0004', message = 'milestones-max-10';
  end if;
  for v_elem in select * from jsonb_array_elements(new.milestones) loop
    if jsonb_typeof(v_elem) != 'object' then
      raise exception using errcode = 'P0004', message = 'milestone-item-must-be-object';
    end if;
    if not (v_elem ? 'id' and v_elem ? 'kind' and v_elem ? 'at') then
      raise exception using errcode = 'P0004', message = 'milestone-missing-required-keys';
    end if;
    for v_key in select jsonb_object_keys(v_elem) loop
      if v_key not in ('id', 'kind', 'at', 'detail') then
        raise exception using errcode = 'P0004', message = 'milestone-unknown-key';
      end if;
    end loop;
    if v_elem->>'kind' not in ('evolve', 'bond_tier', 'bloom_week', 'new_pet') then
      raise exception using errcode = 'P0004', message = 'milestone-invalid-kind';
    end if;
    if char_length(v_elem->>'id') > 40 then
      raise exception using errcode = 'P0004', message = 'milestone-id-too-long';
    end if;
    begin
      perform (v_elem->>'at')::date;
    exception when others then
      raise exception using errcode = 'P0004', message = 'milestone-invalid-date';
    end;
    if pg_column_size(v_elem) > 200 then
      raise exception using errcode = 'P0004', message = 'milestone-item-too-large';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists published_summaries_validate_milestones on public.published_summaries;
create trigger published_summaries_validate_milestones
before insert or update on public.published_summaries
for each row execute function public.validate_milestones();

-- ---------------------------------------------------------------------
-- Milestone helpers for refresh_my_summary. Ids are DETERMINISTIC
-- (kind || ':' || detail): the one-cheer-per-milestone unique index and the
-- client's cheered state key off them, so a refresh must never re-mint ids.
-- Dedupe-by-id also makes the diff append-only under repeated refreshes.
-- ---------------------------------------------------------------------

create or replace function public.pet_stage_rank(p_stage text)
returns integer
language sql
immutable
as $$
  select case p_stage
    when 'baby' then 1
    when 'kid' then 2
    when 'junior' then 3
    when 'teen' then 4
    when 'adult' then 5
    else 0
  end;
$$;

create or replace function public.append_milestone(
  p_milestones jsonb,
  p_kind text,
  p_detail text,
  p_at date
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_id text := p_kind || ':' || p_detail;
  v_next jsonb := coalesce(p_milestones, '[]'::jsonb);
begin
  if exists (
    select 1 from jsonb_array_elements(v_next) m where m->>'id' = v_id
  ) then
    return v_next;
  end if;

  v_next := v_next || jsonb_build_array(jsonb_build_object(
    'id', v_id, 'kind', p_kind, 'at', p_at::text, 'detail', p_detail));

  -- Keep the 10 most recent (append order = chronological); never rewrite
  -- surviving entries (spec §4.1: append-only, positive-only).
  while jsonb_array_length(v_next) > 10 loop
    v_next := v_next - 0;
  end loop;

  return v_next;
end;
$$;

-- ---------------------------------------------------------------------
-- Backstop trigger (§4.1): identity/consent changes propagate to the summary
-- even when no client follow-up call ever lands (the client's
-- refreshMySummary calls are fire-and-forget). SECURITY DEFINER because
-- published_summaries deliberately has no INSERT/UPDATE/owner-DELETE-only
-- policies — the writes below share the RPC trust model.
-- ---------------------------------------------------------------------

create or replace function public.profiles_propagate_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sharing_enabled is distinct from true then
    -- Opt-out is immediate and silent at the data layer (§4.1 "tắt → xóa
    -- row"), even when sharing_enabled flips via a direct PATCH.
    delete from public.published_summaries where user_id = new.user_id;
  else
    -- Sharing stays on: propagate the display name, and enforce the fair
    -- write-layer opt-out (§8). A direct PATCH turning fair_opt_in OFF clears
    -- the fair columns immediately; turning it ON re-populates on the next
    -- refresh_my_summary (the trigger never fabricates fair data).
    update public.published_summaries
    set display_name = new.display_name,
        week_start = case when new.fair_opt_in is true then week_start else null end,
        weekly_good_days = case when new.fair_opt_in is true then weekly_good_days else null end,
        prev_week_start = case when new.fair_opt_in is true then prev_week_start else null end,
        prev_week_good_days =
          case when new.fair_opt_in is true then prev_week_good_days else null end
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_propagate_summary on public.profiles;
create trigger profiles_propagate_summary
after update of display_name, avatar_kind, sharing_enabled, fair_opt_in on public.profiles
for each row execute function public.profiles_propagate_summary();

-- ---------------------------------------------------------------------
-- Table: garden_visits (§4.2)
-- Mailbox for gifts/cheers. Writes via visit_garden RPC only.
-- Partial unique indexes enforce: one gift per (host, visitor, visit_date)
-- across ack states; one cheer per milestone per (visitor, host).
-- ---------------------------------------------------------------------

create table if not exists public.garden_visits (
  visit_id            uuid primary key default gen_random_uuid(),
  host_user_id        uuid not null references auth.users(id) on delete cascade,
  visitor_user_id     uuid not null references auth.users(id) on delete cascade,
  visit_date          date not null,
  visitor_pet_species text check (visitor_pet_species in ('dog', 'cat')),
  visitor_pet_name    text check (char_length(visitor_pet_name) <= 20),
  gifted_food         integer not null default 0 check (gifted_food between 0 and 1),
  cheered_milestone_id text, -- references host's milestones array (validated in RPC)
  applied_at          timestamptz, -- null = pending in mailbox; not-null = applied
  created_at          timestamptz not null default now()
);

alter table public.garden_visits enable row level security;

-- RLS: SELECT for the HOST only (the mailbox read). The visitor needs no read
-- path — caps are enforced by unique indexes + typed RPC errors — and a
-- visitor-readable applied_at would leak exactly when the host came online
-- (§0.3: no last_active-shaped data leaves a user's garden). No INSERT/UPDATE
-- policies (RPC-only writes).
drop policy if exists "Garden visits readable by host or visitor" on public.garden_visits;
drop policy if exists "Garden visits readable by host" on public.garden_visits;
create policy "Garden visits readable by host" on public.garden_visits
for select using (auth.uid() = host_user_id);

-- Gift cap (§4.2): UNIQUE over the GIFT rows themselves — keyed on gift-ness,
-- not mailbox state. No applied_at predicate: acking mail must not reopen the
-- daily cap (the 72h prune only removes rows applied >72h ago, never today's).
-- Migration note: the old index covered pending rows of EVERY kind; drop it
-- and remove over-cap same-day gift duplicates it allowed (keep the earliest —
-- extras exceeded the 1/day cap and only exist because of the old predicate).
drop index if exists public.garden_visits_one_gift_per_host_visitor_date;

delete from public.garden_visits gv
using public.garden_visits keeper
where gv.gifted_food = 1
  and keeper.gifted_food = 1
  and gv.host_user_id = keeper.host_user_id
  and gv.visitor_user_id = keeper.visitor_user_id
  and gv.visit_date = keeper.visit_date
  and (keeper.created_at, keeper.visit_id) < (gv.created_at, gv.visit_id);

create unique index if not exists garden_visits_one_gift_per_host_visitor_date
on public.garden_visits (host_user_id, visitor_user_id, visit_date)
where gifted_food = 1;

-- Cheer cap (§4.2): one cheer per milestone PER (visitor, host) — the old
-- index omitted visitor_user_id, so only the FIRST friend could ever cheer a
-- milestone. Loosening-only relative to the old key: safe on live data.
drop index if exists public.garden_visits_one_cheer_per_milestone;
create unique index if not exists garden_visits_one_cheer_per_milestone
on public.garden_visits (visitor_user_id, host_user_id, cheered_milestone_id)
where cheered_milestone_id is not null;

-- PET_CAP_PER_DAY = 3 pets per (visitor, host) per day: soft cap counted in
-- visit_garden under the pair advisory lock (a unique index cannot express
-- "at most 3"); over-cap is a silent ok — animation without a record (§4.2).

-- Indexes for queries.
create index if not exists garden_visits_host_idx on public.garden_visits (host_user_id);
create index if not exists garden_visits_host_applied_idx on public.garden_visits (host_user_id, applied_at);

-- ---------------------------------------------------------------------
-- RPC: refresh_my_summary (§4.1)
-- Recomputes published_summaries from companions + profiles, and SERVER-
-- derives milestones by diffing against the previously published row — the
-- client never supplies milestone content, and no streak/last_active-shaped
-- field is ever published (§0.3). Returns {"status":"ok","sharingEnabled":b}.
-- If sharing is not enabled (or no profiles row), DELETEs the summary row.
-- ---------------------------------------------------------------------

create or replace function public.refresh_my_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_sharing_enabled boolean;
  v_display_name text;
  v_timezone text;
  v_today date;
  v_pet record;
  v_pet_name text;
  v_pet_species text;
  v_pet_stage text;
  v_pet_bond_tier integer;
  v_prev record;
  v_milestones jsonb := '[]'::jsonb;
  v_fair_opt_in boolean;
  v_week_start date;
  v_weekly_good_days integer;
  v_prev_week_start date;
  v_prev_week_good_days integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  -- Advisory lock on own uid (same pattern as merge_companion_state).
  perform pg_advisory_xact_lock(hashtext('betterme.summary:' || v_uid::text));

  select sharing_enabled, display_name, timezone, fair_opt_in
  into v_sharing_enabled, v_display_name, v_timezone, v_fair_opt_in
  from public.profiles
  where user_id = v_uid;

  -- Fail CLOSED on a missing profiles row (null): plain `if not null` would
  -- skip this branch and publish for a user who never opted in. Missing row
  -- = opted out, matching the column's `default false` posture.
  if v_sharing_enabled is distinct from true then
    -- Opt-out: delete summary row.
    delete from public.published_summaries where user_id = v_uid;
    return jsonb_build_object('status', 'ok', 'sharingEnabled', false);
  end if;

  -- Day label for milestone stamps: the OWNER's local calendar (§3.1).
  v_today := public.local_date_in(v_timezone);

  -- Active companion -> the AS-BUILT scales (spec §4.1 "đúng ngưỡng
  -- PET_STAGE_THRESHOLDS/BOND_TIER_THRESHOLDS as-built"). KEEP IN LOCKSTEP
  -- with dashboard-data.ts:
  --   PET_STAGE_THRESHOLDS: baby 0 / kid 5 / junior 15 / teen 30 / adult 50
  --   BOND_TIER_THRESHOLDS: 0 / 60 / 180 / 420 / 840  -> tiers 1..5
  select c.name, c.species, c.growth_days, c.bond
  into v_pet
  from public.companions c
  join public.companion_meta m on m.user_id = c.user_id and m.active_species = c.species
  where c.user_id = v_uid;

  if found then
    v_pet_name := v_pet.name;
    v_pet_species := v_pet.species;
    v_pet_stage := case
      when v_pet.growth_days >= 50 then 'adult'
      when v_pet.growth_days >= 30 then 'teen'
      when v_pet.growth_days >= 15 then 'junior'
      when v_pet.growth_days >= 5 then 'kid'
      else 'baby'
    end;
    v_pet_bond_tier := case
      when v_pet.bond >= 840 then 5
      when v_pet.bond >= 420 then 4
      when v_pet.bond >= 180 then 3
      when v_pet.bond >= 60 then 2
      else 1
    end;
  else
    v_pet_name := null;
    v_pet_species := null;
    v_pet_stage := null;
    v_pet_bond_tier := null;
  end if;

  -- Server-side milestone diff (§4.1: "tự append milestones bằng cách diff
  -- với row trước"): fixed vocabulary, deterministic ids, no free text,
  -- forward-transitions only (nothing is appended on a regression — positive
  -- only, structurally). No previous row -> nothing to diff: a first publish
  -- starts with an empty history rather than invented backstory.
  select ps.pet_species, ps.pet_stage, ps.pet_bond_tier, ps.milestones,
         ps.week_start, ps.weekly_good_days, ps.prev_week_start, ps.prev_week_good_days
  into v_prev
  from public.published_summaries ps
  where ps.user_id = v_uid;

  if found then
    v_milestones := coalesce(v_prev.milestones, '[]'::jsonb);

    -- new_pet: the active species appeared or changed.
    if v_pet_species is not null and v_pet_species is distinct from v_prev.pet_species then
      v_milestones := public.append_milestone(v_milestones, 'new_pet', v_pet_species, v_today);
    end if;

    -- evolve: growth stage advanced (same pet only; forward-only).
    if v_pet_species is not null and v_pet_species = v_prev.pet_species
      and public.pet_stage_rank(v_pet_stage) > public.pet_stage_rank(v_prev.pet_stage) then
      v_milestones := public.append_milestone(v_milestones, 'evolve', v_pet_stage, v_today);
    end if;

    -- bond_tier: bond tier climbed (same pet only; forward-only).
    if v_pet_species is not null and v_pet_species = v_prev.pet_species
      and v_pet_bond_tier > coalesce(v_prev.pet_bond_tier, 0) then
      v_milestones := public.append_milestone(v_milestones, 'bond_tier', v_pet_bond_tier::text, v_today);
    end if;
    -- ('bloom_week' lands with Phase 3's weekly rollover.)
  end if;

  -- Garden Fair weekly metric (§5.2): distinct days with >=1 done habit_log in
  -- the current ISO week (Monday start). habit_logs.date is already a local date
  -- label, so no tz conversion is needed on it. Cap 0..7. Populated ONLY when
  -- fair_opt_in is true (write-layer opt-out §8) — otherwise the four columns
  -- stay NULL, and a NULL weekly_good_days means "not in the fair". No streak /
  -- last-active shape is introduced (§0.3): a positive weekly count only.
  if v_fair_opt_in is true then
    -- Monday of the current week in the owner's calendar (isodow: Mon=1..Sun=7).
    v_week_start := v_today - (extract(isodow from v_today)::integer - 1);

    select count(distinct hl.date)
    into v_weekly_good_days
    from public.habit_logs hl
    where hl.user_id = v_uid
      and hl.done
      and hl.date >= v_week_start
      and hl.date < v_week_start + 7;

    v_weekly_good_days := least(7, coalesce(v_weekly_good_days, 0));

    -- Roll the prior week forward for the self-verifying lantern read (§5.2):
    -- if the last publish was in an EARLIER week, its weekly count becomes the
    -- prev-week entry; a same-week recompute keeps the existing prev-week; a
    -- first publish has no prior week. The client's self-verifying read filters
    -- a stale prev week (absent >= 2 weeks) against M-1, so we simply carry the
    -- most recent completed week here.
    if v_prev.week_start is not null and v_prev.week_start < v_week_start then
      v_prev_week_start := v_prev.week_start;
      v_prev_week_good_days := v_prev.weekly_good_days;
    else
      v_prev_week_start := v_prev.prev_week_start;
      v_prev_week_good_days := v_prev.prev_week_good_days;
    end if;
  else
    v_week_start := null;
    v_weekly_good_days := null;
    v_prev_week_start := null;
    v_prev_week_good_days := null;
  end if;

  -- Upsert published_summaries.
  insert into public.published_summaries (
    user_id, display_name, pet_name, pet_species, pet_stage, pet_bond_tier, milestones,
    week_start, weekly_good_days, prev_week_start, prev_week_good_days
  ) values (
    v_uid, v_display_name, v_pet_name, v_pet_species, v_pet_stage, v_pet_bond_tier, v_milestones,
    v_week_start, v_weekly_good_days, v_prev_week_start, v_prev_week_good_days
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    pet_name = excluded.pet_name,
    pet_species = excluded.pet_species,
    pet_stage = excluded.pet_stage,
    pet_bond_tier = excluded.pet_bond_tier,
    milestones = excluded.milestones,
    week_start = excluded.week_start,
    weekly_good_days = excluded.weekly_good_days,
    prev_week_start = excluded.prev_week_start,
    prev_week_good_days = excluded.prev_week_good_days;

  return jsonb_build_object('status', 'ok', 'sharingEnabled', true);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: set_sharing_enabled (§0.4 — "chia sẻ là opt-in riêng")
-- The explicit consent write path for the projection: flips
-- profiles.sharing_enabled and publishes/deletes the summary in the SAME
-- transaction (enable -> row appears immediately; disable -> silent delete;
-- the profiles_propagate_summary trigger backstops direct PATCHes).
-- Returns refresh_my_summary's {"status":"ok","sharingEnabled":bool}.
-- ---------------------------------------------------------------------

create or replace function public.set_sharing_enabled(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_enabled is null then
    raise exception using errcode = 'P0004', message = 'invalid-args';
  end if;

  update public.profiles
  set sharing_enabled = p_enabled
  where user_id = v_uid;

  return public.refresh_my_summary();
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: visit_garden (§4.2)
-- Visit a friend's garden, optionally gift food and/or cheer a milestone.
-- Returns {"status":"ok","petCount":N,"petRecorded":b,"giftDelivered":b,
-- "cheerDelivered":b}. Validates friendship + host sharing (fail-closed on a
-- missing profiles row). Every day label uses the VISITOR's timezone
-- (§4.2 "nhãn ngày theo timezone của VISITOR"; §3.1).
-- Typed errors (all P0004): invalid-host / not-friends / host-not-sharing /
-- no-active-pet / insufficient-food / milestone-not-found / already-cheered /
-- gift-cap-reached. Over-cap pets are a silent ok — animation without a
-- record, never an error (§4.2).
-- Gift: deducts 1 food from the visitor's ledger; the HOST receives via
-- their own client mailbox (§4.2.1) — this RPC never writes host state.
-- ---------------------------------------------------------------------

create or replace function public.visit_garden(
  p_host_user_id uuid,
  p_gift_food boolean default false,
  p_cheer_milestone_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visitor_uid uuid;
  v_visitor_tz text;
  v_today date;
  v_host_sharing boolean;
  v_friendship_exists boolean;
  v_visitor_pet record;
  v_is_pure_pet boolean;
  v_pet_count integer;
  v_food_balance integer;
  v_gift_delivered boolean := false;
  v_cheer_delivered boolean := false;
  v_milestone_exists boolean;
  v_visit_id uuid;
begin
  v_visitor_uid := auth.uid();
  if v_visitor_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_host_user_id is null or p_host_user_id = v_visitor_uid then
    raise exception using errcode = 'P0004', message = 'invalid-host';
  end if;

  -- Pair lock (visitor, host): serializes the count-then-insert caps below.
  perform pg_advisory_xact_lock(
    hashtext('betterme.visit:' || least(v_visitor_uid, p_host_user_id)::text || ':' || greatest(v_visitor_uid, p_host_user_id)::text)
  );

  -- Validate friendship accepted.
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((user_a = v_visitor_uid and user_b = p_host_user_id)
        or (user_a = p_host_user_id and user_b = v_visitor_uid))
  ) into v_friendship_exists;

  if not v_friendship_exists then
    raise exception using errcode = 'P0004', message = 'not-friends';
  end if;

  -- Validate host sharing. Fail CLOSED when the host has no profiles row:
  -- plain `if not NULL` would skip the raise and let the visit proceed
  -- against a user who never opted in. Same message either way — callers get
  -- no oracle for whether the profile row exists.
  select sharing_enabled into v_host_sharing
  from public.profiles where user_id = p_host_user_id;

  if v_host_sharing is distinct from true then
    raise exception using errcode = 'P0004', message = 'host-not-sharing';
  end if;

  -- The visitor's local calendar date labels the visit, the caps, and the
  -- ledger spend key. Missing profiles row / invalid timezone name degrade
  -- to the default inside local_date_in.
  select timezone into v_visitor_tz
  from public.profiles where user_id = v_visitor_uid;

  v_today := public.local_date_in(v_visitor_tz);

  -- Fetch visitor's active companion (for visitor_pet_species, visitor_pet_name).
  select c.species, c.name
  into v_visitor_pet
  from public.companions c
  join public.companion_meta m on m.user_id = c.user_id and m.active_species = c.species
  where c.user_id = v_visitor_uid;

  if not found then
    raise exception using errcode = 'P0004', message = 'no-active-pet';
  end if;

  v_is_pure_pet := not p_gift_food and p_cheer_milestone_id is null;

  -- PET_CAP_PER_DAY (§4.2): 3 pets per (visitor, HOST) per day, counting
  -- pet-kind rows only, regardless of ack state — acking mail must not
  -- reopen the cap, and the 72h prune never removes same-day rows. Computed
  -- for every call so the returned petCount stays meaningful, but enforced
  -- only on pure pet calls: gifts/cheers have their own caps (unique
  -- indexes) and must not be collateral damage of petting.
  select count(*) into v_pet_count
  from public.garden_visits
  where visitor_user_id = v_visitor_uid
    and host_user_id = p_host_user_id
    and visit_date = v_today
    and gifted_food = 0
    and cheered_milestone_id is null;

  if v_is_pure_pet and v_pet_count >= 3 then
    -- Over cap: still animation + thoại, just no record (§4.2 mirrors
    -- PETTING_CAP_PER_DAY) — affection is never an error.
    return jsonb_build_object(
      'status', 'ok',
      'petCount', v_pet_count,
      'petRecorded', false,
      'giftDelivered', false,
      'cheerDelivered', false
    );
  end if;

  -- Handle gift (if requested).
  if p_gift_food then
    -- Serialize with merge_companion_state / reset_companion: they hold this
    -- per-user lock across their read-modify-write of companion_meta, so a
    -- spend appended outside it could be overwritten by a concurrent merge's
    -- pre-computed food_spent_events union — a silent refund while the host
    -- still receives the gift. Holding it across the balance check also
    -- makes check+append atomic against concurrent gifts to DIFFERENT hosts
    -- (those hold different pair locks). Lock order is pair -> companion
    -- here; merge/reset take only the companion lock and never wait on a
    -- pair lock, so no deadlock cycle is possible.
    perform pg_advisory_xact_lock(hashtext('betterme.companion:' || v_visitor_uid::text));

    -- Canonical balance (§2.3, mirrors deriveFoodBalance and the merge
    -- prune): clamp(carryover + Σ granted + Σ gifts_received − Σ|spent|, 0, 21).
    -- Sums ledger VALUES — never counts keys: overflow-absorbed gifts are
    -- stored with value 0 and would otherwise mint food. Malformed values
    -- degrade to 0 via safe_int. FOR UPDATE pins the row under the lock.
    select least(21, greatest(0,
        m.food_carryover
      + coalesce((select sum(public.safe_int(g.value, 0))
          from jsonb_each_text(m.food_granted_by_date) g), 0)
      + coalesce((select sum(public.safe_int(r.value, 0))
          from jsonb_each_text(m.food_gifts_received) r), 0)
      - coalesce((select sum(jsonb_array_length(s.value))
          from jsonb_each(m.food_spent_events) s
          where jsonb_typeof(s.value) = 'array'), 0)))::integer
    into v_food_balance
    from public.companion_meta m
    where m.user_id = v_visitor_uid
    for update;

    if v_food_balance is null or v_food_balance < 1 then
      raise exception using errcode = 'P0004', message = 'insufficient-food';
    end if;

    -- Deduct 1 food: append a server-minted spend event to today's bucket.
    -- (OVERFLOW_BOND_CAP — 2/day — is enforced HOST-client-side at
    -- mailbox-apply time per §4.2.1; nothing to read here.)
    v_visit_id := gen_random_uuid();
    update public.companion_meta
    set food_spent_events = jsonb_set(
      food_spent_events,
      array[v_today::text],
      coalesce(food_spent_events->v_today::text, '[]'::jsonb)
        || jsonb_build_array('gift:' || p_host_user_id::text || ':' || v_today::text || ':' || v_visit_id::text),
      true
    )
    where user_id = v_visitor_uid;

    v_gift_delivered := true;
  end if;

  -- Handle cheer (if requested).
  if p_cheer_milestone_id is not null then
    -- Validate milestone_id exists in host's published_summaries.milestones array.
    select exists (
      select 1 from public.published_summaries ps,
      jsonb_array_elements(ps.milestones) m
      where ps.user_id = p_host_user_id
        and m->>'id' = p_cheer_milestone_id
    ) into v_milestone_exists;

    if not v_milestone_exists then
      raise exception using errcode = 'P0004', message = 'milestone-not-found';
    end if;

    -- Typed duplicate check — 1 cheer per milestone per (visitor, host); the
    -- unique index below is the backstop. Race-safe: the pair advisory lock
    -- taken above covers the index's full key. Raising here (instead of
    -- leaking a raw 23505 off the insert) also rolls back any gift-food
    -- deduction made in the same call.
    if exists (
      select 1 from public.garden_visits
      where visitor_user_id = v_visitor_uid
        and host_user_id = p_host_user_id
        and cheered_milestone_id = p_cheer_milestone_id
    ) then
      raise exception using errcode = 'P0004', message = 'already-cheered';
    end if;

    v_cheer_delivered := true;
  end if;

  -- Insert the mailbox row (applied_at null = pending). Unique indexes
  -- enforce: one gift per (host, visitor, visit_date); one cheer per
  -- milestone per (visitor, host). Cheer duplicates were pre-checked above,
  -- so a unique_violation here is the gift cap — surface it as a typed error
  -- (rolling back the food deduction) instead of a raw 23505 the client
  -- would misread as a network problem.
  begin
    insert into public.garden_visits (
      host_user_id, visitor_user_id, visit_date, visitor_pet_species, visitor_pet_name,
      gifted_food, cheered_milestone_id, applied_at
    ) values (
      p_host_user_id, v_visitor_uid, v_today, v_visitor_pet.species, v_visitor_pet.name,
      case when p_gift_food then 1 else 0 end,
      p_cheer_milestone_id,
      null
    );
  exception when unique_violation then
    raise exception using errcode = 'P0004', message = 'gift-cap-reached';
  end;

  -- Only a pet-kind row advances the pet count.
  if v_is_pure_pet then
    v_pet_count := v_pet_count + 1;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'petCount', v_pet_count,
    'petRecorded', v_is_pure_pet,
    'giftDelivered', v_gift_delivered,
    'cheerDelivered', v_cheer_delivered
  );
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: ack_garden_visits (§4.2)
-- Host acknowledges visits (sets applied_at = now()). The CLIENT merges
-- the ledger changes to local state (spec §4.2.1) — this RPC is just the ack.
-- Prunes applied visits older than FEED_RETENTION (72 hours).
-- Returns void.
-- ---------------------------------------------------------------------

create or replace function public.ack_garden_visits(p_visit_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_uid uuid;
begin
  v_host_uid := auth.uid();
  if v_host_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_visit_ids is null or array_length(p_visit_ids, 1) is null then
    raise exception using errcode = 'P0004', message = 'invalid-visit-ids';
  end if;

  -- Set applied_at = now() for those visit_ids where host_user_id = v_host_uid and applied_at is null.
  update public.garden_visits
  set applied_at = now()
  where visit_id = any(p_visit_ids)
    and host_user_id = v_host_uid
    and applied_at is null;

  -- Prune applied visits older than FEED_RETENTION (72 hours) — EXCEPT cheer
  -- rows whose milestone is still live in the host's summary: they carry the
  -- one-cheer-per-milestone uniqueness, and pruning would let the same
  -- visitor re-cheer after 3 days. Growth stays bounded: milestones rotate
  -- out of the 10-slot array, at which point their cheer rows become
  -- prunable (and visit_garden rejects departed ids with milestone-not-found).
  delete from public.garden_visits gv
  where gv.host_user_id = v_host_uid
    and gv.applied_at is not null
    and gv.applied_at < now() - interval '72 hours'
    and (gv.cheered_milestone_id is null or not exists (
      select 1
      from public.published_summaries ps,
      jsonb_array_elements(ps.milestones) m
      where ps.user_id = gv.host_user_id
        and m->>'id' = gv.cheered_milestone_id
    ));
end;
$$;

-- ---------------------------------------------------------------------
-- Helper view: get_my_garden_feed (§4.2)
-- Returns recent applied visits (visitor names, species, dates) as jsonb array.
-- Ordered by applied_at desc, limited to p_limit (default 20).
-- Shape: [{"visitId", "visitorPetName", "visitorPetSpecies", "visitDate", "giftedFood", "cheeredMilestoneId", "appliedAt"}]
-- ---------------------------------------------------------------------

create or replace function public.get_my_garden_feed(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_uid uuid;
  v_feed jsonb;
begin
  v_host_uid := auth.uid();
  if v_host_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'visitId', visit_id,
      'visitorUserId', visitor_user_id,
      'visitorPetName', visitor_pet_name,
      'visitorPetSpecies', visitor_pet_species,
      'visitDate', visit_date,
      'giftedFood', gifted_food,
      'cheeredMilestoneId', cheered_milestone_id,
      'appliedAt', applied_at
    ) order by applied_at desc
  ), '[]'::jsonb) into v_feed
  from (
    select *
    from public.garden_visits
    where host_user_id = v_host_uid and applied_at is not null
    order by applied_at desc
    limit p_limit
  ) sub;

  return v_feed;
end;
$$;

-- ---------------------------------------------------------------------
-- Grants: all Phase 2 RPCs are for authenticated users only.
-- ---------------------------------------------------------------------

revoke execute on function public.refresh_my_summary() from public, anon;
grant execute on function public.refresh_my_summary() to authenticated;

revoke execute on function public.set_sharing_enabled(boolean) from public, anon;
grant execute on function public.set_sharing_enabled(boolean) to authenticated;

revoke execute on function public.visit_garden(uuid, boolean, text) from public, anon;
grant execute on function public.visit_garden(uuid, boolean, text) to authenticated;

revoke execute on function public.ack_garden_visits(uuid[]) from public, anon;
grant execute on function public.ack_garden_visits(uuid[]) to authenticated;

revoke execute on function public.get_my_garden_feed(integer) from public, anon;
grant execute on function public.get_my_garden_feed(integer) to authenticated;



-- =====================================================================
-- ===== Social Garden Phase 3: Nhịp Chung & Hội chợ vườn =====
-- Spec: docs/superpowers/specs/2026-07-08-social-garden-spec.md §5
-- Idempotent — safe to re-run. Adds the shared-rhythm ledger + the weekend
-- garden-fair RPCs. The fair COLUMNS + weekly computation live with Phase 2's
-- published_summaries / refresh_my_summary above (fair_opt_in on profiles,
-- week_start/weekly_good_days/prev_week_* on published_summaries, all NULL
-- unless fair_opt_in — write-layer opt-out §8). Locked decisions §11: bloom
-- >= 4/7, lanterns top-3, Nhịp Chung never counts days both rest, reflection
-- deferred. No streak/last-active surface anywhere (§0.3).
-- Constants (inline): SHARED_RHYTHM_MAX_PARTNERS = 5.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: shared_rhythms (§5.1)
-- Canonical pair (user_a < user_b). rhythm_days only ever RISES or RESTS —
-- never decays (a not-counted day leaves it unchanged, never a break/penalty:
-- invariant 2, structural). Writes go through bump_shared_rhythms only.
-- ---------------------------------------------------------------------

create table if not exists public.shared_rhythms (
  user_a            uuid not null references auth.users(id) on delete cascade,
  user_b            uuid not null references auth.users(id) on delete cascade,
  rhythm_days       integer not null default 0 check (rhythm_days >= 0),
  last_counted_date date,
  created_at        timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

alter table public.shared_rhythms enable row level security;

-- RLS: both sides may SELECT their shared rhythm; no INSERT/UPDATE policies —
-- writes are RPC-only (bump_shared_rhythms).
drop policy if exists "Shared rhythms readable by both sides" on public.shared_rhythms;
create policy "Shared rhythms readable by both sides" on public.shared_rhythms
for select using (auth.uid() in (user_a, user_b));

-- ---------------------------------------------------------------------
-- RPC: set_fair_opt_in (§0.4/§5.2 — "Hội chợ là opt-in riêng nữa")
-- Flips profiles.fair_opt_in and recomputes the summary in the SAME
-- transaction so the fair columns populate (enable) or clear (disable) at
-- once. Fair requires sharing: if the garden isn't shared, the opt-in is still
-- stored and takes effect when sharing turns on. Returns refresh_my_summary's
-- {"status":"ok","sharingEnabled":b} plus {"fairOptIn":b}.
-- ---------------------------------------------------------------------

create or replace function public.set_fair_opt_in(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;
  if p_enabled is null then
    raise exception using errcode = 'P0004', message = 'invalid-args';
  end if;

  update public.profiles set fair_opt_in = p_enabled where user_id = v_uid;

  return public.refresh_my_summary() || jsonb_build_object('fairOptIn', p_enabled);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: bump_shared_rhythms (§5.1)
-- Called after the caller's first tick of the day. For up to
-- SHARED_RHYTHM_MAX_PARTNERS (5) accepted friends (oldest friendships first),
-- counts a shared day D when BOTH tended on the shared date label D. Reads the
-- partner's habit_logs directly (SECURITY DEFINER, intentional RLS bypass) but
-- returns ONLY the rhythm counts — never the partner's data (§0.3). The
-- catch-up window (D and D-1 in the caller's local calendar) handles late
-- ticks and cross-timezone pairs; last_counted_date < D blocks a double count.
-- A day that does not qualify leaves the rhythm unchanged (rests, never
-- breaks). Returns {"status":"ok","advanced":N}.
-- ---------------------------------------------------------------------

create or replace function public.bump_shared_rhythms()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_my_tz text;
  v_my_today date;
  v_partner record;
  v_a uuid;
  v_b uuid;
  v_rhythm integer;
  v_last date;
  v_d date;
  v_advanced integer := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  select timezone into v_my_tz from public.profiles where user_id = v_uid;
  v_my_today := public.local_date_in(v_my_tz);

  for v_partner in
    select f.other_id
    from (
      select user_b as other_id, accepted_at, created_at
      from public.friendships
      where user_a = v_uid and status = 'accepted'
      union all
      select user_a as other_id, accepted_at, created_at
      from public.friendships
      where user_b = v_uid and status = 'accepted'
    ) f
    order by f.accepted_at nulls last, f.created_at
    limit 5
  loop
    v_a := least(v_uid, v_partner.other_id);
    v_b := greatest(v_uid, v_partner.other_id);

    insert into public.shared_rhythms (user_a, user_b)
    values (v_a, v_b)
    on conflict (user_a, user_b) do nothing;

    select rhythm_days, last_counted_date
    into v_rhythm, v_last
    from public.shared_rhythms
    where user_a = v_a and user_b = v_b
    for update;

    -- D-1 then D (ascending): a caught-up day is counted before today so
    -- last_counted_date advances correctly and a two-day catch-up is possible.
    foreach v_d in array array[v_my_today - 1, v_my_today]
    loop
      if (v_last is null or v_last < v_d)
        and exists (
          select 1 from public.habit_logs
          where user_id = v_uid and date = v_d and done
        )
        and exists (
          select 1 from public.habit_logs
          where user_id = v_partner.other_id and date = v_d and done
        )
      then
        v_rhythm := v_rhythm + 1;
        v_last := v_d;
        v_advanced := v_advanced + 1;
      end if;
    end loop;

    update public.shared_rhythms
    set rhythm_days = v_rhythm, last_counted_date = v_last
    where user_a = v_a and user_b = v_b;
  end loop;

  return jsonb_build_object('status', 'ok', 'advanced', v_advanced);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: get_shared_rhythms (§5.1)
-- The Nhịp Chung display source: accepted friends with a shared rhythm of at
-- least 1 day, ordered oldest-friendship first — NEVER by rhythm (no ranking).
-- A 0-day rhythm simply does not appear (positive/neutral only, not a miss
-- surface). Returns {"rhythms":[{otherUserId, displayName, avatarKind, rhythmDays}]}.
-- ---------------------------------------------------------------------

create or replace function public.get_shared_rhythms()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_rhythms jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'otherUserId', x.other_id,
      'displayName', p.display_name,
      'avatarKind', p.avatar_kind,
      'rhythmDays', x.rhythm_days
    ) order by x.accepted_at nulls last, x.created_at
  ), '[]'::jsonb) into v_rhythms
  from (
    select f.other_id, f.accepted_at, f.created_at, sr.rhythm_days
    from (
      select user_b as other_id, accepted_at, created_at
      from public.friendships
      where user_a = v_uid and status = 'accepted'
      union all
      select user_a as other_id, accepted_at, created_at
      from public.friendships
      where user_b = v_uid and status = 'accepted'
    ) f
    join public.shared_rhythms sr
      on sr.user_a = least(v_uid, f.other_id)
     and sr.user_b = greatest(v_uid, f.other_id)
    where sr.rhythm_days >= 1
  ) x
  join public.profiles p on p.user_id = x.other_id;

  return jsonb_build_object('rhythms', v_rhythms);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: get_garden_fair (§5.2)
-- The Hội chợ data source: my own fair entry (null if I'm not sharing+fair)
-- plus every accepted friend who is sharing AND in the fair (weekly_good_days
-- not null), ordered by friendship age (oldest first) — NEVER by score. Returns
-- the RAW weekly fields; the client derives decorations (self-verifying top-3
-- lantern read, bloom band >= 4, week-0 silence) purely + testably. Only
-- friends' identity + positive weekly counts cross — no streak/last-active.
-- Returns {"me": {...}|null, "gardens": [{...}]}.
-- ---------------------------------------------------------------------

create or replace function public.get_garden_fair()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_me jsonb;
  v_gardens jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not-authenticated';
  end if;

  select jsonb_build_object(
    'userId', ps.user_id,
    'displayName', pr.display_name,
    'avatarKind', pr.avatar_kind,
    'petSpecies', ps.pet_species,
    'weeklyGoodDays', ps.weekly_good_days,
    'weekStart', ps.week_start,
    'prevWeekGoodDays', ps.prev_week_good_days,
    'prevWeekStart', ps.prev_week_start
  ) into v_me
  from public.published_summaries ps
  join public.profiles pr on pr.user_id = ps.user_id
  where ps.user_id = v_uid and ps.weekly_good_days is not null;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'userId', g.other_id,
      'displayName', pr.display_name,
      'avatarKind', pr.avatar_kind,
      'petSpecies', ps.pet_species,
      'weeklyGoodDays', ps.weekly_good_days,
      'weekStart', ps.week_start,
      'prevWeekGoodDays', ps.prev_week_good_days,
      'prevWeekStart', ps.prev_week_start
    ) order by g.accepted_at nulls last, g.created_at
  ), '[]'::jsonb) into v_gardens
  from (
    select user_b as other_id, accepted_at, created_at
    from public.friendships
    where user_a = v_uid and status = 'accepted'
    union all
    select user_a as other_id, accepted_at, created_at
    from public.friendships
    where user_b = v_uid and status = 'accepted'
  ) g
  join public.published_summaries ps
    on ps.user_id = g.other_id and ps.weekly_good_days is not null
  join public.profiles pr on pr.user_id = g.other_id;

  return jsonb_build_object(
    'me', v_me,
    'gardens', v_gardens,
    'fairOptIn', coalesce((select fair_opt_in from public.profiles where user_id = v_uid), false)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Grants: all Phase 3 RPCs are for authenticated users only.
-- ---------------------------------------------------------------------

revoke execute on function public.set_fair_opt_in(boolean) from public, anon;
grant execute on function public.set_fair_opt_in(boolean) to authenticated;

revoke execute on function public.bump_shared_rhythms() from public, anon;
grant execute on function public.bump_shared_rhythms() to authenticated;

revoke execute on function public.get_shared_rhythms() from public, anon;
grant execute on function public.get_shared_rhythms() to authenticated;

revoke execute on function public.get_garden_fair() from public, anon;
grant execute on function public.get_garden_fair() to authenticated;


-- =====================================================================
-- ===== Security hardening (Supabase advisor 0011 / 0028 / 0029) =====
-- Idempotent. Pin search_path on helper + trigger functions, and revoke REST
-- execute on trigger-only functions (they still fire as triggers regardless of
-- grant). The app's RPCs stay authenticated-executable by design (each checks
-- auth.uid() internally). is_sharing keeps its authenticated grant — the
-- published_summaries friend-SELECT policy calls it under the querying role.
-- =====================================================================

alter function public.set_updated_at() set search_path = public;
alter function public.enforce_companion_no_decay() set search_path = public;
alter function public.safe_int(text, integer) set search_path = public;
alter function public.safe_date(text) set search_path = public;
alter function public.safe_ts(text) set search_path = public;
alter function public.jsonb_union_max(jsonb, jsonb, numeric, numeric) set search_path = public;
alter function public.jsonb_union_true(jsonb, jsonb) set search_path = public;
alter function public.jsonb_union_idset(jsonb, jsonb) set search_path = public;
alter function public.set_invite_code() set search_path = public;
alter function public.append_milestone(jsonb, text, text, date) set search_path = public;
alter function public.local_date_in(text) set search_path = public;
alter function public.validate_milestones() set search_path = public;
alter function public.pet_stage_rank(text) set search_path = public;

revoke execute on function public.profiles_propagate_summary() from public, anon, authenticated;
revoke execute on function public.validate_milestones() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.enforce_companion_no_decay() from public, anon, authenticated;
revoke execute on function public.set_invite_code() from public, anon, authenticated;
