"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Layers, Star, Crown, ArrowRight } from "lucide-react";

const categories = ["All", "Corporate", "School", "Hospital", "College", "Events", "Government"];

const templates = [
  {
    name: "Corporate Pro",
    category: "Corporate",
    colors: ["#1a1040", "#6366f1", "#8b5cf6"],
    rating: 4.9,
    uses: "12.4K",
    premium: false,
    accent: "#6366f1",
  },
  {
    name: "School Classic",
    category: "School",
    colors: ["#0d1f0d", "#059669", "#10b981"],
    rating: 4.8,
    uses: "8.2K",
    premium: false,
    accent: "#10b981",
  },
  {
    name: "Hospital Staff",
    category: "Hospital",
    colors: ["#0a1e3a", "#0ea5e9", "#38bdf8"],
    rating: 4.9,
    uses: "5.6K",
    premium: true,
    accent: "#0ea5e9",
  },
  {
    name: "College Modern",
    category: "College",
    colors: ["#1f0f00", "#f59e0b", "#fbbf24"],
    rating: 4.7,
    uses: "9.1K",
    premium: false,
    accent: "#f59e0b",
  },
  {
    name: "Tech Startup",
    category: "Corporate",
    colors: ["#060810", "#06b6d4", "#22d3ee"],
    rating: 4.9,
    uses: "6.8K",
    premium: true,
    accent: "#06b6d4",
  },
  {
    name: "Event Pass",
    category: "Events",
    colors: ["#1a0a1f", "#ec4899", "#f43f5e"],
    rating: 4.8,
    uses: "3.4K",
    premium: true,
    accent: "#ec4899",
  },
];

function IDCardPreview({ template }: { template: typeof templates[0] }) {
  return (
    <div
      className="w-full aspect-[1.6/1] rounded-xl overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)` }}
    >
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <div className="w-14 h-4 rounded" style={{ background: `${template.accent}80` }}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[7px] font-bold text-white">ORGANIZATION</span>
              </div>
            </div>
            <div className="text-[7px] text-white/40 mt-0.5">IDENTITY CARD</div>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{ background: `${template.accent}40`, border: `1px solid ${template.accent}60` }}
          >
            AB
          </div>
        </div>
        <div>
          <div className="text-white font-bold text-sm">Employee Name</div>
          <div className="text-white/50 text-[9px]">Designation · Department</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-white/40 text-[8px] font-mono">ID: EMP-000</div>
            <div className="w-7 h-7 rounded bg-white/20 grid grid-cols-3 gap-0.5 p-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`rounded-[1px] ${[0, 2, 4, 6, 8].includes(i) ? "bg-white" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Shimmer */}
      <div className="absolute inset-0 shimmer-effect rounded-xl pointer-events-none opacity-50" />
    </div>
  );
}

export default function TemplatesSection() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? templates
    : templates.filter((t) => t.category === activeCategory);

  return (
    <section id="templates" className="relative py-28 bg-[#060810] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="section-badge">
            <Layers className="w-3 h-3" />
            Template Marketplace
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            500+ Premium Templates
            <br />
            <span className="gradient-text">Ready to Use</span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            Professional templates for every industry. One click to apply, fully customizable for your brand.
          </p>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-brand-500 text-white shadow-glow-sm"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group glass-card rounded-2xl border border-white/[0.06] hover:border-white/15 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-4">
                <IDCardPreview template={template} />
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{template.name}</span>
                    {template.premium && (
                      <span className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        <Crown className="w-2.5 h-2.5" /> PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {template.rating}
                    </div>
                    <span className="text-white/30 text-xs">{template.uses} uses</span>
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{
                    background: `${template.accent}20`,
                    border: `1px solid ${template.accent}40`,
                    color: template.accent,
                  }}
                >
                  Use Template
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <button className="btn-ghost">
            Browse All 500+ Templates
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
