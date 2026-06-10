"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, LayoutDashboard, Bot, PenTool, QrCode, BarChart3,
  Users, Settings, ChevronLeft, ChevronRight, LogOut, Shield,
  Crown, AlertTriangle, CreditCard, Globe, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PLANS, getPlanBadgeColor, type PlanId } from "@/lib/subscription";
import { ROLE_META, getUserInitials, type UserRole } from "@/lib/auth";

// ── Nav definitions with role visibility ──────────────────────────────────────

const NAV = [
  { label:"Overview",        href:"/dashboard",               icon:LayoutDashboard, roles:null,                                             badge:null  },
  { label:"AI Builder",      href:"/dashboard/ai-builder",    icon:Bot,             roles:["SuperAdmin","Admin","Operator"] as UserRole[],   badge:"AI"  },
  { label:"Manual Builder",  href:"/dashboard/manual-builder",icon:PenTool,         roles:["SuperAdmin","Admin","Operator"] as UserRole[],   badge:null  },
  { label:"Verification",    href:"/dashboard/verification",  icon:QrCode,          roles:null,                                             badge:null  },
  { label:"Analytics",       href:"/dashboard/analytics",     icon:BarChart3,       roles:["SuperAdmin","Admin"]            as UserRole[],   badge:null  },
  { label:"Users",           href:"/dashboard/users",         icon:Users,           roles:["SuperAdmin","Admin"]            as UserRole[],   badge:null  },
  { label:"Audit Logs",      href:"/dashboard/audit-logs",    icon:ClipboardList,   roles:["SuperAdmin","Admin"]            as UserRole[],   badge:null  },
  { label:"Billing",         href:"/dashboard/subscription",  icon:CreditCard,      roles:["SuperAdmin"]                   as UserRole[],   badge:null  },
  { label:"Organizations",   href:"/dashboard/organizations", icon:Globe,           roles:["SuperAdmin"]                   as UserRole[],   badge:null  },
  { label:"Security",        href:"/dashboard/security",      icon:Shield,          roles:["SuperAdmin","Admin"]           as UserRole[],   badge:null  },
  { label:"Settings",        href:"/dashboard/settings",      icon:Settings,        roles:["SuperAdmin"]                   as UserRole[],   badge:null  },
];

// SuperAdmin-only section shown as separate group
const ADMIN_NAV = [
  { label:"Admin Panel",     href:"/dashboard/admin",         icon:Crown,           badge:"SA" },
];

const ROLE_PILL: Record<UserRole, string> = {
  SuperAdmin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Admin:      "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Operator:   "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Viewer:     "bg-white/10 text-white/40 border-white/15",
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { session, logout, role } = useAuth();
  const { planId } = useSubscription();

  const visibleNav = NAV.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  );

  const initials = session ? getUserInitials(session.name) : "?";
  const roleMeta = role ? ROLE_META[role] : null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-[#0a0d18] border-r border-white/[0.06] shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-10 }} transition={{ duration:0.2 }}
              className="font-bold text-white text-lg whitespace-nowrap">
              ID<span className="gradient-text">Forge</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {/* SuperAdmin admin panel — pinned at top */}
        {role === "SuperAdmin" && ADMIN_NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer mb-3 ${
                active
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-amber-500/60 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20"
              } ${collapsed ? "justify-center" : ""}`}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-500 rounded-r-full" />}
                <Crown className={`w-5 h-5 shrink-0 ${active ? "text-amber-400" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      className="flex items-center justify-between flex-1">
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1f2e] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {/* Main nav */}
        {visibleNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                active ? "bg-brand-500/15 text-brand-300" : "text-white/40 hover:text-white hover:bg-white/5"
              } ${collapsed ? "justify-center" : ""}`}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-500 rounded-r-full" />}
                <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-brand-400" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      className="flex items-center justify-between flex-1">
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold bg-brand-500/20 border border-brand-500/30 text-brand-400 px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1f2e] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <AnimatePresence>
        {!collapsed && (() => {
          const plan   = PLANS[planId];
          const colors = getPlanBadgeColor(planId);
          const isTop  = planId === "enterprise" || planId === "business";
          return isTop ? (
            <motion.div key="plan-top" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className={`mx-3 mb-3 p-2.5 rounded-xl border ${colors.border} ${colors.bg} flex items-center gap-2`}>
              <Crown className={`w-3.5 h-3.5 ${colors.text} shrink-0`} />
              <span className={`text-[10px] font-bold ${colors.text}`}>{plan.name} Plan</span>
            </motion.div>
          ) : (
            <motion.div key="plan-upgrade" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="mx-3 mb-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">{plan.name} Plan</span>
              </div>
              <p className="text-[10px] text-white/30 mb-2">Upgrade for unlimited AI Builder</p>
              <Link href="/dashboard/subscription">
                <button className="w-full text-xs font-semibold py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors">
                  Upgrade Now
                </button>
              </Link>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Bottom: user + logout */}
      <div className={`border-t border-white/[0.06] p-3 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-bold text-xs">
          {initials}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{session?.name ?? "—"}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {roleMeta && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_PILL[role!]}`}>
                    {roleMeta.label}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!collapsed && (
            <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={handleLogout} title="Sign Out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
        {collapsed && (
          <button onClick={handleLogout} title="Sign Out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-[#1a1f2e] border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors z-10">
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {collapsed && <AlertTriangle className="hidden" />}
    </motion.aside>
  );
}
