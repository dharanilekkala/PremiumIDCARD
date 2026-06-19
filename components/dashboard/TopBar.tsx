"use client";
import { usePathname } from "next/navigation";
import { Search, Sparkles, Menu, HelpCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard":                "Home",
  "/dashboard/ai-builder":     "AI Smart Builder",
  "/dashboard/manual-builder": "Design Manually",
  "/dashboard/templates":      "Templates",
  "/dashboard/verification":   "Verify ID Card",
  "/dashboard/analytics":      "Reports",
  "/dashboard/users":          "Team",
  "/dashboard/audit-logs":     "Activity Log",
  "/dashboard/organizations":  "Organization",
  "/dashboard/security":       "Security",
  "/dashboard/settings":       "Settings",
  "/dashboard/admin":          "Admin Panel",
};

const PAGE_SUBTITLES: Record<string, string> = {
  "/dashboard":                "Start here — create your first ID card",
  "/dashboard/ai-builder":     "Upload template + data → bulk ID cards",
  "/dashboard/manual-builder": "Type in details and design one card at a time",
  "/dashboard/verification":   "Scan a QR code to check an ID card",
  "/dashboard/analytics":      "See your card creation history",
};

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname   = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const pageName     = PAGE_NAMES[pathname]     || "Dashboard";
  const pageSubtitle = PAGE_SUBTITLES[pathname] || "Vinofyx Prints Platform";

  return (
    <header className="h-14 sm:h-16 border-b border-white/[0.06] bg-[#0a0d18]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-white truncate">{pageName}</h1>
          <p className="text-[10px] sm:text-[11px] text-white/30 hidden sm:block truncate">{pageSubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <input
              autoFocus
              onBlur={() => setSearchOpen(false)}
              className="w-32 sm:w-48 h-9 px-3 pl-9 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50"
              placeholder="Search…"
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          {searchOpen && <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />}
        </div>

        {/* Help */}
        <button
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title="Help & Tips"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Quick Generate CTA */}
        <Link href="/dashboard/ai-builder" className="hidden sm:block">
          <button className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow-sm whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Create ID Card</span>
            <span className="md:hidden">Create</span>
          </button>
        </Link>
      </div>
    </header>
  );
}
