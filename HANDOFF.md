# HANDOFF — Vườn Có Bạn (Social Garden)

> **Ngày bàn giao:** 2026-07-09 · **Trạng thái tree:** typecheck sạch, lint sạch, **167/167 test xanh**, build pass
> **Nhánh:** `main` · **Commit cuối:** `c919634`
> File này là điểm vào duy nhất cho người nhận bàn giao. Đọc từ trên xuống là đủ ngữ cảnh để làm tiếp.

---

## 1. Tóm tắt 30 giây

App: **Nếp's Garden** — habit tracker tiếng Việt, cozy, có pet nuôi được (Next.js 15 + React 19 + TS strict + Supabase, localStorage-first). Đang mở rộng thành **social layer kiểu Duolingo** theo spec đã qua adversarial review: `docs/superpowers/specs/2026-07-08-social-garden-spec.md` (nguồn chân lý — đọc §0 invariants trước khi viết bất kỳ dòng code nào).

- **Phase 0 (Supabase sync) + Phase 1 (kết bạn): ĐÃ SHIP** — commit, review, gates xanh.
- **Phase 2 (thăm vườn & cheers): CODE XONG NHƯNG CHƯA COMMIT** — vòng review xác nhận **23 defect chưa vá** (xem §4). Đây là việc tiếp theo cần làm.
- **Phase 3 (Nhịp Chung & Hội chợ): CHƯA BẮT ĐẦU.**
- **Chưa có bước nào chạy trên database thật** — toàn bộ `supabase/schema.sql` mới chỉ được review tay, chưa apply lên Supabase project nào (xem §5-D).

**2 invariant tuyệt đối, test-enforce, không thương lượng:**
1. **No-guilt**: không câu chữ/UI nào trách móc user hay so sánh họ *xuống dưới* ai (`pet-voice.test.ts` chặn cứng cả từ so sánh: "thua", "kém hơn", "xếp cuối"…).
2. **No-decay**: growth/bond của pet chỉ tăng (trigger Postgres enforce; đường giảm duy nhất là RPC `reset_companion`). KHÔNG áp cho completions — untick là hành động hợp lệ và phải sync được.

---

## 2. Đã ship (commit trên `main`)

| Commit | Nội dung | Gates lúc ship |
|---|---|---|
| `dd1e812` | **Docs**: spec social-garden v2 (đã qua 23-finding adversarial review), amendment `product-spec.md` (bỏ anti-goal private), cập nhật `architecture.md` extension path | — |
| `854744e` | **Phase 0 — Supabase sync**: bảng `companions`/`companion_meta` (kinh tế food = ledger chỉ-thêm + carryover, KHÔNG có cột số dư), tombstone habit, `habit_logs.mutated_at`, trigger no-decay, 7 RPC sync (LWW từng ô, merge monotonic, reset supremacy theo `serverTime` do server cấp), sync engine client (`src/lib/sync/` — queue coalescing, merge thuần theo bảng luật spec §2.4, importer với `seedCutoverDate`, backoff, không head-of-line-block), modal onboarding "Đưa vườn lên mây?", chấm trạng thái sync. **Đã qua 3 vòng review, 7 defect thật được vá trước khi commit.** | typecheck/lint/**121 test**/build |
| `85b537f` | **Voice packs social**: 66 câu VN mới — host-side `friendVisit`/`fairLantern`/`sharedRhythm` (2 loài × 3 tier × 3 câu), guest-side `guestPet`/`guestGift` qua export mới `getGuestLine(species, event)` (khách không có bond tier). Test mở rộng chặn từ so sánh xuống trên MỌI pool. | 11 test voice xanh |
| `c919634` | **Phase 1 — Danh tính & kết bạn**: `profiles` + display_name/avatar_kind/invite_code (64-bit, trigger re-roll)/sharing_enabled; bảng `friendships` (cặp canonical `user_a < user_b`, RLS SELECT+DELETE cho 2 bên, ghi chỉ qua RPC) + `friend_request_attempts` (RLS default-deny); 4 RPC: `send_friend_request` (đốt quota TRƯỚC khi tra mã, 10 lượt/24h, advisory lock, cap 50 bạn, lỗi chung chung không lộ mã tồn tại), `respond_friend_request` (chỉ người nhận), `get_friends_overview`, `update_my_profile`; server actions `social-actions.ts`; card **"Bạn vườn 🏡"** (copy mã 4-4-4-4, thêm bạn với 8 status copy cozy, pending accept/decline, unfriend im lặng có confirm mềm). Phase 1 boundary giữ đúng: **chưa ai thấy data của ai**. Review: 0 defect. | typecheck/lint/**122 test**/build |

---

## 3. Đang dở — Phase 2 (thăm vườn & cheers), CHƯA COMMIT

Toàn bộ code Phase 2 nằm ở **working tree** (uncommitted, ~+1500 dòng):

| File | Trạng thái |
|---|---|
| `supabase/schema.sql` (+814 dòng, banner "Social Garden Phase 2") | `published_summaries` + `garden_visits` + 4 RPC (`refresh_my_summary`, `visit_garden`, `ack_garden_visits`, `get_my_garden_feed`) — **có 23 defect cần vá, xem §4** |
| `src/lib/server/social-actions.ts` (+344) | 6 action mới: `refreshMySummary`, `visitGarden`, `ackGardenVisits`, `getMyGardenFeed`, `getFriendSummary`, `getPendingGardenVisits` |
| `src/lib/types.ts` (+59) | Row types + RPC signatures Phase 2 |
| `src/components/dashboard/garden-visit-overlay.tsx` (+test, MỚI) | Overlay thăm vườn: pet bạn qua `<Pet>` SVG, milestone chips, vuốt ve/tặng food/cheer |
| `src/components/dashboard/dashboard-data.ts` | Thêm pure function `applyGiftToState` (hộp thư quà, spec §4.2.1) + `GIFT_OVERFLOW_BOND_PER_DAY=2` |
| `src/components/dashboard/dashboard-client.tsx` | Mailbox delivery sau sync hydrate → ack → toast tập thể; mount overlay |
| `src/components/dashboard/friends-card.tsx` (+108, +test MỚI) | Nút "Thăm vườn" mỗi bạn, feed thì thầm 72h, hook `refreshMySummary` khi đổi tên/avatar |
| `src/lib/server/social-actions.test.ts` (MỚI) | Test parsing actions |

Suite hiện tại **xanh 167/167** — các defect §4 là *sai-so-với-spec* (đa số trong SQL, không có test chạy được trên DB), không phải lỗi compile/test.

---

## 4. VIỆC TIẾP THEO #1 — Vá 23 defect Phase 2 đã xác nhận

**Chi tiết đầy đủ từng defect (detail + suggested fix + refined fix đã verify):**
`docs/superpowers/specs/2026-07-09-phase2-review-findings.md`

23 finding từ 2 lăng kính có trùng lặp — gom lại thành **13 việc thực**, theo file:

### 4a. `supabase/schema.sql` — phần Phase 2 (nặng nhất, gần như viết lại projection)

1. **[blocker] Bỏ `last_refreshed`, `current_streak`, `best_streak` khỏi `published_summaries`** (hoặc chuyển sang cột không-friend-readable). Vi phạm invariant §0.3: friend đọc được = suy ra được ngày miss/last-active. Spec §4.1 chỉ cho phép: `rhythm_score`, cột fair (NULL khi tắt), pet fields, milestones. Làm đúng theo danh sách cột của spec §4.1.
2. **[blocker] Milestones phải do server tự diff** trong `refresh_my_summary` (so sánh row trước với state mới → tự append evolve/bond-tier/bloom/new-pet), **không copy từ `profiles.milestones` client ghi**. Xóa cột `profiles.milestones` (đi ngược spec §4.1: "client không bao giờ cung cấp nội dung milestone").
3. **[blocker] `garden_visits` thiếu cột `kind`** (`'pet'|'gift'|'cheer'` như spec §4.2). Sửa 2 unique index theo spec: gift = `(visitor_id, host_id, visit_date) where kind='gift'` (không filter `applied_at`); cheer = `(visitor_id, host_id, milestone_id) where kind='cheer'` (per-visitor — hiện tại chỉ friend ĐẦU TIÊN cheer được mỗi milestone). Hiện trạng: mọi hành động thứ 2 trong ngày với 1 bạn bị unique-violation, còn sau khi ack thì gift không giới hạn.
4. **[blocker] Food-balance check trong `visit_garden` sai công thức** — chỉ đếm ledger HÔM NAY, bỏ qua `food_carryover` + các ngày trước. Dùng đúng công thức spec §2.3: `clamp(carryover + Σ granted + Σ gifts − Σ |spent|, 0, 21)`.
5. **[blocker] Không có đường ghi `sharing_enabled`** → mọi vườn đóng vĩnh viễn. Thêm tham số vào `update_my_profile` (hoặc RPC riêng) + UI toggle; khi tắt → xóa row summary ngay trong RPC.
6. **[major] Opt-out phải structural**: policy SELECT của bạn bè trên `published_summaries` phải thêm điều kiện `sharing_enabled` (join profiles) hoặc bảo đảm row bị xóa ngay khi tắt (trigger backstop trên profiles per spec §4.1). Thêm owner SELECT/DELETE policy (spec §4.1: owner có SELECT + DELETE để opt-out im lặng).
7. **[major] `visit_garden` ghi `companion_meta` của visitor mà không lấy advisory lock `betterme.companion:<uid>`** → race với `merge_companion_state` hoàn lại spend. Lấy cùng lock.
8. **[major] Pet cap 3/ngày đếm sai**: hiện đếm mọi kind, mọi host, và reset khi ack. Sửa: đếm theo `(visitor, host, ngày, kind='pet')`, không phụ thuộc `applied_at`.
9. **[minor] Check `sharing`/profile NULL-unsafe** (`if not v_host_sharing` pass khi host không có profiles row); `refresh_my_summary` cũng publish khi lookup profile rỗng — thêm guard `found`.
10. **[minor] Stage/bond-tier phải dùng đúng ngưỡng as-built** (`PET_STAGE_THRESHOLDS` 0/5/15/30/50 → baby/kid/junior/teen/adult; `BOND_TIER_THRESHOLDS` 0/60/180/420/840 → tier 1-5) — SQL hiện bịa scale riêng ('puppy'/'kitten'/'sprout'/'bloom'/'fruit') và mèo 7–29 ngày bị kẹt 'kitten'. Đồng bộ vocabulary với client (`dashboard-data.ts`).
11. **[minor] `visit_date` phải theo timezone của visitor** (`profiles.timezone`), không phải `current_date` UTC của server (spec §4.2).

### 4b. TypeScript client/server

12. **[major] Overlay dùng sai voice**: pet chủ nhà chào khách bằng câu `idle` owner-facing keyed theo bond tier CỦA KHÁCH. Đổi sang `getGuestLine(hostSpecies, 'guestPet')` / `'guestGift'` (đã có sẵn trong `pet-voice.ts` từ commit `85b537f`).
13. **[minor] Mailbox**: toast tập thể lặp lại mỗi lần mount khi có visit kẹt (chưa apply được); visit không-quà không phát thoại `friendVisit`. Dedupe theo visit_id đã thấy + dùng biến thể thoại không-quà (spec §4.2.1: 🎁 chỉ khi có gift thật).

Sau khi vá: cập nhật test (garden-visit-overlay.test.tsx, social-actions.test.ts, thêm test cho index/RPC nếu có môi trường DB) → chạy đủ 4 gate → **commit Phase 2**.

> Task list nội bộ đang track việc này: #7 (schema.sql), #8 (TS + voice), #9 (tests + gates).

---

## 5. Việc tiếp theo #2 trở đi (theo thứ tự)

- **B. Commit Phase 2** sau khi §4 xong + gates xanh (`pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`).
- **C. Build Phase 3 — Nhịp Chung & Hội chợ vườn** (chưa bắt đầu). Theo spec §5 + gates §12 Phase 3:
  - SQL: bảng `shared_rhythms` (cặp canonical, `rhythm_days` chỉ tăng, RLS SELECT 2 bên, ghi qua RPC) + RPC `bump_shared_rhythms()` (SECURITY DEFINER, đọc habit_logs partner trong RPC — KHÔNG lộ ra ngoài, cửa sổ catch-up D−1, `last_counted_date` chống đếm 2 lần, nhãn ngày theo `profiles.timezone` của TỪNG người, tối đa 5 partner).
  - Hội chợ: metric `weekly_good_days` 0–7 do `refresh_my_summary` tự tính (cột fair NULL khi `fair_opt_in=false` — enforce tầng ghi); render mọi vườn opt-in, thứ tự theo `friendships.accepted_at` KHÔNG BAO GIỜ theo điểm; lồng đèn top-3 đọc tự-kiểm-chứng (`week_start`/`prev_week_start` khớp M₋₁ mới tính); dải nở hoa ≥4/7; tuần 0-good-days = im lặng tuyệt đối.
  - Voice `fairLantern`/`sharedRhythm` đã có sẵn — chỉ cần wire.
  - **4 quyết định §11 đã được chốt theo phương án đề xuất trong spec** (owner ủy quyền 2026-07-09): nở hoa ≥4/7 · lồng đèn top-3 · Nhịp Chung KHÔNG đếm ngày cả hai cùng nghỉ · reflection (`daily_entries` UI) để sau.
- **D. Apply schema lên Supabase thật**: chạy TOÀN BỘ `supabase/schema.sql` trong SQL editor của project (file idempotent, chạy lại an toàn). Chú ý: đến khi làm bước này, mọi RPC/RLS chỉ tồn tại trên giấy. Cần set env `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` để client hoạt động.
- **E. Test trên DB thật theo §12** (chưa làm được vì môi trường này không có Postgres/supabase CLI): RLS matrix 3 user (§8), race tests (2 visitor cùng tặng, double-click), rate-limit đếm cả mã sai, invite-code re-roll, trigger no-decay + `reset_companion`, RPC merge 2 thiết bị. Khuyến nghị: `supabase start` (docker) + bộ test pgTAP hoặc script SQL tay.
- **F. Soak Phase 0 ≥1 tuần** (gate cứng spec §1): bật sync cho chính owner dùng đa thiết bị 1 tuần, xem log lỗi, RỒI mới mở Phase 1+ cho user thật.
- **G. Follow-ups đã ghi nhận, làm sau được**:
  - Multi-tab: 2 tab cùng flush có thể mất mutation trong queue (xác suất thấp, tự-lành) — thêm `storage` event listener nếu cần.
  - `update_my_profile` chưa gọi `refresh_my_summary` (spec §4.1) — hiện client tự gọi; chuyển vào RPC khi vá §4a-5.
  - Lọc ledger companion theo `seedCutoverDate` khi upload (tightening tùy chọn — ledger chỉ chứa hành động thật nên không phải lỗ hổng fiction).
  - Playwright 2-context integration test (§12 Phase 0) — chưa có.
  - Kill-switch metrics Hội chợ (spec §5.3) — cần đo sau 4 tuần chạy thật.

---

## 6. Môi trường & lệnh

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
pnpm vitest run  # 167 tests / 13 files (hiện tại)
pnpm build       # next build
pnpm dev         # next dev
```

- **Dev bypass đăng nhập**: env `BETTERME_DEV_AUTH_BYPASS` phải là chuỗi `"true"` (số `1` không ăn). Khi bypass: sync/social tắt hoàn toàn, dashboard chạy localStorage thuần — đây là hành vi đúng, không phải bug.
- **localStorage keys**: state `betterme.dashboard.v2` (v1 chỉ đọc, migration tự chạy) · queue `betterme.syncqueue.v1` · shadow LWW `betterme.syncmeta.v1` · watermark `betterme.synclast.v1` · opt-in `betterme.syncoptin.v1` (`'fresh'|'memories'`) · hoãn hỏi `betterme.syncask.v1`.
- JSDOM không có `window.matchMedia` — guard trước khi dùng (đã có pattern trong `pet.tsx`).

## 7. Bản đồ file quan trọng

| Vùng | File |
|---|---|
| Spec (NGUỒN CHÂN LÝ) | `docs/superpowers/specs/2026-07-08-social-garden-spec.md` |
| Findings Phase 2 chưa vá | `docs/superpowers/specs/2026-07-09-phase2-review-findings.md` |
| Pet system as-built | `docs/superpowers/specs/2026-07-07-pet-companion-spec.md` |
| Schema + toàn bộ RPC | `supabase/schema.sql` (4 banner section: gốc / Phase 0 / Phase 1 / Phase 2) |
| State thuần (pure functions, kinh tế) | `src/components/dashboard/dashboard-data.ts` (+ test) |
| Sync engine | `src/lib/sync/{types,time,storage,queue,shadow,merge,importer,engine}.ts` (+ tests) |
| Server actions | `src/lib/server/sync-actions.ts`, `src/lib/server/social-actions.ts` |
| UI dashboard | `src/components/dashboard/{dashboard-client,friends-card,garden-visit-overlay,sync-onboarding,pet,pet-voice,nep}.tsx` |
| Voice + invariant tests | `src/components/dashboard/pet-voice.ts` + `pet-voice.test.ts` |

## 8. Rủi ro / giới hạn đã biết (chấp nhận có chủ đích — đừng "sửa" nhầm)

- **Trust model (spec §0.7)**: data gốc là self-reported + owner-writable (bản chất local-first). Server bảo đảm summary *nhất quán với data gốc*, không chống được user tự tick láo — Hội chợ là trò chơi giữa bạn thật.
- **LWW tin đồng hồ client** cho name/species/log cells — thiết kế được spec chấp nhận; watermark reset đã chuyển sang server-time.
- **Ledger imprecision có trần**: 2 replica lệch nhau >30 ngày có thể đếm đôi net của 1 ngày đã prune (clamp bởi FOOD_CAP=21; spend không bao giờ mất — nằm trong union set).
- **`CompanionState.food` là derived cache** — mọi code đụng ledger ngoài các pure function phải gọi lại `deriveFoodBalance`; KHÔNG BAO GIỜ merge field này.
- **`bestStreakFloor` (=26) và `events` là seed fiction** — không bao giờ upload; records `date <= seedCutoverDate` không bao giờ rời máy.
