/**
 * lib/server/db.ts
 * Prisma 7 client singleton using better-sqlite3 adapter.
 * Node.js runtime only — never import in Edge (middleware/proxy.ts).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  // Strip "file:" prefix to get the filesystem path
  const dbFile = rawUrl.replace(/^file:/, "");
  const dbPath = path.isAbsolute(dbFile) ? dbFile : path.resolve(process.cwd(), dbFile);

  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter } as any);
}

// Singleton pattern: reuse across hot-reloads in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
