/**
 * GET /api/auth/session
 * Returns current session info from the JWT cookie (no DB query needed).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ session: null }, { status: 200 });
  }
  return NextResponse.json({
    session: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      organizationId: session.organizationId,
      organizationName: session.organizationName,
    },
  });
}
