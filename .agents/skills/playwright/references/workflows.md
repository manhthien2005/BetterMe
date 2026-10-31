# Focused browser QA

## Local form or overlay

Use a disposable session with synthetic inputs; do not submit real account
creation, outbound mail or production writes as a smoke test.

```powershell
try {
    pnpm browser open http://127.0.0.1:3000/login
    pnpm browser snapshot
    # Read the snapshot, then use its actual refs for clicks and fills.
    pnpm browser press Tab
    pnpm browser snapshot
} finally {
    pnpm browser close
}
```

For a popover/sheet change, verify open, Escape, focus return and click-outside.
For mobile layout changes, also inspect safe-area behavior and horizontal overflow.
The full task-specific acceptance list comes from the approved UI spec.

## Troubleshooting

- A stale ref requires a new snapshot, not another guessed click.
- A missing browser needs an installed Chrome/Edge or `pnpm browser install-browser chrome`.
- Confirm the app's local port rather than assuming 3000 is free.
- If the app redirects to login, do not bypass real auth by changing product code.
- The dev bypass disables sync/social by design; verify those separately with
  an explicitly authorized test account and environment when the task requires it.
- On failure, close only `betterme-qa`, retain local evidence and report the
  exact failed command. Do not reset a personal browser or clear app storage.
