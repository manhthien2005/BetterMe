export function isDevAuthBypassEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" && env.BETTERME_DEV_AUTH_BYPASS === "true";
}
