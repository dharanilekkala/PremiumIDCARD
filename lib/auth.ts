/**
 * lib/auth.ts — Types, RBAC constants, and pure client-side utilities.
 * All data fetching has moved to lib/api.ts (API routes) and lib/server/*.ts
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole   = "SuperAdmin" | "Admin" | "Operator" | "Viewer";
export type UserStatus = "active" | "inactive" | "suspended" | "locked";

export type OrgCategory =
  | "school" | "college" | "university" | "coaching"
  | "corporate" | "hospital" | "event" | "custom";

export interface User {
  id:             string;
  name:           string;
  email:          string;
  passwordHash?:  string;
  role:           UserRole;
  organizationId: string;
  status:         UserStatus;
  lastLogin:      string | null;
  createdAt:      string;
  failedAttempts: number;
  lockedUntil:    string | null;
  organization?:  { name: string; orgType: string };
}

export interface Organization {
  id:         string;
  name:       string;
  orgType:    OrgCategory;
  status:     "active" | "suspended";
  adminEmail: string;
  adminName:  string;
  phone?:     string | null;
  address?:   string | null;
  createdAt:  string;
}

export interface AuthSession {
  userId:           string;
  email:            string;
  name:             string;
  role:             UserRole;
  organizationId:   string;
  organizationName: string;
  orgType?:         string;
}

export type LoginError =
  | "invalid_credentials"
  | "account_locked"
  | "account_inactive"
  | "account_suspended";

export type LoginResult =
  | { ok: true;  session: AuthSession }
  | { ok: false; error: LoginError; minutesLeft?: number };

// ── RBAC ──────────────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SuperAdmin: [
    "manage:organizations", "manage:users", "manage:templates",
    "generate:cards",       "delete:cards", "view:analytics",
    "view:audit_logs",      "manage:roles",
    "bulk:generate",        "upload:excel", "upload:photos",
    "view:cards",           "download:cards",
  ],
  Admin: [
    "manage:users", "manage:templates", "generate:cards",
    "bulk:generate", "view:analytics",  "upload:excel",
    "upload:photos", "view:cards",      "download:cards",
  ],
  Operator: [
    "generate:cards", "bulk:generate", "upload:excel",
    "upload:photos",  "view:cards",    "download:cards",
  ],
  Viewer: ["view:cards", "download:cards"],
};

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard/ai-builder":     ["SuperAdmin", "Admin", "Operator"],
  "/dashboard/manual-builder": ["SuperAdmin", "Admin", "Operator"],
  "/dashboard/bulk":           ["SuperAdmin", "Admin", "Operator"],
  "/dashboard/analytics":      ["SuperAdmin", "Admin"],
  "/dashboard/users":          ["SuperAdmin", "Admin"],
  "/dashboard/settings":       ["SuperAdmin"],
  "/dashboard/security":       ["SuperAdmin", "Admin"],
  "/dashboard/audit-logs":     ["SuperAdmin", "Admin"],
  "/dashboard/organizations":  ["SuperAdmin"],
  "/dashboard/admin":          ["SuperAdmin"],
};

export const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  SuperAdmin: { label:"Super Admin", color:"text-amber-400",  bg:"bg-amber-500/10",  border:"border-amber-500/20"  },
  Admin:      { label:"Admin",       color:"text-violet-400", bg:"bg-violet-500/10", border:"border-violet-500/20" },
  Operator:   { label:"Operator",    color:"text-cyan-400",   bg:"bg-cyan-500/10",   border:"border-cyan-500/20"   },
  Viewer:     { label:"Viewer",      color:"text-white/50",   bg:"bg-white/5",       border:"border-white/10"      },
};

export const ALL_ROLES: UserRole[] = ["SuperAdmin", "Admin", "Operator", "Viewer"];

export const ORG_CATEGORY_META: Record<OrgCategory, { label: string; icon: string; color: string }> = {
  school:     { label: "School",      icon: "🏫", color: "text-brand-400"   },
  college:    { label: "College",     icon: "🎓", color: "text-emerald-400" },
  university: { label: "University",  icon: "🏛️", color: "text-amber-400"   },
  coaching:   { label: "Coaching",    icon: "📚", color: "text-cyan-400"    },
  corporate:  { label: "Corporate",   icon: "🏢", color: "text-violet-400"  },
  hospital:   { label: "Hospital",    icon: "🏥", color: "text-red-400"     },
  event:      { label: "Events",      icon: "🎪", color: "text-pink-400"    },
  custom:     { label: "Custom",      icon: "⚙️",  color: "text-white/50"   },
};

// ── Pure utilities ────────────────────────────────────────────────────────────

export function hasPermission(role: UserRole, perm: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function getUserInitials(name: string): string {
  return name.split(" ").map(p => p[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}
