"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, TrendingUp, Users, CreditCard, QrCode,
  ArrowUpRight, ArrowRight, CheckCircle, Clock, XCircle, Eye,
  Bot, PenTool, BarChart3, Settings
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

const statsCards = [
  {
    title: "Total Cards Generated",
    value: "0",
    change: "0%",
    trend: "up",
    icon: CreditCard,
    color: "from-brand-500 to-brand-600",
    glow: "#6366f1",
  },
  {
    title: "Active Cards",
    value: "0",
    change: "0%",
    trend: "up",
    icon: CheckCircle,
    color: "from-emerald-500 to-teal-500",
    glow: "#10b981",
  },
  {
    title: "Verifications Today",
    value: "0",
    change: "0%",
    trend: "up",
    icon: QrCode,
    color: "from-cyan-500 to-cyan-600",
    glow: "#06b6d4",
  },
  {
    title: "Total Users",
    value: "0",
    change: "0%",
    trend: "up",
    icon: Users,
    color: "from-violet-500 to-violet-600",
    glow: "#8b5cf6",
  },
];

const chartData = [
  { month: "Jan", cards: 0, verifications: 0 },
  { month: "Feb", cards: 0, verifications: 0 },
  { month: "Mar", cards: 0, verifications: 0 },
  { month: "Apr", cards: 0, verifications: 0 },
  { month: "May", cards: 0, verifications: 0 },
  { month: "Jun", cards: 0, verifications: 0 },
  { month: "Jul", cards: 0, verifications: 0 },
  { month: "Aug", cards: 0, verifications: 0 },
  { month: "Sep", cards: 0, verifications: 0 },
  { month: "Oct", cards: 0, verifications: 0 },
  { month: "Nov", cards: 0, verifications: 0 },
  { month: "Dec", cards: 0, verifications: 0 },
];

const recentCards: { name: string; id: string; dept: string; status: string; time: string }[] = [];

const quickActions = [
  { label: "AI Builder",    href: "/dashboard/ai-builder",    icon: Bot,      color: "from-brand-500 to-violet-500",   desc: "Create with AI"    },
  { label: "Manual Build",  href: "/dashboard/manual-builder",icon: PenTool,  color: "from-emerald-500 to-teal-500",   desc: "Design manually"   },
  { label: "Analytics",     href: "/dashboard/analytics",     icon: BarChart3,color: "from-violet-500 to-purple-500",  desc: "View insights"     },
  { label: "Verification",  href: "/dashboard/verification",  icon: QrCode,   color: "from-cyan-500 to-blue-500",      desc: "Scan & verify"     },
  { label: "Users",         href: "/dashboard/users",         icon: Users,    color: "from-amber-500 to-orange-500",   desc: "Manage users"      },
  { label: "Settings",      href: "/dashboard/settings",      icon: Settings, color: "from-rose-500 to-pink-500",      desc: "Configure"         },
];

interface TooltipEntry { name: string; value: number | string; color: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-xl border border-white/10 text-xs">
        <p className="text-white/50 mb-1">{label}</p>
        {payload.map((p: TooltipEntry) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px]" />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/50 text-sm mb-1">Good morning, Rahul 👋</p>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back to IDForge AI</h2>
            <p className="text-white/40 text-sm">
              You&apos;ve generated <span className="text-brand-300 font-semibold">0 cards</span> this month.
              {" "}Your monthly limit is <span className="text-white/60">2,000 cards</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/ai-builder">
              <button className="btn-premium text-sm">
                <Sparkles className="w-4 h-4" />
                Create New Card
              </button>
            </Link>
          </div>
        </div>
        {/* Usage bar */}
        <div className="relative z-10 mt-5">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>Monthly Usage</span>
            <span>0 / 2,000 cards</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "0%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 rounded-2xl border border-white/[0.06] hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                style={{ boxShadow: `0 4px 12px ${card.glow}40` }}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${
                card.trend === "up" ? "text-emerald-400" : "text-red-400"
              }`}>
                <TrendingUp className="w-3 h-3" />
                {card.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">{card.value}</div>
            <div className="text-xs text-white/40">{card.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 glass-card p-5 rounded-2xl border border-white/[0.06]"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Cards Generated vs Verified</h3>
              <p className="text-xs text-white/30 mt-0.5">Last 12 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="text-white/40">Cards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-white/40">Verifications</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cards" stroke="#6366f1" strokeWidth={2} fill="url(#colorCards)" name="Cards" />
              <Area type="monotone" dataKey="verifications" stroke="#06b6d4" strokeWidth={2} fill="url(#colorVerif)" name="Verifications" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 rounded-2xl border border-white/[0.06]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Cards</h3>
            <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CreditCard className="w-8 h-8 text-white/10" />
                <p className="text-xs text-white/25">No cards generated yet</p>
              </div>
            ) : recentCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/60 to-violet-500/60 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {card.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{card.name}</div>
                  <div className="text-[10px] text-white/30">{card.id} · {card.dept}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    card.status === "active"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : card.status === "pending"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-red-500/15 text-red-400"
                  }`}>
                    {card.status.toUpperCase()}
                  </div>
                  <div className="text-[9px] text-white/20">{card.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.label} href={action.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="glass-card p-4 rounded-2xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer group text-center"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-white">{action.label}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{action.desc}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
