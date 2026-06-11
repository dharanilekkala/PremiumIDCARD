/**
 * POST /api/auth/login
 * Validates credentials, returns a signed JWT in an httpOnly cookie.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/password";
import { signToken } from "@/lib/server/jwt";
import { SESSION_COOKIE } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (email.length > 320 || password.length > 1024) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Account status checks
    if (user.status === "inactive") {
      return NextResponse.json({ error: "Account is inactive. Contact your administrator." }, { status: 403 });
    }

    // Lock check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Try again in ${mins} minute(s).` },
        { status: 403 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, lockedUntil: lockUntil },
      });
      const remaining = 5 - attempts;
      const msg = remaining > 0
        ? `Invalid credentials. ${remaining} attempt(s) remaining.`
        : "Account locked for 15 minutes due to too many failed attempts.";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // Reset failed attempts, update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    });

    // Log the login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        email: user.email,
        action: "login",
        module: "Auth",
        details: "Successful login",
        organizationId: user.organizationId,
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
      },
    });

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    });

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      orgType: user.organization.orgType,
    };

    const res = NextResponse.json({ success: true, session });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
