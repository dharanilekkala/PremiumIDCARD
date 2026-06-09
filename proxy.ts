/**
 * proxy.ts — Next.js 16 Proxy (formerly middleware.ts)
 * Protects all /dashboard routes. Redirects unauthenticated users to /login.
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE      = "idforge_token";
const PUBLIC_PFXS = ["/login", "/forgot-password", "/reset-password"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: landing page, public auth pages, static assets, API routes
  if (
    pathname === "/" ||
    PUBLIC_PFXS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/models/") ||
    pathname.includes(".")               // static files (svg, ico, etc.)
  ) {
    return NextResponse.next();
  }

  // Require auth for all /dashboard/* routes
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validate token (base64 JSON with exp field)
  try {
    const token = JSON.parse(atob(decodeURIComponent(raw)));
    if (!token.exp || token.exp < Math.floor(Date.now() / 1000)) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete(COOKIE);
      return res;
    }
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
