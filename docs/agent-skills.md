# BetterMe agent skills

Installed/reviewed: 2026-10-31. Project rules and skill routing live only in
[`AGENTS.md`](../AGENTS.md); this document is the installation and provenance record.

## What travels with the repository

| Repo skill | Purpose | Installation |
|---|---|---|
| `ponytail` | Smallest complete code change; scope/dependency review | Instruction-only; no hooks, dashboard or executable installer |
| `web-design-guidelines` | Accessibility and interface review | Local MIT-licensed guideline snapshot; no live remote instruction fetch |
| `playwright` | Real-browser interaction, screenshots and UI debugging | Repo skill + exact `@playwright/cli` 0.1.22 dev dependency |

The three folders are checked into `.agents/skills/`, where Codex can discover
repo skills. They require no machine-absolute paths or global CLI installation.
Keep only one equivalent active copy if a host also has these same skills.

## Host-managed core dependencies

These skills were available in the owner's host during installation; they are
not copied into Git. A fresh clone does not install plugins or connect accounts.

| Provider | Required capabilities | Observed local version |
|---|---|---|
| Supabase | Supabase general workflow, Postgres best practices | Plugin 1.0.0 |
| Vercel | React best practices; deployments/CLI/verification; env-vars and protected-preview access when relevant | Plugin 0.54.1 |
| Superpowers | Brainstorming, writing plans, debugging, TDD, inline execution, self-review, verification and finishing | Plugin 7.0.1 |
| Impeccable | Full UI/UX skill including shape, critique, audit, layout, typeset, adapt, clarify, harden, motion and polish | Skill 4.7.1 |
| Codex built-in | Skill installer/creator; image generation when assets are actually needed | Host-managed |

On a new machine, enable/install the Supabase, Vercel and Superpowers plugins and
full Impeccable through the host's supported skill/plugin management. Do this once,
not on every task. Prefer the current compatible official distribution and record
a reviewed version change here; do not copy another machine's plugin cache.

Availability of a skill, a connector tool, an authenticated account and a configured
remote project are four different states. Check the actual state when a task needs
it. Missing host skills are reported and handled through official docs and the
AGENTS.md workflow, never silently claimed to be installed. Keep the owner's
single-agent preference even if a host skill suggests delegation.

Official distribution references:
[Supabase](https://supabase.com/docs/guides/getting-started/ai-skills),
[Vercel](https://github.com/vercel-labs/agent-skills),
[Superpowers](https://github.com/obra/superpowers),
[Impeccable](https://impeccable.style/docs/),
[Codex discovery](https://developers.openai.com/codex/skills/).

## Fresh clone and ordinary use

Use the Node and pnpm requirements in package.json. The setup was verified with
Node 24.16.0 and pnpm 11.7.0 on Windows. From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm browser --version
pnpm browser --help
```

The CLI must report `0.1.22`. Codex should discover the repo skills on the next
turn; restart the session if they are absent from the picker. Their instructions
remain readable from `.agents/skills/<name>/SKILL.md` if implicit selection fails.

The browser workflow uses an installed Chrome/Edge, an isolated nonpersistent
profile and the `betterme-qa` named session. If Chrome is unavailable, open with
`--browser=msedge` or run `pnpm browser install-browser chrome`. Browser installation
is separate from installing the CLI package. No personal profile or browser
extension connection is required.

The [Playwright skill](../.agents/skills/playwright/SKILL.md) contains the tested
open/snapshot/interact/screenshot/close sequence and artifact locations. It does
not install `@playwright/test` or create an automated E2E suite. The existing
computer-use tool remains an alternative when the host already provides it.

Repeatable commands:

```powershell
pnpm test:sync
# First stop the verified dev process and Next child for this checkout.
pnpm verify
```

`verify` deliberately uses the existing four commands and fails at the first
failure. It does not kill processes, commit, push, deploy or apply SQL. The dev
server check and source/staging review remain agent responsibilities.

## Pinned upstream sources and local changes

### Ponytail

- Source: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/96608e078b2d5ea607c5c3b8b5a54d1c1fba6846/skills/ponytail).
- Commit: `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`.
- Copied: `skills/ponytail/SKILL.md` and root `LICENSE` (MIT).
- Adaptation: removed unsupported `argument-hint` frontmatter so the Codex skill
  validator accepts the entrypoint. Instruction body is unchanged; project
  authority and invocation boundaries are defined in AGENTS.md.
- Upstream entrypoint SHA-256: `9badd22a32e19cb884e46dfa8d3aae82bb81dfa5484105b8b4f0262df823a509`.

### Web Interface Guidelines

- Source: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines/tree/434b7f91364665f2f733b310ec54809bf8f37937).
- Commit: `434b7f91364665f2f733b310ec54809bf8f37937`.
- Copied: `command.md` as `references/guidelines.md`, plus root `LICENSE` (MIT).
- Snapshot SHA-256 (upstream and local bytes match): `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`.
- The local SKILL.md is a BetterMe review entrypoint, not a copy of the separate
  Vercel agent-skills entrypoint. It uses the fixed snapshot and explains actual
  native keyboard behavior, Vietnamese copy and task-dependent architecture advice.

### Playwright

- Source: [openai/skills](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright).
- Commit: `49f948faa9258a0c61caceaf225e179651397431`.
- Retained: Apache-2.0 `LICENSE.txt`, upstream `NOTICE.txt`, picker assets and metadata.
- Upstream entrypoint SHA-256: `0ffaabcc8e0990627c4725f18bf1c7955534a796c1c199e872909de2013ce6a8`.
- Adapted entrypoint and both references for PowerShell, `pnpm browser`, dedicated
  sessions, temporary profiles, cleanup, ignored artifacts and bypass limitations.
- Removed the Bash/npx wrapper; no scripts are fetched or executed from skill text.
- Corrected outdated upstream examples: CLI 0.1.22 uses `requests` instead of
  `network`, and `.playwright/cli.config.json` as its default config path.
- Exact CLI version is in package.json; package integrity and its transitive
  dependencies are recorded in pnpm-lock.yaml. This is a development dependency.
  CLI 0.1.22 itself pins an upstream Playwright alpha build; retain that tested
  dependency pair rather than overriding its internals or treating it as an app
  runtime upgrade. Browser QA is separate from production application dependencies.

## Update and review policy

Do not auto-update these repo instructions, install lifecycle hooks, download
mutable instruction files during ordinary review, or run a third-party installer
that rewrites AGENTS.md. Compare a candidate upstream commit with the pin above,
review changed instructions/scripts and license notices, preserve local adapters,
update this record and the lockfile only when needed, then validate before commit.
No new skill manager, scheduled updater or extra repository rule file is needed.

For structural validation, the host's built-in skill-creator provides
`scripts/quick_validate.py <skill-folder>`. Also read references and exercise any
changed executable workflow: valid YAML alone does not prove good agent behavior.
Use single-agent scenario review unless the owner explicitly authorizes subagents.

Taste Skill and Graphify are intentionally deferred under the approved plan.
Karpathy-inspired scope/simplicity/verification principles live in AGENTS.md rather
than a fourth overlapping coding-behavior skill. Next.js was subsequently upgraded
directly to stable 16.4.3 at the owner's request. Match framework guidance to
`node_modules/next/dist/docs/`; the original skill-install evidence below is historical.

## Installation evidence and limitations

- Before installation: all three repo skill paths were absent and
  `pnpm exec playwright-cli --help` failed with command-not-found.
- Baseline: 595 tests in 58 files passed.
- Each new skill passed the built-in structural validator after the Ponytail
  frontmatter adjustment. The guideline snapshot was compared byte-for-byte
  against its pinned upstream source.
- `pnpm install --frozen-lockfile`, CLI version/help, isolated browser open,
  snapshot, mobile 390×844 and desktop 1440×1000 screenshots, and session close
  were exercised on the local login page without credentials or form submission.
- `pnpm test:sync` passed 101 tests in 8 files. It is a regression subset.
- Final `pnpm verify` exited 0: `pnpm typecheck` and `pnpm lint` passed;
  `pnpm vitest run` passed 595/595 tests across 58 files (25.45 seconds);
  `pnpm build` compiled successfully and generated all 11 static pages. The
  verified BetterMe dev process and its Next child were stopped first.
- This verifies installation and browser operation, not the full product UI,
  authenticated Supabase flows, remote schema state or live RLS. Skill behavioral
  review was a primary-agent self-review, not an independent agent evaluation.
- Browser smoke surfaced an existing `/favicon.ico` 404. Package installation
  reported an existing ESLint 9 / transitive `@typescript-eslint/utils` 5 peer
  mismatch. Neither was changed as part of skill setup; check the four gate
  results for actual application validation.
- Build emitted non-blocking webpack cache serialization warnings. No application
  source, framework version, auth behavior or database schema changed.
