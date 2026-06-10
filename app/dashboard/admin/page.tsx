"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown, Building2, Users, TrendingUp, ArrowRight,
  Globe, Shield, Activity,
  BarChart3, ChevronRight, Clock,
} from "lucide-react";
import { getOrganizations, getUsers, ORG_CATEGORY_META, type Organization } from "@/lib/auth";
import { getLogs, ACTION_META } from "@/lib/auditLog";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
}

export default function AdminPage() {
  const [orgs,  setOrgs]  = useState<ReturnType<typeof getOrganizations>>([]);
  const [users, setUsers] = useState<ReturnType<typeof getUsers>>([]);
  const [logs,  setLogs]  = useState<ReturnType<typeof getLogs>>([]);

  useEffect(() => {
    setOrgs(getOrganizations());
    setUsers(getUsers());
    setLogs(getLogs().reverse().slice(0, 20));
  }, []);

  const activeOrgs  = orgs.filter(o => o.status === "active").length;
  const activeUsers = users.filter(u => u.status === "active").length;

  const recentOrgs = [...orgs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5);

  const statCards = [
    { label:"Total Organizations", value:orgs.length.toString(),  sub:`${activeOrgs} active`,  icon:Globe,      color:"from-brand-500 to-violet-500",  glow:"#6366f1" },
    { label:"Total Users",         value:users.length.toString(), sub:`${activeUsers} active`, icon:Users,      color:"from-emerald-500 to-teal-500",  glow:"#10b981" },
    { label:"Active Orgs",         value:activeOrgs.toString(),   sub:"currently active",      icon:TrendingUp, color:"from-amber-500 to-orange-500",  glow:"#f59e0b" },
    { label:"Active Users",        value:activeUsers.toString(),  sub:"currently active",      icon:Activity,   color:"from-violet-500 to-purple-600", glow:"#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Platform Admin
          </h2>
          <p className="text-xs text-white/40 mt-0.5">SuperAdmin overview · {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/organizations">
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:text-white hover:bg-white/10 transition-all">
              <Building2 className="w-4 h-4" /> Manage Orgs
            </button>
          </Link>
          <Link href="/dashboard/audit-logs">
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-all">
              <Shield className="w-4 h-4" /> Audit Logs
            </button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            className="glass-card p-5 rounded-2xl border border-white/[0.06] hover:border-white/12 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}
                style={{ boxShadow:`0 4px 12px ${s.glow}40` }}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-white/25 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Org types distribution */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="glass-card p-5 rounded-2xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Organization Types</h3>
            <BarChart3 className="w-4 h-4 text-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ORG_CATEGORY_META) as (keyof typeof ORG_CATEGORY_META)[]).map(k => {
              const count = orgs.filter(o => o.orgType === k).length;
              if (!count) return null;
              const pct = orgs.length > 0 ? Math.round((count / orgs.length) * 100) : 0;
              return (
                <div key={k} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{ORG_CATEGORY_META[k].icon}</span>
                    <span className="text-xs text-white/60">{ORG_CATEGORY_META[k].label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{count}</span>
                    <span className="text-[10px] text-white/30">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent registrations */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="glass-card p-5 rounded-2xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Organizations</h3>
            <Link href="/dashboard/organizations" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrgs.length === 0 ? (
              <div className="text-center py-8 text-white/25 text-sm">No organizations yet</div>
            ) : recentOrgs.map(org => {
              const meta = ORG_CATEGORY_META[org.orgType] ?? ORG_CATEGORY_META.custom;
              return (
                <div key={org.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center text-lg shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{org.name}</div>
                    <div className="text-[10px] text-white/30">{meta.label} · {fmtDate(org.createdAt)}</div>
                  </div>
                  <span className={`text-[10px] font-semibold capitalize ${org.status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                    {org.status}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Activity feed */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
        className="glass-card p-5 rounded-2xl border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            Live Activity Feed
          </h3>
          <Link href="/dashboard/audit-logs" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            Full logs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-white/25 text-sm">No activity recorded yet</div>
          ) : logs.slice(0, 12).map((entry, i) => {
            const meta = ACTION_META[entry.action] ?? { label:entry.action, color:"text-white/50", bg:"bg-white/5" };
            return (
              <motion.div key={entry.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35+i*0.025 }}
                className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500/60 shrink-0" />
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta.color} ${meta.bg}`}>
                  {meta.label}
                </span>
                <span className="text-xs text-white/60 truncate flex-1">{entry.userName}</span>
                <span className="text-xs text-white/30 shrink-0 hidden sm:block">{entry.details.slice(0,40)}{entry.details.length>40?"…":""}</span>
                <div className="text-[10px] text-white/20 shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {fmtTime(entry.timestamp)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label:"Organizations",  href:"/dashboard/organizations", icon:Globe,   color:"from-brand-500 to-violet-500",  desc:"Manage tenants" },
          { label:"Users",          href:"/dashboard/users",         icon:Users,   color:"from-emerald-500 to-teal-500",  desc:"All users"      },
          { label:"Audit Logs",     href:"/dashboard/audit-logs",    icon:Shield,  color:"from-violet-500 to-purple-600", desc:"Security trail" },
        ].map((item, i) => (
          <Link key={item.label} href={item.href}>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.4+i*0.06 }}
              className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-semibold text-white">{item.label}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{item.desc}</div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
