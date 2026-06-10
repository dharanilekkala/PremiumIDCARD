"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  Crown, CreditCard, Sparkles, Zap, Building2, ArrowRight,
  CheckCircle, AlertTriangle, XCircle, RefreshCw,
  Users, FileText, Check, Clock,
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PlanDetailsModal from "@/components/subscription/PlanDetailsModal";
import CheckoutModal    from "@/components/subscription/CheckoutModal";
import {
  PLANS, PLAN_ORDER, formatPrice,
  type PlanId, type BillingCycle,
} from "@/lib/subscription";

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLAN_ICONS: Record<PlanId, React.ElementType> = {
  starter:      Zap,
  professional: Sparkles,
  business:     Building2,
  enterprise:   Crown,
};

const STATUS_META = {
  active:    { label: "Active",     color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle },
  trialing:  { label: "Trial",      color: "text-brand-400",   bg: "bg-brand-500/10",   border: "border-brand-500/20",   icon: Sparkles   },
  cancelled: { label: "Cancelled",  color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    icon: XCircle    },
  expired:   { label: "Expired",    color: "text-white/40",    bg: "bg-white/5",        border: "border-white/10",       icon: Clock      },
  past_due:  { label: "Past Due",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: AlertTriangle },
};

function UsageBar({ label, current, limit, icon: Icon, color }: {
  label: string; current: number; limit: number;
  icon: React.ElementType; color: string;
}) {
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const unlimited = limit === -1;
  const danger = pct >= 90;
  const warn   = pct >= 70 && !danger;

  return (
    <div className="glass-card p-4 rounded-2xl border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-white">{label}</span>
        </div>
        <span className={`text-xs font-bold ${danger ? "text-rose-400" : warn ? "text-amber-400" : "text-white/50"}`}>
          {unlimited ? `${current.toLocaleString()} / ∞` : `${current.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      {!unlimited && (
        <>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                danger ? "bg-rose-500" : warn ? "bg-amber-500" : "bg-gradient-to-r from-brand-500 to-violet-500"
              }`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/25 mt-1">
            <span>{pct}% used</span>
            <span>{Math.max(0, limit - current).toLocaleString()} remaining</span>
          </div>
        </>
      )}
      {unlimited && (
        <div className="h-1.5 bg-brand-500/20 rounded-full">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-brand-500/40 to-violet-500/40 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// ── Plan card (compact, for upgrade section) ───────────────────────────────────

function PlanCard({ planId, current, onSelect }: { planId: PlanId; current: boolean; onSelect: () => void }) {
  const plan = PLANS[planId];
  const Icon = PLAN_ICONS[planId];
  return (
    <button
      onClick={onSelect}
      disabled={current}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
        current
          ? "border-brand-500/40 bg-brand-500/10 cursor-default"
          : "border-white/[0.07] hover:border-white/20 hover:bg-white/[0.03] cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{plan.name}</span>
            {current && <span className="text-[9px] font-bold bg-brand-500/20 border border-brand-500/30 text-brand-400 px-1.5 py-0.5 rounded-full">Current</span>}
            {plan.popular && !current && <span className="text-[9px] font-bold bg-violet-500/20 border border-violet-500/30 text-violet-400 px-1.5 py-0.5 rounded-full">Popular</span>}
          </div>
        </div>
        <span className="text-sm font-bold text-white">{formatPrice(plan.price.monthly)}<span className="text-[10px] text-white/30">/mo</span></span>
      </div>
      <div className="flex flex-wrap gap-1.5 ml-11">
        {plan.displayFeatures.slice(0, 3).map(f => (
          <span key={f} className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.5 rounded-full">{f}</span>
        ))}
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const {
    subscription, usage, planId,
    cancel, renew, loading,
  } = useSubscription();

  const [planDetails, setPlanDetails] = useState<PlanId | null>(null);
  const [checkout,    setCheckout]    = useState<{ planId: PlanId; cycle: BillingCycle } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionDone,    setActionDone]    = useState<"cancelled" | "renewed" | null>(null);
  const nextPlanId = PLAN_ORDER[PLAN_ORDER.indexOf(planId) + 1] as PlanId | undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <CreditCard className="w-8 h-8 text-brand-500 animate-pulse" />
          <p className="text-xs text-white/30">Loading subscription…</p>
        </div>
      </div>
    );
  }

  const plan     = PLANS[planId];
  const Icon     = PLAN_ICONS[planId];
  const status   = subscription?.status ?? "active";
  const statusM  = STATUS_META[status];
  const StatusIc = statusM.icon;

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400_000))
    : null;

  const renewDate = subscription?.renewsAt
    ? new Date(subscription.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  function handleCancel() {
    cancel();
    setCancelConfirm(false);
    setActionDone("cancelled");
  }

  function handleRenew() {
    renew();
    setActionDone("renewed");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-0.5">Subscription & Billing</h1>
        <p className="text-sm text-white/40">Manage your plan, usage, and payment history</p>
      </motion.div>

      {/* Action feedback banners */}
      {actionDone === "cancelled" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          Subscription cancelled. You&apos;ll retain access until the end of your billing period.
        </div>
      )}
      {actionDone === "renewed" && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Subscription renewed successfully!
        </div>
      )}

      {/* Current plan + status */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card rounded-3xl border border-white/[0.07] overflow-hidden">
        <div className={`h-1 w-full bg-gradient-to-r ${plan.color}`} />
        <div className="p-6">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 6px 20px ${plan.glow}40` }}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-xl font-bold text-white">{plan.name} Plan</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusM.bg} ${statusM.color} ${statusM.border} flex items-center gap-1`}>
                    <StatusIc className="w-2.5 h-2.5" />
                    {statusM.label}
                  </span>
                </div>
                <p className="text-sm text-white/40">{plan.tagline}</p>
                <p className="text-xs text-white/30 mt-1">
                  {subscription?.billingCycle === "annual" ? "Annual" : "Monthly"} billing ·{" "}
                  {status === "cancelled" ? "Ends" : "Renews"} {renewDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {formatPrice(plan.price[subscription?.billingCycle ?? "monthly"])}
              </div>
              <div className="text-xs text-white/30">per month</div>
            </div>
          </div>

          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="text-sm text-brand-300 font-medium">
                Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-white/[0.06]">
            {planId !== "enterprise" && nextPlanId && (
              <button
                onClick={() => setPlanDetails(nextPlanId)}
                className="btn-premium text-sm px-4 py-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade Plan
              </button>
            )}
            {status === "cancelled" ? (
              <button onClick={handleRenew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all">
                <RefreshCw className="w-4 h-4" />
                Renew Subscription
              </button>
            ) : (
              <button onClick={() => setCancelConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/40 text-sm font-medium hover:border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/5 transition-all">
                <XCircle className="w-4 h-4" />
                Cancel Subscription
              </button>
            )}
            <Link href="/pricing">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 transition-all">
                View All Plans
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Cancel confirm */}
          {cancelConfirm && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-rose-300 font-semibold mb-1">Cancel subscription?</p>
              <p className="text-xs text-white/40 mb-3">
                You&apos;ll retain access until {renewDate}. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition-all">
                  Yes, cancel
                </button>
                <button onClick={() => setCancelConfirm(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40 text-xs hover:text-white transition-all">
                  Keep plan
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Usage tracking */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-sm font-bold text-white mb-3">This Month&apos;s Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <UsageBar
            label="Cards Generated"
            current={usage?.cardsGenerated ?? 0}
            limit={plan.features.cards_per_month}
            icon={CreditCard}
            color="from-brand-500 to-violet-500"
          />
          <UsageBar
            label="AI Builder Uses"
            current={usage?.aiBuilderUsage ?? 0}
            limit={plan.features.ai_builder_unlimited ? -1 : plan.features.cards_per_month}
            icon={Sparkles}
            color="from-violet-500 to-purple-600"
          />
          <UsageBar
            label="Templates Created"
            current={usage?.templatesCreated ?? 0}
            limit={plan.features.templates}
            icon={FileText}
            color="from-emerald-500 to-teal-500"
          />
          <UsageBar
            label="User Seats Used"
            current={usage?.usersCount ?? 1}
            limit={plan.features.users}
            icon={Users}
            color="from-cyan-500 to-blue-500"
          />
          <UsageBar
            label="Organizations"
            current={usage?.organizationsCount ?? 1}
            limit={plan.features.organizations}
            icon={Building2}
            color="from-amber-500 to-orange-500"
          />
        </div>
      </motion.div>

      {/* Upgrade options (show plans above current) */}
      {planId !== "enterprise" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-bold text-white mb-3">Available Plans</h3>
          <div className="space-y-2">
            {PLAN_ORDER.map(pid => (
              <PlanCard
                key={pid}
                planId={pid}
                current={pid === planId}
                onSelect={() => { if (pid !== planId) setPlanDetails(pid); }}
              />
            ))}
          </div>
        </motion.div>
      )}


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
    </div>
  );
}
