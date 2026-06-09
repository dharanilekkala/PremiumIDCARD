"use client";
import { motion } from "framer-motion";
import { FieldDef } from "@/lib/orgTypes";
import { ChevronDown } from "lucide-react";

interface Props {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  compact?: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  identity: "Identity",
  academic: "Academic / Professional",
  family: "Family",
  contact: "Contact",
  medical: "Medical",
  other: "Other Details",
};

export default function DynamicFieldForm({ fields, values, onChange, compact = false }: Props) {
  // Group fields
  const groups: Record<string, FieldDef[]> = {};
  for (const f of fields) {
    const g = f.group ?? "other";
    if (!groups[g]) groups[g] = [];
    groups[g].push(f);
  }

  return (
    <div className={`space-y-${compact ? "3" : "5"}`}>
      {Object.entries(groups).map(([groupKey, groupFields]) => (
        <div key={groupKey}>
          <div className={`text-[9px] font-bold text-white/25 uppercase tracking-widest mb-${compact ? "1.5" : "2.5"} flex items-center gap-1.5`}>
            <div className="flex-1 h-px bg-white/[0.06]" />
            {GROUP_LABELS[groupKey] ?? groupKey}
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className={`grid ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-${compact ? "2" : "3"}`}>
            {groupFields.map((field) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={field.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <label className={`${compact ? "text-[9px]" : "text-[10px]"} font-semibold text-white/40 uppercase tracking-wide flex items-center gap-1 mb-1.5`}>
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                </label>

                {field.type === "select" ? (
                  <div className="relative">
                    <select
                      value={values[field.key] ?? ""}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      className={`w-full ${compact ? "h-8 text-xs px-2.5" : "h-9 text-xs px-3"} rounded-xl bg-white/5 border border-white/[0.08] text-white outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all appearance-none cursor-pointer`}
                      style={{ color: values[field.key] ? "white" : "rgba(255,255,255,0.25)" }}
                    >
                      <option value="" disabled>{field.placeholder}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt} style={{ background: "#0d0a1f" }}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                  </div>
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={compact ? 2 : 2}
                    value={values[field.key] ?? ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full ${compact ? "text-xs px-2.5 py-1.5" : "text-xs px-3 py-2"} rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/20 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all resize-none`}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={values[field.key] ?? ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full ${compact ? "h-8 text-xs px-2.5" : "h-9 text-xs px-3"} rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/20 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all`}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
