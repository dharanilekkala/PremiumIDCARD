/**
 * POST /api/auth/signup
 * Register a new organization + admin user.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { signToken } from "@/lib/server/jwt";
import { SESSION_COOKIE } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  try {
    const { orgName, orgType, adminName, adminEmail, phone, address, password } = await req.json();

    if (!orgName || !orgType || !adminName || !adminEmail || !password) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create org + admin user in a transaction
    const { org, user } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName.trim(),
          orgType,
          adminEmail: adminEmail.toLowerCase().trim(),
          adminName: adminName.trim(),
          phone: phone?.trim() ?? null,
          address: address?.trim() ?? null,
        },
      });

      const user = await tx.user.create({
        data: {
          name: adminName.trim(),
          email: adminEmail.toLowerCase().trim(),
          passwordHash,
          role: "Admin",
          organizationId: org.id,
          status: "active",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          email: user.email,
          action: "register",
          module: "Auth",
          details: `New organization registered: ${org.name}`,
          organizationId: org.id,
          ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        },
      });

      return { org, user };
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org.id,
      organizationName: org.name,
    });

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: org.id,
      organizationName: org.name,
      orgType: org.orgType,
    };

    const res = NextResponse.json({ success: true, session }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    console.error("[/api/auth/signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
