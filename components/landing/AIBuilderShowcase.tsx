"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Upload, Eye, Download, CheckCircle, ArrowRight, Cpu } from "lucide-react";

const aiSteps = [
  { label: "Upload Sample", icon: Upload, done: true },
  { label: "AI Analysis", icon: Cpu, done: true },
  { label: "Layout Extraction", icon: Eye, done: true },
  { label: "Card Generation", icon: Sparkles, done: false, active: true },
  { label: "Export Ready", icon: Download, done: false },
];

const detectedFields = [
  { field: "Logo", position: "Top-Left", confidence: 98 },
  { field: "Name", position: "Center", confidence: 99 },
  { field: "ID Number", position: "Bottom-Left", confidence: 97 },
  { field: "Photo", position: "Right", confidence: 96 },
  { field: "QR Code", position: "Bottom-Right", confidence: 99 },
];

export default function AIBuilderShowcase() {
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  return (
    <section id="ai-builder" className="relative py-28 bg-[#060810] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute left-0 top-1/3 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-badge">
              <Sparkles className="w-3 h-3" />
              AI Smart Builder
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              AI Recreates Any
              <br />
              <span className="gradient-text">ID Card Design</span>
              <br />
              Automatically
            </h2>
            <p className="text-lg text-white/40 mb-8 leading-relaxed">
              Upload a photo of any existing ID card. Our AI analyzes the layout, extracts colors,
              detects typography, identifies field positions, and recreates a pixel-perfect digital
              template — ready for your data.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {[
                "AI detects and extracts all text field positions",
                "Preserves exact colors, fonts, and design elements",
                "Recognizes logo, photo, QR code placement",
                "Auto-generates editable template in seconds",
                "Save templates for future use and bulk generation",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-brand-400" />
                  </div>
                  <span className="text-sm text-white/60">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button className="btn-premium">
                <Sparkles className="w-4 h-4" />
                Try AI Builder
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="btn-ghost">View Demo</button>
            </div>
          </motion.div>

          {/* Right: UI Demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-card rounded-3xl border border-white/[0.07] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  {["bg-red-500", "bg-amber-500", "bg-emerald-500"].map((c) => (
                    <div key={c} className={`w-3 h-3 rounded-full ${c} opacity-70`} />
                  ))}
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span className="text-sm text-white/50 font-medium">IDForge AI — Smart Builder</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Progress Steps */}
                <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
                  {aiSteps.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-1 shrink-0">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
                        step.done
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : step.active
                          ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse"
                          : "bg-white/5 text-white/30 border border-white/10"
                      }`}>
                        <step.icon className="w-3 h-3" />
                        {step.label}
                        {step.done && <CheckCircle className="w-3 h-3" />}
                      </div>
                      {i < aiSteps.length - 1 && (
                        <div className="w-3 h-px bg-white/10" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Main Panel */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  {/* Input card preview */}
                  <div>
                    <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">Input Sample</div>
                    <div
                      className="rounded-xl overflow-hidden aspect-video relative"
                      style={{
                        background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 100%)",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-3 rounded bg-white/20" />
                          <div className="w-6 h-6 rounded-full bg-white/10" />
                        </div>
                        <div>
                          <div className="w-16 h-2.5 rounded bg-white/30 mb-1" />
                          <div className="w-10 h-1.5 rounded bg-white/15" />
                          <div className="flex justify-between mt-2">
                            <div className="w-8 h-1.5 rounded bg-white/15" />
                            <div className="w-5 h-5 rounded bg-white/20" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 bg-amber-500/80 text-[8px] font-bold text-white px-1.5 py-0.5 rounded">
                        UPLOADED
                      </div>
                    </div>
                  </div>

                  {/* Output card preview */}
                  <div>
                    <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">AI Generated</div>
                    <div
                      className="rounded-xl overflow-hidden aspect-video relative"
                      style={{
                        background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 100%)",
                        border: "1px solid rgba(99,102,241,0.4)",
                        boxShadow: "0 0 20px rgba(99,102,241,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-3 rounded bg-brand-400/60 flex items-center justify-center">
                            <span className="text-[5px] font-bold text-white">ACME</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-brand-500/60 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-white">RK</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-white text-[9px] font-bold">Rahul Kumar</div>
                          <div className="text-white/50 text-[7px]">Sr. Manager</div>
                          <div className="flex justify-between items-center mt-1.5">
                            <div className="text-white/40 text-[6px] font-mono">EMP-001</div>
                            <div className="w-5 h-5 rounded bg-white grid grid-cols-3 gap-px p-0.5">
                              {Array.from({length:9}).map((_,i)=>(
                                <div key={i} className={`rounded-[1px] ${i%3===0||i===4?'bg-gray-800':'bg-white'}`}/>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 bg-emerald-500/80 text-[8px] font-bold text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Sparkles className="w-2 h-2" /> AI
                      </div>
                      {/* Shimmer */}
                      <div className="absolute inset-0 shimmer-effect rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* Detected Fields */}
                <div>
                  <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-3">
                    AI Detected Fields
                  </div>
                  <div className="space-y-2">
                    {detectedFields.map((item) => (
                      <div key={item.field} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-white/60 font-medium shrink-0">{item.field}</div>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.confidence}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                          />
                        </div>
                        <div className="text-xs text-emerald-400 font-mono shrink-0">{item.confidence}%</div>
                        <div className="text-[10px] text-white/30 shrink-0">{item.position}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
