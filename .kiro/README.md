# `.kiro/` — Kiro CLI setup for BetterMe

This folder turns Kiro into a project-tuned agent for **BetterMe / Nếp's Garden**. It is
committed with the repo so the whole team (and every future session) shares the same brain.

## What's here

| Path | Purpose | Loaded |
|---|---|---|
| `../AGENTS.md` | Portable, command-first project brief. **Source of truth** for agent instructions (also read by Codex/Cursor/Copilot/etc.). | Always (all agents) |
| `steering/00-guardrails.md` | Non-negotiable STOP rules: the two invariants, secrets, RLS, destructive ops. | Always |
| `steering/10-workflow-and-verification.md` | How to work (spec-first, TDD) and what "done" means (4 gates + evidence). | Always |
| `skills/betterme-verification/` | Exact 4-gate sequence, Windows/pnpm specifics, done-checklist. | On demand |
| `skills/supabase-schema-conventions/` | RLS / SECURITY DEFINER / RPC / idempotent schema / ledger economy / server-action contract. | On demand |
| `skills/sync-engine/` | Local-first merge laws, localStorage keys, derived-cache rule. | On demand |
| `skills/pet-voice-invariants/` | No-guilt / no-comparison Vietnamese copy rules, host vs guest voice. | On demand |
| `agents/betterme.json` | The tuned **super-agent**: focused toolset, PowerShell-safe command allow/deny, write-path guards, trusted docs, skill resources, git-status spawn hook. | When selected |

The `../.agents/skills/**` "superpowers" process skills (brainstorming, writing-plans,
executing-plans, TDD, systematic-debugging, verification-before-completion, subagent-driven-development,
requesting/receiving-code-review, using-git-worktrees, dispatching-parallel-agents) are wired
into the `betterme` agent as on-demand skills too.

## Two ways to use it

**1. Default agent (zero setup).** `kiro-cli chat` already auto-loads `AGENTS.md`, everything in
`steering/`, and the skills in `skills/`. So the default agent is already upgraded.

**2. The `betterme` super-agent (recommended).** Adds the tuned tool permissions, command
guards, and the git-status spawn hook on top:
- In a chat session: `/agent betterme`  (or press **Ctrl+Shift+B** to toggle)
- Make it the default for this repo: `kiro-cli agent set-default betterme`
- One-off launch: `kiro-cli chat --agent betterme`

## Safety rails baked into `betterme`
- **Auto-approved shell**: only `pnpm` gates/dev/install, `git` read + `git add`, `node`/`tsc`
  checks, and `kiro-cli agent list/validate`. Read-only commands auto-approve; anything else prompts.
- **Hard-blocked shell**: `rm -rf`, `git reset --hard`, `git clean -f`, force-push, working-tree
  discard (`git checkout -- .` / `git restore <path>` — protects uncommitted work), and
  destructive SQL (`DROP`/`TRUNCATE`/`supabase db reset`).
- **Write guards**: writes are allowed across the project source but **denied** on `.env*`,
  `.git/`, `node_modules/`, `.next/`, `.worktrees/`, `pnpm-lock.yaml`, keys/certs.
- **Trusted docs**: `web_fetch` auto-allows Next.js/React/Supabase/TanStack/Remotion/Tailwind/
  Radix/MDN/GitHub/npm/agents.md; other URLs prompt.

### Tuning
- Want every file edit to require confirmation? Remove `"write"` from `allowedTools` in
  `agents/betterme.json`.
- Add or remove auto-approved commands under `toolsSettings.shell.allowedCommands`.
- Re-validate after any edit: `kiro-cli agent validate --path .kiro/agents/betterme.json`.

## Design skills (from ui-ux-pro-max) 🎨

`ui-ux-pro-max` and `ui-styling` (MIT, from `nextlevelbuilder/ui-ux-pro-max-skill` v2.10.2) are
installed as **on-demand skills** in `.kiro/skills/`. They give design intelligence — 67 UI
styles, 161 palettes, 57 font pairings, UX/a11y checklists, chart guidance, and Radix/Tailwind
patterns — searchable via a local Python engine.

- **Requires Python 3.x** (present: 3.12). On Windows run `python`, not `python3`.
- Generate a design system / search a domain:
  `python .kiro/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Nep Garden"`
  (`--domain style|color|typography|chart|ux|...`, `--stack nextjs`)
- **Reference tools, subordinate to the project's own design system.** The approved system in
  `docs/` + `src/app/globals.css` semantic tokens + the 4 themes + the no-guilt / no-decay
  invariants + the cozy Vietnamese identity always win. A project-override note sits at the top
  of each skill file.

**Curation applied:** `uipro init --ai kiro` also dropped `slides`, `banner-design`, `brand`,
`design` (logo/CIP/social), and `design-system` into `.kiro/steering/`. Those were **removed** —
irrelevant to a habit tracker, they reference other skills we don't have, and (worst) they land
in *always-on* steering. Only the two relevant packs were kept and **moved to `.kiro/skills/`**
so they load on demand (metadata only until invoked) instead of bloating context every turn.

> ⚠️ Re-running `uipro init` / `uipro update` will re-add the 5 removed packs into
> `.kiro/steering/` and overwrite the project-override notes + path fixes. If you update,
> re-apply this curation: move the 2 keepers to `.kiro/skills/`, delete the other 5.

## Optional: Supabase / Postgres MCP (not wired yet)
No database is provisioned yet (see `HANDOFF.md §5`), and no credentials are stored here. When
you provision Supabase and want the agent to query/apply schema, add an MCP server to
`agents/betterme.json` (`mcpServers`) using an env var for the token — never hard-code secrets.
Example shape:

```jsonc
"mcpServers": {
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only"],
    "env": { "SUPABASE_ACCESS_TOKEN": "$SUPABASE_ACCESS_TOKEN" }
  }
}
```
Then allow its read tools via `allowedTools` (e.g. `"@supabase/list_*"`). Treat DB write/apply
tools as high-risk (leave them to prompt).

## Maintenance
`AGENTS.md` and `.kiro/` are an instruction channel the agent follows — review changes with the
same rigor as code. Keep `AGENTS.md` as the single source of truth; when conventions change,
update it (and the affected skill), not scattered notes.
