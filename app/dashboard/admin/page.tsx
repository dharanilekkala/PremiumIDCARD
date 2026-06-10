"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown, Building2, Users, CreditCard, TrendingUp, ArrowRight,
  Globe, Shield, Zap, CheckCircle, AlertCircle, Clock, Activity,
  DollarSign, BarChart3, ChevronRight,
} from "lucide-react";
import { getOrganizations, getUsers, ORG_CATEGORY_META, type Organization } from "@/lib/auth";
import { getLogs, ACTION_META } from "@/lib/auditLog";
import { getBillingHistory, PLANS } from "@/lib/subscription";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
}

function PlanDot({ plan }: { plan: Organization["subscriptionPlan"] }) {
  const cfg = { free:"bg-white/20", pro:"bg-brand-500", enterprise:"bg-amber-500" };
  return <span className={`inline-block w-2 h-2 rounded-full ${cfg[plan]}`} />;
}

export default function AdminPage() {
  const [orgs,    setOrgs]    = useState<ReturnType<typeof getOrganizations>>([]);
  const [users,   setUsers]   = useState<ReturnType<typeof getUsers>>([]);
  const [logs,    setLogs]    = useState<ReturnType<typeof getLogs>>([]);
  const [billing, setBilling] = useState<ReturnType<typeof getBillingHistory>>([]);

  useEffect(() => {
    setOrgs(getOrganizations());
    setUsers(getUsers());
    setLogs(getLogs().reverse().slice(0, 20));
    setBilling(getBillingHistory());
  }, []);

  const totalRevenue   = billing.filter(b => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const thisMonthBills = billing.filter(b => {
    const d = new Date(b.date); const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonthBills.filter(b => b.status === "paid").reduce((s, b) => s + b.amount, 0);

  const activeOrgs = orgs.filter(o => o.status === "active").length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const planDist = { free: orgs.filter(o=>o.subscriptionPlan==="free").length, pro: orgs.filter(o=>o.subscriptionPlan==="pro").length, enterprise: orgs.filter(o=>o.subscriptionPlan==="enterprise").length };

  const recentOrgs = [...orgs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,5);

  const statCards = [
    { label:"Total Organizations", value:orgs.length.toString(),    sub:`${activeOrgs} active`,          icon:Globe,      color:"from-brand-500 to-violet-500",   glow:"#6366f1" },
    { label:"Total Users",         value:users.length.toString(),   sub:`${activeUsers} active`,         icon:Users,      color:"from-emerald-500 to-teal-500",   glow:"#10b981" },
    { label:"Total Revenue",       value:`₹${totalRevenue.toLocaleString("en-IN")}`, sub:"all-time",    icon:DollarSign, color:"from-amber-500 to-orange-500",   glow:"#f59e0b" },
    { label:"Monthly Revenue",     value:`₹${monthRevenue.toLocaleString("en-IN")}`, sub:"this month", icon:TrendingUp, color:"from-violet-500 to-purple-600",  glow:"#8b5cf6" },
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Plan distribution */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="glass-card p-5 rounded-2xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Plan Distribution</h3>
            <BarChart3 className="w-4 h-4 text-white/30" />
          </div>
          <div className="space-y-4">
            {([
              { key:"enterprise", label:"Enterprise", val:planDist.enterprise, color:"bg-amber-500", text:"text-amber-400" },
              { key:"pro",        label:"Pro",         val:planDist.pro,        color:"bg-brand-500", text:"text-brand-400" },
              { key:"free",       label:"Free",        val:planDist.free,       color:"bg-white/20",  text:"text-white/40" },
            ]).map(p => {
              const pct = orgs.length > 0 ? Math.round((p.val / orgs.length) * 100) : 0;
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/60">{p.label}</span>
                    <span className={`text-xs font-semibold ${p.text}`}>{p.val} orgs ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, delay:0.4 }}
                      className={`h-full rounded-full ${p.color}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Org Types</h4>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ORG_CATEGORY_META) as (keyof typeof ORG_CATEGORY_META)[]).map(k => {
                const count = orgs.filter(o => o.orgType === k).length;
                if (!count) return null;
                return (
                  <div key={k} className="flex items-center gap-2 text-xs text-white/50">
                    <span>{ORG_CATEGORY_META[k].icon}</span>
                    <span>{ORG_CATEGORY_META[k].label}</span>
                    <span className="ml-auto font-semibold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
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
                  <div className="flex items-center gap-1">
                    <PlanDot plan={org.subscriptionPlan} />
                    <span className={`text-[10px] capitalize ${org.status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                      {org.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent billing */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="glass-card p-5 rounded-2xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Payments</h3>
            <Link href="/dashboard/subscription" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Billing <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {billing.slice(0,6).length === 0 ? (
              <div className="text-center py-8 text-white/25 text-sm">No payments yet</div>
            ) : billing.slice(0,6).map(b => {
              const plan = PLANS[b.plan];
              return (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${plan?.color ?? "from-white/10 to-white/5"} flex items-center justify-center shrink-0`}>
                    <CreditCard className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{plan?.name ?? b.plan} Plan</div>
                    <div className="text-[10px] text-white/30">{b.invoiceNo} · {fmtDate(b.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">₹{b.amount.toLocaleString("en-IN")}</div>
                    <div className={`text-[10px] capitalize ${b.status==="paid" ? "text-emerald-400/60" : "text-red-400/60"}`}>{b.status}</div>
                  </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Organizations",  href:"/dashboard/organizations", icon:Globe,   color:"from-brand-500 to-violet-500",  desc:"Manage tenants" },
          { label:"Users",          href:"/dashboard/users",         icon:Users,   color:"from-emerald-500 to-teal-500",  desc:"All users"      },
          { label:"Audit Logs",     href:"/dashboard/audit-logs",    icon:Shield,  color:"from-violet-500 to-purple-600", desc:"Security trail" },
          { label:"Billing",        href:"/dashboard/subscription",  icon:CreditCard,color:"from-amber-500 to-orange-500",desc:"Payments"       },
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
