/**
 * lib/server/password.ts
 * bcrypt helpers — Node.js runtime only (never import in Edge).
 */
import bcrypt from "bcryptjs";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
