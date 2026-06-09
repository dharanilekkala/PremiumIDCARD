"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle, Sparkles, Zap, Building2, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: { monthly: "₹999", annual: "₹799" },
    period: "/month",
    description: "Perfect for small teams and individuals",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    glow: "#10b981",
    cta: "Get Started Free",
    popular: false,
    features: [
      "50 ID cards / month",
      "5 templates",
      "Manual builder",
      "PDF & PNG export",
      "QR code generation",
      "Email support",
    ],
    missing: ["AI builder", "Bulk generation", "Custom branding"],
  },
  {
    name: "Professional",
    price: { monthly: "₹4,999", annual: "₹3,999" },
    period: "/month",
    description: "For growing organizations with AI needs",
    icon: Sparkles,
    color: "from-brand-500 to-violet-500",
    glow: "#6366f1",
    cta: "Start 14-Day Trial",
    popular: true,
    features: [
      "2,000 ID cards / month",
      "All 500+ templates",
      "AI Smart Builder",
      "Bulk generation (Excel)",
      "AI photo enhancement",
      "Digital ID cards + URL",
      "QR verification portal",
      "Approval workflow",
      "Priority support",
      "Custom branding",
    ],
    missing: [],
  },
  {
    name: "Enterprise",
    price: { monthly: "Custom", annual: "Custom" },
    period: "",
    description: "Unlimited scale with dedicated support",
    icon: Building2,
    color: "from-amber-500 to-orange-500",
    glow: "#f59e0b",
    cta: "Contact Sales",
    popular: false,
    features: [
      "Unlimited ID cards",
      "White-label solution",
      "Custom AI model training",
      "API access",
      "SSO / LDAP integration",
      "Multi-organization",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment",
      "Custom integrations",
    ],
    missing: [],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

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
            Start free, scale as you grow. No hidden fees.
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass-card rounded-3xl border overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? "border-brand-500/40 shadow-glow-md scale-105 lg:scale-110"
                  : "border-white/[0.07] hover:border-white/15"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-violet-500" />
              )}
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-brand-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="p-7">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-5`}
                  style={{ boxShadow: `0 4px 16px ${plan.glow}40` }}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/40 mb-5">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">
                    {annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.period && (
                    <span className="text-white/40 text-sm">{plan.period}</span>
                  )}
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-6 ${
                    plan.popular
                      ? "btn-premium justify-center"
                      : "btn-ghost justify-center"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="border-t border-white/[0.06] pt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-white/20 line-through">
                      <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/30 text-sm mt-10"
        >
          All plans include 14-day free trial · No credit card required · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
