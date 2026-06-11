"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { AuthSession, User, UserRole } from "@/lib/auth";

// No-auth stub — full access, no login required
const GUEST_SESSION: AuthSession = {
  userId:           "guest",
  email:            "you@idforge.ai",
  name:             "Guest User",
  role:             "Admin" as UserRole,
  organizationId:   "default",
  organizationName: "My Organization",
  orgType:          "school",
};

const GUEST_USER: User = {
  id:             "guest",
  name:           "Guest User",
  email:          "you@idforge.ai",
  role:           "Admin" as UserRole,
  organizationId: "default",
  status:         "active",
  lastLogin:      null,
  createdAt:      new Date().toISOString(),
  failedAttempts: 0,
  lockedUntil:    null,
};

export type LoginResult =
  | { ok: true;  session: AuthSession }
  | { ok: false; error: string };

interface AuthCtx {
  session:    AuthSession | null;
  user:       User | null;
  loading:    boolean;
  login:      (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
  logout:     () => Promise<void>;
  logoutAll:  () => Promise<void>;
  can:        (perm: string) => boolean;
  canRoute:   (path: string) => boolean;
  role:       UserRole | null;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthCtx = {
    session:    GUEST_SESSION,
    user:       GUEST_USER,
    loading:    false,
    login:      async () => ({ ok: true, session: GUEST_SESSION }),
    logout:     async () => {},
    logoutAll:  async () => {},
    can:        () => true,
    canRoute:   () => true,
    role:       "Admin" as UserRole,
    reloadUser: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
