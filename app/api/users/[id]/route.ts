/**
 * GET    /api/users/[id]
 * PATCH  /api/users/[id]        — update profile / role / status
 * DELETE /api/users/[id]
 *
 * Special PATCH actions (via body.action):
 *   "reset_password"  — admin sets a new password for a user
 *   "change_password" — user changes own password (requires body.currentPassword)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";
import { hashPassword, verifyPassword } from "@/lib/server/password";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { organization: { select: { name: true, orgType: true } } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Non-SuperAdmin can only access users in their org
  if (session.role !== "SuperAdmin" && user.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role !== "SuperAdmin" && target.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Special action: change own password
    if (body.action === "change_password") {
      if (session.userId !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const ok = await verifyPassword(body.currentPassword, target.passwordHash);
      if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

      const passwordHash = await hashPassword(body.newPassword);
      const user = await prisma.user.update({ where: { id }, data: { passwordHash } });

      await prisma.auditLog.create({
        data: {
          userId: session.userId, userName: session.name, email: session.email,
          action: "password_change", module: "Users",
          details: "Changed own password",
          organizationId: session.organizationId,
          ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        },
      });

      return NextResponse.json({ user });
    }

    // Special action: admin resets another user's password
    if (body.action === "reset_password") {
      if (session.role !== "SuperAdmin" && session.role !== "Admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const passwordHash = await hashPassword(body.newPassword);
      const user = await prisma.user.update({ where: { id }, data: { passwordHash, failedAttempts: 0, lockedUntil: null } });

      await prisma.auditLog.create({
        data: {
          userId: session.userId, userName: session.name, email: session.email,
          action: "password_reset", module: "Users",
          details: `Reset password for: ${target.email}`,
          organizationId: session.organizationId,
          ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        },
      });

      return NextResponse.json({ user });
    }

    // General field update
    if (session.role !== "SuperAdmin" && session.role !== "Admin" && session.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed = ["name", "role", "status", "phone"];
    // Only SuperAdmin/Admin can change roles
    if (session.role !== "SuperAdmin" && session.role !== "Admin") {
      allowed.splice(allowed.indexOf("role"), 1);
      allowed.splice(allowed.indexOf("status"), 1);
    }

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const user = await prisma.user.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: {
        userId: session.userId, userName: session.name, email: session.email,
        action: "user_update", module: "Users",
        details: `Updated user: ${target.email}`,
        organizationId: session.organizationId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[PATCH /api/users/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "SuperAdmin" && session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (session.userId === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.role === "Admin" && target.organizationId !== session.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId, userName: session.name, email: session.email,
        action: "user_delete", module: "Users",
        details: `Deleted user: ${target.email}`,
        organizationId: session.organizationId,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/users/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
