/**
 * prisma/seed.ts — Seeds the database with demo data.
 * Run with: npx prisma db seed
 *
 * Strategy:
 *  - Organizations and Users: upsert by unique email fields (safe to re-run)
 *  - AuditLogs: created once on a fresh DB (skipped if logs already exist)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL env var is not set");
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database…");
  const pw = await bcrypt.hash("Admin@1234", 12);

  // ── Organizations ────────────────────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where:  { adminEmail: "superadmin@idforge.ai" },
    update: {},
    create: {
      name: "IDForge Demo Corp", orgType: "corporate",
      status: "active", adminEmail: "superadmin@idforge.ai",
      adminName: "Super Admin", phone: "+91 98765 00001",
    },
  });

  const org2 = await prisma.organization.upsert({
    where:  { adminEmail: "sunita@acmeschool.edu" },
    update: {},
    create: {
      name: "Acme School Board", orgType: "school",
      status: "active", adminEmail: "sunita@acmeschool.edu",
      adminName: "Sunita Sharma", phone: "+91 98765 00002",
    },
  });

  // ── Users ────────────────────────────────────────────────────────────────────
  const u1 = await prisma.user.upsert({
    where:  { email: "superadmin@idforge.ai" },
    update: {},
    create: { name: "Super Admin",   email: "superadmin@idforge.ai", passwordHash: pw, role: "SuperAdmin", organizationId: org1.id, status: "active" },
  });
  const u2 = await prisma.user.upsert({
    where:  { email: "admin@idforge.ai" },
    update: {},
    create: { name: "Admin User",    email: "admin@idforge.ai",      passwordHash: pw, role: "Admin",      organizationId: org1.id, status: "active" },
  });
  const u3 = await prisma.user.upsert({
    where:  { email: "operator@idforge.ai" },
    update: {},
    create: { name: "Ravi Operator", email: "operator@idforge.ai",   passwordHash: pw, role: "Operator",   organizationId: org1.id, status: "active" },
  });
  const u4 = await prisma.user.upsert({
    where:  { email: "viewer@idforge.ai" },
    update: {},
    create: { name: "Priya Viewer",  email: "viewer@idforge.ai",     passwordHash: pw, role: "Viewer",     organizationId: org1.id, status: "active" },
  });
  await prisma.user.upsert({
    where:  { email: "sunita@acmeschool.edu" },
    update: {},
    create: { name: "Sunita Sharma", email: "sunita@acmeschool.edu", passwordHash: pw, role: "Admin",      organizationId: org2.id, status: "active" },
  });
  await prisma.user.upsert({
    where:  { email: "vikram@idforge.ai" },
    update: {},
    create: { name: "Vikram Mehta",  email: "vikram@idforge.ai",     passwordHash: pw, role: "Operator",   organizationId: org1.id, status: "inactive" },
  });

  // ── Audit Logs ───────────────────────────────────────────────────────────────
  // Only seed logs on a fresh database; skip if any already exist.
  const existingLogs = await prisma.auditLog.count();
  if (existingLogs === 0) {
    await prisma.auditLog.createMany({
      data: [
        { userId: u1.id, userName: "Super Admin",   email: "superadmin@idforge.ai", action: "login",           module: "Auth",       details: "Successful login",                    organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-01T09:00:00Z") },
        { userId: u2.id, userName: "Admin User",    email: "admin@idforge.ai",      action: "bulk_generate",   module: "AI Builder", details: "Generated 125 cards",                organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-01T10:15:00Z") },
        { userId: u3.id, userName: "Ravi Operator", email: "operator@idforge.ai",   action: "card_generate",   module: "Manual",     details: "Generated card for Amit Kumar",       organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-01T11:30:00Z") },
        { userId: u1.id, userName: "Super Admin",   email: "superadmin@idforge.ai", action: "user_create",     module: "Users",      details: "Created user operator@idforge.ai",   organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-02T08:45:00Z") },
        { userId: u2.id, userName: "Admin User",    email: "admin@idforge.ai",      action: "template_upload", module: "Templates",  details: "Uploaded School ID template",         organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-02T09:20:00Z") },
        { userId: u1.id, userName: "Super Admin",   email: "superadmin@idforge.ai", action: "role_change",     module: "Users",      details: "Changed viewer@idforge.ai to Viewer", organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-03T14:00:00Z") },
        { userId: u4.id, userName: "Priya Viewer",  email: "viewer@idforge.ai",     action: "download",        module: "Cards",      details: "Downloaded 12 ID cards (ZIP)",        organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-04T16:30:00Z") },
        { userId: u3.id, userName: "Ravi Operator", email: "operator@idforge.ai",   action: "login_failed",    module: "Auth",       details: "Invalid password (attempt 1/5)",      organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-05T08:00:00Z") },
        { userId: u2.id, userName: "Admin User",    email: "admin@idforge.ai",      action: "bulk_generate",   module: "AI Builder", details: "Generated 555 cards",                organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-05T11:00:00Z") },
        { userId: u1.id, userName: "Super Admin",   email: "superadmin@idforge.ai", action: "settings_change", module: "Settings",   details: "Updated organization branding",       organizationId: org1.id, ipAddress: "192.168.1.10", timestamp: new Date("2024-06-06T10:00:00Z") },
      ],
    });
    console.log("Audit logs seeded.");
  } else {
    console.log(`Skipping audit logs — ${existingLogs} already exist.`);
  }

  console.log("Seed complete.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
