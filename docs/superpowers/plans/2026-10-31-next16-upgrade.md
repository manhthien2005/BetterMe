# Direct Next.js 16 stable upgrade

**Authorization/spec:** Owner request on 2026-10-31: upgrade directly to stable
Next.js 16, keep the website working, no intermediate release, no backup and no
subagents. Execute in the current checkout on the existing working branch.

**Goal:** Run BetterMe on exact stable Next.js 16.4.3 with the existing product,
storage, no-guilt/no-decay invariants, auth boundaries and UI intact.

**Architecture:** Keep the existing App Router and React 19.2.7 (compatible with
Next 16's declared peers). Use default Turbopack without enabling Cache Components
or React Compiler. Rename the session-refresh middleware to the supported proxy
convention and migrate lint config to native flat config. No SQL or remote deploy.

**Sources:** Current registry dist-tags and Next's official
[16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) and
[ESLint setup](https://nextjs.org/docs/app/api-reference/config/eslint).
Baseline immediately before this task: all four gates passed, 595 tests/58 files.

## Tasks and acceptance

- [x] Pin `next` and `eslint-config-next` to 16.4.3 in package.json/lockfile.
  Existing Node 24 and TypeScript 5.9 satisfy the documented requirements.
- [x] Add regression tests for the migrated proxy before renaming: missing config,
  cookie refresh forwarding and Supabase outage. Run RED, migrate, then run GREEN.
  Preserve server/page auth and never treat proxy alone as authorization.
- [x] Replace FlatCompat with the package's native flat configs, retain the
  existing ignores and Remotion rules, and fix actual compatibility failures.
- [x] Run typecheck, lint, full tests and default production build. Stop every
  verified dev process for this checkout before building.
- [x] Exercise the production server without bypass: login renders and protected
  routes redirect guests. Exercise default dev/Turbopack with local-only bypass:
  all four spaces, habit create/progress/untick/reload, day/week switch, editor
  keyboard close, widget popover and mobile/desktop screenshots.
- [x] Inspect browser/server errors, close the QA session and stop owned servers.
  No real account credentials, external emails or production data writes.
- [x] Update AGENTS.md stack and version-matched docs guidance, HANDOFF.md and
  the previous skill setup document's present-tense Next version statements.
  Perform a final separate self-review; preserve the owner's single-agent rule.

## Review focus

- Cookie updates must reach both the forwarded request and browser response.
- Production cannot accidentally honor the development auth bypass.
- Turbopack must produce working CSS/fonts and parse Tailwind's static token classes.
- Lint changes must not silently discard existing checks or broad-disable new rules.
- localStorage persistence and per-cell untick must survive refresh and navigation.

## Execution results

- Confirmed registry `latest` = 16.4.3 and declared React peers include the installed
  React 19.2.7. Pinned Next and eslint-config-next to exactly 16.4.3.
- RED: the proxy test suite failed because `@/proxy` did not exist. GREEN: five
  tests pass after the convention rename. They check missing URL/key, cookie
  forwarding plus response cookie flags, guest pass-through and network failure.
- Reproduced the FlatCompat circular-JSON failure with Next 16's native flat
  config, then removed the adapter and its now-unused direct dependency.
- Kept seven precisely scoped, explained `set-state-in-effect` exceptions for
  existing browser-storage hydration, clock hydration and awaited external data
  synchronization. Kept the intentional full-page sign-out navigation with one
  explained warning exception. No rule is disabled globally and no app behavior
  was refactored to satisfy a newly introduced lint heuristic.
- Retained Next's required `jsx: react-jsx` and generated type imports; included
  `.next/dev/types/**/*.ts`. The framework-generated next-env file is committed
  in its production-build form.
- Disabled automatic agent-rule generation with supported `agentRules: false`:
  AGENTS.md is project-owned and now explicitly points at version-matched docs.
- Found the new smooth-scroll navigation warning in the browser. Added the
  documented `data-scroll-behavior="smooth"` attribute to the root HTML element;
  repeat navigation confirms the warning is gone.

### Final automated gates

`pnpm verify` exited **0** after stopping the owned dev/production QA servers:

| Command | Actual result |
|---|---|
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed, no diagnostics |
| `pnpm vitest run` | 600/600 tests, 59/59 files, 21.41 seconds |
| `pnpm build` | Next.js 16.4.3 (Turbopack), compiled in 2.7s, generated 10/10 pages |

### Runtime evidence

- Production server on loopback port 3100: `/login` returned 200, with no dev-login
  link; `/dashboard`, `/calendar`, `/nep`, `/friends` and `/nep/archive` each returned
  307 to `/login`. The dev-bypass variable was deliberately set to `true` in that
  process to prove production ignores it.
- Default dev/Turbopack on loopback port 3101 with the authorized local bypass:
  created a synthetic check habit, ticked, reloaded, unticked and reloaded; each
  checked state persisted. A synthetic count habit retained **1/8** after reload.
- Browser assertions passed for day/week panel switching, editor Escape close,
  weather open/Escape/focus return, and Spotify iframe remaining connected when
  its popover closes. All four spaces rendered through client navigation.
- Visually inspected desktop (1440x1000) and mobile (390x844) screenshots; mobile
  scroll width equaled viewport width, and the display font computed to Bricolage
  Grotesque. Evidence is local/ignored under `output/playwright/next16-dashboard-*`.
- No application/hydration errors observed. The existing `/favicon.ico` 404 and
  transitive Remotion/ESLint peer mismatch remain outside this migration's scope.
- A Windows CLI multiline-argument quoting failure was corrected by sending the
  browser assertion function on one line; the failed tool invocation changed no
  product code or data. The assertions then passed.
- Closed only the `betterme-qa` browser session and stopped the owned QA servers.
  No personal browser, real credentials, remote schema, SQL or cloud data writes.

### Self-review and limits

The primary agent reviewed the diff, cookie flow, source/generated file changes,
lint exception scope, local persistence, production guards and staging boundaries.
Product invariants, domain logic, storage schema and all auth authorization gates
are unchanged. This was single-agent self-review at the owner's instruction.

Live authenticated sync and the deployed Supabase schema were not tested: no real
test-account credentials were supplied. The local production guard checks and proxy
regressions establish the framework migration boundaries, not a cloud deployment.
Publication is recorded by the resulting Git commit and verified remote SHA.
