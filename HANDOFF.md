# HANDOFF — Nếp's Garden / Vườn Có Bạn

> **Ngày cập nhật:** 2026-07-26 · **Trạng thái tree:** sạch, 4 gates xanh (**221/221 test, 21 file**)
> **Nhánh:** `main` · File này là điểm vào duy nhất cho người nhận bàn giao.
> Quy ước cho agent: đọc `AGENTS.md`. Spec hành vi: `docs/superpowers/specs/`.

---

## 1. Tóm tắt 30 giây

App: **Nếp's Garden** — habit tracker tiếng Việt, cozy, có pet nuôi được (Next.js 15 + React 19 + TS strict + Supabase, localStorage-first) cùng **social layer kiểu Duolingo** (kết bạn, thăm vườn, Nhịp Chung, Hội chợ vườn).

- **Social Garden Phase 0 → 3: ĐÃ SHIP HẾT** (commit, review, gates xanh — xem §2).
- **Auth thật đã chạy**: email + password, signup có OTP 6 số qua email (Gmail SMTP). Config GoTrue nằm NGOÀI Postgres — nguồn chân lý: `docs/auth-email-config.md`.
- **Schema đã apply lên project Supabase thật** (ref trong `docs/auth-email-config.md`). Bằng chứng: các fix theo Supabase advisor 0011/0028/0029 và lỗi `extensions.gen_random_bytes` chỉ lộ ra khi chạy trên DB thật. LƯU Ý: bộ test DB-level theo spec §12 (RLS matrix, race tests) **vẫn chưa chạy** — xem §4.
- **Việc tiếp theo #1 (chỉ đạo owner 2026-07-26): đại tu giao diện** — UI hiện tại chưa giữ chân người dùng; phân tích retention + redesign toàn diện, làm CÙNG owner từng bước (xem §4-A).

**2 invariant tuyệt đối, test-enforce, không thương lượng:**
1. **No-guilt**: không câu chữ/UI nào trách móc user hay so sánh họ *xuống dưới* ai (`pet-voice.test.ts` chặn cứng: "thua", "kém hơn", "xếp cuối"…).
2. **No-decay**: growth/bond của pet chỉ tăng (trigger Postgres enforce; đường giảm duy nhất là RPC `reset_companion`). KHÔNG áp cho completions — untick là hành động hợp lệ và phải sync được.

---

## 2. Đã ship (commit trên `main`, mới → cũ)

| Commit | Nội dung |
|---|---|
| `bc2ea68` | **Agent instruction layer**: `AGENTS.md` + `.kiro/` (steering, skills: verification / schema conventions / sync-engine / pet-voice / ui-styling / ui-ux-pro-max). `.gitignore` chặn `__pycache__`, giữ `.kiro/settings/mcp.json` (token) ngoài git |
| `3987a31` | **Refactor dashboard**: tách `dashboard-client.tsx` (~600 dòng gọn lại) thành `HeroBanner`/`CompanionPanel`/`CelebrationOverlay`/`WeatherCard`/`AnalyticsPanel`/`ProfileMenu`/`SiteFooter`, mỗi cái có test riêng (167 → 221 test); email tài khoản chuyển vào ProfileMenu dropdown (trang hồ sơ/cài đặt còn là toast placeholder) |
| `0e631f6` | **Auth email+password + OTP signup**: `auth-actions.ts` (4 server action, không throw), login form 3 mode (login/signup/verify) với copy VN cozy + anti-enumeration; `docs/auth-email-config.md` ghi config GoTrue tái lập được (template OTP-only `{{ .Token }}`, invariant `mailer_otp_length=6` ≤ độ dài input, custom SMTP). Root cause đã fix: OTP 8 số bị form cắt còn 6 → mọi verify fail `otp_expired` |
| `cd3c238` | **Schema hardening** theo Supabase advisor: pin `search_path` cho helper/trigger functions, revoke REST-execute trigger-only functions, `extensions.gen_random_bytes` |
| `aeba2da` | **Phase 3 — Nhịp Chung & Hội chợ vườn** (shared rhythm + garden fair) |
| `72686c5` | **Phase 2 — Thăm vườn & cheers** (23 defect từ adversarial review đã vá cả SQL lẫn TS trước khi commit) |
| `c919634` | **Phase 1 — Danh tính & kết bạn** (invite code 64-bit, RPC rate-limited, card "Bạn vườn 🏡") |
| `85b537f` | **Voice packs social** (66 câu VN, guest voices, guard no-comparison) |
| `854744e` | **Phase 0 — Supabase sync** (ledger economy, LWW merge, no-decay trigger, sync engine `src/lib/sync/`) |
| `dd1e812` | Spec social-garden v2 (qua 23-finding adversarial review) + amendment product-spec |

Chi tiết kỹ thuật từng phase (contract RPC, luật merge, quyết định §11 đã chốt): xem spec + git log message của từng commit.

---

## 3. Môi trường & lệnh

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
pnpm vitest run  # 221 tests / 21 files
pnpm build       # next build
pnpm dev         # next dev
```

- **4 gates trên phải xanh trước MỌI commit.** pnpm only, không npm/yarn.
- **Dev bypass đăng nhập**: env `BETTERME_DEV_AUTH_BYPASS` phải là chuỗi `"true"` (số `1` không ăn). Khi bypass: sync/social tắt hoàn toàn, dashboard chạy localStorage thuần — hành vi đúng, không phải bug.
- **Client cần env**: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`.env.local`, không bao giờ commit).
- **Config auth (GoTrue)** không nằm trong `schema.sql` — môi trường mới phải re-apply theo `docs/auth-email-config.md`.
- **localStorage keys**: state `betterme.dashboard.v2` (v1 chỉ đọc, migration tự chạy) · queue `betterme.syncqueue.v1` · shadow `betterme.syncmeta.v1` · watermark `betterme.synclast.v1` · opt-in `betterme.syncoptin.v1` · hoãn hỏi `betterme.syncask.v1` · mailbox seen `betterme.mailboxseen.v1`.
- JSDOM không có `window.matchMedia` — guard trước khi dùng (pattern có sẵn trong `pet.tsx`).

---

## 4. Việc tiếp theo (theo thứ tự ưu tiên)

### A. Đại tu giao diện (ĐANG LÀM — chỉ đạo owner 2026-07-26)
UI hiện tại "khá chán", chưa có yếu tố giữ chân người theo dõi. Cách làm: **phân tích cùng owner trước, chốt hướng rồi mới code** — không tự ý redesign một mạch. Gợi ý phạm vi phân tích: hero/first-impression, vòng lặp quay-lại-mỗi-ngày (pet + streak + social có đang được "bán" đủ không), các widget tĩnh chiếm chỗ (WeatherCard đang là dữ liệu cứng Bangkok, Spotify iframe), tính khám phá của social layer. Tôn trọng 2 invariant §1 và design system hiện có (rice-paper/matcha/sakura tokens trong `tailwind.config.ts`, font Baloo 2 + Nunito). Skill hỗ trợ: `.kiro/skills/ui-styling`, `.kiro/skills/ui-ux-pro-max`, `frontend-design`.

### B. Test DB-level theo spec §12 (chưa làm — môi trường dev không có Postgres/supabase CLI)
RLS matrix 3 user (§8), race tests (2 visitor cùng tặng, double-click), rate-limit đếm cả mã sai, invite-code re-roll, trigger no-decay + `reset_companion`, merge 2 thiết bị. Khuyến nghị: `supabase start` (docker) + pgTAP hoặc script SQL tay.

### C. Soak Phase 0 ≥1 tuần (gate cứng spec §1)
Owner dùng sync đa thiết bị 1 tuần, xem log lỗi, RỒI mới mở social cho user thật.

### D. Follow-ups đã ghi nhận, làm sau được
- Trang hồ sơ + cài đặt thật (ProfileMenu đang toast "đang được ươm mầm").
- Multi-tab: 2 tab cùng flush có thể mất mutation trong queue (xác suất thấp, tự-lành) — thêm `storage` event listener nếu cần.
- Lọc ledger companion theo `seedCutoverDate` khi upload (tightening tùy chọn).
- Playwright 2-context integration test (§12 Phase 0).
- Kill-switch metrics Hội chợ (spec §5.3) — đo sau 4 tuần chạy thật.

---

## 5. Bản đồ file quan trọng

| Vùng | File |
|---|---|
| Quy ước agent | `AGENTS.md` (nguồn chân lý) + `.kiro/steering/**`, `.kiro/skills/**` |
| Spec hành vi (NGUỒN CHÂN LÝ) | `docs/superpowers/specs/2026-07-08-social-garden-spec.md` · `2026-07-07-pet-companion-spec.md` |
| Auth config (ngoài Postgres) | `docs/auth-email-config.md` + `src/lib/server/auth-actions.ts` + `src/components/auth/login-form.tsx` |
| Schema + toàn bộ RPC | `supabase/schema.sql` (idempotent; banner: gốc / Phase 0 / 1 / 2 / 3 / hardening) |
| State thuần (pure functions, kinh tế pet) | `src/components/dashboard/dashboard-data.ts` (+ test) |
| Sync engine | `src/lib/sync/{types,time,storage,queue,shadow,merge,importer,engine}.ts` (+ tests) |
| Server actions | `src/lib/server/{sync-actions,social-actions,auth-actions,actions}.ts` |
| UI dashboard | `src/components/dashboard/{dashboard-client,hero-banner,companion-panel,celebration-overlay,weather-card,analytics-panel,profile-menu,site-footer,friends-card,garden-fair,garden-visit-overlay,sync-onboarding,pet,nep}.tsx` |
| Voice + invariant tests | `src/components/dashboard/pet-voice.ts` + `pet-voice.test.ts` |

---

## 6. Rủi ro / giới hạn đã biết (chấp nhận có chủ đích — đừng "sửa" nhầm)

- **Trust model (spec §0.7)**: data gốc là self-reported + owner-writable (bản chất local-first). Server bảo đảm summary *nhất quán với data gốc*, không chống được user tự tick láo — Hội chợ là trò chơi giữa bạn thật.
- **LWW tin đồng hồ client** cho name/species/log cells — spec chấp nhận; watermark reset đã theo server-time.
- **Ledger imprecision có trần**: 2 replica lệch >30 ngày có thể đếm đôi net của 1 ngày đã prune (clamp bởi FOOD_CAP=21; spend không bao giờ mất).
- **`CompanionState.food` là derived cache** — mọi code đụng ledger phải gọi lại `deriveFoodBalance`; KHÔNG BAO GIỜ merge field này.
- **`bestStreakFloor` (=26) và `events` là seed fiction** — không bao giờ upload; records `date <= seedCutoverDate` không bao giờ rời máy.
- **WeatherCard là dữ liệu tĩnh có chủ đích** (spec 2026-07-05) — chưa có live API; đừng coi là bug, nhưng là ứng viên xem xét trong đợt đại tu UI.
