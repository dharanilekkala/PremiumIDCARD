/**
 * proxy.ts — Next.js 16 Proxy (no auth — open access)
 */
import { NextRequest, NextResponse } from "next/server";

export async function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
