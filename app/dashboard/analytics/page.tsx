"use client";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, CreditCard, QrCode, Users, Calendar, Activity } from "lucide-react";

const monthlyData = [
  { month: "Jan", cards: 1200, verifications: 890, users: 45 },
  { month: "Feb", cards: 1890, verifications: 1200, users: 62 },
  { month: "Mar", cards: 2100, verifications: 1540, users: 78 },
  { month: "Apr", cards: 1800, verifications: 1300, users: 71 },
  { month: "May", cards: 2800, verifications: 2100, users: 95 },
  { month: "Jun", cards: 3200, verifications: 2400, users: 112 },
  { month: "Jul", cards: 2900, verifications: 2100, users: 98 },
  { month: "Aug", cards: 3800, verifications: 2800, users: 134 },
  { month: "Sep", cards: 4200, verifications: 3100, users: 156 },
  { month: "Oct", cards: 3900, verifications: 2900, users: 142 },
  { month: "Nov", cards: 4800, verifications: 3500, users: 178 },
  { month: "Dec", cards: 5200, verifications: 3900, users: 198 },
];

const cardTypes = [
  { name: "Corporate", value: 45, color: "#6366f1" },
  { name: "School", value: 28, color: "#10b981" },
  { name: "Hospital", value: 15, color: "#06b6d4" },
  { name: "Events", value: 12, color: "#f59e0b" },
];

const weeklyVerifications = [
  { day: "Mon", count: 234 },
  { day: "Tue", count: 312 },
  { day: "Wed", count: 289 },
  { day: "Thu", count: 456 },
  { day: "Fri", count: 398 },
  { day: "Sat", count: 167 },
  { day: "Sun", count: 89 },
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
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const kpis = [
  { label: "Cards This Month", value: "5,247", change: "+18%", icon: CreditCard, color: "from-brand-500 to-violet-500" },
  { label: "QR Scans Today", value: "1,284", change: "+23%", icon: QrCode, color: "from-cyan-500 to-blue-500" },
  { label: "Active Users", value: "3,847", change: "+5%", icon: Users, color: "from-emerald-500 to-teal-500" },
  { label: "Avg Daily Generation", value: "174", change: "+12%", icon: Activity, color: "from-amber-500 to-orange-500" },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 rounded-2xl border border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 rounded-2xl border border-white/[0.06]"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">Monthly Performance</h3>
            <p className="text-xs text-white/30 mt-0.5">Cards generated, verifications, and new users</p>
          </div>
          <div className="flex gap-4 text-xs">
            {[
              { color: "#6366f1", label: "Cards" },
              { color: "#06b6d4", label: "Verifications" },
              { color: "#10b981", label: "Users" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-white/40">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              {[
                { id: "cards", color: "#6366f1" },
                { id: "verif", color: "#06b6d4" },
                { id: "users", color: "#10b981" },
              ].map((g) => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={g.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="cards" stroke="#6366f1" strokeWidth={2} fill="url(#cards)" name="Cards" />
            <Area type="monotone" dataKey="verifications" stroke="#06b6d4" strokeWidth={2} fill="url(#verif)" name="Verifications" />
            <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} fill="url(#users)" name="Users" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card Types Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl border border-white/[0.06]"
        >
          <h3 className="text-sm font-bold text-white mb-5">Card Types Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={cardTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {cardTypes.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(13,10,31,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {cardTypes.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-white/60">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Weekly Verifications Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl border border-white/[0.06]"
        >
          <h3 className="text-sm font-bold text-white mb-5">Weekly QR Verifications</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyVerifications} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Verifications" radius={[4, 4, 0, 0]}>
                {weeklyVerifications.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? "#6366f1" : "rgba(99,102,241,0.4)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
