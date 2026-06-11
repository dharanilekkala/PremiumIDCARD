/**
 * lib/server/db.ts
 * Prisma 7 client singleton using @prisma/adapter-neon (Neon PostgreSQL).
 * Node.js runtime only — never import in Edge (proxy.ts / middleware).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket polyfill required in Node.js serverless environments (Vercel)
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL env var is not set");
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Singleton pattern: reuse across hot-reloads in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
