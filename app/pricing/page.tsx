"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, Fragment } from "react";
import Link from "next/link";
import {
  Sparkles, Zap, Crown, Building2, CheckCircle, X, ArrowRight,
  ChevronDown, Mail, Phone, MessageSquare, Check,
} from "lucide-react";
import {
  PLANS, PLAN_ORDER, formatPrice,
  type PlanId, type PlanFeatures, type BillingCycle,
} from "@/lib/subscription";
import PlanDetailsModal from "@/components/subscription/PlanDetailsModal";
import CheckoutModal    from "@/components/subscription/CheckoutModal";

// ── Feature comparison table rows ──────────────────────────────────────────────

const COMPARISON_ROWS: { label: string; feature: keyof PlanFeatures; group?: string }[] = [
  { label: "Organizations",          feature: "organizations",           group: "Limits" },
  { label: "User seats",             feature: "users",                   group: "Limits" },
  { label: "Templates",              feature: "templates",               group: "Limits" },
  { label: "Cards / month",          feature: "cards_per_month",         group: "Limits" },
  { label: "Manual Builder",         feature: "manual_builder",          group: "Builders" },
  { label: "AI Builder",             feature: "ai_builder",              group: "Builders" },
  { label: "Unlimited AI Builder",   feature: "ai_builder_unlimited",    group: "Builders" },
  { label: "AI Template Analysis",   feature: "ai_template_analysis",    group: "Builders" },
  { label: "Bulk Generation",        feature: "bulk_generation",         group: "Generation" },
  { label: "Excel Import",           feature: "excel_import",            group: "Generation" },
  { label: "ZIP Photo Upload",       feature: "zip_photo_upload",        group: "Generation" },
  { label: "PDF Export",             feature: "pdf_export",              group: "Export" },
  { label: "PNG Export",             feature: "png_export",              group: "Export" },
  { label: "Analytics Dashboard",    feature: "analytics",               group: "Management" },
  { label: "User Management",        feature: "user_management",         group: "Management" },
  { label: "Audit Logs",             feature: "audit_logs",              group: "Management" },
  { label: "Verification System",    feature: "verification_system",     group: "Management" },
  { label: "Digital ID Cards",       feature: "digital_id_cards",        group: "Management" },
  { label: "White Label",            feature: "white_label",             group: "Enterprise" },
  { label: "API Access",             feature: "api_access",              group: "Enterprise" },
  { label: "Multi-School Mgmt",      feature: "multi_school_management", group: "Enterprise" },
  { label: "Custom Integrations",    feature: "custom_integrations",     group: "Enterprise" },
  { label: "Priority Support",       feature: "priority_support",        group: "Support" },
];

const FAQS = [
  {
    q: "Can I change my plan later?",
    a: "Yes — you can upgrade or downgrade at any time. Upgrades are effective immediately. Downgrades take effect at the end of your billing cycle.",
  },
  {
    q: "What happens if I exceed my monthly card limit?",
    a: "You'll receive a warning at 80% usage and a final alert at 100%. Card generation is paused until the next billing cycle or until you upgrade.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! The Professional plan includes a 14-day free trial — no credit card required to start.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards via Razorpay and Stripe. UPI, Net Banking, and Wallets are also supported for Indian customers.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No long-term contracts or lock-ins. Cancel from your subscription settings and you'll retain access until the end of your billing period.",
  },
  {
    q: "What is the AI Builder?",
    a: "The AI Builder uses Claude Vision AI to analyze your reference ID card, detect fields automatically, and generate perfectly-aligned cards. On Professional+ plans, AI usage is unlimited.",
  },
  {
    q: "Do you offer annual discounts?",
    a: "Yes — annual billing saves you 20% compared to monthly billing on all plans.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit and at rest. We are SOC 2 Type II compliant and follow GDPR best practices. Enterprise plans include dedicated data residency options.",
  },
];

const PLAN_ICONS: Record<PlanId, React.ElementType> = {
  starter:      Zap,
  professional: Sparkles,
  business:     Building2,
  enterprise:   Crown,
};

function formatLimit(val: number): string {
  if (val === -1) return "Unlimited";
  if (val === 0)  return "—";
  return val.toLocaleString("en-IN");
}

function CellValue({ feature, planId }: { feature: keyof PlanFeatures; planId: PlanId }) {
  const val = PLANS[planId].features[feature];
  if (typeof val === "boolean") {
    return val
      ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
      : <X className="w-4 h-4 text-white/15 mx-auto" />;
  }
  return <span className="text-xs text-white/70 font-medium">{formatLimit(val as number)}</span>;
}

// ── Accordion FAQ ──────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-semibold text-white pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="px-5 pb-5 text-sm text-white/50 leading-relaxed border-t border-white/[0.05]">
              <div className="pt-4">{a}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Contact Sales Form ─────────────────────────────────────────────────────────

function ContactSales() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return sent ? (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
        <Check className="w-7 h-7 text-emerald-400" />
      </div>
      <h3 className="text-lg font-bold text-white">Message sent!</h3>
      <p className="text-sm text-white/40 text-center">Our sales team will reach out within 24 hours.</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Your name</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Rahul Sharma"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Work email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="rahul@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Company / Organization</label>
        <input
          value={form.company}
          onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          placeholder="Acme School Board"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Tell us about your needs</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Number of users, card volume, specific requirements…"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
        />
      </div>
      <button type="submit" className="btn-premium w-full justify-center">
        <MessageSquare className="w-4 h-4" />
        Contact Enterprise Sales
      </button>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [cycle,       setCycle]       = useState<"monthly" | "annual">("monthly");
  const [planDetails, setPlanDetails] = useState<PlanId | null>(null);
  const [checkout,    setCheckout]    = useState<{ planId: PlanId; cycle: BillingCycle } | null>(null);

  // Group comparison rows by section
  const groups = COMPARISON_ROWS.reduce<Record<string, typeof COMPARISON_ROWS>>((acc, row) => {
    const g = row.group ?? "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#070a12] text-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-[#070a12]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">ID<span className="gradient-text">Forge</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/dashboard" className="btn-premium text-sm px-4 py-2">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-brand-600/8 blur-[120px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-400 px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3 h-3" /> Transparent Pricing
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              Simple, Predictable<br />
              <span className="gradient-text">Pricing Plans</span>
            </h1>
            <p className="text-lg text-white/40 max-w-xl mx-auto mb-8">
              Start with a 14-day free trial. Scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${cycle === "monthly" ? "bg-brand-500 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("annual")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${cycle === "annual" ? "bg-brand-500 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
            >
              Annual
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                Save 20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {PLAN_ORDER.map((planId, i) => {
            const plan = PLANS[planId];
            const Icon = PLAN_ICONS[planId];
            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
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
                  <p className="text-xs text-white/40 mb-5">{plan.tagline}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-white">
                      {formatPrice(plan.price[cycle])}
                    </span>
                    <span className="text-white/40 text-xs">/mo</span>
                  </div>
                  {cycle === "annual" && (
                    <p className="text-[10px] text-emerald-400 mb-4">
                      {formatPrice(plan.price.annual * 12)} billed annually
                    </p>
                  )}

                  {planId === "enterprise" ? (
                    <a href="#contact-sales">
                      <button className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4 mb-5 btn-ghost border border-white/10 text-white/70 hover:text-white hover:border-white/20 bg-white/5">
                        Contact Sales <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </a>
                  ) : (
                    <button
                      onClick={() => setPlanDetails(planId)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4 mb-5 ${
                        plan.popular
                          ? "btn-premium justify-center"
                          : "btn-ghost justify-center border border-white/10 text-white/70 hover:text-white hover:border-white/20 bg-white/5"
                      }`}
                    >
                      Choose Plan <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="border-t border-white/[0.06] pt-4 space-y-2">
                    {plan.displayFeatures.map(f => (
                      <div key={f} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </div>
                    ))}
                    {plan.missingFeatures.map(f => (
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

        <p className="text-center text-white/25 text-xs mt-8">
          All plans include 14-day free trial · No credit card required · Cancel anytime
        </p>
      </section>

      {/* ── Feature comparison table ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Compare Plans</h2>
          <p className="text-white/40 text-sm">See exactly what&apos;s included in each plan</p>
        </motion.div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.07] glass-card">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 text-xs font-semibold text-white/40 w-48">Feature</th>
                {PLAN_ORDER.map(pid => {
                  const Icon = PLAN_ICONS[pid];
                  const p = PLANS[pid];
                  return (
                    <th key={pid} className={`text-center p-4 ${p.popular ? "bg-brand-500/5" : ""}`}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={`text-xs font-bold ${p.popular ? "text-brand-300" : "text-white"}`}>
                          {p.name}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {formatPrice(p.price[cycle])}/mo
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([group, rows]) => (
                <Fragment key={group}>
                  <tr className="border-t border-white/[0.04]">
                    <td colSpan={5} className="px-4 py-2 text-[10px] font-bold text-white/25 uppercase tracking-widest">
                      {group}
                    </td>
                  </tr>
                  {rows.map((row, ri) => (
                    <tr key={row.feature} className={`border-t border-white/[0.04] ${ri % 2 === 0 ? "bg-white/[0.01]" : ""} hover:bg-white/[0.03] transition-colors`}>
                      <td className="px-4 py-3 text-xs text-white/60 font-medium">{row.label}</td>
                      {PLAN_ORDER.map(pid => (
                        <td key={pid} className={`px-4 py-3 text-center ${PLANS[pid].popular ? "bg-brand-500/5" : ""}`}>
                          <CellValue feature={row.feature} planId={pid} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
          <p className="text-white/40 text-sm">Everything you need to know about our pricing and plans</p>
        </motion.div>
        <div className="space-y-3">
          {FAQS.map(item => <FAQItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* ── Contact Sales ── */}
      <section id="contact-sales" className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass-card rounded-3xl border border-white/[0.07] p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4"
              style={{ boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}>
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Need Enterprise?</h2>
            <p className="text-sm text-white/40">
              Custom pricing for large organizations with specific requirements.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/30">
              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> sales@idforge.ai</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +91 98765 43210</span>
            </div>
          </div>
          <ContactSales />
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-white/25">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-3 h-3 text-brand-400" />
          <span className="font-bold text-white/40">IDForge AI</span>
        </div>
        © 2025 IDForge AI · <Link href="/" className="hover:text-white/50 transition-colors">Home</Link> ·
        <Link href="/dashboard" className="hover:text-white/50 transition-colors ml-1">Dashboard</Link>
      </footer>

      {/* ── Plan Details Modal ── */}
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

      {/* ── Checkout Modal ── */}
      {checkout && (
        <CheckoutModal
          planId={checkout.planId}
          cycle={checkout.cycle}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}
