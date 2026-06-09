"use client";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { ORG_TYPES, OrgTypeId, OrgType } from "@/lib/orgTypes";

interface Props {
  selected: OrgTypeId;
  onChange: (id: OrgTypeId) => void;
  detectedId?: OrgTypeId | null;
}

export default function OrgTypeSelector({ selected, onChange, detectedId }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ORG_TYPES.map((org) => {
        const isSelected = selected === org.id;
        const isDetected = detectedId === org.id;
        return (
          <motion.button
            key={org.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(org.id)}
            className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 text-center group ${
              isSelected
                ? "border-transparent shadow-glow-sm"
                : "border-white/[0.07] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
            style={
              isSelected
                ? {
                    background: `${org.color}12`,
                    borderColor: `${org.color}50`,
                    boxShadow: `0 0 20px ${org.color}25`,
                  }
                : undefined
            }
          >
            {/* Detected badge */}
            {isDetected && !isSelected && (
              <div
                className="absolute -top-2 -right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: org.color }}
              >
                AI Detected
              </div>
            )}

            {/* Selected checkmark */}
            {isSelected && (
              <div
                className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: org.color }}
              >
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{
                background: isSelected ? `${org.color}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${isSelected ? org.color + "50" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <org.icon
                className="w-5 h-5 transition-colors"
                style={{ color: isSelected ? org.color : "rgba(255,255,255,0.4)" }}
              />
            </div>

            <div>
              <div
                className="text-xs font-bold transition-colors"
                style={{ color: isSelected ? org.color : "rgba(255,255,255,0.7)" }}
              >
                {org.label}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5 leading-tight">{org.description}</div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
