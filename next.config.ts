import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 writes an AGENTS.md into the repo on `next dev`; not wanted here.
  agentRules: false,
};

export default nextConfig;
