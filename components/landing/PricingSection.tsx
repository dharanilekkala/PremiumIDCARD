"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Sparkles, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { PLANS, PLAN_ORDER, formatPrice, type PlanId, type BillingCycle } from "@/lib/subscription";
import PlanDetailsModal from "@/components/subscription/PlanDetailsModal";
import CheckoutModal    from "@/components/subscription/CheckoutModal";

const PLAN_ICONS: Record<PlanId, React.ElementType> = {
  starter:      Zap,
  professional: Sparkles,
  business:     Building2,
  enterprise:   Crown,
};

export default function PricingSection() {
  const [annual,      setAnnual]      = useState(false);
  const [planDetails, setPlanDetails] = useState<PlanId | null>(null);
  const [checkout,    setCheckout]    = useState<{ planId: PlanId; cycle: BillingCycle } | null>(null);
  const cycle = annual ? "annual" : "monthly";

  return (
    <section id="pricing" className="relative py-28 bg-[#070a12] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/5 blur-[150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="section-badge">
            <Sparkles className="w-3 h-3" />
            Transparent Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, Predictable
            <br />
            <span className="gradient-text">Pricing Plans</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto mb-8">
            Start with a 14-day free trial. Scale as you grow. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !annual ? "bg-brand-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? "bg-brand-500 text-white" : "text-white/50 hover:text-white"
              }`}
            >
              Annual
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {PLAN_ORDER.map((planId, i) => {
            const plan = PLANS[planId];
            const Icon = PLAN_ICONS[planId];
            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass-card rounded-3xl border overflow-hidden transition-all duration-300 ${
                  plan.popular
                    ? "border-brand-500/40 shadow-glow-md"
                    : "border-white/[0.07] hover:border-white/15"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-violet-500" />
                )}
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-6">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                    style={{ boxShadow: `0 4px 16px ${plan.glow}40` }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-0.5">{plan.name}</h3>
                  <p className="text-xs text-white/40 mb-4">{plan.tagline}</p>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-bold text-white">
                      {formatPrice(plan.price[cycle])}
                    </span>
                    <span className="text-white/40 text-xs">/mo</span>
                  </div>

                  {planId === "enterprise" ? (
                    <Link href="/pricing#contact-sales">
                      <button className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-5 btn-ghost border border-white/10 text-white/70 hover:text-white hover:border-white/20 bg-white/5">
                        Contact Sales <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setPlanDetails(planId)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-5 ${
                        plan.popular
                          ? "btn-premium justify-center"
                          : "btn-ghost justify-center border border-white/10 text-white/70 hover:text-white hover:border-white/20 bg-white/5"
                      }`}
                    >
                      Choose Plan <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="border-t border-white/[0.06] pt-4 space-y-2">
                    {plan.displayFeatures.slice(0, 6).map(f => (
                      <div key={f} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </div>
                    ))}
                    {plan.missingFeatures.slice(0, 2).map(f => (
                      <div key={f} className="flex items-start gap-2 text-xs text-white/20 line-through">
                        <div className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0 mt-0.5" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 space-y-2"
        >
          <p className="text-white/30 text-sm">
            All plans include 14-day free trial · No credit card required · Cancel anytime
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-brand-400 text-sm hover:text-brand-300 transition-colors">
            Compare all features <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {planDetails && (
        <PlanDetailsModal
          planId={planDetails}
          onContinue={selectedCycle => {
            setCheckout({ planId: planDetails, cycle: selectedCycle });
            setPlanDetails(null);
          }}
          onClose={() => setPlanDetails(null)}
        />
      )}

      {checkout && (
        <CheckoutModal
          planId={checkout.planId}
          cycle={checkout.cycle}
          onClose={() => setCheckout(null)}
        />
      )}
    </section>
  );
}
