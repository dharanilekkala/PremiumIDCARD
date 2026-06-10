"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Search, Plus, Edit3, Trash2, UserCheck, UserX,
  X, Loader2, AlertCircle, CheckCircle, ChevronDown, Users,
  MoreVertical, RefreshCw, Globe, Phone, Mail, Crown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrganizations, createOrganization, updateOrganization, deleteOrganization,
  getUsersByOrg, ORG_CATEGORY_META, type Organization, type OrgCategory,
} from "@/lib/auth";
import { addLog } from "@/lib/auditLog";

const ORG_CATEGORIES: OrgCategory[] = [
  "school","college","university","coaching","corporate","hospital","event","custom",
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function StatusBadge({ status }: { status: Organization["status"] }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
      status === "active"
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-red-500/10 text-red-400 border-red-500/20"
    }`}>{status}</span>
  );
}

// ── Org Modal ─────────────────────────────────────────────────────────────────

interface OrgModalProps {
  mode:      "create" | "edit";
  target?:   Organization;
  onClose:   () => void;
  onSuccess: () => void;
}

function OrgModal({ mode, target, onClose, onSuccess }: OrgModalProps) {
  const { session } = useAuth();
  const [name,      setName]      = useState(target?.name      ?? "");
  const [orgType,   setOrgType]   = useState<OrgCategory>(target?.orgType ?? "school");
  const [adminName, setAdminName] = useState(target?.adminName ?? "");
  const [adminEmail,setAdminEmail]= useState(target?.adminEmail?? "");
  const [phone,     setPhone]     = useState(target?.phone     ?? "");
  const [address,   setAddress]   = useState(target?.address   ?? "");
  const [status,    setStatus]    = useState<Organization["status"]>(target?.status ?? "active");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminEmail.trim()) {
      setError("Organization name, admin name, and admin email are required."); return;
    }
    setLoading(true); setError(null);
    await new Promise(r => setTimeout(r, 400));

    if (mode === "create") {
      const res = createOrganization({ name: name.trim(), orgType, adminName: adminName.trim(), adminEmail: adminEmail.trim(), phone, address });
      if (!res.ok) { setError(res.error ?? "Failed to create organization."); setLoading(false); return; }
      addLog({ userId: session!.userId, userName: session!.name, email: session!.email, action:"user_create", module:"Organizations", details:`Created org: ${name}` });
    } else if (target) {
      updateOrganization(target.id, { name: name.trim(), orgType, adminName: adminName.trim(), adminEmail: adminEmail.trim(), phone, address, status });
      addLog({ userId: session!.userId, userName: session!.name, email: session!.email, action:"settings_change", module:"Organizations", details:`Updated org: ${name}` });
    }
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-lg bg-[#0d1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">{mode === "create" ? "New Organization" : "Edit Organization"}</h3>
            <p className="text-xs text-white/40 mt-0.5">{mode === "create" ? "Add a new tenant organization" : `Editing ${target?.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex gap-2 items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Organization Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Delhi Public School"
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Type</label>
              <div className="relative">
                <select value={orgType} onChange={e => setOrgType(e.target.value as OrgCategory)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-500/50 appearance-none cursor-pointer">
                  {ORG_CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-[#0d1120]">
                      {ORG_CATEGORY_META[c].icon} {ORG_CATEGORY_META[c].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Admin Name</label>
              <input required value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Administrator name"
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Admin Email</label>
              <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@org.com"
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
            </div>

            {mode === "edit" && (
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Status</label>
                <div className="relative">
                  <select value={status} onChange={e => setStatus(e.target.value as Organization["status"])}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-500/50 appearance-none cursor-pointer">
                    <option value="active"    className="bg-[#0d1120]">Active</option>
                    <option value="suspended" className="bg-[#0d1120]">Suspended</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Office / institution address"
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "create" ? "Create Organization" : "Save Changes")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const { session } = useAuth();
  const [orgs,       setOrgs]       = useState<Organization[]>([]);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState<OrgCategory | "all">("all");
  const [modal,      setModal]      = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Organization | null>(null);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => { setOrgs(getOrganizations()); }, []);
  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = (org: Organization) => {
    const next = org.status === "active" ? "suspended" : "active";
    updateOrganization(org.id, { status: next });
    addLog({ userId: session!.userId, userName: session!.name, email: session!.email, action:"settings_change", module:"Organizations", details:`${org.name} status → ${next}` });
    showToast(`${org.name} ${next === "active" ? "activated" : "suspended"}.`, next === "active");
    load(); setOpenMenu(null);
  };

  const handleDelete = (org: Organization) => {
    if (!confirm(`Delete "${org.name}"? All associated data will be lost.`)) return;
    deleteOrganization(org.id);
    addLog({ userId: session!.userId, userName: session!.name, email: session!.email, action:"user_delete", module:"Organizations", details:`Deleted org: ${org.name}` });
    showToast(`${org.name} deleted.`, false);
    load(); setOpenMenu(null);
  };

  const filtered = orgs.filter(o =>
    (typeFilter === "all" || o.orgType === typeFilter) &&
    (o.name.toLowerCase().includes(search.toLowerCase()) ||
     o.adminEmail.toLowerCase().includes(search.toLowerCase()))
  );

  const typeCounts = ORG_CATEGORIES.reduce((acc, c) => ({
    ...acc, [c]: orgs.filter(o => o.orgType === c).length,
  }), {} as Record<OrgCategory, number>);

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
        <OrgModal mode={modal} target={editTarget ?? undefined}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSuccess={() => load()}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-400" />
            Organizations
          </h2>
          <p className="text-xs text-white/40 mt-0.5">{orgs.length} tenant organizations · SuperAdmin view</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setModal("create"); setEditTarget(null); }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New Organization
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orgs",  value: orgs.length,                                   color: "from-brand-500 to-violet-500" },
          { label: "Active",      value: orgs.filter(o=>o.status==="active").length,    color: "from-emerald-500 to-teal-500" },
          { label: "Suspended",   value: orgs.filter(o=>o.status==="suspended").length, color: "from-red-500 to-rose-500"     },
          { label: "Org Types",   value: new Set(orgs.map(o=>o.orgType)).size,           color: "from-amber-500 to-orange-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
            className="glass-card p-4 rounded-2xl border border-white/[0.06]">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organization or admin email…"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50 transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTypeFilter("all")}
            className={`h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${typeFilter==="all" ? "bg-brand-500/20 border-brand-500/40 text-brand-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"}`}>
            All Types
          </button>
          {ORG_CATEGORIES.filter(c => typeCounts[c] > 0).map(c => (
            <button key={c} onClick={() => setTypeFilter(c)}
              className={`h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${typeFilter===c ? "bg-brand-500/20 border-brand-500/40 text-brand-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"}`}>
              {ORG_CATEGORY_META[c].icon} {ORG_CATEGORY_META[c].label} ({typeCounts[c]})
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
                {["Organization", "Type", "Status", "Admin", "Users", "Created", "Actions"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-white/30 py-12 text-sm">No organizations match the current filters.</td></tr>
              ) : filtered.map((org, i) => {
                const memberCount = getUsersByOrg(org.id).length;
                const catMeta     = ORG_CATEGORY_META[org.orgType] ?? ORG_CATEGORY_META.custom;
                return (
                  <motion.tr key={org.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 flex items-center justify-center text-lg shrink-0">
                          {catMeta.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{org.name}</div>
                          <div className="text-[10px] text-white/30 flex items-center gap-1">
                            {org.phone && <><Phone className="w-2.5 h-2.5" />{org.phone}</>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${catMeta.color}`}>{catMeta.label}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={org.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-white/60">{org.adminName}</div>
                      <div className="text-[10px] text-white/30">{org.adminEmail}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-sm font-semibold text-white">{memberCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/40">{fmtDate(org.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTarget(org); setModal("edit"); }} title="Edit"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggleStatus(org)} title={org.status === "active" ? "Suspend" : "Activate"}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            org.status === "active" ? "text-white/30 hover:text-orange-400 hover:bg-orange-500/10" : "text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                          }`}>
                          {org.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <div className="relative">
                          <button onClick={() => setOpenMenu(openMenu === org.id ? null : org.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openMenu === org.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[#0d1120] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                              <button onClick={() => handleDelete(org)}
                                className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Delete Org
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <p className="text-xs text-white/30">Showing {filtered.length} of {orgs.length} organizations</p>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Crown className="w-3.5 h-3.5" />
            SuperAdmin — full tenant management
          </div>
        </div>
      </div>
    </div>
  );
}
