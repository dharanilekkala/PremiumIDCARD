/**
 * GET  /api/users  — list users (SuperAdmin: all; Admin/others: own org)
 * POST /api/users  — create user (SuperAdmin or Admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";
import { hashPassword } from "@/lib/server/password";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId");

  const where =
    session.role === "SuperAdmin"
      ? orgId ? { organizationId: orgId } : {}
      : { organizationId: session.organizationId };

  const users = await prisma.user.findMany({
    where,
    include: { organization: { select: { name: true, orgType: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "SuperAdmin" && session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, role, organizationId, password } = await req.json();

    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Admin can only create users in their own org
    const orgId = session.role === "SuperAdmin" ? (organizationId ?? session.organizationId) : session.organizationId;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        organizationId: orgId,
        status: "active",
      },
      include: { organization: { select: { name: true, orgType: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: session.name,
        email: session.email,
        action: "user_create",
        module: "Users",
        details: `Created user: ${user.email}`,
        organizationId: session.organizationId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
