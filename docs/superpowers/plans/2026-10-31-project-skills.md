# Project Skills Implementation Plan

> Execution: inline by the primary agent. The owner's explicit instruction forbids
> starting additional subagents. Existing authorization covers implementation,
> commit and push; no additional approval round is needed for this agreed scope.

**Goal:** Install the reviewed minimal additions with repeatable browser tooling.

**Architecture:** Three repo-scoped skill folders, pinned upstream provenance,
host-managed core skill dependencies, and AGENTS.md as the only project-rule source.

**Tech Stack:** Codex skills, PowerShell, pnpm 11.7, Node 24, Playwright CLI;
the Next.js 15.5.20 / React 19 application stays unchanged.

**Spec:** `docs/superpowers/specs/2026-10-31-project-skills-design.md`.

## Global constraints

- Preserve the complete existing AGENTS.md invariants and authorization boundaries.
- pnpm only; PowerShell-safe examples; no machine-absolute paths in checked-in files.
- No secret reads, framework upgrades, SQL execution, app deployment or auto-subagents.
- Stop the project's dev server before the production build.
- All four gates must pass before a commit.

## Review focus

1. Fresh clone: documented external plugins must not masquerade as vendored skills.
2. Windows: no Bash/npx wrapper dependency or global CLI requirement.
3. Browsers: isolated session, ignored artifacts and cleanup after errors.
4. Authority: generic UI guidance cannot override Vietnamese copy or project specs.
5. Supply chain: fixed commits, licenses, reviewed scripts and no mutable instruction fetch.

## Task 1: Install the three repo additions

- [x] Establish baseline: CLI missing, all three skill paths missing; existing
  `pnpm vitest run` passes 595 tests in 58 files.
- [x] Install Ponytail from a fixed commit using skill-installer; retain MIT notice.
- [x] Add the licensed Web Interface Guidelines snapshot with a scoped review entrypoint.
- [x] Install the pinned OpenAI Playwright skill, adapt to the repo-local pnpm CLI,
  retain license, and smoke-test the adapted workflow before proceeding.
- [x] Validate each entrypoint and references; record source commits and adaptations.

## Task 2: Integrate routing and repeatable checks

- [x] Update AGENTS.md with routing, bounded planning, no automatic subagents,
  engineering principles, sync review and pre-release checklists.
- [x] Add pinned browser dev tooling and pnpm aliases for browser, sync tests and gates.
- [x] Ignore browser artifacts and every `.env*` variant; document host dependencies,
  fresh-clone setup, update procedure and optional/deferred skills.
- [x] Update HANDOFF.md with the installed setup and its limits.

## Task 3: Verify and publish

- [x] Smoke-test isolated browser open/snapshot/screenshot/close and run structural
  skill validation; inspect licensing, local links, staged files and final diff.
- [x] Stop only the verified BetterMe dev process, then run typecheck, lint,
  the complete Vitest suite and build; record actual output.
- [x] Self-review the final changes and prepare the explicit file list for publication.

Publication follows this verification record: commit only intended files, push the
feature branch, verify its remote SHA and report the actual commit in chat. Do not
merge or deploy. Git records that action rather than premarking it complete here.

## Execution notes

- Working on `codex/project-skill-stack` in the current checkout, as requested;
  no parallel implementation or extra worktree is needed for these scoped changes.
- The first review subagent was stopped when the owner requested no auto-subagents.
  All remaining review and verification is performed by the primary agent.
- Review correction: Ponytail's unsupported argument-hint frontmatter was removed
  after a failing validator run, then validation passed. The body remains upstream.
- Review correction: Playwright upstream Bash/npm examples, its obsolete network
  command and its old config path were replaced by commands verified on CLI 0.1.22.
- The pinned guideline snapshot matches its upstream SHA-256. The original product
  invariants, conventions and security section were verified unchanged verbatim.
- Final evidence: `pnpm install --frozen-lockfile` passed; all three skill entrypoints
  and local links validated; browser version/help/open/snapshot/screenshots/close
  passed; `pnpm test:sync` passed 101/101; `pnpm verify` passed typecheck, lint,
  595/595 tests in 58 files and the production build (11/11 static pages).
- Known observations outside scope: existing favicon 404, ESLint peer mismatch and
  non-blocking webpack cache warnings. They do not represent verified skill failures.
