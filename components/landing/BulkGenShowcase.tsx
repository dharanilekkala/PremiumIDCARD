"use client";
import { motion } from "framer-motion";
import { FileSpreadsheet, Package, Zap, CheckCircle, ArrowRight, Download } from "lucide-react";

const employees = [
  { name: "Rahul Kumar", id: "EMP001", dept: "Engineering", status: "done" },
  { name: "Priya Sharma", id: "EMP002", dept: "Marketing", status: "done" },
  { name: "Amit Singh", id: "EMP003", dept: "Finance", status: "done" },
  { name: "Sunita Patel", id: "EMP004", dept: "HR", status: "processing" },
  { name: "Vikram Mehta", id: "EMP005", dept: "Operations", status: "queued" },
  { name: "Anita Joshi", id: "EMP006", dept: "Legal", status: "queued" },
];

export default function BulkGenShowcase() {
  return (
    <section id="bulk" className="relative py-28 bg-[#070a12] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute right-0 top-1/3 w-80 h-80 bg-amber-600/8 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: UI Demo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="glass-card rounded-3xl border border-white/[0.07] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white/60 font-medium">Bulk ID Generator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-400 font-semibold">Generating...</span>
                </div>
              </div>

              <div className="p-5">
                {/* Progress */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/50">Progress</span>
                    <span className="text-xs font-bold text-white">347 / 500 cards</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "69.4%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-white/30">Started 2 min ago</span>
                    <span className="text-[10px] text-amber-400">~45 seconds remaining</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Completed", value: "347", color: "text-emerald-400" },
                    { label: "Processing", value: "1", color: "text-amber-400" },
                    { label: "Queued", value: "152", color: "text-white/40" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/[0.05]">
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Employee list */}
                <div className="space-y-2 mb-5">
                  {employees.map((emp, i) => (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500/60 to-violet-500/60 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white">
                          {emp.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{emp.name}</div>
                        <div className="text-[10px] text-white/30">{emp.id} · {emp.dept}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        emp.status === "done"
                          ? "bg-emerald-500/20"
                          : emp.status === "processing"
                          ? "bg-amber-500/20"
                          : "bg-white/5"
                      }`}>
                        {emp.status === "done" ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : emp.status === "processing" ? (
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-white/20" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button className="btn-premium w-full justify-center text-sm">
                  <Download className="w-4 h-4" />
                  Download ZIP (347 cards)
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <span className="section-badge">
              <Zap className="w-3 h-3" />
              Bulk Generation
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Generate 1000+ Cards
              <br />
              <span className="gradient-text-warm">in Under 60 Seconds</span>
            </h2>
            <p className="text-lg text-white/40 mb-8 leading-relaxed">
              Import employee/student data from Excel, upload a photo ZIP, and let our AI
              auto-generate every single ID card. Smart column mapping, photo matching,
              and instant download.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: FileSpreadsheet, title: "Excel Import", desc: "XLSX, CSV, Google Sheets" },
                { icon: Package, title: "Photo ZIP", desc: "Auto-match by name or ID" },
                { icon: Zap, title: "Instant Processing", desc: "1000 cards in ~45 seconds" },
                { icon: Download, title: "Bulk Export", desc: "PDF, PNG, or ZIP bundle" },
              ].map((item) => (
                <div key={item.title} className="glass-card p-4 rounded-xl border border-white/[0.06]">
                  <item.icon className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>

            <button className="btn-premium">
              <Zap className="w-4 h-4" />
              Try Bulk Generator
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
