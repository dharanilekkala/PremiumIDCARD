"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Zap,
  LayoutDashboard,
  Users,
  Globe,
} from "lucide-react";

const navLinks = [
  {
    label: "Product",
    href: "#",
    dropdown: [
      { label: "AI Builder", href: "#ai-builder", icon: Sparkles, desc: "AI-powered template recreation" },
      { label: "Manual Builder", href: "#manual-builder", icon: LayoutDashboard, desc: "Full design control" },
      { label: "Bulk Generator", href: "#bulk", icon: Zap, desc: "1000+ cards in minutes" },
      { label: "Digital IDs", href: "#digital-ids", icon: Globe, desc: "Mobile-friendly cards" },
    ],
  },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
  { label: "Enterprise", href: "#enterprise" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-[#060810]/80 border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold text-white">
              ID<span className="gradient-text">Forge</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-brand-500/20 to-violet-500/20 border border-brand-500/30 text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {link.dropdown ? (
                  <button className="flex items-center gap-1 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5">
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === link.label ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
                  >
                    {link.label}
                  </Link>
                )}

                <AnimatePresence>
                  {link.dropdown && activeDropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-64 rounded-2xl border border-white/10 backdrop-blur-xl bg-[#0d0a1f]/90 shadow-2xl overflow-hidden"
                    >
                      <div className="p-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors duration-150 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                              <item.icon className="w-4 h-4 text-brand-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{item.label}</div>
                              <div className="text-xs text-white/50 mt-0.5">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/dashboard">
              <button className="btn-ghost text-sm">Sign In</button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-premium text-sm">
                <Sparkles className="w-4 h-4" />
                Start Free Trial
              </button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden backdrop-blur-xl bg-[#060810]/95 border-t border-white/[0.06]"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.dropdown ? "#" : link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 pb-2 flex flex-col gap-2">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <button className="btn-ghost w-full">Sign In</button>
                </Link>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <button className="btn-premium w-full">
                    <Sparkles className="w-4 h-4" />
                    Start Free Trial
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
