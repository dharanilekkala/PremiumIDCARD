"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, LayoutDashboard, Bot, PenTool, QrCode, BarChart3,
  Users, Settings, ChevronLeft, ChevronRight, Shield,
  AlertTriangle, Globe, ClipboardList, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserInitials } from "@/lib/auth";

const NAV = [
  { label:"Home",             href:"/dashboard",               icon:LayoutDashboard, badge:null  },
  { label:"AI Builder",       href:"/dashboard/ai-builder",    icon:Bot,             badge:"AI"  },
  { label:"Design Manually",  href:"/dashboard/manual-builder",icon:PenTool,         badge:null  },
  { label:"Verify ID Card",   href:"/dashboard/verification",  icon:QrCode,          badge:null  },
  { label:"Reports",          href:"/dashboard/analytics",     icon:BarChart3,       badge:null  },
  { label:"Team",             href:"/dashboard/users",         icon:Users,           badge:null  },
  { label:"Activity Log",     href:"/dashboard/audit-logs",    icon:ClipboardList,   badge:null  },
  { label:"Organization",     href:"/dashboard/organizations", icon:Globe,           badge:null  },
  { label:"Security",         href:"/dashboard/security",      icon:Shield,          badge:null  },
  { label:"Settings",         href:"/dashboard/settings",      icon:Settings,        badge:null  },
];


interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile,  setIsMobile]  = useState(true); // true = safe default (hides sidebar before effect)
  const [mounted,   setMounted]   = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { session, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = session ? getUserInitials(session.name) : "G";

  const handleLogout = () => { logout(); router.replace("/"); };
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Plain aside — no framer-motion, all transitions via CSS */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-[#0a0d18] border-r border-white/[0.06] shrink-0 overflow-hidden lg:relative lg:inset-auto lg:z-auto"
        style={{
          width: sidebarWidth,
          transform: isMobile && !mobileOpen ? `translateX(-${sidebarWidth}px)` : "translateX(0px)",
          transition: mounted ? "width 0.3s ease-in-out, transform 0.3s ease-in-out" : "none",
        }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
                transition={{ duration:0.2 }}
                className="font-bold text-white text-lg whitespace-nowrap flex-1"
              >
                ID<span className="gradient-text">Forge</span>
              </motion.span>
            )}
          </AnimatePresence>
          {/* Mobile close button */}
          {!collapsed && (
            <button
              onClick={onClose}
              className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV.map((item) => {
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

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block px-2 py-2 border-t border-white/[0.06]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all duration-200 group ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
              {collapsed
                ? <ChevronRight className="w-4 h-4" />
                : <ChevronLeft className="w-4 h-4" />}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs font-medium whitespace-nowrap"
                >
                  Collapse sidebar
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Bottom: user avatar */}
        <div className={`border-t border-white/[0.06] p-3 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-bold text-xs">
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{session?.name ?? "Guest User"}</div>
                <div className="text-[10px] text-white/30 mt-0.5">Free account</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

{collapsed && <AlertTriangle className="hidden" />}
      </aside>
    </>
  );
}
