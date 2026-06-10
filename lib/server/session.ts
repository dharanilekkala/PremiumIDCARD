/**
 * lib/server/session.ts
 * Extract and verify the session from the request cookie.
 * Works in both Node.js API routes and Edge (proxy.ts).
 */
import { type NextRequest } from "next/server";
import { verifyToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "idforge_session";

/** Parse the session from a Next.js request; returns null if missing/invalid */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Parse the session from a plain Cookie header string */
export async function getSessionFromCookieHeader(cookieHeader: string | null): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = match.slice(SESSION_COOKIE.length + 1);
  return verifyToken(token);
}
