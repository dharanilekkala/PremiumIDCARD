/**
 * lib/auditLog.ts — Audit log client helpers.
 * Data now lives in the database via /api/audit-logs.
 */
import { apiAddLog, apiGetLogs, type ApiAuditLog } from "./api";

// Re-export the type as AuditEntry for backward compat
export type AuditEntry = ApiAuditLog;

export type AuditAction =
  | "login" | "logout" | "logout_all" | "login_failed" | "account_locked"
  | "user_create" | "user_update" | "user_delete" | "user_status_change"
  | "role_change" | "password_reset" | "password_change"
  | "template_upload" | "card_generate" | "bulk_generate" | "download"
  | "settings_change" | "register" | "org_create" | "org_update";

// ── API-backed helpers ────────────────────────────────────────────────────────

/** Fetch all audit logs for the current user's org (or all orgs for SuperAdmin) */
export async function getLogs(options?: { organizationId?: string; limit?: number }): Promise<AuditEntry[]> {
  try {
    return await apiGetLogs(options);
  } catch {
    return [];
  }
}

/** Write a new audit log entry */
export async function addLog(
  entry: Omit<AuditEntry, "id" | "timestamp" | "ipAddress" | "userId" | "userName" | "email" | "organizationId">,
): Promise<void> {
  try {
    await apiAddLog({
      action: entry.action,
      module: entry.module,
      details: entry.details,
    });
  } catch {
    // Silently fail — audit logs should not break the main flow
  }
}

// ── Action display metadata ───────────────────────────────────────────────────

export const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  login:             { label:"Login",            color:"text-emerald-400", bg:"bg-emerald-500/10" },
  logout:            { label:"Logout",           color:"text-white/40",    bg:"bg-white/5"        },
  logout_all:        { label:"Logout All",       color:"text-orange-400",  bg:"bg-orange-500/10"  },
  login_failed:      { label:"Login Failed",     color:"text-red-400",     bg:"bg-red-500/10"     },
  account_locked:    { label:"Account Locked",   color:"text-red-400",     bg:"bg-red-500/10"     },
  user_create:       { label:"User Created",     color:"text-brand-400",   bg:"bg-brand-500/10"   },
  user_update:       { label:"User Updated",     color:"text-cyan-400",    bg:"bg-cyan-500/10"    },
  user_delete:       { label:"User Deleted",     color:"text-red-400",     bg:"bg-red-500/10"     },
  user_status_change:{ label:"Status Change",    color:"text-yellow-400",  bg:"bg-yellow-500/10"  },
  role_change:       { label:"Role Changed",     color:"text-violet-400",  bg:"bg-violet-500/10"  },
  password_reset:    { label:"Password Reset",   color:"text-orange-400",  bg:"bg-orange-500/10"  },
  password_change:   { label:"Password Changed", color:"text-yellow-400",  bg:"bg-yellow-500/10"  },
  template_upload:   { label:"Template Upload",  color:"text-brand-400",   bg:"bg-brand-500/10"   },
  card_generate:     { label:"Card Generated",   color:"text-emerald-400", bg:"bg-emerald-500/10" },
  bulk_generate:     { label:"Bulk Generated",   color:"text-emerald-400", bg:"bg-emerald-500/10" },
  download:          { label:"Download",         color:"text-cyan-400",    bg:"bg-cyan-500/10"    },
  settings_change:   { label:"Settings Changed", color:"text-white/60",    bg:"bg-white/5"        },
  register:          { label:"Registered",       color:"text-brand-400",   bg:"bg-brand-500/10"   },
  org_create:        { label:"Org Created",      color:"text-brand-400",   bg:"bg-brand-500/10"   },
  org_update:        { label:"Org Updated",      color:"text-cyan-400",    bg:"bg-cyan-500/10"    },
};
