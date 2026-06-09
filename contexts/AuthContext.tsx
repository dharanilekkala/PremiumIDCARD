"use client";
import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import {
  getSession, login as authLogin, logout as authLogout, logoutAll as authLogoutAll,
  refreshSession, getUsers, hasPermission, canAccessRoute,
  type AuthSession, type User, type LoginResult, type UserRole,
} from "@/lib/auth";
import { addLog } from "@/lib/auditLog";

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthCtx {
  session:      AuthSession | null;
  user:         User | null;
  loading:      boolean;
  login:        (email: string, password: string, rememberMe?: boolean) => LoginResult;
  logout:       () => void;
  logoutAll:    () => void;
  can:          (perm: string) => boolean;
  canRoute:     (path: string) => boolean;
  role:         UserRole | null;
  reloadUser:   () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback((s: AuthSession | null) => {
    if (!s) { setUser(null); return; }
    const found = getUsers().find(u => u.id === s.userId) ?? null;
    setUser(found);
  }, []);

  const reloadUser = useCallback(() => {
    const s = getSession();
    setSession(s);
    loadUser(s);
  }, [loadUser]);

  // Bootstrap on mount
  useEffect(() => {
    refreshSession();          // re-sync cookie from localStorage
    const s = getSession();
    setSession(s);
    loadUser(s);
    setLoading(false);
  }, [loadUser]);

  const login = useCallback((email: string, password: string, rememberMe = false): LoginResult => {
    const result = authLogin(email, password, rememberMe);
    if (result.ok) {
      setSession(result.session);
      loadUser(result.session);
      addLog({
        userId: result.session.userId, userName: result.session.name,
        email: result.session.email, action: "login",
        module: "Auth", details: "Successful login",
      });
    } else {
      addLog({
        userId: "unknown", userName: "—", email,
        action: result.error === "account_locked" ? "account_locked" : "login_failed",
        module: "Auth",
        details: `Login failed: ${result.error}`,
      });
    }
    return result;
  }, [loadUser]);

  const logout = useCallback(() => {
    if (session) {
      addLog({
        userId: session.userId, userName: session.name, email: session.email,
        action: "logout", module: "Auth", details: "User logged out",
      });
    }
    authLogout();
    setSession(null);
    setUser(null);
  }, [session]);

  const logoutAll = useCallback(() => {
    if (session) {
      addLog({
        userId: session.userId, userName: session.name, email: session.email,
        action: "logout_all", module: "Auth", details: "Logged out from all devices",
      });
    }
    authLogoutAll();
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
