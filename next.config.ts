import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 default bundler.
  turbopack: {},

  // Native MongoDB driver uses Node.js TLS (system cert store) — keep it
  // out of the server-component bundle so native require() is used at runtime.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
