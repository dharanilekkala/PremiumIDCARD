"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Shield, Edit3, Trash2, Crown,
  RefreshCw, X, CheckCircle, AlertCircle,
  Loader2, Mail, Lock, Eye, EyeOff, UserCheck, UserX,
  Key, Activity, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addLog } from "@/lib/auditLog";
import {
  ROLE_META, ALL_ROLES, getUserInitials,
  type UserRole, type UserStatus,
} from "@/lib/auth";
import {
  apiGetUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, apiResetPassword,
  type ApiUser,
} from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    inactive:  "bg-white/5 text-white/40 border-white/10",
    suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    locked:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${cfg[status] ?? "bg-white/5 text-white/40 border-white/10"}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const m = ROLE_META[role];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.color} ${m.bg} ${m.border}`}>
      {m.label}
    </span>
  );
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

// ── Invite / Edit modal ───────────────────────────────────────────────────────

interface UserModalProps {
  mode:       "invite" | "edit";
  target?:    ApiUser;
  orgId:      string;
  onClose:    () => void;
  onSuccess:  () => void;
}

function UserModal({ mode, target, orgId, onClose, onSuccess }: UserModalProps) {
  const [name,     setName]     = useState(target?.name     ?? "");
  const [email,    setEmail]    = useState(target?.email    ?? "");
  const [role,     setRole]     = useState<UserRole>((target?.role as UserRole) ?? "Operator");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);

    try {
      if (mode === "invite") {
        if (!password || password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
        await apiCreateUser({ name: name.trim(), email: email.trim(), password, role, organizationId: orgId });
        void addLog({ action:"user_create", module:"Users", details:`Created ${email}` });
      } else if (target) {
        await apiUpdateUser(target.id, { name: name.trim(), role });
        void addLog({ action:"user_update", module:"Users", details:`Updated ${target.email}` });
        if (password && password.length >= 8) {
          await apiResetPassword(target.id, password);
          void addLog({ action:"password_reset", module:"Users", details:`Reset password for ${target.email}` });
        }
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Operation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-md bg-[#0d1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-white">{mode === "invite" ? "Invite New User" : "Edit User"}</h3>
            <p className="text-xs text-white/40 mt-0.5">{mode === "invite" ? "Add a team member to your organization" : `Editing ${target?.email}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="flex gap-2 items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input required={mode==="invite"} type="email" value={email} onChange={e => setEmail(e.target.value)}
                disabled={mode==="edit"} placeholder="user@company.com"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors disabled:opacity-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Role</label>
            <div className="relative">
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-500/50 appearance-none cursor-pointer">
                {ALL_ROLES.map(r => <option key={r} value={r} className="bg-[#0d1120]">{ROLE_META[r].label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              {mode === "invite" ? "Password" : "New Password (leave blank to keep current)"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                required={mode==="invite"} placeholder={mode==="invite" ? "Min 8 characters" : "Leave blank to keep current"}
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "invite" ? "Invite User" : "Save Changes")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { session, role, reloadUser } = useAuth();
  const [users,        setUsers]        = useState<ApiUser[]>([]);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [modal,        setModal]        = useState<"invite" | "edit" | null>(null);
  const [editTarget,   setEditTarget]   = useState<ApiUser | null>(null);
  const [openMenu,     setOpenMenu]     = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const orgId       = session?.organizationId ?? "";
  const isSuperAdmin = role === "SuperAdmin";

  const load = useCallback(async () => {
    const result = await apiGetUsers(isSuperAdmin ? undefined : orgId);
    setUsers(result);
  }, [isSuperAdmin, orgId]);

  useEffect(() => { void load(); }, [load]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async (u: ApiUser) => {
    const next: UserStatus = u.status === "active" ? "inactive" : "active";
    try {
      await apiUpdateUser(u.id, { status: next });
      void addLog({ action:"user_status_change", module:"Users", details:`${u.email} → ${next}` });
      showToast(`${u.name} marked as ${next}.`);
      void load();
      setOpenMenu(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status.", false);
    }
  };

  const handleSuspend = async (u: ApiUser) => {
    try {
      await apiUpdateUser(u.id, { status: "suspended" });
      void addLog({ action:"user_status_change", module:"Users", details:`Suspended ${u.email}` });
      showToast(`${u.name} suspended.`, false);
      void load(); setOpenMenu(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to suspend.", false);
    }
  };

  const handleDelete = async (u: ApiUser) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await apiDeleteUser(u.id);
      void addLog({ action:"user_delete", module:"Users", details:`Deleted ${u.email}` });
      showToast(`${u.name} deleted.`, false);
      void load(); setOpenMenu(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete.", false);
    }
  };

  const handleRoleChange = async (u: ApiUser, newRole: UserRole) => {
    try {
      await apiUpdateUser(u.id, { role: newRole });
      void addLog({ action:"role_change", module:"Users", details:`${u.email}: ${u.role} → ${newRole}` });
      showToast(`${u.name}'s role updated to ${ROLE_META[newRole].label}.`);
      void load(); setOpenMenu(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update role.", false);
    }
  };

  const handleResetPw = async (u: ApiUser) => {
    const pw = "TempPass@123";
    try {
      await apiResetPassword(u.id, pw);
      void addLog({ action:"password_reset", module:"Users", details:`Reset password for ${u.email}` });
      showToast(`Password reset. Temp: ${pw}`);
      setOpenMenu(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to reset password.", false);
    }
  };

  const filtered = users.filter(u =>
    (roleFilter   === "all" || u.role   === roleFilter)   &&
    (statusFilter === "all" || u.status === statusFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = ALL_ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {} as Record<UserRole, number>);

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

      {/* Modal */}
      {modal && (
        <UserModal
          mode={modal} target={editTarget ?? undefined} orgId={orgId}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSuccess={() => { void load(); void reloadUser(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">User Management</h2>
          <p className="text-xs text-white/40 mt-0.5">{users.length} members · {isSuperAdmin ? "All organizations" : "Your organization"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setModal("invite"); setEditTarget(null); }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Invite User
          </button>
        </div>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([ ["SuperAdmin","Crown",Crown,"from-amber-500 to-orange-500"], ["Admin","Shield",Shield,"from-violet-500 to-purple-500"], ["Operator","Edit3",Edit3,"from-cyan-500 to-blue-500"], ["Viewer","Users",Users,"from-slate-500 to-slate-600"] ] as const).map(([r,,Icon,grad]) => (
          <motion.div key={r} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            className="glass-card p-4 rounded-2xl border border-white/[0.06] flex items-center gap-3 cursor-pointer hover:border-white/10 transition-colors"
            onClick={() => setRoleFilter(roleFilter === r ? "all" : r as UserRole)}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{counts[r as UserRole] ?? 0}</div>
              <div className="text-xs text-white/40">{ROLE_META[r as UserRole].label}s</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50 transition-colors" />
        </div>
        <div className="flex gap-2">
          {(["all","SuperAdmin","Admin","Operator","Viewer"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${roleFilter === r ? "bg-brand-500/20 border-brand-500/40 text-brand-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"}`}>
              {r === "all" ? "All Roles" : ROLE_META[r].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all","active","inactive","suspended","locked"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`h-10 px-3 rounded-xl text-xs font-semibold border transition-all capitalize ${statusFilter === s ? "bg-brand-500/20 border-brand-500/40 text-brand-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"}`}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["User","Role","Status","Organization","Last Login","Joined","Actions"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-white/30 py-12 text-sm">No users match the current filters.</td></tr>
              ) : filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.03 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group relative">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/60 to-violet-500/60 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {getUserInitials(u.name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{u.name}</div>
                        <div className="text-xs text-white/35">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={u.role as UserRole} />
                      {role === "SuperAdmin" && (
                        <div className="relative">
                          <button onClick={() => setOpenMenu(openMenu === `role-${u.id}` ? null : `role-${u.id}`)}
                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {openMenu === `role-${u.id}` && (
                            <div className="absolute left-0 top-full mt-1 w-36 bg-[#0d1120] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                              {ALL_ROLES.map(r => (
                                <button key={r} onClick={() => void handleRoleChange(u, r)}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${u.role === r ? "text-brand-400 font-bold" : "text-white/60"}`}>
                                  {ROLE_META[r].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-white/40">{u.organization?.name ?? u.organizationId}</td>
                  <td className="px-5 py-3.5 text-xs text-white/40">{fmtDate(u.lastLogin)}</td>
                  <td className="px-5 py-3.5 text-xs text-white/40">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditTarget(u); setModal("edit"); }} title="Edit User"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => void handleToggleStatus(u)} title={u.status === "active" ? "Deactivate" : "Activate"}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                        {u.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => void handleResetPw(u)} title="Reset Password"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                        {openMenu === u.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#0d1120] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <button onClick={() => void handleSuspend(u)}
                              className="w-full text-left px-3 py-2.5 text-xs text-orange-400 hover:bg-orange-500/10 transition-colors flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" /> Suspend
                            </button>
                            <button onClick={() => void handleDelete(u)}
                              className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <p className="text-xs text-white/30">Showing {filtered.length} of {users.length} users</p>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Shield className="w-3.5 h-3.5" />
            Role-based access control active
          </div>
        </div>
      </div>
    </div>
  );
}
