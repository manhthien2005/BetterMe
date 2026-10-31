# Repo-local CLI reference

Run from the repository root through `pnpm browser` (the `betterme-qa` session).
Use `pnpm browser --help <command>` to verify current options. These commands
were checked against the pinned CLI; no alias, shell wrapper or global install.

```powershell
pnpm browser open http://127.0.0.1:3000/login
pnpm browser snapshot
pnpm browser fill e5 "example input"
pnpm browser click e3
pnpm browser press Tab
pnpm browser press Enter
pnpm browser resize 390 844
pnpm browser set-reduced-motion reduce
pnpm browser clear-reduced-motion
pnpm browser screenshot --filename=output/playwright/mobile.png
pnpm browser console error
pnpm browser requests
pnpm browser tab-list
pnpm browser go-back
pnpm browser reload
pnpm browser close
```

Target refs above are placeholders; use only refs from a fresh snapshot.
`requests` lists network activity. Request/response body commands can reveal
sensitive data; do not use them as a routine checklist step.

`open` accepts `--headed`, `--browser=msedge` and `--device`.
`screenshot` accepts `--filename` and `--full-page`.
The default config path in CLI 0.1.22 is `.playwright/cli.config.json`, not
`playwright-cli.json`. No config file is required for this repository.

For traces, use `tracing-start` and `tracing-stop` around the narrow reproduction.
Review the resulting file paths and keep artifacts in ignored QA directories.
