"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Upload, FileSpreadsheet, Download, Bot, PenTool,
  QrCode, ArrowRight, CheckCircle, Play, Lightbulb,
  GraduationCap, Building2, Users, Zap,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Upload,
    title: "Upload Your Template",
    desc: "Take a photo or scan your existing ID card design. Our AI instantly reads all the text zones, photo area, and layout.",
    color: "from-brand-500 to-violet-500",
    tip: "Any JPG, PNG or PDF works — even a hand-drawn sketch!",
  },
  {
    step: "2",
    icon: FileSpreadsheet,
    title: "Add Your Data",
    desc: "Upload an Excel or CSV file with names, photos, and details. Or type in details for a single card — no spreadsheet needed.",
    color: "from-emerald-500 to-teal-500",
    tip: "Use our sample Excel file to see the format instantly.",
  },
  {
    step: "3",
    icon: Download,
    title: "Download ID Cards",
    desc: "Get print-ready PNG or PDF files in seconds. 1 card or 5,000 cards — same speed, same quality.",
    color: "from-amber-500 to-orange-500",
    tip: "Cards are full-resolution and ready to print at any copy shop.",
  },
];

const QUICK_TOOLS = [
  {
    label: "AI Smart Builder",
    href:  "/dashboard/ai-builder",
    icon:  Bot,
    color: "from-brand-500 to-violet-500",
    glow:  "#6366f1",
    desc:  "Upload template + Excel → bulk ID cards in minutes",
    badge: "Most Popular",
  },
  {
    label: "Design Manually",
    href:  "/dashboard/manual-builder",
    icon:  PenTool,
    color: "from-emerald-500 to-teal-500",
    glow:  "#10b981",
    desc:  "Create a single card by typing in details directly",
    badge: "Beginner Friendly",
  },
  {
    label: "Verify an ID Card",
    href:  "/dashboard/verification",
    icon:  QrCode,
    color: "from-cyan-500 to-blue-500",
    glow:  "#06b6d4",
    desc:  "Scan a QR code to check if a card is genuine",
    badge: null,
  },
  {
    label: "View Reports",
    href:  "/dashboard/analytics",
    icon:  Zap,
    color: "from-violet-500 to-purple-500",
    glow:  "#8b5cf6",
    desc:  "See how many cards were created and when",
    badge: null,
  },
];

const USE_CASES = [
  { icon: GraduationCap, label: "Schools & Colleges",  desc: "Student ID cards with class, roll number & photo" },
  { icon: Building2,     label: "Offices & Companies", desc: "Employee ID cards with designation & department"  },
  { icon: Users,         label: "Events & Clubs",      desc: "Membership or event pass cards in bulk"           },
];

const TIPS = [
  "You can create a card without logging in — just open and start.",
  "AI Builder can process 5,000+ cards in under 10 minutes.",
  "Upload any existing ID card photo as your template — AI figures out the layout.",
  "Download cards as PDF and send directly to a print shop.",
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #0f1629 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-60 h-60 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-brand-500/20 border border-brand-500/30 text-brand-300 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> No login required
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Free to use
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
            Create Professional<br />
            <span className="gradient-text">ID Cards in Minutes</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base mb-6 max-w-lg">
            Upload your ID card design, add your data from Excel, and download
            print-ready cards instantly — no training needed.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/ai-builder">
              <button className="btn-premium text-sm gap-2">
                <Bot className="w-4 h-4" />
                Create ID Cards with AI
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard/manual-builder">
              <button className="btn-ghost text-sm gap-2">
                <PenTool className="w-4 h-4" />
                Design a Single Card
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── How It Works ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-brand-400" />
          <h2 className="text-base font-bold text-white">How it works — 3 simple steps</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="glass-card rounded-2xl border border-white/[0.07] p-5 flex flex-col gap-3 hover:border-white/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black text-white/10">0{item.step}</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                <div className="text-xs text-white/40 leading-relaxed">{item.desc}</div>
              </div>
              <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.05]">
                <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300/70">{item.tip}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Tools ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-base font-bold text-white mb-4">Choose a tool to get started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_TOOLS.map((tool, i) => (
            <Link key={tool.label} href={tool.href}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.07 }}
                className="glass-card rounded-2xl border border-white/[0.07] p-5 flex items-center gap-4 hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                style={{ boxShadow: `0 0 0 0 ${tool.glow}00` }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  style={{ boxShadow: `0 4px 16px ${tool.glow}40` }}
                >
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{tool.label}</span>
                    {tool.badge && (
                      <span className="text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded-full">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{tool.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all shrink-0" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Who Uses It ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-base font-bold text-white mb-4">Used by everyone — no expertise needed</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.42 + i * 0.06 }}
              className="glass-card rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <uc.icon className="w-4.5 h-4.5 text-white/50" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{uc.label}</div>
                <div className="text-[11px] text-white/35 mt-0.5">{uc.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Tips ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="glass-card rounded-2xl border border-amber-500/15 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Good to know</h3>
          </div>
          <ul className="space-y-2">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-white/50">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

    </div>
  );
}
