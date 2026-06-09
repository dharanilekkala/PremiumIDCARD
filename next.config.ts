import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required in Next.js 16: Turbopack is the default bundler.
  // pdfjs-dist v6 is browser-only in this project (worker URL approach),
  // so no canvas alias is needed under Turbopack.
  turbopack: {},
};

export default nextConfig;
