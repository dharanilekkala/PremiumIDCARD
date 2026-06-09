"use client";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Sparkles, LogOut, User, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserInitials, ROLE_META } from "@/lib/auth";
import Link from "next/link";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard":                "Overview",
  "/dashboard/ai-builder":     "AI Smart Builder",
  "/dashboard/manual-builder": "Manual Builder",
  "/dashboard/templates":      "Templates",
  "/dashboard/bulk":           "Bulk Generator",
  "/dashboard/digital-ids":    "Digital IDs",
  "/dashboard/verification":   "Verification Center",
  "/dashboard/analytics":      "Analytics",
  "/dashboard/users":          "User Management",
  "/dashboard/security":       "Security & Audit Logs",
  "/dashboard/settings":       "Settings",
};

export default function TopBar() {
  const pathname             = usePathname();
  const router               = useRouter();
  const { session, logout, role } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageName  = PAGE_NAMES[pathname] || "Dashboard";
  const initials  = session ? getUserInitials(session.name) : "?";
  const roleMeta  = role ? ROLE_META[role] : null;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.replace("/login");
  };

  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#0a0d18]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-bold text-white">{pageName}</h1>
          <p className="text-[11px] text-white/30">IDForge AI Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <input autoFocus onBlur={() => setSearchOpen(false)}
              className="w-48 h-9 px-3 pl-9 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50"
              placeholder="Search…" />
          ) : (
            <button onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <Search className="w-4 h-4" />
            </button>
          )}
          {searchOpen && <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />}
        </div>

        {/* Notification */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* Quick Generate (visible for roles with permission) */}
        {role && ["SuperAdmin","Admin","Operator"].includes(role) && (
          <Link href="/dashboard/ai-builder">
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Generate
            </button>
          </Link>
        )}

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-brand-500/30">
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1120] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              {/* User info */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{session?.name}</div>
                    <div className="text-xs text-white/40 truncate">{session?.email}</div>
                    {roleMeta && (
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 border ${
                        role === "SuperAdmin" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        role === "Admin"      ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                        role === "Operator"   ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                                               "bg-white/5 text-white/40 border-white/10"
                      }`}>{roleMeta.label}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)}>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
                    <User className="w-4 h-4" /> Profile & Settings
                  </button>
                </Link>
                {role && ["SuperAdmin","Admin"].includes(role) && (
                  <Link href="/dashboard/security" onClick={() => setMenuOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
                      <Shield className="w-4 h-4" /> Security & Audit Logs
                    </button>
                  </Link>
                )}
              </div>

              <div className="p-2 border-t border-white/[0.06]">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
