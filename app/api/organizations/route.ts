/**
 * GET  /api/organizations  — list all orgs (SuperAdmin sees all; Admin sees own)
 * POST /api/organizations  — create a new org (SuperAdmin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = session.role === "SuperAdmin"
    ? await prisma.organization.findMany({ orderBy: { createdAt: "desc" } })
    : await prisma.organization.findMany({
        where: { id: session.organizationId },
        orderBy: { createdAt: "desc" },
      });

  return NextResponse.json({ organizations: orgs });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "SuperAdmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, orgType, adminEmail, adminName, phone, address } = await req.json();
    if (!name || !orgType || !adminEmail || !adminName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const org = await prisma.organization.create({
      data: { name, orgType, adminEmail, adminName, phone: phone ?? null, address: address ?? null },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: session.name,
        email: session.email,
        action: "org_create",
        module: "Organizations",
        details: `Created organization: ${org.name}`,
        organizationId: org.id,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });

    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/organizations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
