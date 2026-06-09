/**
 * lib/auditLog.ts — Audit Log Store
 * Persists to localStorage, max 500 entries (FIFO eviction).
 */

export interface AuditEntry {
  id:        string;
  userId:    string;
  userName:  string;
  email:     string;
  action:    string;
  module:    string;
  details:   string;
  timestamp: string;
  ipAddress: string;
}

export type AuditAction =
  | "login" | "logout" | "logout_all" | "login_failed" | "account_locked"
  | "user_create" | "user_update" | "user_delete" | "user_status_change"
  | "role_change" | "password_reset" | "password_change"
  | "template_upload" | "card_generate" | "bulk_generate" | "download"
  | "settings_change";

const LS_KEY  = "idforge_audit";
const MAX_LOG = 500;

// ── Seed entries for demo ─────────────────────────────────────────────────────

const SEED: AuditEntry[] = [
  { id:"a1", userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"login",         module:"Auth",     details:"Successful login",                  timestamp:"2024-06-01T09:00:00Z", ipAddress:"192.168.1.10" },
  { id:"a2", userId:"u2", userName:"Admin User",    email:"admin@idforge.ai",      action:"bulk_generate", module:"AI Builder",details:"Generated 125 cards",              timestamp:"2024-06-01T10:15:00Z", ipAddress:"192.168.1.11" },
  { id:"a3", userId:"u3", userName:"Ravi Operator", email:"operator@idforge.ai",   action:"card_generate", module:"Manual",   details:"Generated card for Amit Kumar",     timestamp:"2024-06-01T11:30:00Z", ipAddress:"192.168.1.12" },
  { id:"a4", userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"user_create",   module:"Users",    details:"Created user operator@idforge.ai",  timestamp:"2024-06-02T08:45:00Z", ipAddress:"192.168.1.10" },
  { id:"a5", userId:"u2", userName:"Admin User",    email:"admin@idforge.ai",      action:"template_upload",module:"Templates","details":"Uploaded School ID template",     timestamp:"2024-06-02T09:20:00Z", ipAddress:"192.168.1.11" },
  { id:"a6", userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"role_change",   module:"Users",    details:"Changed viewer@idforge.ai → Viewer", timestamp:"2024-06-03T14:00:00Z", ipAddress:"192.168.1.10" },
  { id:"a7", userId:"u4", userName:"Priya Viewer",  email:"viewer@idforge.ai",     action:"download",      module:"Cards",    details:"Downloaded 12 ID cards (ZIP)",      timestamp:"2024-06-04T16:30:00Z", ipAddress:"192.168.1.14" },
  { id:"a8", userId:"u3", userName:"Ravi Operator", email:"operator@idforge.ai",   action:"login_failed",  module:"Auth",     details:"Invalid password (attempt 1/5)",    timestamp:"2024-06-05T08:00:00Z", ipAddress:"192.168.1.15" },
  { id:"a9", userId:"u2", userName:"Admin User",    email:"admin@idforge.ai",      action:"bulk_generate", module:"AI Builder",details:"Generated 555 cards",              timestamp:"2024-06-05T11:00:00Z", ipAddress:"192.168.1.11" },
  { id:"a10",userId:"u1", userName:"Super Admin",   email:"superadmin@idforge.ai", action:"settings_change",module:"Settings","details":"Updated organization branding",   timestamp:"2024-06-06T10:00:00Z", ipAddress:"192.168.1.10" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getLogs(): AuditEntry[] {
  if (typeof window === "undefined") return [...SEED];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { localStorage.setItem(LS_KEY, JSON.stringify(SEED)); return [...SEED]; }
    return JSON.parse(raw);
  } catch { return [...SEED]; }
}

function saveLogs(logs: AuditEntry[]): void {
  const trimmed = logs.slice(-MAX_LOG);
  localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
}

export function addLog(
  entry: Omit<AuditEntry, "id" | "timestamp" | "ipAddress">,
): void {
  if (typeof window === "undefined") return;
  const logs = getLogs();
  saveLogs([...logs, {
    ...entry,
    id:        `a${Date.now()}`,
    timestamp: new Date().toISOString(),
    ipAddress: "192.168.1.1",  // simulated — in prod: read from request header
  }]);
}

export function clearLogs(): void {
  localStorage.setItem(LS_KEY, JSON.stringify([]));
}

// ── Action display metadata ───────────────────────────────────────────────────

export const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  login:           { label:"Login",            color:"text-emerald-400", bg:"bg-emerald-500/10" },
  logout:          { label:"Logout",           color:"text-white/40",    bg:"bg-white/5"        },
  logout_all:      { label:"Logout All",       color:"text-orange-400",  bg:"bg-orange-500/10"  },
  login_failed:    { label:"Login Failed",     color:"text-red-400",     bg:"bg-red-500/10"     },
  account_locked:  { label:"Account Locked",   color:"text-red-400",     bg:"bg-red-500/10"     },
  user_create:     { label:"User Created",     color:"text-brand-400",   bg:"bg-brand-500/10"   },
  user_update:     { label:"User Updated",     color:"text-cyan-400",    bg:"bg-cyan-500/10"    },
  user_delete:     { label:"User Deleted",     color:"text-red-400",     bg:"bg-red-500/10"     },
  user_status_change:{ label:"Status Change",  color:"text-yellow-400",  bg:"bg-yellow-500/10"  },
  role_change:     { label:"Role Changed",     color:"text-violet-400",  bg:"bg-violet-500/10"  },
  password_reset:  { label:"Password Reset",   color:"text-orange-400",  bg:"bg-orange-500/10"  },
  password_change: { label:"Password Changed", color:"text-yellow-400",  bg:"bg-yellow-500/10"  },
  template_upload: { label:"Template Upload",  color:"text-brand-400",   bg:"bg-brand-500/10"   },
  card_generate:   { label:"Card Generated",   color:"text-emerald-400", bg:"bg-emerald-500/10" },
  bulk_generate:   { label:"Bulk Generated",   color:"text-emerald-400", bg:"bg-emerald-500/10" },
  download:        { label:"Download",         color:"text-cyan-400",    bg:"bg-cyan-500/10"    },
  settings_change: { label:"Settings Changed", color:"text-white/60",    bg:"bg-white/5"        },
};
