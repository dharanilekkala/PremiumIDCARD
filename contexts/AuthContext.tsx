"use client";
import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import {
  hasPermission, canAccessRoute,
  type AuthSession, type User, type UserRole,
} from "@/lib/auth";
import {
  apiLogin, apiLogout, apiGetSession,
  type ApiSession,
} from "@/lib/api";
import { addLog } from "@/lib/auditLog";

// ── Context shape ─────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function apiSessionToAuthSession(s: ApiSession): AuthSession {
  return {
    userId:           s.userId,
    email:            s.email,
    name:             s.name,
    role:             s.role as UserRole,
    organizationId:   s.organizationId,
    organizationName: s.organizationName,
    orgType:          s.orgType,
  };
}

function sessionToUser(s: AuthSession): User {
  return {
    id:             s.userId,
    name:           s.name,
    email:          s.email,
    role:           s.role,
    organizationId: s.organizationId,
    status:         "active",
    lastLogin:      null,
    createdAt:      new Date().toISOString(),
    failedAttempts: 0,
    lockedUntil:    null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    try {
      const apiSess = await apiGetSession();
      if (apiSess) {
        const s = apiSessionToAuthSession(apiSess);
        setSession(s);
        setUser(sessionToUser(s));
      } else {
        setSession(null);
        setUser(null);
      }
    } catch {
      setSession(null);
      setUser(null);
    }
  }, []);

  // Bootstrap on mount
  useEffect(() => {
    reloadUser().finally(() => setLoading(false));
  }, [reloadUser]);

  const login = useCallback(async (
    email: string, password: string, _rememberMe = false
  ): Promise<LoginResult> => {
    try {
      const apiSess = await apiLogin(email, password);
      const s = apiSessionToAuthSession(apiSess);
      setSession(s);
      setUser(sessionToUser(s));
      // Fire-and-forget audit log (login already logged server-side; skip duplicate)
      return { ok: true, session: s };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      // Log failed attempt client-side only (server already logged it)
      void addLog({ action: "login_failed", module: "Auth", details: msg });
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    if (session) {
      void addLog({ action: "logout", module: "Auth", details: "User logged out" });
    }
    try { await apiLogout(); } catch { /* ignore */ }
    setSession(null);
    setUser(null);
  }, [session]);

  const logoutAll = useCallback(async () => {
    if (session) {
      void addLog({ action: "logout_all", module: "Auth", details: "Logged out from all devices" });
    }
    try { await apiLogout(); } catch { /* ignore */ }
    setSession(null);
    setUser(null);
  }, [session]);

  const can      = useCallback((perm: string) => session ? hasPermission(session.role, perm) : false, [session]);
  const canRoute = useCallback((path: string) => session ? canAccessRoute(session.role, path) : false, [session]);

  return (
    <AuthContext.Provider value={{
      session, user, loading, login, logout, logoutAll,
      can, canRoute, role: session?.role ?? null, reloadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
