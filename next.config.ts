import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  // ws and @neondatabase/serverless use Node.js net/tls modules — must not be
  // bundled by Next.js; they need native require() in the serverless runtime.
  serverExternalPackages: ["ws", "@neondatabase/serverless", "@prisma/adapter-neon"],
};

export default nextConfig;
