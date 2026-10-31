---
name: playwright
description: Use when checking BetterMe in a real browser, reproducing UI bugs, navigating forms, or capturing mobile and desktop screenshots with the repo-local Playwright CLI.
license: See LICENSE.txt and NOTICE.txt
---

# Playwright browser QA

Use the repository-local, lockfile-pinned CLI through `pnpm browser`. No global
installation, Bash wrapper, `npx`, personal browser attachment or separate test
framework is required. This is interactive browser QA, not an E2E test suite.

## Setup

Read `AGENTS.md` and the relevant UI spec. Run from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm browser --help
```

`pnpm browser` selects the named `betterme-qa` session. It is isolated from normal
browser profiles. Use its default nonpersistent profile; do not use `attach`,
`--persistent`, `--profile`, or load saved authentication state unless explicitly
requested. If Chrome is unavailable, use `--browser=msedge` for an installed Edge
or `pnpm browser install-browser chrome` for a dedicated browser installation.

Confirm the dev URL from terminal output. Start the app only when necessary,
with local binding: `pnpm dev --hostname 127.0.0.1`. Stop it before `pnpm verify`
or `pnpm build`. The authorized local-only bypass uses the string `"true"` in
`BETTERME_DEV_AUTH_BYPASS`; it cannot verify real auth, sync or social behavior.
Do not read or edit `.env*` files, reuse personal storage or mutate production data.

## Standard interaction loop

Choose a starting route and the behaviors to check before opening the browser.
Replace the example URL with the confirmed local port:

```powershell
pnpm browser open http://127.0.0.1:3000/login
pnpm browser snapshot
```

Read the current snapshot before using a target reference, then interact:

```powershell
pnpm browser click e3
pnpm browser snapshot
```

`e3` is an example, not a known target. Re-snapshot after navigation, tab changes,
opening or closing overlays, and whenever a ref becomes stale. Prefer explicit
CLI actions over `eval` or `run-code`; do not guess or brute-force target IDs.

## Visual and interaction checks

For changed UI, verify a phone and desktop viewport, keyboard focus/activation,
Escape and focus return for overlays, long Vietnamese content and the applicable
empty/loading/error states. Inspect rendered screenshots, not only snapshots.
Check reduced-motion behavior for animated changes. Narrow checks to the task;
UI QA does not authorize unrelated redesign or rewriting product copy.

```powershell
New-Item -ItemType Directory -Force -Path output/playwright
pnpm browser resize 390 844
pnpm browser screenshot --filename=output/playwright/mobile.png
pnpm browser resize 1440 1000
pnpm browser screenshot --filename=output/playwright/desktop.png
pnpm browser set-reduced-motion reduce
pnpm browser press Tab
pnpm browser snapshot
```

Snapshots and default artifacts go into ignored `.playwright-cli/`. Explicit
screenshots, traces or storage exports belong under ignored `output/playwright/`.
Review console errors when relevant without dumping tokens, cookies or user data.
Avoid collecting authentication state and full network bodies for ordinary UI QA.

## Finish

Close this session even if a command fails: `pnpm browser close`. Do not use
`close-all` or `kill-all`, which could disrupt another task. Use PowerShell
`try { ... } finally { pnpm browser close }` for scripted checks.

Report the tested route, viewport/state, result, evidence paths, and untested
behavior. A bypass-only run cannot establish Supabase sync or social correctness.
Retain artifacts locally; never stage them in Git.

Read [CLI reference](references/cli.md) or [workflow examples](references/workflows.md)
only when needed. Source commits and adaptations are recorded in `docs/agent-skills.md`.
