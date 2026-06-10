"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Sparkles, Zap, Crown, ArrowRight, Check } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  PLANS, PLAN_ORDER, formatPrice, getRequiredPlanForFeature,
  type PlanId, type BillingCycle, type PlanFeatures,
} from "@/lib/subscription";

interface Props {
  feature:      keyof PlanFeatures;
  featureName:  string;
  onClose:      () => void;
}

const PLAN_ICONS: Record<PlanId, React.ElementType> = {
  starter:      Zap,
  professional: Sparkles,
  business:     Crown,
  enterprise:   Crown,
};

export default function UpgradeModal({ feature, featureName, onClose }: Props) {
  const { planId, upgrade } = useSubscription();
  const [cycle, setCycle]   = useState<BillingCycle>("monthly");
  const [busy,  setBusy]    = useState(false);
  const [done,  setDone]    = useState(false);

  const requiredPlan = getRequiredPlanForFeature(feature);
  const currentIdx   = PLAN_ORDER.indexOf(planId);
  const requiredIdx  = PLAN_ORDER.indexOf(requiredPlan);
  const eligiblePlans = PLAN_ORDER.slice(Math.max(currentIdx + 1, requiredIdx));

  const [selected, setSelected] = useState<PlanId>(eligiblePlans[0] ?? requiredPlan);

  function handleUpgrade() {
    setBusy(true);
    setTimeout(() => {
      upgrade(selected, cycle);
      setDone(true);
      setBusy(false);
      setTimeout(onClose, 1200);
    }, 900);
  }

  const plan = PLANS[selected];
  const Icon = PLAN_ICONS[selected];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="relative w-full max-w-md bg-[#0e1120] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Top gradient bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${plan.color}`} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6">
            {/* Lock badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Feature Locked
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-1">
              Unlock <span className="gradient-text">{featureName}</span>
            </h2>
            <p className="text-sm text-white/40 mb-5">
              This feature requires a higher plan. Upgrade now to unlock it instantly.
            </p>

            {/* Plan selector */}
            {eligiblePlans.length > 1 && (
              <div className="flex gap-2 mb-4">
                {eligiblePlans.map(pid => {
                  const p = PLANS[pid];
                  const PI = PLAN_ICONS[pid];
                  return (
                    <button
                      key={pid}
                      onClick={() => setSelected(pid)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        selected === pid
                          ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                          : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <PI className="w-3 h-3" />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected plan card */}
            <div className={`rounded-xl border border-white/10 p-4 mb-4 bg-gradient-to-br from-white/[0.03] to-white/[0.01]`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}
                  style={{ boxShadow: `0 4px 12px ${plan.glow}40` }}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{plan.name}</div>
                  <div className="text-[10px] text-white/40">{plan.tagline}</div>
                </div>
              </div>

              {/* Features preview */}
              <div className="space-y-1.5">
                {plan.displayFeatures.slice(0, 4).map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
                {plan.displayFeatures.length > 4 && (
                  <div className="text-[10px] text-white/25">+{plan.displayFeatures.length - 4} more features</div>
                )}
              </div>
            </div>

            {/* Billing toggle */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => setCycle("monthly")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${cycle === "monthly" ? "bg-brand-500 text-white" : "text-white/40 hover:text-white"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle("annual")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${cycle === "annual" ? "bg-brand-500 text-white" : "text-white/40 hover:text-white"}`}
                >
                  Annual
                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1 rounded">-20%</span>
                </button>
              </div>
              <div className="text-sm font-bold text-white">
                {formatPrice(plan.price[cycle])}<span className="text-xs text-white/30">/mo</span>
              </div>
            </div>

            {/* CTA */}
            {done ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                <Check className="w-4 h-4" />
                Upgraded successfully!
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={busy}
                className="btn-premium w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  <>
                    Upgrade to {plan.name}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            <p className="text-center text-[10px] text-white/20 mt-3">
              No long-term contracts · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
