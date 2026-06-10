"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  X, CheckCircle, XCircle, ArrowRight,
  Zap, Sparkles, Building2, Crown,
  Users, FileText, CreditCard, Layers,
} from "lucide-react";
import { PLANS, formatPrice, type PlanId } from "@/lib/subscription";

const PLAN_ICONS: Record<PlanId, React.ElementType> = {
  starter:      Zap,
  professional: Sparkles,
  business:     Building2,
  enterprise:   Crown,
};

interface Props {
  planId:     PlanId;
  onContinue: (cycle: "monthly" | "annual") => void;
  onClose:    () => void;
}

function fmt(n: number, unit: string) {
  return n === -1 ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`;
}

export default function PlanDetailsModal({ planId, onContinue, onClose }: Props) {
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const plan = PLANS[planId];
  const Icon = PLAN_ICONS[planId];
  const price    = plan.price[cycle];
  const altPrice = plan.price[cycle === "monthly" ? "annual" : "monthly"];

  const limits = [
    { icon: CreditCard, label: "Cards / month",  value: fmt(plan.features.cards_per_month, "cards") },
    { icon: Users,      label: "User seats",      value: fmt(plan.features.users, "seats")           },
    { icon: FileText,   label: "Templates",        value: fmt(plan.features.templates, "templates")   },
    { icon: Layers,     label: "Organizations",   value: fmt(plan.features.organizations, "orgs")    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg glass-card rounded-3xl border border-white/[0.09] overflow-hidden shadow-2xl"
        >
          {/* Gradient top bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${plan.color}`} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Plan header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 6px 20px ${plan.glow}40` }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{plan.name} Plan</h2>
                  {plan.popular && (
                    <span className="text-[9px] font-bold bg-brand-500/20 border border-brand-500/30 text-brand-400 px-2 py-0.5 rounded-full">
                      MOST POPULAR
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40 mt-0.5">{plan.tagline}</p>
              </div>
            </div>

            {/* Billing cycle toggle */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10 mb-5 w-fit">
              {(["monthly", "annual"] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    cycle === c ? "bg-brand-500 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  {c === "monthly" ? "Monthly" : "Annual"}
                  {c === "annual" && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                      -20%
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="mb-5">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{formatPrice(price)}</span>
                <span className="text-white/40 text-sm">/mo</span>
                {cycle === "annual" && (
                  <span className="text-xs text-white/30 line-through">{formatPrice(altPrice)}/mo</span>
                )}
              </div>
              {cycle === "annual" && (
                <p className="text-xs text-emerald-400 mt-1">
                  Billed {formatPrice(price * 12)}/year · Save {formatPrice((altPrice - price) * 12)}
                </p>
              )}
            </div>

            {/* Usage limits */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {limits.map(({ icon: LimitIcon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <LimitIcon className="w-4 h-4 text-white/30 shrink-0" />
                  <div>
                    <div className="text-[10px] text-white/30">{label}</div>
                    <div className="text-xs font-semibold text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Builder callout */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border mb-5 ${
              plan.features.ai_builder_unlimited
                ? "bg-brand-500/10 border-brand-500/20"
                : "bg-white/[0.03] border-white/[0.06]"
            }`}>
              <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${plan.features.ai_builder_unlimited ? "text-brand-400" : "text-white/30"}`} />
              <div>
                <div className="text-xs font-semibold text-white mb-0.5">AI Builder</div>
                <div className="text-[11px] text-white/40">
                  {plan.features.ai_builder_unlimited
                    ? "Unlimited AI-powered card generation — analyze templates, auto-detect fields, generate at scale."
                    : "Quota-based AI access included. Upgrade to Professional for unlimited AI Builder usage."}
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div className="space-y-2 mb-5">
              <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2">What&apos;s included</p>
              {plan.displayFeatures.map(f => (
                <div key={f} className="flex items-start gap-2 text-xs text-white/70">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  {f}
                </div>
              ))}
              {plan.missingFeatures.map(f => (
                <div key={f} className="flex items-start gap-2 text-xs text-white/25 line-through">
                  <XCircle className="w-3.5 h-3.5 text-white/15 shrink-0 mt-0.5" />
                  {f}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => onContinue(cycle)}
                className="btn-premium flex-1 justify-center text-sm py-3"
              >
                Continue to Payment
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-white/10 text-white/40 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
