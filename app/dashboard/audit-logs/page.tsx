"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, Download, RefreshCw, Filter, X, Clock,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLogs, ACTION_META, type AuditEntry } from "@/lib/auditLog";

const PAGE_SIZE = 25;

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  });
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? { label: action, color: "text-white/50", bg: "bg-white/5" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>
      {meta.label}
    </span>
  );
}

const MODULES = ["All", "Auth", "Users", "Cards", "Templates", "AI Builder", "Settings", "Manual"];
const ALL_ACTIONS = Object.keys(ACTION_META);

export default function AuditLogsPage() {
  const { session, role } = useAuth();
  const [logs,        setLogs]        = useState<AuditEntry[]>([]);
  const [search,      setSearch]      = useState("");
  const [module,      setModule]      = useState("All");
  const [action,      setAction]      = useState("all");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [page,        setPage]        = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const all = await getLogs();
    // API returns newest-first already (orderBy timestamp desc)
    setLogs(all);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };


  const handleExport = () => {
    const header = ["ID", "Timestamp", "User", "Email", "Action", "Module", "Details", "IP"].join(",");
    const rows   = filtered.map(e =>
      [e.id, e.timestamp, `"${e.userName}"`, e.email, e.action, e.module, `"${e.details}"`, e.ipAddress].join(",")
    );
    const csv  = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("Audit logs exported.");
  };

  const filtered = logs.filter(e => {
    if (module !== "All" && e.module !== module) return false;
    if (action !== "all" && e.action !== action) return false;
    if (dateFrom && new Date(e.timestamp) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(e.timestamp) > new Date(dateTo + "T23:59:59")) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.userName.toLowerCase().includes(q) ||
             e.email.toLowerCase().includes(q)    ||
             e.details.toLowerCase().includes(q)  ||
             e.action.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { label: "Total Events",   value: logs.length,                              color: "from-brand-500 to-violet-500" },
    { label: "Login Events",   value: logs.filter(l => l.action === "login").length, color: "from-emerald-500 to-teal-500" },
    { label: "Security Alerts",value: logs.filter(l => ["login_failed","account_locked"].includes(l.action)).length, color: "from-red-500 to-rose-500" },
    { label: "User Actions",   value: logs.filter(l => ["user_create","user_delete","role_change"].includes(l.action)).length, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
              toast.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            Audit Logs
          </h2>
          <p className="text-xs text-white/40 mt-0.5">{logs.length} total events · immutable trail</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
            className="glass-card p-4 rounded-2xl border border-white/[0.06]">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by user, email, action, or details…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50 transition-colors" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? "bg-brand-500/20 border-brand-500/40 text-brand-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}>
            <Filter className="w-4 h-4" /> Filters
            {(module !== "All" || action !== "all" || dateFrom || dateTo) && (
              <span className="w-2 h-2 rounded-full bg-brand-500" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="overflow-hidden">
              <div className="flex flex-wrap gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                {/* Module filter */}
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Module</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MODULES.map(m => (
                      <button key={m} onClick={() => { setModule(m); setPage(1); }}
                        className={`h-7 px-3 rounded-lg text-xs font-medium transition-all ${
                          module === m ? "bg-brand-500/20 border border-brand-500/40 text-brand-400" : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action filter */}
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Action</label>
                  <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none">
                    <option value="all" className="bg-[#0d1120]">All Actions</option>
                    {ALL_ACTIONS.map(a => (
                      <option key={a} value={a} className="bg-[#0d1120]">{ACTION_META[a]?.label ?? a}</option>
                    ))}
                  </select>
                </div>

                {/* Date range */}
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Date From</label>
                  <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Date To</label>
                  <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none" />
                </div>

                {/* Clear */}
                {(module !== "All" || action !== "all" || dateFrom || dateTo) && (
                  <div className="flex items-end">
                    <button onClick={() => { setModule("All"); setAction("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
                      className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-all">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Timestamp", "User", "Action", "Module", "Details", "IP"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14">
                    <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/25">No audit events match the current filters.</p>
                  </td>
                </tr>
              ) : paginated.map((entry, i) => (
                <motion.tr key={entry.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-xs text-white/60 whitespace-nowrap">{fmtDate(entry.timestamp)}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500/60 to-violet-500/60 flex items-center justify-center text-white font-bold text-[9px] shrink-0">
                        {entry.userName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">{entry.userName}</div>
                        <div className="text-[10px] text-white/30">{entry.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><ActionBadge action={entry.action} /></td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-md">{entry.module}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/50 max-w-[280px] truncate">{entry.details}</td>
                  <td className="px-5 py-3 text-[10px] text-white/30 font-mono">{entry.ipAddress}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <p className="text-xs text-white/30">
            {filtered.length === 0 ? "0" : `${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE, filtered.length)}`} of {filtered.length} events
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-white/40">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
