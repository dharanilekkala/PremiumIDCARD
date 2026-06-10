/**
 * lib/api.ts
 * Async client-side wrappers for all API routes.
 * Used by React components and contexts — never import server-only libs here.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ApiSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
  orgType?: string;
}

export interface ApiOrganization {
  id: string;
  name: string;
  orgType: string;
  status: string;
  adminEmail: string;
  adminName: string;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  status: string;
  lastLogin?: string | null;
  createdAt: string;
  failedAttempts: number;
  lockedUntil?: string | null;
  organization?: { name: string; orgType: string };
}

export interface ApiAuditLog {
  id: string;
  userId: string;
  userName: string;
  email: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  organizationId: string;
  timestamp: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`);
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<ApiSession> {
  const data = await apiFetch<{ session: ApiSession }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.session;
}

export async function apiLogout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function apiGetSession(): Promise<ApiSession | null> {
  const data = await apiFetch<{ session: ApiSession | null }>("/api/auth/session");
  return data.session;
}

export async function apiSignup(payload: {
  orgName: string; orgType: string; adminName: string; adminEmail: string;
  phone?: string; address?: string; password: string;
}): Promise<ApiSession> {
  const data = await apiFetch<{ session: ApiSession }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.session;
}

// ── Organizations ─────────────────────────────────────────────────────────────

export async function apiGetOrganizations(): Promise<ApiOrganization[]> {
  const data = await apiFetch<{ organizations: ApiOrganization[] }>("/api/organizations");
  return data.organizations;
}

export async function apiGetOrganization(id: string): Promise<ApiOrganization> {
  const data = await apiFetch<{ organization: ApiOrganization }>(`/api/organizations/${id}`);
  return data.organization;
}

export async function apiCreateOrganization(payload: Partial<ApiOrganization>): Promise<ApiOrganization> {
  const data = await apiFetch<{ organization: ApiOrganization }>("/api/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.organization;
}

export async function apiUpdateOrganization(id: string, payload: Partial<ApiOrganization>): Promise<ApiOrganization> {
  const data = await apiFetch<{ organization: ApiOrganization }>(`/api/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.organization;
}

export async function apiDeleteOrganization(id: string): Promise<void> {
  await apiFetch(`/api/organizations/${id}`, { method: "DELETE" });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function apiGetUsers(organizationId?: string): Promise<ApiUser[]> {
  const qs = organizationId ? `?organizationId=${organizationId}` : "";
  const data = await apiFetch<{ users: ApiUser[] }>(`/api/users${qs}`);
  return data.users;
}

export async function apiCreateUser(payload: {
  name: string; email: string; role: string; password: string; organizationId?: string;
}): Promise<ApiUser> {
  const data = await apiFetch<{ user: ApiUser }>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function apiUpdateUser(id: string, payload: Partial<ApiUser>): Promise<ApiUser> {
  const data = await apiFetch<{ user: ApiUser }>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function apiDeleteUser(id: string): Promise<void> {
  await apiFetch(`/api/users/${id}`, { method: "DELETE" });
}

export async function apiResetPassword(id: string, newPassword: string): Promise<void> {
  await apiFetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "reset_password", newPassword }),
  });
}

export async function apiChangeOwnPassword(
  id: string, currentPassword: string, newPassword: string
): Promise<void> {
  await apiFetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "change_password", currentPassword, newPassword }),
  });
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export async function apiGetLogs(options?: { organizationId?: string; limit?: number }): Promise<ApiAuditLog[]> {
  const params = new URLSearchParams();
  if (options?.organizationId) params.set("organizationId", options.organizationId);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await apiFetch<{ logs: ApiAuditLog[] }>(`/api/audit-logs${qs}`);
  return data.logs;
}

export async function apiAddLog(payload: {
  action: string; module: string; details: string; ipAddress?: string;
}): Promise<ApiAuditLog> {
  const data = await apiFetch<{ log: ApiAuditLog }>("/api/audit-logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.log;
}
