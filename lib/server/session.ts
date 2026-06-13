/**
 * lib/server/session.ts
 * Extract and verify the session from the request cookie.
 * Works in both Node.js API routes and Edge (proxy.ts).
 *
 * No-auth mode: when no cookie is present, a guest Admin session is returned
 * so all API routes work without login.
 */
import { type NextRequest } from "next/server";
import { verifyToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "idforge_session";

const GUEST_SESSION: SessionPayload = {
  userId:           "guest",
  email:            "you@idforge.ai",
  name:             "Guest User",
  role:             "Admin",
  organizationId:   "default",
  organizationName: "My Organization",
};

/** Parse the session from a Next.js request; falls back to guest in no-auth mode */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return GUEST_SESSION;
  return (await verifyToken(token)) ?? GUEST_SESSION;
}

/** Parse the session from a plain Cookie header string */
export async function getSessionFromCookieHeader(cookieHeader: string | null): Promise<SessionPayload> {
  if (!cookieHeader) return GUEST_SESSION;
  const match = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return GUEST_SESSION;
  const token = match.slice(SESSION_COOKIE.length + 1);
  return (await verifyToken(token)) ?? GUEST_SESSION;
}
