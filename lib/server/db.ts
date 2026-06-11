/**
 * lib/server/db.ts
 * Prisma 5 client singleton — MongoDB Atlas via the native binary engine.
 * Node.js runtime only — never import in Edge (proxy.ts / middleware).
 * DATABASE_URL must be a mongodb+srv:// connection string.
 */
import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  return new PrismaClient();
}

// Singleton: reuse the same client across hot-reloads in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
