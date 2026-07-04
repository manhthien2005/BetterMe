> **META NOTE — xoá đoạn này trước khi paste vào Codex.**
> Thay đổi chính so với bản gốc: (1) khoá xung đột giữa `brainstorming` skill (mặc định hỏi-chờ-duyệt) và yêu cầu "không chờ clarification" bằng chế độ self-answered brainstorming; (2) bắt buộc đọc SKILL.md thật thay vì "theo tinh thần"; (3) thêm vùng dán legacy code có delimiter + fallback; (4) chốt rõ "scaffold" = types viết đầy đủ, logic/UI chỉ stub; (5) thêm bước audit repo hiện trạng (`docs/repo-audit.md`); (6) thêm guardrail an toàn (không xoá/ghi đè bừa); (7) thêm gate verification-before-completion + final session report; (8) map lại Execution Order theo đúng thứ tự skill thật của Superpowers (using-superpowers → brainstorming → writing-plans → dừng, không sang git-worktrees/TDD/code-review).
> Mọi thứ **từ dòng `---` bên dưới trở xuống** là nội dung để dán vào Codex.

---

# SESSION BRIEF: BetterMe — Planning & Scaffolding (Superpowers-enabled repo)

You are a senior product engineer, frontend architect, and technical planning agent operating inside a repository where the **Superpowers** skills framework (obra/superpowers) is installed. This framework works across Claude Code, Codex CLI/App, Cursor, and others — the same `SKILL.md` files apply here.

## 0. Session type and hard stop

This is a **planning and scaffolding session only**. You will not implement Phase 1 features. You will:
1. Inspect the repo and the pasted legacy script.
2. Produce planning docs.
3. Produce a task breakdown.
4. Create a folder/type scaffold (no business logic, no working features).
5. Self-verify everything against the checklist in §10.
6. Report and **stop**.

Do not proceed into implementation (no TDD, no git worktrees, no code review pass) even if it seems like the natural next step. Those are separate sessions with separate skill invocations (see §2).

---

## 1. Superpowers workflow contract for this session

Superpowers ships as markdown skill files (`SKILL.md`) under a `skills/` directory somewhere in this repo or its plugin install location (commonly referenced via `.codex/`, `.claude-plugin/`, or a project-level `skills/` folder — locate it, don't assume a path). **Reading this brief is not a substitute for reading the actual skill files.**

**Step 1 — Bootstrap.** Locate and read `using-superpowers/SKILL.md` first. Confirm which skills are actually installed in this repo. If Superpowers is not actually present in this environment despite being expected, say so explicitly in your first output and fall back to the manual process defined in this brief (do not silently skip discipline).

**Step 2 — Brainstorming, in self-answered mode.** Read `brainstorming/SKILL.md` and follow its process — assess scope, ask clarifying questions, explore alternatives, self-review for placeholders/contradictions — **with one modification**: this is a non-interactive batch session, so instead of pausing for live user answers, generate the questions the skill would ask, answer them yourself using the directives in this brief plus the legacy script, and record every question+answer as an explicit **"Assumptions & Resolved Questions"** section inside `docs/product-spec.md`. Do not silently skip the questions — write them down, answered.

As part of this step, do the scope-assessment the skill requires: confirm explicitly (one paragraph, in `docs/product-spec.md`) whether BetterMe Phase 1 is one cohesive product or must be decomposed into independent sub-projects. Default assumption unless the repo audit says otherwise: **one cohesive product, single spec → single plan cycle** (dashboard, tracker, calendar, habits, reflections, charts, and theming are tightly coupled through one data model, not independent subsystems).

Per `brainstorming/SKILL.md`: do not invoke `frontend-design` or any other implementation skill during this phase. UI/theme direction in this session is a **planning artifact** (`docs/ui-system.md`), not a call to an implementation skill.

**Step 3 — Writing plans.** Read `writing-plans/SKILL.md` and use its task template conventions for `docs/task-breakdown.md`: small tasks (each independently completable and verifiable), exact file paths (Create/Modify/Test), explicit Consumes/Produces interfaces between tasks, and a verification step per task. See §9 for the exact structure required here.

**Step 4 — Deferred skills (do NOT invoke this session).** `using-git-worktrees`, `test-driven-development`, `subagent-driven-development`, `executing-plans`, `requesting-code-review` all apply to *implementation* sessions, not this one. Reference them in `docs/implementation-plan.md` as "next session will invoke X" but do not run them now. Do not create a git branch or worktree for this planning session — you're only adding docs and scaffold files, not runnable app logic.

**Step 5 — Verification gate.** Read `verification-before-completion/SKILL.md` (if present) and apply its discipline as the final gate described in §10, before writing your closing report.

**Path precedence note:** Superpowers' own default doc locations (`docs/superpowers/specs/...`, `docs/superpowers/plans/...`) are superseded here by the explicit deliverable paths in §8 — per `using-superpowers`' own precedence rule, direct project instructions override skill defaults. Do not create duplicate copies in both locations.

---

## 2. Legacy reference input

The legacy product is a Google Apps Script spreadsheet tracker called **"Better Me - English Weekly Tracker"**. Full source will be pasted at the bottom of this brief inside a delimited block:

```
<legacy_apps_script filename="...">
...full .gs source...
</legacy_apps_script>
```

Treat that block as the ground-truth source for legacy behavior — read it fully before writing `docs/legacy-analysis.md`. **Do not port it line-by-line**; extract the actual product logic, data model, calculations, user flows, and feature requirements.

**Fallback:** if that block is empty, missing, or clearly truncated when you reach it, this is **not a blocker** — proceed using the "Legacy capabilities" summary in §3 below as the authoritative substitute, and record this substitution explicitly in a "Source Note" subsection at the top of `docs/legacy-analysis.md` (state that full source wasn't available and analysis is based on the provided functional summary).

### 2.1 Legacy capabilities to understand and preserve conceptually

- Daily habit tracking; weekly habit board.
- Default habits: wake up on time, study English, code/project work, exercise/sports, avoid wasting time, clean up/personal discipline, end-of-day review.
- Habit config: `habit_key`, `habit_name`, `category`, `max_score`, `active`, `description`.
- Tracker settings: `timezone`, `start_date`, `selected_date`, `tracker_days`, `target_completion_rate`.
- Daily record: `date`, `week_start`, `day_label`, habit completion values, `daily_note`, `problem_today`, `tomorrow_focus`, `total_score`, `max_score`, `completion_rate`, `status`, `streak`, missed habit keys/names.
- Scoring: active habits contribute to max score; completed habits contribute their `max_score`; `completion_rate = total_score / max_score`.
- Status: Good if `completion_rate >= target_completion_rate`; Okay if `>= 50%`; Bad otherwise; Planned for future dates.
- Streak increases on Good days, resets otherwise.
- UI concepts: top dashboard metrics, weekly quest board, selected day card, mini calendar, motivation card, 30-day progress chart, selected-week habit chart, theme/palette system.

---

## 3. Product direction

BetterMe is a self-improvement planning/tracking web app: daily/weekly habits, progress visualization, streaks, motivation. **Must not feel like an Excel clone** — redesign for a modern web-native UX while preserving the core scoring/streak logic.

### 3.1 Phase 1 scope (build and plan for)

Dashboard overview · daily tracking · weekly planner/quest board · calendar view · selected-day detail · habit configuration · reflection fields (daily note, problem/challenge, tomorrow focus) · progress charts · streaks/completion status · motivational message system · theme system · local/mock persistence abstraction.

### 3.2 Explicitly out of scope for Phase 1

Login · multi-user accounts · backend database · friend system · group streaks · social accountability · public sharing · promotional/growth features.

Design the architecture so these can be added later **without rewriting the app** — document the extension seam in `docs/architecture.md` (§6.3 below), don't build it now.

### 3.3 UI/UX direction

Feel: cute, focused, modern, calm, minimal — a personal study/self-improvement corner.

Initial themes to plan (not just palettes — see theme contract below):
1. Cute Cat
2. Study Corner
3. Modern Focus
4. Minimal Calm

Each theme must affect: colors, typography, border radius, card frame style, icon style, illustration style, background treatment, motion/effects, toast styling, chart styling, empty states, micro-interactions.

Theme implementation rules:
- CSS variables/design tokens; raw tokens separated from semantic tokens.
- No hardcoded theme values inside components — components consume semantic tokens only.
- Toasts and charts must be theme-aware.
- Note a light/dark path for the future; don't build it in Phase 1.

---

## 4. Repository inspection protocol (do this before writing any deliverable)

Produce `docs/repo-audit.md` first, containing:

1. **Framework state**: does `package.json` exist? Next.js version, App Router vs Pages Router, TypeScript config, existing lint/test tooling, package manager in use (infer from lockfile — `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`; do not assume npm if a different lockfile is present).
2. **Existing structure**: does `src/`, `app/`, or `docs/` already contain content unrelated to BetterMe? List conflicts.
3. **Superpowers install location**: where the `skills/` directory (or plugin manifest) actually lives in this repo.
4. **Git state**: current branch, clean/dirty working tree (informational only — do not commit or branch in this session).
5. **Decision log**: how the folder scaffold in §7 was adjusted (if at all) based on findings 1–2. If the repo is fully empty, state that explicitly and confirm the scaffold in §7 is being created as specified.

Guardrails while doing this and everything after:
- **Never delete existing files.**
- **Never `git commit`, `git push`, or create branches/worktrees** in this session.
- If a target doc or scaffold file already exists with unrelated content, do not blind-overwrite — diff it, note the conflict in `docs/repo-audit.md`, and merge thoughtfully (or write the new version alongside with a `.new` suffix and flag it for manual reconciliation).
- Don't run installs that mutate the lockfile unless creating a fresh `package.json` from nothing; if you do add a dependency, state it in the relevant doc rather than silently installing.

---

## 5. Architecture directives

- Extract legacy tracker/scoring logic into pure TypeScript domain functions, independent of React.
- Isolate date/time logic; must be timezone-aware (legacy `timezone` setting).
- Keep chart data transformation separate from chart rendering components.
- Keep theme definitions isolated from UI logic.
- Abstract persistence so Phase 1 can run on local storage or mock data while a future backend can be swapped in without touching domain logic or components.
- Define strong TypeScript types for: `Habit`, `HabitConfig`, `DailyRecord`, `TrackerSettings`, `CompletionStatus`, `ScoreSummary`, `WeekSummary`, `ChartData`, `ThemeDefinition`, `ReflectionEntry`, `MotivationMessage`.
- Document the future auth/backend/social extension path explicitly (which module boundaries absorb it, which stay untouched) in `docs/architecture.md`.

### 5.1 Library evaluation rules

Before proposing any library (charting, toast/notification, date handling, animation, validation, local persistence, class utilities): **check `docs/repo-audit.md` findings for existing dependencies first.** Only propose new ones if nothing suitable exists. For each proposed library, give a 2–3 sentence justification against at least one alternative in `docs/architecture.md`. Prefer simple, maintainable choices — avoid unnecessary complexity.

---

## 6. Required deliverables

Create or update these files. Each must be internally consistent with the others — same type names, same module boundaries, same file paths as the scaffold in §7.

**`docs/repo-audit.md`** — per §4.

**`docs/legacy-analysis.md`** — source note (per §2 fallback rule) · summary of the legacy tracker · extracted domain logic · what's preserved / redesigned / simplified / postponed · spreadsheet-concept → web-concept mapping.

**`docs/product-spec.md`** — self-answered brainstorming Q&A (§1, Step 2) · scope assessment paragraph · user goals · core flows · screens/pages · Phase 1 feature boundaries · explicit out-of-scope list (§3.2).

**`docs/architecture.md`** — module boundaries · client/server component strategy (Next.js App Router — minimize client components) · state management approach · persistence abstraction · library decisions (§5.1) · future auth/backend extension path.

**`docs/ui-system.md`** — visual direction · design token strategy (raw vs semantic) · full theme contract · the four initial themes · toast theming · chart theming · motion guidelines · accessibility guidelines (keyboard flows, focus states, contrast).

**`docs/data-model.md`** — full TypeScript interfaces for all types listed in §5 · relationships between habits/records/settings/reflections/summaries/themes · scoring and streak calculation rules (exact formulas, ported from §2.1) · local/mock storage shape · future database-readiness notes.

**`docs/implementation-plan.md`** — phases · phase goals · dependencies between phases · verification gates per phase · acceptance criteria per phase · a short "Superpowers Compliance Notes" subsection stating which skills were invoked at which step in this session, and which are explicitly deferred to which future session.

**`docs/task-breakdown.md`** — per §9's format exactly.

---

## 7. Folder scaffold rules

Inspect the current repo first (per §4) and adjust — do not blindly duplicate existing structure. Target shape (adjust based on audit findings):

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    dashboard/
    tracker/
    calendar/
    habits/
    settings/
  components/
    ui/
    layout/
    dashboard/
    tracker/
    calendar/
    habits/
    charts/
    theme/
    feedback/
  features/
    tracking/
    habits/
    scoring/
    reflections/
  themes/
  charts/
  lib/
    date/
    scoring/
    storage/
    utils/
  styles/
    tokens/
    themes/
  types/
  data/
  hooks/
  store/
```

**Scaffold content rule — this is the part that most often gets over- or under-built, so be precise:**
- **Types (`src/types/`): write these fully now.** These are a planning deliverable (they must match `docs/data-model.md` exactly), not an implementation shortcut.
- **Domain logic (`src/lib/scoring`, `src/lib/date`, etc.), components, hooks, store: create the files with correct names/exports and a `TODO` comment describing what will go there, but leave function bodies unimplemented (throw `Error('not implemented')` or return typed placeholder values) — do not write real scoring/streak/date logic yet.** That belongs to the next session, under `test-driven-development`.
- `layout.tsx` / `page.tsx`: minimal valid Next.js stubs so the app builds and runs, not a styled UI.
- Every scaffold file must satisfy `tsc --noEmit` — verify this before finishing (§10).

---

## 8. Task breakdown format (§6 deliverable, exact structure)

Follow `writing-plans/SKILL.md` conventions. In `docs/task-breakdown.md`:

```
## Global Constraints
[version floors, dependency limits, naming rules — one line each, copied from docs/architecture.md]

## Dependency order
T-001 → T-002 → T-004
T-002 → T-003
[etc. — simple ordered list is enough, no extra tooling]

### T-00X: <short name>
Goal: <one sentence>
Files:
  - Create: <exact path>
  - Modify: <exact path:lines, if applicable>
  - Test: <exact path>
Interfaces:
  - Consumes: <exact function/type signatures from earlier tasks>
  - Produces: <exact function/type signatures later tasks rely on>
Verification: <exact command or check, e.g. "npm run test -- scoring.test.ts", "tsc --noEmit">
Dependencies: <task IDs, or "none">
```

Rules:
- No vague tasks ("build dashboard"). Prefer concrete ones ("create pure `calculateCompletionRate()` function with unit tests covering 0%, partial, and 100% completion").
- Each task small enough to be independently verifiable.
- Cover at minimum: scoring logic, streak logic, date/week calculations, theme token validation, storage adapter behavior, chart data transformation, plus one task per page/screen scaffold.

---

## 9. Verification & definition of done (verification-before-completion gate)

Before writing the closing report, self-check — do not claim anything is complete without this:

- [ ] Every file in §6 exists at the exact path specified.
- [ ] Every TypeScript type named in §5 is defined in `src/types/` and matches `docs/data-model.md` exactly (no drift between the doc and the code).
- [ ] `docs/architecture.md` module boundaries match the actual folder scaffold 1:1 — no orphaned folders, no undocumented ones.
- [ ] No contradictions across docs (e.g., a type name or scoring formula stated differently in two files).
- [ ] No unresolved placeholders (`TBD`, `TODO: decide`) left without being explicitly logged as an open question in `docs/implementation-plan.md`.
- [ ] Scaffold builds: `tsc --noEmit` passes; if a package.json/build exists, confirm `next build` at least type-checks (do not worry about styling/runtime completeness).
- [ ] `docs/task-breakdown.md` tasks are all small, concrete, and have exact file paths + verification steps (per §8's anti-vagueness rule).
- [ ] Self-answered brainstorming Q&A in `docs/product-spec.md` covers scope assessment, theme direction, persistence choice, and library choices — the things that would otherwise need live clarification.

---

## 10. Final session report (chat output, not a file)

After the gate above passes, report concisely:
- Files created / files updated (list, with paths).
- Key assumptions made (cross-reference §1 Step 2's Q&A).
- Open questions or risks flagged for the user.
- Explicit confirmation that no implementation code was written beyond typed stubs.
- The exact next step: which task ID in `docs/task-breakdown.md` should be tackled first, and which Superpowers skills the next session should invoke (`using-git-worktrees` → `writing-plans`'s already-produced plan → `test-driven-development` via `subagent-driven-development`/`executing-plans`).

Then stop. Do not begin implementation.

---

## Legacy Apps Script source (paste below)

<legacy_apps_script filename="PASTE_FILENAME_HERE">
PASTE FULL "Better Me - English Weekly Tracker" .gs SOURCE HERE
</legacy_apps_script>
