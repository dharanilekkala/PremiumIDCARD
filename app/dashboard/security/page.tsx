"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield, Search, Download, RefreshCw,
  Activity, Lock, Users, Eye, CheckCircle, X,
  AlertTriangle, Clock, Globe, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLogs, ACTION_META, type AuditEntry } from "@/lib/auditLog";
import { ROLE_PERMISSIONS, ALL_ROLES, ROLE_META } from "@/lib/auth";
import { useRouter } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

function ActionBadge({ action }: { action: string }) {
  const m = ACTION_META[action] ?? { label: action, color:"text-white/50", bg:"bg-white/5" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  );
}

// ── Permission Matrix ─────────────────────────────────────────────────────────

const PERM_LABELS: Record<string, string> = {
  "manage:organizations": "Manage Organizations",
  "manage:users":         "Manage Users",
  "manage:templates":     "Manage Templates",
  "generate:cards":       "Generate Cards",
  "delete:cards":         "Delete Cards",
  "view:analytics":       "View Analytics",
  "view:audit_logs":      "View Audit Logs",
  "manage:roles":         "Manage Roles",
  "bulk:generate":        "Bulk Generate",
  "upload:excel":         "Upload Excel",
  "upload:photos":        "Upload Photos",
  "view:cards":           "View Cards",
  "download:cards":       "Download Cards",
};

const ALL_PERMS = Object.keys(PERM_LABELS);

function PermissionMatrix() {
  return (
    <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Role Permissions Matrix</h3>
          <p className="text-xs text-white/40">What each role can and cannot do</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Permission</th>
              {ALL_ROLES.map(r => (
                <th key={r} className="text-center text-[11px] font-semibold uppercase tracking-wider px-4 py-3">
                  <span className={`${ROLE_META[r].color}`}>{ROLE_META[r].label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMS.map(perm => (
              <tr key={perm} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-2.5 text-xs text-white/60">{PERM_LABELS[perm]}</td>
                {ALL_ROLES.map(r => {
                  const has = ROLE_PERMISSIONS[r].includes(perm);
                  return (
                    <td key={r} className="px-4 py-2.5 text-center">
                      {has
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        : <X className="w-4 h-4 text-white/15 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { session, logout } = useAuth();
  const router = useRouter();

  const [tab,    setTab]    = useState<"audit" | "roles" | "sessions">("audit");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [module, setModule] = useState("all");
  const [logs,   setLogs]   = useState<AuditEntry[]>([]);

  const load = useCallback(async () => {
    const result = await getLogs();
    setLogs(result);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const modules = useMemo(() => ["all", ...Array.from(new Set(logs.map(l => l.module)))], [logs]);
  const actions = useMemo(() => ["all", ...Object.keys(ACTION_META)], []);

  const filtered = useMemo(() => logs.filter(l =>
    (action === "all" || l.action === action) &&
    (module === "all" || l.module === module) &&
    (search === "" || l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()))
  ), [logs, action, module, search]);

  const stats = useMemo(() => ({
    total:   logs.length,
    logins:  logs.filter(l => l.action === "login").length,
    alerts:  logs.filter(l => ["login_failed","account_locked"].includes(l.action)).length,
    bulk:    logs.filter(l => l.action === "bulk_generate").length,
  }), [logs]);

  const handleDownload = () => {
    const csv = ["ID,User,Email,Action,Module,Details,Timestamp,IP",
      ...filtered.map(l => `${l.id},"${l.userName}",${l.email},${l.action},${l.module},"${l.details}",${l.timestamp},${l.ipAddress}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = `idforge_audit_${Date.now()}.csv`;
    a.click();
  };

  const handleLogoutAll = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Security & Audit Logs</h2>
          <p className="text-xs text-white/40 mt-0.5">Monitor all platform activity and manage access</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Events",     val:stats.total,  icon:Activity,      col:"from-brand-500 to-violet-500"   },
          { label:"Successful Logins",val:stats.logins, icon:CheckCircle,   col:"from-emerald-500 to-teal-500"   },
          { label:"Security Alerts",  val:stats.alerts, icon:AlertTriangle, col:"from-red-500 to-orange-500"     },
          { label:"Bulk Generations", val:stats.bulk,   icon:Users,         col:"from-cyan-500 to-blue-500"      },
        ].map(({ label, val, icon: Icon, col }) => (
          <motion.div key={label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            className="glass-card p-4 rounded-2xl border border-white/[0.06] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${col} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{val}</div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
        {([["audit","Audit Logs",Activity], ["roles","Role Permissions",Shield], ["sessions","Sessions",Globe]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "text-white/40 hover:text-white"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Audit Log Tab ── */}
      {tab === "audit" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, email, details…"
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50 transition-colors" />
            </div>
            <select value={action} onChange={e => setAction(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 outline-none cursor-pointer">
              {actions.map(a => <option key={a} value={a} className="bg-[#0d1120]">{a === "all" ? "All Actions" : (ACTION_META[a]?.label ?? a)}</option>)}
            </select>
            <select value={module} onChange={e => setModule(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 outline-none cursor-pointer">
              {modules.map(m => <option key={m} value={m} className="bg-[#0d1120]">{m === "all" ? "All Modules" : m}</option>)}
            </select>
          </div>

          <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Timestamp","User","Action","Module","Details","IP Address"].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-white/30 py-12 text-sm">No log entries match the current filters.</td></tr>
                  ) : filtered.slice(0, 100).map((log, i) => (
                    <motion.tr key={log.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.01 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                          <Clock className="w-3 h-3" /> {fmtTs(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs font-semibold text-white">{log.userName}</div>
                        <div className="text-[10px] text-white/30">{log.email}</div>
                      </td>
                      <td className="px-5 py-3"><ActionBadge action={log.action} /></td>
                      <td className="px-5 py-3 text-xs text-white/50">{log.module}</td>
                      <td className="px-5 py-3 text-xs text-white/50 max-w-[260px] truncate">{log.details}</td>
                      <td className="px-5 py-3 text-xs text-white/30 font-mono">{log.ipAddress}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-white/30">
              Showing {Math.min(100, filtered.length)} of {filtered.length} events
            </div>
          </div>
        </div>
      )}

      {/* ── Role Permissions Tab ── */}
      {tab === "roles" && <PermissionMatrix />}

      {/* ── Sessions Tab ── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">Active Sessions</h3>
              <p className="text-xs text-white/40 mt-0.5">Currently signed-in devices for your account</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      Current Device
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
                    </div>
                    <div className="text-xs text-white/40">{session?.email} · Browser · {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Logout from All Devices</div>
                    <div className="text-xs text-white/40">Revoke all active sessions and sign out everywhere</div>
                  </div>
                </div>
                <button onClick={() => void handleLogoutAll()}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out All
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" /> Security Recommendations
            </h3>
            <ul className="space-y-2 text-xs text-white/50">
              {[
                "Use a strong, unique password (min 12 characters).",
                "Account locks after 5 failed attempts for 15 minutes.",
                "Never share your credentials with other team members.",
                "Regularly review the Audit Log for unusual activity.",
                "Assign minimum required roles — avoid SuperAdmin for daily tasks.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
