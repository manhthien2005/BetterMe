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

-- Per-cell LWW upsert (spec §2.4): newer mutated_at wins; equal stamps -> tick
-- (done = true) wins. Stale writes are silently skipped, never overwrite.
create or replace function public.apply_habit_log(
  p_habit_key text, p_date date, p_done boolean, p_mutated_at timestamptz)
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
  insert into public.habit_logs as l (user_id, habit_id, date, done, mutated_at)
  values (auth.uid(), v_habit.id, p_date, p_done, coalesce(p_mutated_at, now()))
  on conflict (user_id, habit_id, date) do update
    set done = excluded.done, mutated_at = excluded.mutated_at
    where l.mutated_at < excluded.mutated_at
       or (l.mutated_at = excluded.mutated_at and excluded.done);
end;
$$;

-- LWW habit upsert. Returns jsonb {status}: 'inserted' | 'updated' |
-- 'stale-skipped' | 'tombstone-blocked' | 'name-collision' (+ server:{key,name}).
-- p_expect_create = true marks a client-side CREATE: an existing live row with
-- a different name is then a slug collision (two devices invented the same
-- key for different habits) — the client must re-key, never merge silently.
create or replace function public.upsert_habit(
  p_key text, p_name text, p_category text, p_max_score numeric, p_active boolean,
  p_description text, p_sort_order integer, p_client_ts timestamptz,
  p_expect_create boolean default false)
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
      (user_id, key, name, category, max_score, active, description, sort_order, client_updated_at)
    values
      (auth.uid(), p_key, p_name, coalesce(p_category, ''), coalesce(p_max_score, 1),
       coalesce(p_active, true), coalesce(p_description, ''), coalesce(p_sort_order, 0), v_ts);
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
        'deletedAt', h.deleted_at) order by h.sort_order)
      from public.habits h
      where h.user_id = auth.uid()), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'habitKey', h.key,
        'date', l.date,
        'done', l.done,
        'mutatedAt', l.mutated_at))
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
revoke execute on function public.apply_habit_log(text, date, boolean, timestamptz) from public, anon;
grant execute on function public.apply_habit_log(text, date, boolean, timestamptz) to authenticated;
revoke execute on function public.upsert_habit(text, text, text, numeric, boolean, text, integer, timestamptz, boolean) from public, anon;
grant execute on function public.upsert_habit(text, text, text, numeric, boolean, text, integer, timestamptz, boolean) to authenticated;
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

-- Invite code generator trigger (§3.1): re-rolls upper(encode(gen_random_bytes(8),'hex'))
-- until unique. The unique index above is the backstop for a rare race; the
-- re-roll loop makes a collision astronomically unlikely (64-bit space).
create or replace function public.set_invite_code()
returns trigger
language plpgsql
as $$
begin
  loop
    new.invite_code := upper(encode(gen_random_bytes(8), 'hex')); -- 16 hex, 64 bit
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
      v_code := upper(encode(gen_random_bytes(8), 'hex'));
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
