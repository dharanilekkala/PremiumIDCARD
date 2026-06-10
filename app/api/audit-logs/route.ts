/**
 * GET  /api/audit-logs  — list logs (SuperAdmin: all; others: own org)
 * POST /api/audit-logs  — create a log entry
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const orgId = url.searchParams.get("organizationId");

  const take = limitParam ? parseInt(limitParam, 10) : 500;

  const where =
    session.role === "SuperAdmin"
      ? orgId ? { organizationId: orgId } : {}
      : { organizationId: session.organizationId };

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take,
  });

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, module, details, ipAddress } = await req.json();

    if (!action || !module || !details) {
      return NextResponse.json({ error: "action, module, and details are required" }, { status: 400 });
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: session.name,
        email: session.email,
        action,
        module,
        details,
        organizationId: session.organizationId,
        ipAddress: ipAddress ?? req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/audit-logs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
