# HANDOFF — Vườn Có Bạn (Social Garden)

> **Ngày bàn giao:** 2026-07-09, bản cập nhật lần 2 (chiều) · **Trạng thái tree:** typecheck sạch, **167/167 test xanh**
> **Nhánh:** `main` · **Commit docs cuối:** `1f41a03` · Code Phase 2 nằm ở **working tree, CHƯA commit**
> File này là điểm vào duy nhất cho người nhận bàn giao. Đọc từ trên xuống là đủ ngữ cảnh để làm tiếp.
>
> **Thay đổi so với bản sáng:** toàn bộ **fix phía SQL (11/13) đã vá xong** trong working tree
> (`supabase/schema.sql`). Việc còn lại của Phase 2 là **phía TypeScript** — §4b có contract
> chính xác từng file để làm tiếp không cần đoán — rồi test → 4 gate → commit.

---

## 1. Tóm tắt 30 giây

App: **Nếp's Garden** — habit tracker tiếng Việt, cozy, có pet nuôi được (Next.js 15 + React 19 + TS strict + Supabase, localStorage-first). Đang mở rộng thành **social layer kiểu Duolingo** theo spec đã qua adversarial review: `docs/superpowers/specs/2026-07-08-social-garden-spec.md` (nguồn chân lý — đọc §0 invariants trước khi viết bất kỳ dòng code nào).

- **Phase 0 (Supabase sync) + Phase 1 (kết bạn): ĐÃ SHIP** — commit, review, gates xanh.
- **Phase 2 (thăm vườn & cheers): CHƯA COMMIT.** Vòng review xác nhận 23 defect; **phần SQL đã vá xong** (working tree), **phần TypeScript còn lại** — xem §4. Đây là việc tiếp theo cần làm.
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
| `supabase/schema.sql` (banner "Social Garden Phase 2", ~900 dòng) | `published_summaries` + `garden_visits` + RPC `refresh_my_summary` / `set_sharing_enabled` / `visit_garden` / `ack_garden_visits` / `get_my_garden_feed` + helper `local_date_in`/`is_sharing`/`append_milestone`/`pet_stage_rank` — **ĐÃ VÁ XONG toàn bộ defect SQL, xem §4a** |
| `src/lib/server/social-actions.ts` (+344) | 6 action: `refreshMySummary`, `visitGarden`, `ackGardenVisits`, `getMyGardenFeed`, `getFriendSummary`, `getPendingGardenVisits` — **CHƯA vá theo contract mới, xem §4b-A** (đang select cột đã drop → sẽ vỡ runtime trên schema mới) |
| `src/lib/types.ts` (+59) | Row types + RPC signatures Phase 2 — **cần cập nhật theo §4b-B** |
| `src/components/dashboard/garden-visit-overlay.tsx` (+test, MỚI) | Overlay thăm vườn: pet bạn qua `<Pet>` SVG, milestone chips, vuốt ve/tặng food/cheer — **cần vá theo §4b-D** |
| `src/components/dashboard/dashboard-data.ts` | Pure function `applyGiftToState` (hộp thư quà, spec §4.2.1) + `GIFT_OVERFLOW_BOND_PER_DAY=2` — OK, không cần sửa |
| `src/components/dashboard/dashboard-client.tsx` | Mailbox delivery sau sync hydrate → ack → toast tập thể; mount overlay — **cần vá theo §4b-E** |
| `src/components/dashboard/friends-card.tsx` (+108, +test MỚI) | Nút "Thăm vườn" mỗi bạn, feed 72h, hook `refreshMySummary` — **cần thêm toggle sharing, §4b-F** |
| `src/components/dashboard/pet-voice.ts` (+test, đã ship `85b537f`) | **Cần mở rộng theo §4b-C**: event `guestGreeting` + tách `friendVisit`/`friendVisitGift` |
| `src/lib/server/social-actions.test.ts` (MỚI) | Test parsing actions — cập nhật cùng §4b |

Suite hiện tại **xanh 167/167** — các defect còn lại là *sai-so-với-spec/contract* phía TS, đa số chưa có test chạy được trên DB, không phải lỗi compile/test. LƯU Ý: sau khi vá §4b-A, suite/typecheck sẽ ép các file phụ thuộc cập nhật theo — đó là chủ đích.

---

## 4. VIỆC TIẾP THEO #1 — Hoàn tất vá Phase 2 (SQL xong, TS còn lại)

**Bối cảnh:** vòng review xác nhận 23 defect (chi tiết + refined fix đã verify từng cái:
`docs/superpowers/specs/2026-07-09-phase2-review-findings.md`), gom thành 13 việc.
**11 việc phía SQL đã vá xong trong working tree.** Còn lại phía TypeScript.

### 4a. `supabase/schema.sql` — ✅ ĐÃ VÁ XONG (working tree, chưa commit)

Những gì đã đổi (đây đồng thời là **contract mới mà phía TS phải theo**):

1. **`published_summaries` viết lại theo §4.1** — cột giờ chỉ còn: `user_id, display_name, pet_name, pet_species, pet_stage, pet_bond_tier, milestones`. Đã DROP `current_streak`/`best_streak`/`last_refreshed` (kèm migration idempotent cho DB đã provision). KHÔNG còn field nào suy ra được miss-day/last-active (§0.3).
2. **Vocab as-built**: `pet_stage in ('baby','kid','junior','teen','adult')` (ngưỡng 0/5/15/30/50 growth days), `pet_bond_tier integer 1–5` (ngưỡng 0/60/180/420/840). Khớp `PET_STAGE_THRESHOLDS`/`BOND_TIER_THRESHOLDS` trong `dashboard-data.ts` — giữ lockstep khi đổi ngưỡng.
3. **Milestones server-diff** (`refresh_my_summary` tự so với row đã publish trước): shape `{id, kind, at, detail?}`, `kind in ('evolve','bond_tier','bloom_week','new_pet')`, **id deterministic = `kind || ':' || detail`** (cheer uniqueness + client cheered-state key theo id này), KHÔNG có free text, giữ 10 cái gần nhất, append-only. Cột `profiles.milestones` đã bị DROP. `bloom_week` để dành Phase 3.
4. **Opt-out structural**: owner có SELECT + DELETE policy trên `published_summaries`; policy SELECT của bạn bè check thêm `is_sharing()` (SECURITY DEFINER helper — subquery thẳng vào profiles sẽ chết vì RLS); trigger `profiles_propagate_summary` (AFTER UPDATE display_name/avatar_kind/sharing_enabled): tắt sharing → xóa row ngay cả khi PATCH thẳng PostgREST, đổi tên → update-if-exists (không hồi sinh row đã opt-out).
5. **RPC mới `set_sharing_enabled(p_enabled boolean)`** → update profiles + gọi `refresh_my_summary()` cùng transaction (bật = publish ngay, tắt = xóa im lặng). Đã revoke public/anon + grant authenticated. **Phía TS chưa có action gọi nó** (§4b-A).
6. **`garden_visits`**: RLS SELECT giờ **HOST-only** (visitor đọc được `applied_at` = biết host online lúc nào — leak §0.3). Gift index = `(host, visitor, visit_date) where gifted_food = 1` (KHÔNG filter applied_at — ack không mở lại cap); cheer index = `(visitor, host, cheered_milestone_id)` per-visitor. Kind phân biệt bằng `gifted_food`/`cheered_milestone_id`, không có cột `kind` riêng (tương đương ngữ nghĩa spec §4.2).
7. **`visit_garden` viết lại**: mọi nhãn ngày theo **timezone của VISITOR** (helper `local_date_in(tz)`, degrade an toàn khi tz rác/thiếu profiles row); check sharing fail-closed (`is distinct from true`); pet cap = 3/(visitor, host)/ngày, chỉ đếm row thuần-pet, không phụ thuộc ack; **quá cap pet → trả ok im lặng** (`petRecorded: false`), không lỗi; gift branch lấy **advisory lock `betterme.companion:<uid>`** (chống merge hoàn lại spend) + công thức số dư **chuẩn §2.3** (carryover + Σ granted + Σ gifts − Σ|spent|, clamp 0–21, sum VALUE không đếm key, `safe_int` cho giá trị rác, FOR UPDATE); lỗi typed mới: **`already-cheered`** (pre-check dưới pair lock) và **`gift-cap-reached`** (bắt unique_violation, rollback cả food deduction). Response giờ có thêm **`petRecorded: boolean`**.
8. **`ack_garden_visits`**: prune 72h giờ **chừa lại row cheer** khi milestone còn sống trong summary của host (không thì sau 3 ngày visitor cheer lại được — mất uniqueness). Row cheer tự prunable khi milestone rớt khỏi mảng 10 slot.

Đối chiếu nhanh với 13 việc bản sáng: các mục 1–11 (SQL) = xong; mục 12–13 (TS) = chưa, chi tiết dưới.

### 4b. TypeScript — ❌ CÒN LẠI (contract chính xác từng file)

> Thứ tự làm nên theo A → B → C → (D, E, F song song) → G. Sau bước A/B, `pnpm typecheck`
> sẽ tự chỉ ra mọi chỗ phụ thuộc còn sót.

**A. `src/lib/server/social-actions.ts`**
- `PublishedSummary` đổi thành (bỏ hẳn `currentStreak`/`bestStreak`/`lastRefreshed`):
  ```ts
  export type PublishedSummary = {
    userId: string;
    displayName: string | null;
    petName: string | null;
    petSpecies: "dog" | "cat" | null;
    petStage: "baby" | "kid" | "junior" | "teen" | "adult" | null;
    petBondTier: number | null; // validate 1..5
    milestones: Array<{
      id: string;
      kind: "evolve" | "bond_tier" | "bloom_week" | "new_pet";
      at: string;       // ISO date
      detail?: string;  // stage / tier / species — enum-ish, KHÔNG free text
    }>;
  };
  ```
- Sửa select string trong `getFriendSummary` (dòng ~593) thành
  `"user_id, display_name, pet_name, pet_species, pet_stage, pet_bond_tier, milestones"`.
  **Đây là bug nổ runtime**: select cột đã DROP → lỗi ngay khi schema mới được apply.
- `PublishedSummaryRow` + `parsePublishedSummary` + `parseMilestone` theo shape mới (stage 5 giá trị, tier integer 1–5, milestone `{id,kind,at,detail?}` với kind vocab mới).
- Thêm action mới (mirror `refreshMySummary`):
  ```ts
  export async function setSharingEnabled(enabled: boolean):
    Promise<{ ok: true; sharingEnabled: boolean } | SocialActionFailure>
  // rpc("set_sharing_enabled", { p_enabled: enabled === true }), parse status === "ok"
  ```
- Doc comment `visitGarden`: bỏ `pet-cap-reached` khỏi danh sách lỗi (giờ là ok im lặng), thêm `already-cheered` + `gift-cap-reached`; RPC trả thêm `petRecorded` (parse hoặc bỏ qua đều được).

**B. `src/lib/types.ts`**
- Row `published_summaries`: bỏ `current_streak`/`best_streak`/`last_refreshed`; `pet_stage: string | null`; `pet_bond_tier: number | null`.
- Bỏ `milestones` khỏi Row `profiles` nếu đang khai (cột đã DROP).
- Functions: thêm `set_sharing_enabled: { Args: { p_enabled: boolean }; Returns: Json }`.

**C. `src/components/dashboard/pet-voice.ts` (+ `pet-voice.test.ts`)** — defect #12/#13 phần voice
- `GuestEvent` thêm `"guestGreeting"` + pool 3 câu/loài trong `GUEST_VOICE` (văn phong với KHÁCH: chó gọi "bạn", chữ "Sếp" chỉ dành cho chủ; mèo tsundere gọi "khách").
- `PetEvent` thêm `"friendVisitGift"`: chuyển các câu friendVisit có nhắc quà sang pool mới, viết bổ sung để MỌI pool (2 loài × 3 tierGroup × 2 event) đủ 3 câu. **Câu `friendVisit` thuần không được chứa "quà"/🎁** (§4.2.1: 🎁 chỉ khi có gift thật).
- Test: thêm `guestGreeting` vào danh sách guest events, `friendVisitGift` vào pet events (các invariant no-guilt/no-comparison tự phủ pool mới); thêm assert structural: pool `friendVisit` không chứa "quà"/🎁.

**D. `src/components/dashboard/garden-visit-overlay.tsx` (+ test)** — defect #12
- XÓA 2 bảng remap `SUMMARY_STAGE`/`SUMMARY_BOND_TIER` (vocab giờ as-built): `stage: summary.petStage`, `bondTier: (summary.petBondTier ?? 1) as BondTier`.
- XÓA badge `🔥 N ngày liền tay` (cột đã drop). Test thêm regression: overlay không bao giờ render "🔥"/"ngày liền tay".
- Greeting: bỏ prop `myBondTier` + câu `getPetLine(..., "idle")` → `getGuestLine(pet.species, "guestGreeting")`; bỏ `myBondTier` khỏi deps của useEffect.
- Milestone chips render từ **dictionary cố định theo kind+detail** (KHÔNG còn `milestone.value`): ví dụ `evolve` → "Lớn thành <tên stage VN>", `bond_tier` → "Thân thiết cấp N", `new_pet` → "Bé cún/mèo mới về nhà", `bloom_week` → "Tuần nở hoa"; emoji: evolve 🌟 / bond_tier 💗 / bloom_week 🌸 / new_pet 🐾; ngày từ `milestone.at`. `MILESTONE_EMOJI` cũ (streak/bond/garden) xóa.
- `handleCheer`: thay regex `/duplicate|unique/i` bằng `result.reason === "already-cheered"`.
- `handleGift`: thêm nhánh `reason === "gift-cap-reached"` → `setGiftSent(true)` (nút thành "Đã tặng hôm nay 🎁", không toast lỗi).
- `handlePet`: nhánh `"pet-cap-reached"` giờ unreachable (server trả ok im lặng) — xóa hay giữ đều an toàn.
- Fixture test cập nhật: `petStage: "junior"` giữ nguyên, `petBondTier: 3`, milestones shape mới, bỏ streak/lastRefreshed.

**E. `src/components/dashboard/dashboard-client.tsx`** — defect #13
- Bỏ `myBondTier={activePet?.bondTier ?? 1}` chỗ mount `<GardenVisitOverlay>` (~dòng 584).
- Mailbox dedupe: persist visitId đã celebrate vào localStorage **`betterme.mailboxseen.v1`** (map `visitId → visitDate`, prune entry >30 ngày). `unseen = visits.filter(v => !seen[v.visitId])`; chỉ toast + bubble khi `unseen.length > 0`; vẫn chạy vòng apply/ack cho MỌI pending (gift kẹt vì pantry đầy retry im lặng). Ghi seen cho cả visit đã apply lẫn chưa — chống toast lặp khi ack fire-and-forget fail.
- Thoại friendVisit cho mọi batch unseen, **kể cả không quà**, chọn biến thể theo kind: `getPetLine(species, tier, giftApplied ? "friendVisitGift" : "friendVisit")`. `giftApplied` chỉ true khi `applyGiftToState` thật sự đổi state (dedupe ledger không tính là quà mới).

**F. `src/components/dashboard/friends-card.tsx` (+ test)** — hoàn tất fix #5
- Thêm toggle sharing trong panel "Mã vườn của Sếp", bind `overview.me.sharingEnabled` (đã có sẵn từ `get_friends_overview`), gọi `setSharingEnabled` với optimistic state + refresh, quiet-toast khi fail. Copy gợi ý: "Mở cổng vườn cho bạn ghé thăm 🌿". Không có toggle này thì **mọi vườn đóng vĩnh viễn** (sharing_enabled default false).
- Test: toggle render đúng state, gọi action, phản ánh kết quả trả về.

**G. Test + gates + commit**
- Cập nhật: `garden-visit-overlay.test.tsx`, `social-actions.test.ts` (thêm contract `setSharingEnabled`), `friends-card.test.tsx`, `pet-voice.test.ts` (theo C).
- Chạy đủ 4 gate: `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build` → **commit Phase 2** (một commit, message dạng `feat: Phase 2 garden visits — ...`).

> Task list nội bộ: #7 (schema.sql — ✅ xong), #8 (TS + voice — §4b A–F), #9 (tests + gates — §4b G).

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
  - `update_my_profile` vẫn chưa gọi `refresh_my_summary` trực tiếp — nhưng trigger `profiles_propagate_summary` (đã thêm khi vá SQL) backstop đổi tên/tắt sharing ở tầng DB, nên chỉ còn là tightening tùy chọn.
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
| Findings Phase 2 (SQL đã vá, TS chưa) | `docs/superpowers/specs/2026-07-09-phase2-review-findings.md` |
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
