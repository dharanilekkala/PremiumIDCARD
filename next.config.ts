import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 default bundler.
  turbopack: {},

  // Prisma 5 binary engine uses native Node.js modules — opt it out of
  // server-component bundling so it uses native require() at runtime.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
