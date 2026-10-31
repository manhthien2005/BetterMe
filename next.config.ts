import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // AGENTS.md is maintained by the project and already links version-matched docs.
  agentRules: false
};

export default nextConfig;
