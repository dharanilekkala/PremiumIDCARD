/**
 * proxy.ts — Next.js 16 Proxy (route protection + RBAC)
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects all /dashboard routes. Redirects unauthenticated users to /login.
 * Also enforces role-based access for sensitive admin routes.
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE      = "idforge_token";
const PUBLIC_PFXS = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Only SuperAdmin can access these
const SUPERADMIN_ONLY = ["/dashboard/admin", "/dashboard/organizations"];

// Admin and above required
const ADMIN_PLUS = [
  "/dashboard/users",
  "/dashboard/analytics",
  "/dashboard/security",
  "/dashboard/audit-logs",
];

interface MinSession { role: string; exp: number; }

function parseToken(raw: string): MinSession | null {
  try {
    return JSON.parse(atob(decodeURIComponent(raw))) as MinSession;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: landing page, public auth pages, static assets, API routes, signup
  if (
    pathname === "/" ||
    PUBLIC_PFXS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/pricing") ||
    pathname.includes(".")               // static files (svg, ico, etc.)
  ) {
    return NextResponse.next();
  }

  // Require auth for all /dashboard/* routes
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Validate token (base64 JSON with exp field)
  const session = parseToken(raw);
  if (!session || session.exp < Math.floor(Date.now() / 1000)) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(COOKIE);
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
