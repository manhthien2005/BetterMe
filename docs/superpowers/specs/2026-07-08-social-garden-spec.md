# Vườn Có Bạn (Social Garden) — Spec

> **Trạng thái: PROPOSED v2** — 2026-07-08, chưa build. Spec thiết kế cho lớp social:
> Supabase sync → kết bạn → thăm vườn → Nhịp Chung → Hội chợ vườn.
> Nguồn: quyết định của owner (2026-07-08) + 2 vòng research (Duolingo Friend Streak/Leagues,
> Finch Tree Town, Strava kudos, nghiên cứu leaderboard) + audit codebase as-built.
> **v2**: bản v1 đã qua adversarial review (3 lăng kính security / product / sync,
> 23 finding xác nhận) — mọi fix đã tích hợp; các quyết định "vì sao" giữ lại trong ghi chú.

## 0. Thay đổi định hướng & nguyên tắc bất biến

**Owner đã bỏ anti-goal "private, single-user"** trong `docs/product-spec.md` (§Explicitly out
of scope): app giờ hướng tới kết bạn kiểu Duolingo — thấy streak/pet/thành tựu của nhau, có
thi đua lành mạnh. Spec này là bản thiết kế cho hướng đó.

**KHÔNG bị bỏ** — 2 invariant vẫn đứng, và mở rộng sang social:

1. **Không guilt** (đang enforce bằng `pet-voice.test.ts`): mở rộng — không câu thoại/UI nào
   so sánh user *xuống dưới* ai. Test mới chặn thêm các cụm: "thua", "kém hơn", "xếp cuối",
   "bét", "sau X". Được phép: ăn mừng người khác ("Vườn của Lan đang nở hoa!"), không bao giờ
   "Sếp đang thua Lan".
2. **Không decay**: growth/bond chỉ tăng — trở thành **luật giải conflict khi sync** cho
   *reward state* (merge monotonic, §2.4) và được enforce cứng bằng Postgres trigger.
   Lưu ý phạm vi: no-decay áp cho reward state (growth/bond/ledger), **không** áp cho raw
   completions — untick là hành động hợp lệ của user và phải lan được sang mọi thiết bị (§2.4).

Nguyên tắc social bổ sung (rút từ research + review):

3. **Chỉ điều tích cực rời khỏi máy user — structural, không phải tonal**: bạn bè chỉ đọc
   được projection (`published_summaries`); projection **không chứa bất kỳ field nào cho phép
   suy ra ngày miss hoặc thời gian inactive** (không `last_good_date`, không `last_active`).
   Không bao giờ thấy habit nào tồn tại, ngày nào miss, ghi chú gì.
4. **Opt-in mọi tầng**: sync là opt-in; chia sẻ là opt-in riêng; Hội chợ là opt-in riêng nữa —
   và opt-in Hội chợ enforce ở **tầng ghi** (cột NULL khi tắt), không phải tầng render.
   Opt-out im lặng (xóa summary, bạn bè không được thông báo).
5. **Không ladder**: không bảng xếp hạng thứ tự, không tier, không demotion, và **không
   cutoff ẩn** — mọi vườn opt-in luôn được hiển thị, thứ tự hiển thị không bao giờ theo điểm.
6. **Social sống trong thế giới vườn**: mọi bề mặt là vườn/pet/Nếp — không phải bảng số liệu.
7. **Trung thực về trust model**: dữ liệu gốc (habit_logs, companions) là self-reported và
   owner-writable — bản chất của local-first sync. Server bảo đảm summary luôn *nhất quán với
   data gốc* và *trong khoảng hợp lệ* (RPC + CHECK), không thể upsert giá trị bịa trực tiếp;
   nhưng Hội chợ về bản chất vẫn dựa trên tin nhau giữa bạn thật — chấp nhận có chủ đích.

## 1. Tổng quan lộ trình

| Phase | Tên | Nội dung chính | Ước lượng | Ship độc lập được? |
|---|---|---|---|---|
| 0 | **Supabase sync** | Hybrid local-first, bảng `companions` + `companion_meta`, merge (monotonic + LWW), kinh tế food dạng ledger, importer + `seedCutoverDate` | 2.5–3 tuần (+1 tuần soak) | ✅ (multi-device) |
| 1 | **Danh tính & kết bạn** | `display_name`, `invite_code` 64-bit, `friendships`, `friend_request_attempts`, RPC kết bạn | 1 tuần | ✅ (chưa lộ data) |
| 2 | **Thăm vườn & cheers** | `published_summaries` (ghi qua RPC), `garden_visits`, tặng food qua gift-box, feed 72h | 1.5 tuần | ✅ |
| 3 | **Nhịp Chung & Hội chợ vườn** | `shared_rhythms`, Hội chợ tuần (metric "ngày có chăm") | 1–1.5 tuần | ✅ |
| 4 | **Quest nhóm** (DEFER) | `quests` + đóng góp nhóm, thưởng chung | +2 tuần | chỉ làm khi P0–3 chứng minh retention |

Tổng đến hết Phase 3: **~6.5–7 tuần part-time**. Gate cứng giữa các phase: Phase 0 phải soak
sạch ≥1 tuần (sync chạy, chưa ai nhìn thấy ai) trước khi Phase 1 bắt đầu.

## 2. Phase 0 — Supabase sync (blocker của mọi thứ)

### 2.1 Kiến trúc: hybrid local-first

localStorage (`betterme.dashboard.v2`) **vẫn là source of truth cho render** — UI không được
chậm đi một mili giây nào. Supabase trở thành bản sao bền + điểm hợp nhất đa thiết bị:

```
UI event → pure function (dashboard-data.ts, giữ nguyên) → setState
        → localStorage (đồng bộ, như hiện tại)
        → sync queue → server actions (nền, debounce ~2s, retry + backoff)

Login/hydrate: đọc localStorage → render ngay → fetch Supabase → merge (§2.4) → setState + ghi đè local
```

- **Sync queue**: mảng mutation tuần tự (`{kind, payload, clientTs}`) persist vào
  `betterme.syncqueue.v1` (sống sót reload khi offline). Flush khi online + sau mỗi mutation
  (debounce). Offline vô hạn vẫn dùng app bình thường.
- **Mutation phải SET-based, idempotent**: `toggleHabit` payload là
  `{habitId, date, done, clientTs}` (SET giá trị, không phải flip) — an toàn dưới retry.
- **Chính sách lỗi queue — không bao giờ head-of-line-block**: lỗi mạng/5xx → retry + backoff;
  lỗi vĩnh viễn (key không resolve được, habit đã tombstone, 4xx) → **drop khỏi queue + ghi
  log local**, các mutation phía sau đi tiếp.
- **Shadow map cho LWW**: sync boundary giữ `betterme.syncmeta.v1` trong localStorage:
  `{ [date]: { [habitId]: mutatedAtIso } }` (stamp từ `clientTs` của mutation cuối chạm ô đó).
  `DashboardState` và các pure function **không đổi shape** — metadata sống ngoài state.
- **Field timestamps cho client state** (persist trong `betterme.dashboard.v2`, được
  `migrateDashboardState` default `null` — null = epoch, luôn thua giá trị server đã stamp):
  `CompanionPetState.nameUpdatedAt`, `CompanionState.activeSpeciesUpdatedAt`.
- **Trạng thái sync** hiển thị kín đáo (chấm nhỏ footer card: ☁️ synced / ⏳ pending / ⚠️ lỗi).

### 2.2 Mapping state → bảng

| DashboardState | Bảng | Ghi chú |
|---|---|---|
| `habits[]` | `habits` (có sẵn + cột `deleted_at` mới) | Client id (`"english"`, `"custom_..."`) map vào `habits.key` (`unique(user_id,key)`); uuid ↔ key resolve ở sync boundary |
| `records[date].completions` | `habit_logs` (+ cột `mutated_at` mới) | Upsert SET-based với LWW guard (§2.4) |
| (chưa có UI) | `daily_entries` (có sẵn) | Không đụng trong phase này |
| `companion.pets[species]` | `companions` (MỚI) | Normalized theo loài — Phase 2 cần đọc species/stage/bond |
| `companion.{activeSpecies, food ledgers, gift}` | `companion_meta` (MỚI) | 1 row/user |
| `seedCutoverDate` (field MỚI, §2.5) | — | Provenance stamp, chỉ dùng cho importer |
| `events` | — | Seed/demo — **không sync**, giữ local |
| `bestStreakFloor` | — | Fiction (=26) — **không sync**; server-truth tính từ logs |

**Slug collision khi sync** (2 thiết bị cùng tạo `custom_doc-sach` cho 2 habit khác nhau):
insert conflict trên `unique(user_id,key)` mà `name` server ≠ `name` local → client **re-key
với suffix** (`custom_doc-sach_2`, tái dùng logic suffix có sẵn), rewrite key trong local
state + records + queue rồi retry. Không bao giờ merge im lặng 2 habit khác tên vào 1 row.

### 2.3 Schema mới

```sql
create table public.companions (
  user_id          uuid not null references auth.users(id) on delete cascade,
  species          text not null check (species in ('dog','cat')),
  name             text not null check (char_length(name) between 1 and 20),
  name_updated_at  timestamptz not null default now(),  -- client stamp từ clientTs lúc rename (KHÔNG dùng trigger set_updated_at)
  adopted_on       date not null,
  growth_days      integer not null default 0 check (growth_days between 0 and 4000),   -- trần sanity: 1/ngày × ~10 năm
  bond             integer not null default 0 check (bond between 0 and 200000),        -- trần sanity: ~50/ngày × ~10 năm
  last_growth_date date,
  pets_today       integer not null default 0,
  pets_today_date  date,
  reset_at         timestamptz,                          -- null = chưa từng reset (§2.4)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (user_id, species)
);

create table public.companion_meta (
  user_id                    uuid primary key references auth.users(id) on delete cascade,
  active_species             text check (active_species in ('dog','cat')),
  active_species_updated_at  timestamptz not null default now(),  -- client stamp từ clientTs lúc switch
  -- KINH TẾ FOOD = 2 LEDGER CHỈ-THÊM + 1 CARRYOVER; KHÔNG có cột food balance.
  -- food hiển thị = clamp(carryover + Σ granted + Σ gifts_received − Σ|spent_events|, 0, FOOD_CAP)
  food_granted_by_date       jsonb not null default '{}',  -- {date: n} — như client hiện tại, prune 30 ngày
  food_gifts_received        jsonb not null default '{}',  -- {"date:visit_id": 1} — union-merge, prune 30 ngày
  food_spent_events          jsonb not null default '{}',  -- {date: [event_uuid, ...]} — mỗi lần cho ăn / tặng quà = 1 uuid
  food_carryover             integer not null default 0 check (food_carryover between 0 and 21),
  gift_overflow_bond_by_date jsonb not null default '{}',  -- {date: n} — cap overflow-bond §4.2, prune 30 ngày
  all_done_bonus_dates       jsonb not null default '{}',
  last_seen_date             date,
  pending_gift               boolean not null default false,
  updated_at                 timestamptz not null default now()
);

-- habits: soft-delete cho tombstone merge (§2.4)
alter table public.habits add column deleted_at timestamptz;

-- habit_logs: LWW per-cell (§2.4)
alter table public.habit_logs add column mutated_at timestamptz not null default now();

-- RLS companions/companion_meta: auth.uid() = user_id, for all (giống 4 bảng hiện có)
-- + trigger set_updated_at như các bảng khác.
```

**Vì sao food là ledger, không phải counter**: cột `food` merge kiểu `max()` sẽ *hoàn lại mọi
lần tiêu* (replica cũ giữ số dư trước-khi-tiêu luôn thắng) → farm bond vô hạn bằng cách
feed rồi hydrate từ thiết bị stale. Hai counter monotonic (`earned`/`spent`) vẫn mất spend
khi 2 thiết bị cùng tiêu offline (max của spent nuốt mất một bên). Ledger sự kiện union-merge
là dạng duy nhất sống sót mọi thứ tự sync. Đây cũng chính là idiom sẵn có của client
(`foodGrantedByDate`).

**Prune ledger theo cặp**: khi prune một ngày quá 30 ngày, gộp *net* của ngày đó
(granted + gifts − spent) vào `food_carryover` (clamp 0..FOOD_CAP) rồi mới xóa — số dư
derive không đổi qua prune.

### 2.4 Luật merge (local ⊕ server khi hydrate)

| Field | Luật |
|---|---|
| `growth_days`, `bond` | `max(local, server)` — monotonic (trừ ngoại lệ reset bên dưới) |
| `last_growth_date`, `pets_today_date`, `last_seen_date` | max theo ngày |
| `food_granted_by_date`, `all_done_bonus_dates`, `gift_overflow_bond_by_date`, `food_gifts_received` | union key; value = max |
| `food_spent_events` | union key; value = **union của set uuid** |
| food hiển thị | **KHÔNG merge** — derive lại sau merge từ ledger (công thức §2.3) |
| `records[date].completions` | **LWW từng ô** (date, habitId): so `mutatedAt` (shadow map §2.1 vs `habit_logs.mutated_at`); bản mới hơn thắng — *kể cả untick*; bằng nhau → tick thắng |
| `habits[]` | union theo `key`; conflict field (name, category, …) → LWW theo `updated_at`; xóa qua **tombstone** (bên dưới) |
| `name` (pet), `active_species` | **LWW theo timestamp riêng của field** (`name_updated_at` / `active_species_updated_at`, stamp = clientTs lúc rename/switch); mới hơn thắng, hòa → server thắng. KHÔNG dùng `updated_at` row-level (bị bump bởi mọi sync write) |

Ghi chú phạm vi: **monotonic/no-decay áp dụng cho reward state** (growth/bond/ledger) —
**không áp dụng cho raw completions**: đó là dữ liệu user chỉnh được, untick phải lan sang
mọi thiết bị. Server-side, upsert `habit_logs` có guard `excluded.mutated_at >= mutated_at`
(stale write bị bỏ qua, không ghi đè).

**Tombstone habit**: client giữ `deletedHabits: {key, deletedAt}[]`; server dùng
`habits.deleted_at` (soft-delete). Merge: tombstone thắng mọi state cũ hơn `deletedAt`;
re-create cùng key *sau* `deletedAt` thắng tombstone (so timestamp). `removeHabitFromState`
phải đồng thời prune completions của key đó khỏi `records` và hủy mutation cùng key còn
trong queue (nếu không LWW-merge sẽ hồi sinh completions mồ côi).

**Trigger no-decay + đường reset có chủ đích** (không có nó thì giá trị bị inflate — do bug
hoặc nghịch tay — vĩnh viễn không gỡ được, và "nuôi lại từ đầu" là bất khả):

```sql
create or replace function public.enforce_companion_no_decay()
returns trigger language plpgsql as $$
begin
  if current_setting('betterme.companion_reset', true) is distinct from 'on' then
    if new.growth_days < old.growth_days or new.bond < old.bond then
      raise exception 'no-decay violation: growth_days/bond must be monotonic';
    end if;
  end if;
  return new;
end $$;

create trigger companions_no_decay before update on public.companions
for each row execute function public.enforce_companion_no_decay();
```

- RPC `reset_companion(p_species text)` (SECURITY DEFINER, `set search_path = public`,
  owner-invoked): `set_config('betterme.companion_reset','on', true)` (transaction-local) →
  zero `growth_days/bond/last_growth_date/pets_today` của (auth.uid(), p_species) + stamp
  `reset_at = now()`. **Đây là đường giảm duy nhất**; UPDATE trực tiếp vẫn bị trigger chặn.
- Luật merge đi kèm: nếu `reset_at` server **mới hơn lần sync cuối của client** → server
  thắng tuyệt đối cho pet đó (bỏ qua max()) — thiết bị stale không hồi sinh được giá trị
  trước-reset.

Test tích hợp phải cover: 2 thiết bị cùng tick offline rồi sync lệch giờ; cùng feed offline
cùng ngày; untick trên A lan sang B; đổi timezone; đồng hồ lệch ngày.

### 2.5 Importer & provenance seed data (bẫy lớn nhất)

`createInitialDashboardState` fabricate **45 ngày lịch sử giả** (`isSeedHabitComplete`) và
`bestStreakFloor = 26`. Import ngây thơ → fiction leak lên summary/Hội chợ → fake streak
giết chết niềm tin vào toàn bộ premise cozy.

**Provenance stamp (ship TRƯỚC Phase 0)**: field mới `seedCutoverDate` (ISO date) trên
`DashboardState` — `createInitialDashboardState(today)` set = `today`;
`migrateDashboardState` backfill cho state cũ = `min(adoptedOn sớm nhất của pets, ngày chạy
migration)`. **Records có `date <= seedCutoverDate` không bao giờ rời khỏi thiết bị.**
KHÔNG BAO GIỜ suy provenance từ *nội dung* completions — seed days user đã sửa tay và ngày
thật trùng pattern đều làm cách đó sai theo cả hai chiều.

**Onboarding sync** (modal 1 lần khi user bật sync — cả hai lựa chọn đều KHÔNG đụng dữ liệu
trên máy; modal nói rõ: *"Dữ liệu trên máy không bị đụng tới — đây chỉ là bản sao lên mây."*):

- Lựa chọn A — **"Vườn mây mới tinh 🌱"** (khuyến nghị, default): upload habits + companion
  (pet là thật — user đã nuôi thật) + records **từ hôm nay trở đi**.
  Copy: "Vườn trên mây bắt đầu từ hôm nay — mọi kỷ niệm trên máy vẫn nguyên vẹn 🌱".
  (Mốc "hôm nay" là mốc duy nhất chắc chắn sạch seed và luôn xác định — kể cả khi user
  chưa nuôi pet.)
- Lựa chọn B — **"Đem kỷ niệm lên mây ☁️"**: upload records có `date > seedCutoverDate`.
  Với state cũ mà backfill trùng ngày migration, B trùng với A — chấp nhận.
- `bestStreakFloor` không bao giờ upload; giá trị derive (streak, rhythm) server tính lại
  từ logs thật.

Gate Phase 0: xem §12.

## 3. Phase 1 — Danh tính & kết bạn

### 3.1 Mở rộng `profiles`

```sql
alter table public.profiles
  add column display_name    text not null default '' check (char_length(display_name) <= 30),
  add column avatar_kind     text not null default 'nep',   -- 'nep' | 'dog' | 'cat' (avatar = mascot/pet, không upload ảnh)
  add column invite_code     text unique,                    -- sinh bằng trigger bên dưới, 16 hex = 64 bit
  add column sharing_enabled boolean not null default false;

-- Sinh mã trong BEFORE INSERT trigger (không dùng column default): re-roll khi trùng;
-- unique constraint chỉ là backstop cho race cực hiếm.
create or replace function public.set_invite_code()
returns trigger language plpgsql as $$
begin
  loop
    new.invite_code := upper(encode(gen_random_bytes(8), 'hex'));   -- 16 hex, 64 bit
    exit when not exists (select 1 from public.profiles where invite_code = new.invite_code);
  end loop;
  return new;
end $$;

create trigger profiles_invite_code before insert on public.profiles
for each row when (new.invite_code is null)
execute function public.set_invite_code();

-- Migration backfill cho row có sẵn rồi khóa not null.
```

- **Add-by-invite-code**: UI card "Mã vườn của Sếp: `3F9A…C2D4` (16 ký tự) 📋 copy" + ô nhập
  mã của bạn. Không tìm bằng email/tên.
- **Múi giờ chuẩn của user**: cột `profiles.timezone` **có sẵn** (default
  `Asia/Ho_Chi_Minh`) trở thành canonical — capture từ thiết bị lúc bật sync, sửa được trong
  settings. **Mọi nhãn ngày social của user** (week_start, bucketing weekly_good_days,
  rollover "thứ Hai hiện tại") derive theo `profiles.timezone` của chính user đó, bất kể
  thiết bị đang ở múi giờ nào. Hai người lệch múi giờ so nhau theo *nhãn ngày local của mỗi
  người*, không theo một đồng hồ chung (§5.1).
- RLS `profiles` giữ nguyên private → mọi tra cứu chéo đi qua RPC.

### 3.2 Bảng `friendships` + bảng đếm rate limit

```sql
create table public.friendships (
  user_a       uuid not null references auth.users(id) on delete cascade,
  user_b       uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted')),
  requested_by uuid not null,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b),                      -- cặp canonical, không duplicate 2 chiều
  check (requested_by in (user_a, user_b))
);
-- RLS: SELECT/DELETE cho auth.uid() in (user_a, user_b). KHÔNG mở insert/update trực tiếp —
-- đi qua RPC security definer (enforce luật mà RLS không tả được).

create table public.friend_request_attempts (
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- KHÔNG mở policy RLS nào (mặc định deny) — chỉ RPC security definer ghi/đọc;
-- RPC tự prune row > 7 ngày.
```

### 3.3 RPC (security definer, `set search_path = public`)

| RPC | Luật enforce bên trong |
|---|---|
| `send_friend_request(code text)` | **Insert 1 row vào `friend_request_attempts` NGAY ĐẦU HÀM, trước khi tra mã** — code sai cũng tốn quota; rate limit `10 lượt/ngày` đếm trên bảng attempts (append-only → decline/unfriend xóa row `friendships` nhưng KHÔNG hoàn quota). Chống race: `pg_advisory_xact_lock` trên uid người gửi (quota) và trên cặp canonical (cap bạn). Tra `invite_code` sai → lỗi chung chung "Không tìm thấy vườn" (không phân biệt tồn tại/không); chặn tự kết bạn; duplicate đã bị PK chặn; cap `MAX_FRIENDS = 50`; thành công trả về `display_name` người nhận |
| `respond_friend_request(other uuid, accept boolean)` | Chỉ người **không phải** `requested_by` được accept; decline = delete row (im lặng) |

- **Unfriend = delete row, im lặng** (Finch model) — không notification.
- UI: bento card "Bạn vườn 🏡" — danh sách bạn (avatar + tên), lời mời đang chờ, ô nhập mã.
- Phase 1 ship xong: kết bạn được nhưng **chưa ai thấy data của ai** (chưa có summary).

## 4. Phase 2 — Thăm vườn & cheers

### 4.1 `published_summaries` — projection duy nhất bạn bè đọc được

```sql
create table public.published_summaries (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null check (char_length(display_name) <= 30),   -- denormalize từ profiles
  avatar_kind         text not null check (avatar_kind in ('nep','dog','cat')),
  rhythm_score        numeric(3,2) not null default 0 check (rhythm_score between 0 and 1),
  fair_opt_in         boolean not null default false,
  week_start          date not null,                    -- thứ Hai theo profiles.timezone của owner
  weekly_good_days    integer check (weekly_good_days between 0 and 7),   -- NULL khi fair_opt_in = false
  prev_week_start     date,
  prev_week_good_days integer check (prev_week_good_days between 0 and 7), -- NULL khi fair_opt_in = false
  pet_species         text check (pet_species in ('dog','cat')),
  pet_name            text check (pet_name is null or char_length(pet_name) between 1 and 20),
  pet_stage           text check (pet_stage is null or pet_stage in ('baby','kid','junior','teen','adult')),
  bond_tier           integer check (bond_tier is null or bond_tier between 1 and 5),
  milestones          jsonb not null default '[]'
    check (jsonb_typeof(milestones) = 'array' and jsonb_array_length(milestones) <= 10
           and pg_column_size(milestones) <= 2048),
  updated_at          timestamptz not null default now()
);
-- + trigger published_summaries_validate (BEFORE INSERT/UPDATE): mỗi phần tử milestones phải
--   là object đúng shape {id, kind, at}, kind in ('evolve','bond_tier','bloom_week','new_pet'),
--   char_length(id) <= 40, at là date hợp lệ. CHECK/trigger nằm ở DB vì client có JWT có thể
--   gọi PostgREST trực tiếp — không tin đường server action.
```

**RLS — điểm mấu chốt sau review**: owner chỉ có **SELECT + DELETE** (DELETE giữ cho opt-out
im lặng). **Không ai có INSERT/UPDATE trực tiếp.** Bạn bè: SELECT-only khi
`exists (friendship accepted)`. Mọi ghi đi qua RPC:

- **`refresh_my_summary(p_fair_opt_in boolean default null)`** (SECURITY DEFINER,
  `set search_path = public`) — **không nhận metric nào làm tham số**: tự recompute
  `weekly_good_days`/`prev_week_*`/`rhythm_score` từ `habit_logs`, derive
  `pet_species/pet_name/pet_stage/bond_tier` từ `companions` (đúng ngưỡng
  `PET_STAGE_THRESHOLDS`/`BOND_TIER_THRESHOLDS` as-built), copy `display_name/avatar_kind`
  từ `profiles`, thực hiện rollover thứ Hai (theo `profiles.timezone`), và **tự append
  milestones bằng cách diff với row trước** (client không bao giờ cung cấp nội dung
  milestone). `p_fair_opt_in` toggle tham gia Hội chợ.
  → Client có sửa lệnh gọi cũng chỉ ép server *tính lại từ data gốc* — không bịa số được
  (giới hạn trust model: xem §0.7).
- **Gọi khi nào**: server action gọi sau mỗi lượt flush sync queue (debounce chung).
- **`fair_opt_in` enforce ở tầng ghi**: RPC chỉ populate `weekly_good_days`/`prev_week_*`
  khi `fair_opt_in = true`; tắt → set cả 3 cột về NULL ngay. Bạn bè không bao giờ đọc được
  số ngày của người đã rời Hội chợ — cohort là data-level, không phải filter client.
- **Đổi tên/avatar**: `display_name`/`avatar_kind` không thuộc DashboardState nên không đi
  qua sync queue — server action cập nhật profile phải gọi `refresh_my_summary()` ngay.
  Backstop DB (cùng pattern trigger no-decay): trigger `profiles_propagate_summary`
  AFTER UPDATE OF display_name, avatar_kind → update summary *nếu row tồn tại* (không hồi
  sinh summary đã opt-out).
- **Opt-in/out**: row chỉ tồn tại khi `sharing_enabled = true`; tắt → xóa row.
- **Milestones** (server tự diff): evolve, lên bond tier, tuần nở hoa, adopt pet mới.
  Không bao giờ append điều tiêu cực. Giữ 10 cái gần nhất.
- **Render phía client**: `display_name`/`pet_name`/milestones là input owner kiểm soát
  nhưng *bạn bè* render → chỉ render dạng plain text (React text node); không bao giờ đưa
  vào `dangerouslySetInnerHTML`, SVG markup, hay notification HTML.

### 4.2 `garden_visits` — thăm, vuốt ve, tặng quà, cheer

```sql
create table public.garden_visits (
  id         uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references auth.users(id) on delete cascade,
  host_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('pet','gift','cheer')),
  payload    jsonb not null default '{}',   -- gift: {food:1}; cheer: {milestoneId, emoji}
  visit_date date not null,                 -- nhãn ngày theo timezone của VISITOR (RPC tính)
  applied_at timestamptz,                   -- gift: null = host chưa nhận (§4.2.1)
  created_at timestamptz not null default now(),
  check (visitor_id <> host_id)
);
-- Cap "1/ngày" enforce bằng CONSTRAINT, không phải đếm-rồi-insert:
create unique index garden_visits_one_gift_per_day
  on public.garden_visits (visitor_id, host_id, visit_date) where (kind = 'gift');
create unique index garden_visits_one_cheer_per_milestone
  on public.garden_visits (visitor_id, host_id, (payload->>'milestoneId')) where (kind = 'cheer');
-- RLS: SELECT cho auth.uid() in (visitor_id, host_id). INSERT/UPDATE chỉ qua RPC.
```

RPC `visit_garden(host uuid, action text, payload jsonb)` — yêu cầu friendship accepted +
host đang share. **Chống race**: mở đầu RPC lấy `pg_advisory_xact_lock` trên cặp
(visitor, host); các cap đếm-rồi-insert (pet 3/ngày) an toàn trong transaction; unique
index ở trên là lớp chặn thứ hai.

- **`gift`** — mô hình "gửi thư, không thò tay vào nhà người khác": RPC atomically
  (a) kiểm tra số dư visitor (derive từ ledger §2.3) ≥ 1 → append **1 uuid vào
  `food_spent_events`** của visitor; (b) insert row `garden_visits {food:1}`.
  **RPC KHÔNG ghi vào `companion_meta`/`companions` của host** — việc nhận diễn ra ở client
  host (§4.2.1). Visitor client mirror spend vào ledger local ngay khi RPC thành công.
- **`pet`** (vuốt ve pet nhà bạn): visit record + animation + thoại `guestPet` trong overlay
  (§7) — **không cộng bond** (bond là của riêng chủ; xem cap overflow bên dưới là kênh
  friend-bond *duy nhất*). Cap 3/bạn/ngày; quá cap → vẫn animation + thoại, không tạo record
  (mirror `PETTING_CAP_PER_DAY` as-built).
- **`cheer`**: RPC verify `milestoneId` **tồn tại trong milestones hiện tại của host** và
  emoji thuộc bộ cố định (🤗/✋/🍡). Cap 1/milestone (unique index).

### 4.2.1 Nhận quà — đường server → local-first duy nhất

Kiến trúc §2.1 chỉ có 2 chiều dữ liệu (client push, client hydrate) — nên quà của bạn phải
đi theo mô hình **hộp thư**: khi hydrate và khi app focus, host fetch `garden_visits` của
mình `where applied_at is null`:

- Mỗi row `gift`: apply như **một mutation local bình thường** qua pure function —
  ghi `food_gifts_received["date:visit_id"] = 1` (từ đó số dư tự +1);
  nếu số dư đang ở `FOOD_CAP` → thay bằng **bond +1, cap
  `GIFT_OVERFLOW_BOND_PER_DAY = 2`/ngày tổng cộng mọi bạn** (ledger
  `gift_overflow_bond_by_date`); nếu overflow cũng đầy → **row giữ nguyên
  `applied_at = null`, quà nằm chờ trong hộp** và tự apply vào ngày sau khi có chỗ —
  "quà không bao giờ mất trắng" theo đúng nghĩa đen.
- Sau khi apply: ack qua RPC `ack_garden_visits(ids uuid[])` (host-only, check ownership)
  set `applied_at = now()`. Exactly-once = at-least-once fetch + guard `applied_at` +
  key ledger idempotent (`date:visit_id`). Sau đó món quà đi theo sync queue như mọi
  mutation khác — luật merge/no-decay áp dụng nguyên vẹn.
- Cùng lượt fetch này cấp payload cho thoại `friendVisit` ("Sếp ơi, hôm qua Lan ghé thăm
  em đó! 🎁") — biến thể câu chọn theo `kind` các visit chưa seen: 🎁 chỉ xuất hiện khi có
  gift thật; visit chỉ pet/cheer dùng biến thể không quà.

Đây cũng là kênh friend-bond duy nhất và có trần: bạn bè chỉ có thể "đẩy" bond của chủ tối
đa +2/ngày qua overflow — không kênh social nào khác cộng bond.

### 4.3 UX trong thế giới vườn

- **Card "Vườn bạn bè"** (bento, cuối dashboard): hàng ô vườn nhỏ — mỗi ô = pet của bạn
  **đúng growth stage thật** (tái dùng `<Pet>` SVG, scale nhỏ) với mức nở hoa theo
  `rhythm_score`. Không có con số nào trên ô.
- **Tap để thăm**: overlay "sang vườn" kiểu Animal Crossing — pet chủ nhà chào theo tính
  cách (thoại `guestPet`/`guestGift`, §7), 3 nút: vuốt ve / tặng 1 🦴｜🐟 / về.
- **Feed khoảnh khắc** (trong cùng card): milestone của bạn bè + cheer 1 chạm. Chỉ có tin
  vui, và **2 luật structural cho người quay lại**:
  (a) feed lọc on-read, chỉ hiển thị milestone có `at` trong **72 giờ** gần nhất (schema
  vẫn giữ 10/bạn — chỉ lọc khi render) — vắng lâu không tích thành "bức tường mọi người
  đều giỏi";
  (b) khi `pendingGift = true` (§2.3), card chỉ render hàng ô vườn, feed thu gọn sau dòng
  "Mở quà [tên pet] để dành trước đã 🎁" cho tới khi user mở gift — cam kết "comeback-gift
  đón trước mọi bề mặt social" là cơ chế, không phải lời hứa.

## 5. Phase 3 — Nhịp Chung & Hội chợ vườn

### 5.1 Nhịp Chung (Friend Streak phiên bản Nếp — evidence +22%)

```sql
create table public.shared_rhythms (
  user_a            uuid not null,
  user_b            uuid not null,
  rhythm_days       integer not null default 0 check (rhythm_days >= 0),
  last_counted_date date,
  created_at        timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
-- RLS: SELECT cho 2 bên; ghi qua RPC.
```

- Ghép tối đa `SHARED_RHYTHM_MAX_PARTNERS = 5` bạn. Ngày `D` được đếm khi **cả hai** có
  ≥1 log `done=true` mang nhãn ngày `D` — nhãn tính theo **lịch local của riêng mỗi người**
  (`profiles.timezone`), không theo một đồng hồ chung.
- **Cách kiểm tra — không lộ miss-day**: `bump_shared_rhythms()` là SECURITY DEFINER — tự
  đọc trực tiếp `habit_logs` của partner *bên trong RPC* (bypass RLS có chủ đích, chỉ trả
  về kết quả đếm nhịp, không trả data). Summary **không** chứa `last_good_date` (§0.3).
- Gọi sau tick đầu ngày của mình; kiểm tra cho `D = hôm nay` **và `D − 1`** (cửa sổ catch-up
  1 ngày — xử lý ca "partner tick muộn sau khi mình đã sang ngày mới, hoặc 2 người lệch múi
  giờ"); `last_counted_date < D` chống đếm 2 lần.
- **Ngày không đếm được: nhịp NGHỈ, không đứt, không giảm.** UI chỉ render trạng thái
  dương hoặc trung tính: nhịp lớn lên → 2 pet nhảy cùng nhau; ngày nhịp chưa/không đếm →
  neutral-idle (mỗi pet trong vườn riêng, số `rhythm_days` đứng yên). **KHÔNG có frame
  "chờ nhau/vắng mặt" riêng** — bất kỳ visual nào chỉ xuất hiện khi có người nghỉ đều là
  miss-day surfacing (vi phạm invariant 2 dạng structural). Chấp nhận: partner đã tick tự
  suy ra được nhịp chưa tăng — inference là bản chất của mechanic, nhưng không render
  thành hình ảnh vắng mặt.

### 5.2 Hội chợ vườn cuối tuần (dạng "rank" được chọn)

- **Opt-in riêng** (`fair_opt_in`, enforce tầng ghi §4.1), chỉ bạn bè cùng opt-in.
- **Metric: `weekly_good_days` (0–7)** — ngày có ≥1 habit tick trong tuần (theo
  `profiles.timezone` của mỗi người). Công bằng (2 habit hay 12 habit đều cap 7/tuần),
  effort-based, chống farm bẩm sinh, chỉ đếm dương, và **server tự tính** (§4.1).
- **Render — rank-free & ổn định**:
  - **Mọi vườn opt-in luôn được hiển thị** — cap 10 chỉ áp cho viewport đầu (cuộn ngang xem
    phần còn lại). Thứ tự: theo `friendships.accepted_at` (bạn lâu nhất trước), **KHÔNG BAO
    GIỜ theo điểm**. Lồng đèn 🏮 và hoa 🌸 là trang trí trên danh sách ổn định, không bao
    giờ là bộ lọc; một vườn opt-in không thể biến mất vì điểm số (ngoại lệ duy nhất: luật
    im lặng tuần-0 bên dưới).
  - **Tôn vinh top**: tối đa 3 vườn điểm tuần trước cao nhất được treo 🏮 (tính on-read,
    không cron — đọc **tự-kiểm-chứng**: đặt `M₋₁` = thứ Hai tuần trước; nếu
    `week_start = M₋₁` (row chưa rollover vì user chưa ghi gì tuần này) → dùng
    `weekly_good_days`; nếu `prev_week_start = M₋₁` → dùng `prev_week_good_days`; mọi
    trường hợp khác (user vắng nhiều tuần, data cũ) → không có điểm tuần trước — vườn im
    lặng. Không bao giờ dùng `prev_week_good_days` mà không khớp `prev_week_start`).
    Voice: "Xoài hãnh diện ghê! Vườn mình có lồng đèn nè, gâu!!".
  - **Dải nở hoa**: mọi vườn đạt `weekly_good_days >= 4` đều nở hoa 🌸 — nhiều người thắng
    cùng lúc.
  - Vườn dưới dải: hiển thị y như bình thường — **không xám, không mờ, không hạng, không
    "còn X ngày nữa mới kịp"**.
- **Lồng đèn không decay**: hết tuần, lồng đèn cũ dọn vào **kệ kỷ niệm** của vườn (local),
  không bị "gỡ mất".
- **Tuần 0 good days**: Hội chợ im lặng tuyệt đối về vườn đó; hệ comeback-gift đón user
  quay lại (cơ chế §4.3b) — leaderboard không bao giờ là người chào họ.

### 5.3 Kill-switch (cam kết đo trước khi mở rộng)

Sau 4 tuần Hội chợ, theo dõi: (a) tỉ lệ opt-out; (b) retention D7/D28 của nhóm dưới-dải;
(c) **retention D7 của returning users** (vắng ≥7 ngày rồi quay lại) so với baseline trước
Phase 2. Nếu (b) xấu rõ rệt → tắt Hội chợ, giữ Phase 1–2. Nếu (c) xấu rõ rệt → feed mặc
định thu gọn vĩnh viễn (chỉ ô vườn), không cần tắt thăm vườn/cheers.

## 6. Phase 4 — Quest nhóm (DEFERRED)

"Cùng tưới vườn": nhóm bạn nhận goal tuần ("cùng nhau tưới 40 habit"), thắng → rương food
chung + 1 decor vườn; **thua → không có gì xảy ra** (Nếp: "Tuần sau vườn mình lại xanh mà").
Đối lập chủ đích với Habitica boss damage / Forest cây chết — 2 mechanic guilt-powered bị
cấm. Cần `quests` + `quest_contributions` + group membership → chỉ build khi Phase 0–3 có
số liệu retention tốt.

## 7. Voice & brand — bảng bổ sung

| Thêm | Chi tiết |
|---|---|
| PetEvent host-side | `friendVisit` (kể chuyện khách ghé — biến thể theo `kind`, 🎁 chỉ khi có gift thật), `fairLantern` (khoe lồng đèn), `sharedRhythm` (nhịp chung lớn lên) — 3 event × 2 loài × 3 tier × 3 câu = 54 câu VN |
| PetEvent guest-side | `guestPet` (pet nhà bạn phản ứng khi khách vuốt — Xoài tan chảy, Mochi giả vờ không quan tâm), `guestGift` (cảm ơn khi nhận quà) — key theo loài (khách không có bond tier với pet nhà người khác): 2 event × 2 loài × 3 câu = 12 câu VN |
| Nếp | Chủ trì Hội chợ trên card Vườn bạn bè (garden keeper — trở lại dashboard đúng vai trò brand) |
| Test mở rộng | `pet-voice.test.ts`: chặn thêm "thua/kém/xếp cuối/bét"; mọi câu social (kể cả guest-side) phải là ăn mừng hoặc trung tính |

Tổng: 66 câu thoại VN mới.

## 8. Bảo mật & riêng tư — tổng kết bề mặt

| Bảng | Owner | Bạn bè | Người lạ |
|---|---|---|---|
| `habits`, `habit_logs`, `daily_entries`, `profiles`, `companions`, `companion_meta` | full (RLS hiện có) | ∅ | ∅ |
| `published_summaries` | SELECT/DELETE; **ghi chỉ qua RPC `refresh_my_summary`** | SELECT (accepted + owner đang share; cột fair thêm điều kiện `fair_opt_in` ở tầng ghi) | ∅ |
| `friendships` | 2 bên: SELECT/DELETE | — | ∅ |
| `friend_request_attempts` | ∅ (default deny) | ∅ | ∅ |
| `garden_visits` | visitor+host: SELECT; host ack qua RPC | ghi qua RPC | ∅ |
| `shared_rhythms` | 2 bên: SELECT | ghi qua RPC | ∅ |

- Mọi INSERT/UPDATE xuyên-user + mọi ghi summary đi qua **RPC security definer** (rate
  limit, advisory lock chống race, luật nghiệp vụ); cap 1/ngày enforce bằng **unique
  index**, không phải đếm-rồi-insert.
- Invite code ngẫu nhiên **16 ký tự hex (64 bit)**; mọi lần tra mã — kể cả mã sai — đều
  trừ rate limit (bảng `friend_request_attempts`); lỗi tra trả thông điệp chung chung.
- `display_name`/`pet_name`/milestones do owner kiểm soát nhưng bạn bè render → client chỉ
  render plain text (React text node), không `dangerouslySetInnerHTML`/SVG markup/HTML.
- Không email, không tên thật bắt buộc, không ảnh upload (avatar = Nếp/pet).
- Xóa tài khoản: mọi bảng đều `on delete cascade` từ `auth.users`.

## 9. Rủi ro chính & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Import seed fiction lên social | `seedCutoverDate` provenance (§2.5) — record ≤ cutover không bao giờ rời máy; default "Vườn mây mới tinh"; `bestStreakFloor` không upload |
| Sync làm hỏng pet / hoàn lại food đã tiêu | Trigger no-decay + merge monotonic cho reward, **ledger sự kiện cho food** (spend không bao giờ bị replica cũ refund), LWW cho completions; soak 1 tuần trước khi ai thấy gì |
| Điểm Hội chợ bị giả mạo | Summary chỉ ghi được qua RPC recompute từ data gốc + CHECK constraints; **giới hạn trung thực**: data gốc vẫn self-reported (§0.7) — Hội chợ là trust giữa bạn thật |
| Visibility thành áp lực khi sa sút (bài học Strava) | Structural: projection không có `last_good_date`; miss không tồn tại trong data social; feed cap 72h + thu gọn sau `pendingGift` (§4.3); opt-out im lặng; returning-user D7 nằm trong kill-switch (§5.3) |
| Hội chợ demotivate nhóm ít cạnh tranh | Không đáy hiển thị, không cutoff ẩn (mọi vườn opt-in đều render, thứ tự theo `accepted_at`); metric cap 7 giữ khoảng cách nhỏ; opt-in tầng ghi; kill-switch §5.3 |
| Gaming metric | Cap 7 ngày/tuần bất kể số habit; server recompute; cohort là bạn thật; không giải thưởng đáng để bot |
| Scope creep solo-dev | Phase gates cứng; mỗi phase ship độc lập; không cron/edge function trong toàn thiết kế (rollover on-write + đọc tự-kiểm-chứng §5.2) |

## 10. Thay đổi tài liệu đi kèm

1. `docs/product-spec.md`: sửa §Explicitly out of scope — bỏ "Friend system / Group streaks /
   Social accountability"; thêm ghi chú amendment 2026-07-08 trỏ về spec này. Giữ nguyên:
   không public sharing (chỉ bạn bè), không referral/promotional.
2. `docs/architecture.md`: cập nhật extension path "published summaries" từ dự kiến → thiết
   kế cụ thể (spec này).
3. `supabase/schema.sql`: append schema §2.3, §3, §4, §5 theo từng phase (mỗi phase 1 migration).

## 11. Câu hỏi mở (cần owner chốt trước khi build)

1. **Ngưỡng nở hoa** Hội chợ: đề xuất `>= 4/7` ngày — anh muốn dễ hơn (3) hay giữ 4?
2. **Số lồng đèn**: top 3 hay chỉ top 1? (đề xuất top 3 — bớt tính "vô địch", thêm tính "hội")
3. **Nhịp Chung** có đếm ngày cả hai cùng nghỉ không? (đề xuất: không đếm, không phạt —
   chỉ ngày cả hai cùng chăm mới +1)
4. Phase 0 có làm luôn UI cho `daily_entries` (reflection) không, hay để tính năng
   "Chúc ngủ ngon" xử lý sau? (đề xuất: sau — giữ Phase 0 thuần sync)

## 12. Gates kiểm thử

**Phase 0**
- Unit merge: monotonic cho reward fields; **LWW per-cell cho completions** (untick trên A
  propagate sang B đã từng thấy tick; equal-timestamp → tick thắng); **per-field LWW** cho
  `name`/`active_species` (rename offline trên B không mất khi A sync tick).
- **Food ledger**: spend trên thiết bị A không bao giờ bị replica cũ ở B hoàn lại; 2 thiết
  bị cùng feed offline cùng ngày → tổng spend = tổng sự kiện, không mất, không refund;
  prune theo cặp giữ nguyên số dư derive.
- Integration 2-client (Playwright 2 context): tick A → sync → hydrate B → untick A → sync
  → hydrate B ⇒ B hiển thị untick và không re-infect server.
- Trigger no-decay: UPDATE giảm bond phải raise; vượt trần CHECK bị reject;
  `reset_companion` zero được row; thiết bị stale giữ giá trị pre-reset không hồi sinh
  được sau hydrate (merge tôn trọng `reset_at`).
- Tombstone: delete-vs-toggle 2 thiết bị (tombstone thắng, queue không kẹt); slug collision
  2 thiết bị (re-key, không interleave logs).
- Importer: không bao giờ upload record `date <= seedCutoverDate`; migration stamp đúng cho
  cả state mới lẫn cũ (backfill = min(adoptedOn, ngày migration)).
- typecheck/lint/build xanh; bộ test hiện có (37+) không đỏ.

**Phase 1**
- RPC: self-friend chặn; duplicate chặn; **rate limit 10/ngày đếm cả lần code sai;
  decline/unfriend không hoàn quota**; cap 50 bạn; chỉ người nhận được accept.
- `invite_code` trigger re-roll khi trùng (pre-insert mã trùng rồi tạo profile mới —
  không được fail).
- RLS: user C không thấy friendship của A–B.

**Phase 2**
- RLS matrix §8 (3 user thật trên Supabase local); **direct INSERT/UPDATE vào
  `published_summaries` với vai owner bị reject**; output `refresh_my_summary()` khớp
  fixture `habit_logs`/`companions`.
- Milestones/impersonation: upsert trực tiếp milestones sai shape/kind/quá 10/quá size,
  pet_name/display_name quá dài → reject; cheer với milestoneId không tồn tại → RPC reject.
- Gift: atomic dưới race (2 visitor cùng tặng 1 host; double-click); **gift gửi khi host
  offline/đang online thiết bị khác → sau hydrate host nhận đúng 1 lần** (không mất khi
  host push state sau đó; không double-apply khi reload trước ack); overflow-bond: 3 bạn
  cùng gift vào host full-food 1 ngày → bond chỉ +2, quà thứ 3 nằm chờ trong hộp
  (`applied_at` null), visitor vẫn bị trừ đúng 1 food, và quà tự apply ngày sau.
- Ping-pong gifting giữa 2 tài khoản là net-zero food.
- Đổi display_name khi đang share → bạn bè thấy tên mới không cần mutation habit; đổi khi
  đã opt-out → không tạo lại summary row.
- Cap pet 3/ngày và cheer 1/milestone giữ vững dưới gọi song song.

**Phase 3**
- Rollover tuần đúng theo `profiles.timezone` (test Asia/Ho_Chi_Minh + cặp lệch múi giờ
  VN/California: nhịp chung vẫn đếm ngày cả hai cùng chăm theo lịch riêng mỗi người; đổi
  timezone thiết bị không làm lệch tuần).
- Nhịp chung: không đếm 2 lần 1 ngày; cửa sổ catch-up D−1 hoạt động.
- Hội chợ đọc điểm tuần trước **tự-kiểm-chứng**: (a) row chưa rollover (last write Chủ
  nhật) vẫn tính đúng qua `weekly_good_days`; (b) row có `prev_week_start` cũ hơn M₋₁
  (vắng ≥2 tuần) không được treo lồng đèn.
- Cohort 15 vườn opt-in: cả 15 đều render, thứ tự không đổi khi điểm thay đổi.
- Tắt `fair_opt_in` → 3 cột fair về NULL; bạn bè vẫn SELECT được row (pet/rhythm/milestones)
  nhưng cột fair NULL.
- Voice tests mở rộng (no-guilt + no-comparison, cả guest-side) xanh.

---

## Amendment 2026-07-27 — U1c: hợp đồng sync mang habit model v3

Spec gốc (§2.2–§2.4) mô tả một ô log là **một boolean**. Habit model v3 (spec đại tu
UI/UX §5) làm điều đó không còn đủ: một ô còn có *số đọc được* — mấy ly, mấy phút,
những bước nào đã tick — và *giờ hoàn thành*. Bản sửa đổi này mở rộng hợp đồng theo
hướng **thuần cộng thêm**.

### Cái không đổi

`habit_logs.done` vẫn là boolean nguồn sự thật, do **client** tính bằng
`isEntryComplete` — chỉ client biết luật tracking của từng kiểu, server không suy diễn
"xong" từ `value` vì server không biết mục tiêu. Nhờ vậy `refresh_my_summary`
(§5.2, `weekly_good_days`) và vòng lặp `shared_rhythms` (§5.1) đọc `done` mà không phải
sửa một dòng nào.

### Cái thêm vào

| Bảng | Cột | Ghi chú |
|---|---|---|
| `habit_logs` | `value integer` | NULL = ghi bởi client trước U1c, hoặc schema cũ |
| `habit_logs` | `completed_at text` | `"HH:mm"` giờ **địa phương**; ngày đã nằm ở `date` |
| `habits` | `icon`, `tracking_type`, `target`, `unit`, `steps`, `repeat_days`, `times_of_day`, `scheduled_at`, `color`, `motivation`, `paused_at`, `archived_at` | định nghĩa v3 (§5.1 spec đại tu) |

`paused_at` / `archived_at` là `text` chứ không phải `date`: client so sánh chúng như
nhãn ISO thuần (`date >= habit.pausedAt`) và không bao giờ làm số học ngày phía server,
nên `text` giữ một giá trị hỏng ở mức vô hại thay vì biến nó thành lỗi 22007 —
tức là một mutation bị **drop vĩnh viễn**, và lần tạm dừng đó im lặng biến mất.

### LWW không đổi độ mịn

Vẫn **một stamp cho cả ô** (`mutated_at`) và **một stamp cho cả habit**
(`client_updated_at`). Bên nào thắng thì mang trọn cả cụm field sang — không có LWW
theo từng cột.

### Hai chiều đều chịu được đối phương ở schema cũ

- *App mới, DB cũ*: RPC thiếu tham số → PostgREST trả `PGRST202`; client xếp loại
  **retry**, không phải permanent, nên hàng đợi tự đẩy lại ngay khi chủ repo apply
  `schema.sql`. Không mất ghi nào.
- *DB cũ trả snapshot thiếu cột*: `value = null` ⇒ merge giữ đúng hành vi trước U1c —
  tick từ xa giữ lại giá trị giàu hơn ở máy này, không dập "8 ly" thành 1. Habit thiếu
  field v3 ⇒ parse ra đúng default mà `migrateHabitFields` vốn sẽ áp.

### Bẫy chữ ký hàm

`create or replace function` với danh sách tham số khác sẽ tạo **overload**, không thay
thế. Hai overload cùng tên + gọi bằng named argument (PostgREST luôn gọi thế) =
`42725 function is not unique`. Nên `apply_habit_log` và `upsert_habit` đều có
`drop function if exists <chữ ký cũ>` đứng ngay trước. Drop cũng xoá grant cũ, mà hàm
Postgres mặc định `EXECUTE` cho `PUBLIC` — nên chữ ký mới **bắt buộc** được
`revoke ... from public, anon` + `grant ... to authenticated` lại, nếu không hàm mới mở
cho `anon`. `tests/schema-contract.test.ts` canh cả hai điều này vì CI không có DB để
chạy SQL.

### Hai lỗ được vá cùng lúc (không có cột nào ở trên sẽ được ghi nếu thiếu)

1. `setEntry` chỉ enqueue khi **số habit xong trong ngày** đổi. Uống 3 → 4 ly của mục
   tiêu 8 không đổi con số đó, nên tiến độ dở dang **không bao giờ** rời máy. Điều kiện
   đúng là "ô log này có đổi không".
2. `pauseHabit`, `archiveHabit`, `moveHabit` **không enqueue gì cả**. Tạm dừng một thói
   quen trên điện thoại thì nó ở lại trên điện thoại. Nay cả ba đều đẩy upsert; đổi thứ
   tự đẩy **cả hai** habit đã hoán vị, vì gửi mỗi cái người dùng cầm sẽ để hàng xóm của
   nó giữ nguyên `sort_order` cũ trên server.

### Thứ tự triển khai (bắt buộc)

Apply `supabase/schema.sql` lên Supabase **trước**, deploy app sau. Làm ngược lại thì
app vẫn chạy và không mất dữ liệu (nhờ PGRST202-retry ở trên), nhưng sync đứng im cho
tới khi SQL được apply. SQL idempotent — chạy lại nhiều lần vẫn an toàn.

### Vẫn không bao giờ rời máy

`seedCutoverDate`, `bestStreakFloor`, `events` — chúng không có mutation kind nào (§2.5).
