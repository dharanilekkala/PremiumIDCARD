"use client";
import { motion } from "framer-motion";
import { Upload, Cpu, Download, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Sample",
    description: "Upload your existing ID card image or describe your design requirements in plain text.",
    color: "from-brand-500 to-brand-600",
    glow: "rgba(99,102,241,0.4)",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Analyzes",
    description: "Our AI extracts layout, colors, typography, logo positions, and field placements automatically.",
    color: "from-violet-500 to-violet-600",
    glow: "rgba(139,92,246,0.4)",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Generate Cards",
    description: "Enter data manually, import from Excel, or let AI fill fields from your description.",
    color: "from-cyan-500 to-cyan-600",
    glow: "rgba(6,182,212,0.4)",
  },
  {
    step: "04",
    icon: Download,
    title: "Export & Share",
    description: "Download as PDF, PNG, or ZIP bundle. Share digital IDs with QR verification links.",
    color: "from-emerald-500 to-emerald-600",
    glow: "rgba(52,211,153,0.4)",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 bg-[#060810] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-brand-500/0 via-brand-500/20 to-brand-500/0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="section-badge">
            <Sparkles className="w-3 h-3" />
            Simple Process
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How <span className="gradient-text">IDForge AI</span> Works
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            From upload to export in under 2 minutes. No design skills required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
              )}

              <div className="relative glass-card p-6 rounded-2xl border border-white/[0.07] hover:border-white/15 transition-all duration-300 group-hover:-translate-y-1">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#0d0a1f] border border-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/40">{step.step}</span>
                </div>

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}
                  style={{ boxShadow: `0 8px 24px ${step.glow}` }}
                >
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Process visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 glass-card rounded-3xl p-8 border border-white/[0.07]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Input */}
            <div className="text-center lg:text-left">
              <div className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-3">Input</div>
              <div className="space-y-2">
                {["Sample ID Card Image", "Employee Data (Excel)", "Organization Logo"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow + AI */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center gap-3">
                <div className="w-px h-8 lg:w-8 lg:h-px bg-white/10 lg:rotate-0 rotate-90" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-glow-md">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="w-px h-8 lg:w-8 lg:h-px bg-white/10 lg:rotate-0 rotate-90" />
              </div>
              <div className="mt-3 text-sm font-semibold gradient-text">AI Processing</div>
              <div className="text-xs text-white/30 mt-1">Layout · Colors · Fields · QR</div>
            </div>

            {/* Output */}
            <div className="text-center lg:text-right">
              <div className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-3">Output</div>
              <div className="space-y-2">
                {["Professional ID Cards (PDF/PNG)", "Digital ID with QR Code", "Bulk ZIP Download"].map((item) => (
                  <div key={item} className="flex items-center justify-end gap-2 text-sm text-white/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
