# Project skill setup

Approved scope: the owner's 2026-10-31 request to review the recommended skill
stack, install it in BetterMe, and commit and push the result. The owner subsequently
required single-agent execution; no additional subagents are permitted without a
new explicit request.

## Decisions after review

- Keep Supabase, the relevant Vercel skills, Superpowers and full Impeccable as
  host-managed dependencies. Do not vendor duplicate copies or machine-specific
  plugin caches. Document which capabilities a fresh machine must provide.
- Check in three discoverable repo skills under `.agents/skills`: Ponytail's
  instruction-only skill, a Web Interface Guidelines review skill, and the OpenAI
  Playwright workflow adapted to Windows and pnpm.
- Pin upstream source commits, retain redistribution notices, and record local
  adaptations. Reviews use a checked-in guideline snapshot, not mutable remote
  instructions fetched during every invocation.
- Use an exact dev dependency on `@playwright/cli`, invoked through pnpm. Do not
  install a second browser automation framework, global commands, npm wrappers,
  telemetry dashboards, hooks, or application runtime dependencies.
- Keep routing, authority, the four Karpathy-inspired engineering principles,
  sync review checklist and release checklist in AGENTS.md. Additional custom
  domain skills would duplicate these rules and are unnecessary at this stage.
- Keep Taste Skill and Graphify optional as recommended. Do not install them,
  change AGENTS.md through their installers, or index/upload the repository.

## Boundaries

All existing product, sync, security, pnpm and verification rules remain binding.
The setup neither upgrades Next.js nor deploys the application nor applies SQL.
Next.js 15.5.20 is the installed baseline, not a recommended long-term target;
framework upgrade assessment is a separate task.

Browser sessions use isolated temporary profiles. Browser artifacts, auth state,
traces and all `.env*` files stay untracked. No personal browser connection,
production login or data mutation is implied by browser-tool installation.

Generic guideline suggestions do not mandate English title case, extra URL state,
new UI libraries, virtualization, memoization, architecture changes or a new
design identity. Apply them only when justified by the task and existing spec.

## Acceptance

- A fresh clone contains the three added skills and their source/license records;
  `pnpm install --frozen-lockfile` installs their browser CLI without global setup.
- The documentation distinguishes repo skills, external host dependencies and
  authenticated service connections. It states what to do if a dependency is absent.
- Skill frontmatter and local references validate; browser help, a real isolated
  browser session, snapshot and screenshot work using documented pnpm commands.
- Existing 595-test baseline is re-established; all four gates pass before commit.
- Review the final diff for unrelated files and secret/artifact staging. Push a
  `codex/` branch and verify the remote commit; no production deployment or merge.
