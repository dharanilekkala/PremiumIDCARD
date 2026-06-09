"use client";
import { motion } from "framer-motion";
import {
  Sparkles, Zap, QrCode, Users, LayoutDashboard, Shield,
  Camera, Globe, BarChart3, FileSpreadsheet, Layers, Lock
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Template Recreation",
    description: "Upload any ID card and AI instantly recreates the entire layout, preserving colors, fonts, logo placement, and design structure.",
    color: "from-brand-500 to-brand-600",
    glow: "#6366f1",
    tag: "Core AI",
  },
  {
    icon: Zap,
    title: "Bulk Generation",
    description: "Upload Excel data + photo ZIP, auto-map columns, and generate 1000+ professional ID cards in under 60 seconds.",
    color: "from-amber-500 to-orange-500",
    glow: "#f59e0b",
    tag: "Enterprise",
  },
  {
    icon: QrCode,
    title: "QR Verification System",
    description: "Every ID card gets a unique QR code. Scan to instantly verify identity, check card status, expiry, and view full history.",
    color: "from-cyan-500 to-cyan-600",
    glow: "#06b6d4",
    tag: "Security",
  },
  {
    icon: Camera,
    title: "AI Photo Enhancement",
    description: "Automatic background removal, passport-size crop, face detection, brightness correction, and quality enhancement.",
    color: "from-violet-500 to-violet-600",
    glow: "#8b5cf6",
    tag: "AI Vision",
  },
  {
    icon: Globe,
    title: "Digital ID Cards",
    description: "Generate mobile-friendly digital identity cards with shareable URLs, wallet pass support, and one-tap downloads.",
    color: "from-emerald-500 to-teal-500",
    glow: "#10b981",
    tag: "Digital",
  },
  {
    icon: Users,
    title: "Approval Workflow",
    description: "Multi-level approval chain: HR → Manager → Admin. Reject with comments, re-edit, and full audit trail for compliance.",
    color: "from-rose-500 to-rose-600",
    glow: "#f43f5e",
    tag: "Workflow",
  },
  {
    icon: LayoutDashboard,
    title: "Template Marketplace",
    description: "500+ premium templates for schools, hospitals, corporates, events. One-click apply and customize for your brand.",
    color: "from-blue-500 to-blue-600",
    glow: "#3b82f6",
    tag: "Templates",
  },
  {
    icon: FileSpreadsheet,
    title: "Smart Field Mapping",
    description: "AI auto-detects Excel column names and maps them to ID card fields. No manual configuration required.",
    color: "from-green-500 to-green-600",
    glow: "#22c55e",
    tag: "AI Smart",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Role-based access control, JWT + 2FA authentication, encrypted storage, watermark protection, and duplicate detection.",
    color: "from-slate-500 to-slate-600",
    glow: "#64748b",
    tag: "Security",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 bg-[#070a12] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="section-badge">
            <Layers className="w-3 h-3" />
            Platform Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything You Need to
            <br />
            <span className="gradient-text">Manage Identity Cards</span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            A complete enterprise platform with AI-first design, from single card creation to
            bulk generation at scale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative glass-card p-6 rounded-2xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
            >
              {/* Background hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${feature.glow}15 0%, transparent 60%)`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}
                    style={{ boxShadow: `0 4px 16px ${feature.glow}40` }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${feature.glow}15`,
                      border: `1px solid ${feature.glow}30`,
                      color: feature.glow,
                    }}
                  >
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
