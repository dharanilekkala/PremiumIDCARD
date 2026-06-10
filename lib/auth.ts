/**
 * lib/auth.ts — Client-side Auth Store & Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Full enterprise auth: JWT-style sessions, RBAC, account lock, multi-tenant.
 * Storage: localStorage (users) + cookie (session token for middleware).
 * In production: replace with real API + httpOnly server-set cookies.
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
  passwordHash:   string;
  role:           UserRole;
  organizationId: string;
  status:         UserStatus;
  lastLogin:      string | null;
  createdAt:      string;
  failedAttempts: number;
  lockedUntil:    string | null;
}

export interface Organization {
  id:               string;
  name:             string;
  orgType:          OrgCategory;
  status:           "active" | "suspended";
  adminEmail:       string;
  adminName:        string;
  phone?:           string;
  address?:         string;
  createdAt:        string;
}

export interface AuthSession {
  userId:         string;
  email:          string;
  name:           string;
  role:           UserRole;
  organizationId: string;
  exp:            number;   // Unix seconds
  iat:            number;
}

// ── Permissions ───────────────────────────────────────────────────────────────

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

// Dashboard route → allowed roles
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

export function hasPermission(role: UserRole, perm: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return true;
  return allowed.includes(role);
}

// ── Password (simulated hash — in prod: bcrypt on server) ─────────────────────

function doHash(plain: string): string {
  return btoa(encodeURIComponent(`idforge::${plain}::v3`));
}
export function hashPw(plain: string): string { return doHash(plain); }
export function verifyPw(plain: string, hashed: string): boolean {
  return doHash(plain) === hashed;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_ORG_ID = "org1";

const SEED_ORGS: Organization[] = [
  {
    id: "org1", name: "IDForge Demo Corp", orgType: "corporate",
    status: "active",
    adminEmail: "superadmin@idforge.ai", adminName: "Super Admin",
    phone: "+91 98765 00001", createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "org2", name: "Acme School Board", orgType: "school",
    status: "active",
    adminEmail: "sunita@acmeschool.edu", adminName: "Sunita Sharma",
    phone: "+91 98765 00002", createdAt: "2024-04-10T00:00:00Z",
  },
];

function makeSeedUsers(): User[] {
  const h = doHash("Admin@1234");
  return [
    { id:"u1", name:"Super Admin",    email:"superadmin@idforge.ai",  passwordHash:h, role:"SuperAdmin", organizationId:"org1", status:"active", lastLogin:null, createdAt:"2024-01-01T00:00:00Z", failedAttempts:0, lockedUntil:null },
    { id:"u2", name:"Admin User",     email:"admin@idforge.ai",       passwordHash:h, role:"Admin",      organizationId:"org1", status:"active", lastLogin:null, createdAt:"2024-02-01T00:00:00Z", failedAttempts:0, lockedUntil:null },
    { id:"u3", name:"Ravi Operator",  email:"operator@idforge.ai",    passwordHash:h, role:"Operator",   organizationId:"org1", status:"active", lastLogin:null, createdAt:"2024-03-01T00:00:00Z", failedAttempts:0, lockedUntil:null },
    { id:"u4", name:"Priya Viewer",   email:"viewer@idforge.ai",      passwordHash:h, role:"Viewer",     organizationId:"org1", status:"active", lastLogin:null, createdAt:"2024-04-01T00:00:00Z", failedAttempts:0, lockedUntil:null },
    { id:"u5", name:"Sunita Sharma",  email:"sunita@acmeschool.edu",  passwordHash:h, role:"Admin",      organizationId:"org2", status:"active", lastLogin:null, createdAt:"2024-04-10T00:00:00Z", failedAttempts:0, lockedUntil:null },
    { id:"u6", name:"Vikram Mehta",   email:"vikram@idforge.ai",      passwordHash:h, role:"Operator",   organizationId:"org1", status:"inactive",lastLogin:null, createdAt:"2024-05-01T00:00:00Z", failedAttempts:0, lockedUntil:null },
  ];
}

// ── localStorage keys ─────────────────────────────────────────────────────────

const LS_USERS  = "idforge_users";
const LS_ORGS   = "idforge_orgs";
const LS_TOKEN  = "idforge_session";
const CK_TOKEN  = "idforge_token";
const MAX_FAIL  = 5;
const LOCK_MINS = 30;

// ── Store helpers ─────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  if (typeof window === "undefined") return makeSeedUsers();
  try {
    const raw = localStorage.getItem(LS_USERS);
    if (!raw) { const seed = makeSeedUsers(); localStorage.setItem(LS_USERS, JSON.stringify(seed)); return seed; }
    return JSON.parse(raw);
  } catch { return makeSeedUsers(); }
}

function saveUsers(u: User[]): void { localStorage.setItem(LS_USERS, JSON.stringify(u)); }

export function getOrganizations(): Organization[] {
  if (typeof window === "undefined") return SEED_ORGS;
  try {
    const raw = localStorage.getItem(LS_ORGS);
    if (!raw) { localStorage.setItem(LS_ORGS, JSON.stringify(SEED_ORGS)); return SEED_ORGS; }
    const orgs = JSON.parse(raw) as Organization[];
    // Migrate old records missing new fields (defaults applied after spread)
    return orgs.map(o => ({
      ...o,
      orgType:    (o.orgType    ?? "custom") as OrgCategory,
      adminEmail: o.adminEmail ?? "",
      adminName:  o.adminName  ?? "",
      createdAt:  o.createdAt  ?? "2024-01-01T00:00:00Z",
    }));
  } catch { return SEED_ORGS; }
}

function saveOrganizations(orgs: Organization[]): void {
  localStorage.setItem(LS_ORGS, JSON.stringify(orgs));
}

export function getOrgById(id: string): Organization | undefined {
  return getOrganizations().find(o => o.id === id);
}

export function createOrganization(data: {
  name: string; orgType: OrgCategory; adminEmail: string; adminName: string;
  phone?: string; address?: string;
}): { ok: boolean; org?: Organization; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "Server context" };
  const orgs = getOrganizations();
  const org: Organization = {
    id: `org${Date.now()}`,
    name: data.name, orgType: data.orgType,
    status: "active",
    adminEmail: data.adminEmail, adminName: data.adminName,
    phone: data.phone, address: data.address,
    createdAt: new Date().toISOString(),
  };
  saveOrganizations([...orgs, org]);
  return { ok: true, org };
}

export function updateOrganization(id: string, patch: Partial<Omit<Organization, "id" | "createdAt">>): boolean {
  const orgs = getOrganizations();
  const idx  = orgs.findIndex(o => o.id === id);
  if (idx < 0) return false;
  orgs[idx] = { ...orgs[idx], ...patch };
  saveOrganizations(orgs);
  return true;
}

export function deleteOrganization(id: string): boolean {
  const orgs = getOrganizations();
  const next = orgs.filter(o => o.id !== id);
  if (next.length === orgs.length) return false;
  saveOrganizations(next);
  return true;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

function encodeSession(s: AuthSession): string { return btoa(JSON.stringify(s)); }
function decodeSession(t: string): AuthSession | null {
  try { return JSON.parse(atob(t)); } catch { return null; }
}
function setCookie(token: string, rememberMe: boolean): void {
  const age = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  document.cookie = `${CK_TOKEN}=${encodeURIComponent(token)};path=/;max-age=${age};SameSite=Strict`;
}
function clearCookie(): void {
  document.cookie = `${CK_TOKEN}=;path=/;max-age=0;SameSite=Strict`;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export type LoginError =
  | "invalid_credentials"
  | "account_locked"
  | "account_inactive"
  | "account_suspended";

export type LoginResult =
  | { ok: true;  session: AuthSession }
  | { ok: false; error: LoginError; minutesLeft?: number };

export function login(email: string, password: string, rememberMe = false): LoginResult {
  const users = getUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: "invalid_credentials" };

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const left = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    return { ok: false, error: "account_locked", minutesLeft: left };
  }
  if (user.status === "suspended") return { ok: false, error: "account_suspended" };
  if (user.status === "inactive")  return { ok: false, error: "account_inactive" };

  if (!verifyPw(password, user.passwordHash)) {
    const fails = (user.failedAttempts ?? 0) + 1;
    const lock  = fails >= MAX_FAIL;
    saveUsers(users.map(u => u.id !== user.id ? u : {
      ...u,
      failedAttempts: fails,
      ...(lock ? { lockedUntil: new Date(Date.now() + LOCK_MINS * 60000).toISOString(), status: "locked" as UserStatus } : {}),
    }));
    return { ok: false, error: lock ? "account_locked" : "invalid_credentials" };
  }

  // Success
  saveUsers(users.map(u => u.id !== user.id ? u : {
    ...u, failedAttempts: 0, lockedUntil: null, status: "active",
    lastLogin: new Date().toISOString(),
  }));

  const ttl = rememberMe ? 30 * 86400 : 86400;
  const session: AuthSession = {
    userId: user.id, email: user.email, name: user.name,
    role: user.role, organizationId: user.organizationId,
    exp: Math.floor(Date.now() / 1000) + ttl,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = encodeSession(session);
  localStorage.setItem(LS_TOKEN, token);
  setCookie(token, rememberMe);
  return { ok: true, session };
}

export function logout(): void {
  localStorage.removeItem(LS_TOKEN);
  clearCookie();
}

export function logoutAll(): void { logout(); }

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(LS_TOKEN);
    if (!token) return null;
    const s = decodeSession(token);
    if (!s || s.exp < Math.floor(Date.now() / 1000)) { logout(); return null; }
    return s;
  } catch { return null; }
}

export function refreshSession(): void {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem(LS_TOKEN);
  if (token) {
    const s = decodeSession(token);
    if (s && s.exp > Math.floor(Date.now() / 1000)) {
      setCookie(token, false);
    }
  }
}

// ── Organization registration (signup flow) ───────────────────────────────────

export function registerOrganization(data: {
  orgName:       string;
  orgType:       OrgCategory;
  adminName:     string;
  adminEmail:    string;
  adminPassword: string;
  phone?:        string;
}): { ok: boolean; session?: AuthSession; error?: string } {
  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === data.adminEmail.toLowerCase())) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const orgResult = createOrganization({
    name: data.orgName, orgType: data.orgType,
    adminEmail: data.adminEmail, adminName: data.adminName,
    phone: data.phone,
  });
  if (!orgResult.ok || !orgResult.org) {
    return { ok: false, error: orgResult.error ?? "Failed to create organization." };
  }

  const org    = orgResult.org;
  const userId = `u${Date.now()}`;
  const user: User = {
    id: userId, name: data.adminName, email: data.adminEmail,
    passwordHash: hashPw(data.adminPassword), role: "Admin",
    organizationId: org.id, status: "active",
    lastLogin: null, createdAt: new Date().toISOString(),
    failedAttempts: 0, lockedUntil: null,
  };
  saveUsers([...users, user]);

  const ttl = 86400;
  const session: AuthSession = {
    userId, email: data.adminEmail, name: data.adminName,
    role: "Admin", organizationId: org.id,
    exp: Math.floor(Date.now() / 1000) + ttl,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = encodeSession(session);
  localStorage.setItem(LS_TOKEN, token);
  setCookie(token, false);
  return { ok: true, session };
}

// ── User management ───────────────────────────────────────────────────────────

export function getUsersByOrg(orgId: string): User[] {
  return getUsers().filter(u => u.organizationId === orgId);
}

export function createUser(data: {
  name: string; email: string; password: string;
  role: UserRole; organizationId: string;
}): { ok: boolean; error?: string } {
  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase()))
    return { ok: false, error: "Email already registered" };
  saveUsers([...users, {
    id: `u${Date.now()}`, name: data.name, email: data.email,
    passwordHash: hashPw(data.password), role: data.role,
    organizationId: data.organizationId, status: "active",
    lastLogin: null, createdAt: new Date().toISOString(),
    failedAttempts: 0, lockedUntil: null,
  }]);
  return { ok: true };
}

export function updateUser(id: string, patch: Partial<Omit<User,"id"|"createdAt">>): boolean {
  const users = getUsers();
  const idx   = users.findIndex(u => u.id === id);
  if (idx < 0) return false;
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return true;
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const next  = users.filter(u => u.id !== id);
  if (next.length === users.length) return false;
  saveUsers(next);
  return true;
}

export function resetUserPassword(id: string, newPw: string): boolean {
  return updateUser(id, { passwordHash: hashPw(newPw) });
}

export function changeOwnPassword(
  userId: string, oldPw: string, newPw: string,
): { ok: boolean; error?: string } {
  const users = getUsers();
  const user  = users.find(u => u.id === userId);
  if (!user) return { ok: false, error: "User not found" };
  if (!verifyPw(oldPw, user.passwordHash)) return { ok: false, error: "Current password is incorrect" };
  updateUser(userId, { passwordHash: hashPw(newPw) });
  return { ok: true };
}

export function sendPasswordReset(email: string): { ok: boolean } {
  return { ok: getUsers().some(u => u.email.toLowerCase() === email.toLowerCase()) };
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  SuperAdmin: { label:"Super Admin", color:"text-amber-400",  bg:"bg-amber-500/10",  border:"border-amber-500/20"  },
  Admin:      { label:"Admin",       color:"text-violet-400", bg:"bg-violet-500/10", border:"border-violet-500/20" },
  Operator:   { label:"Operator",    color:"text-cyan-400",   bg:"bg-cyan-500/10",   border:"border-cyan-500/20"   },
  Viewer:     { label:"Viewer",      color:"text-white/50",   bg:"bg-white/5",       border:"border-white/10"      },
};

export const ALL_ROLES: UserRole[] = ["SuperAdmin", "Admin", "Operator", "Viewer"];

export function getUserInitials(name: string): string {
  return name.split(" ").map(p => p[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

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
