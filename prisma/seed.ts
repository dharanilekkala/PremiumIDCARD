/**
 * prisma/seed.ts — Seeds the database with demo data.
 * Run with: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: path.resolve(dbPath) });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");
  const pw = await bcrypt.hash("Admin@1234", 12);

  // ── Organizations ──────────────────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where:  { id: "org1" },
    update: {},
    create: {
      id: "org1", name: "IDForge Demo Corp", orgType: "corporate",
      status: "active", adminEmail: "superadmin@idforge.ai",
      adminName: "Super Admin", phone: "+91 98765 00001",
    },
  });

  const org2 = await prisma.organization.upsert({
    where:  { id: "org2" },
    update: {},
    create: {
      id: "org2", name: "Acme School Board", orgType: "school",
      status: "active", adminEmail: "sunita@acmeschool.edu",
      adminName: "Sunita Sharma", phone: "+91 98765 00002",
    },
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  const seedUsers = [
    { id:"u1", name:"Super Admin",   email:"superadmin@idforge.ai", role:"SuperAdmin", org: org1.id },
    { id:"u2", name:"Admin User",    email:"admin@idforge.ai",      role:"Admin",      org: org1.id },
    { id:"u3", name:"Ravi Operator", email:"operator@idforge.ai",   role:"Operator",   org: org1.id },
    { id:"u4", name:"Priya Viewer",  email:"viewer@idforge.ai",     role:"Viewer",     org: org1.id },
    { id:"u5", name:"Sunita Sharma", email:"sunita@acmeschool.edu", role:"Admin",      org: org2.id },
    { id:"u6", name:"Vikram Mehta",  email:"vikram@idforge.ai",     role:"Operator",   org: org1.id, inactive: true },
  ];

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: {
        id: u.id, name: u.name, email: u.email,
        passwordHash: pw, role: u.role,
        organizationId: u.org,
        status: u.inactive ? "inactive" : "active",
      },
    });
  }

  // ── Audit Logs (demo data) ─────────────────────────────────────────────────
  const seedLogs = [
    { id:"a1",  userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"login",           module:"Auth",       details:"Successful login",                   org: org1.id, ts: "2024-06-01T09:00:00Z" },
    { id:"a2",  userId:"u2", userName:"Admin User",    email:"admin@idforge.ai",      action:"bulk_generate",   module:"AI Builder", details:"Generated 125 cards",               org: org1.id, ts: "2024-06-01T10:15:00Z" },
    { id:"a3",  userId:"u3", userName:"Ravi Operator", email:"operator@idforge.ai",   action:"card_generate",   module:"Manual",     details:"Generated card for Amit Kumar",      org: org1.id, ts: "2024-06-01T11:30:00Z" },
    { id:"a4",  userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"user_create",     module:"Users",      details:"Created user operator@idforge.ai",  org: org1.id, ts: "2024-06-02T08:45:00Z" },
    { id:"a5",  userId:"u2", userName:"Admin User",    email:"admin@idforge.ai",      action:"template_upload", module:"Templates",  details:"Uploaded School ID template",        org: org1.id, ts: "2024-06-02T09:20:00Z" },
    { id:"a6",  userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"role_change",     module:"Users",      details:"Changed viewer@idforge.ai → Viewer", org: org1.id, ts: "2024-06-03T14:00:00Z" },
    { id:"a7",  userId:"u4", userName:"Priya Viewer",  email:"viewer@idforge.ai",     action:"download",        module:"Cards",      details:"Downloaded 12 ID cards (ZIP)",       org: org1.id, ts: "2024-06-04T16:30:00Z" },
    { id:"a8",  userId:"u3", userName:"Ravi Operator", email:"operator@idforge.ai",   action:"login_failed",    module:"Auth",       details:"Invalid password (attempt 1/5)",     org: org1.id, ts: "2024-06-05T08:00:00Z" },
    { id:"a9",  userId:"u2", userName:"Admin User",    email:"admin@idforge.ai",      action:"bulk_generate",   module:"AI Builder", details:"Generated 555 cards",               org: org1.id, ts: "2024-06-05T11:00:00Z" },
    { id:"a10", userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"settings_change", module:"Settings",   details:"Updated organization branding",      org: org1.id, ts: "2024-06-06T10:00:00Z" },
  ];

  for (const l of seedLogs) {
    await prisma.auditLog.upsert({
      where:  { id: l.id },
      update: {},
      create: {
        id: l.id, userId: l.userId, userName: l.userName, email: l.email,
        action: l.action, module: l.module, details: l.details,
        organizationId: l.org, ipAddress: "192.168.1.10",
        timestamp: new Date(l.ts),
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
