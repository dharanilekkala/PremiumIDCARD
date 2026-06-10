/**
 * proxy.ts — Next.js 16 Proxy (route protection + RBAC)
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects all /dashboard routes. Redirects unauthenticated users to /login.
 * Enforces role-based access for sensitive admin routes.
 * Uses HMAC-SHA256 JWT via `jose` (Edge-compatible).
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "idforge_session";
const PUBLIC_PFXS    = ["/login", "/signup", "/forgot-password", "/reset-password"];

const SUPERADMIN_ONLY = ["/dashboard/admin", "/dashboard/organizations"];
const ADMIN_PLUS = [
  "/dashboard/users",
  "/dashboard/analytics",
  "/dashboard/security",
  "/dashboard/audit-logs",
];

interface MinSession { role: string; exp: number; userId: string; }

async function verifyJwt(token: string): Promise<MinSession | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as MinSession;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: landing page, public auth pages, static assets, API routes
  if (
    pathname === "/" ||
    PUBLIC_PFXS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/pricing") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Require auth for all /dashboard/* routes
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyJwt(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  // Role-based route protection
  if (SUPERADMIN_ONLY.some(p => pathname.startsWith(p)) && session.role !== "SuperAdmin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (ADMIN_PLUS.some(p => pathname.startsWith(p)) && !["SuperAdmin", "Admin"].includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
