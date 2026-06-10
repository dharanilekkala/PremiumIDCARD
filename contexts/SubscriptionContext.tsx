"use client";
import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from "react";
import {
  getSubscription, saveSubscription, getUsage, incrementUsage,
  hasFeature, getLimit, isWithinLimit, initSubscription,
  getBillingHistory, upgradePlan as doUpgrade, cancelSubscription as doCancel,
  renewSubscription as doRenew,
  type Subscription, type UsageRecord, type PlanId,
  type BillingCycle, type BillingRecord, type PlanFeatures, type UsageField,
  PLANS,
} from "@/lib/subscription";
import { useAuth } from "@/contexts/AuthContext";

// ── Context shape ──────────────────────────────────────────────────────────────

interface SubscriptionCtx {
  subscription:   Subscription | null;
  usage:          UsageRecord | null;
  loading:        boolean;
  planId:         PlanId;
  billingHistory: BillingRecord[];
  can:            (feature: keyof PlanFeatures) => boolean;
  limit:          (feature: keyof PlanFeatures) => number;
  withinLimit:    (feature: keyof PlanFeatures, current: number) => boolean;
  upgrade:        (plan: PlanId, cycle: BillingCycle) => boolean;
  cancel:         () => boolean;
  renew:          () => boolean;
  trackUsage:     (field: UsageField, by?: number) => void;
  reload:         () => void;
}

const SubCtx = createContext<SubscriptionCtx | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session }                           = useAuth();
  const [subscription, setSub]               = useState<Subscription | null>(null);
  const [usage,        setUsage]             = useState<UsageRecord | null>(null);
  const [billing,      setBilling]           = useState<BillingRecord[]>([]);
  const [loading,      setLoading]           = useState(true);

  const load = useCallback(() => {
    if (!session) { setLoading(false); return; }
    const orgId = session.organizationId;
    const sub   = initSubscription(orgId, session.userId);
    setSub(sub);
    setUsage(getUsage(orgId));
    setBilling(getBillingHistory());
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const planId = subscription?.plan ?? "starter";

  const can         = useCallback((f: keyof PlanFeatures) => hasFeature(planId, f), [planId]);
  const limit       = useCallback((f: keyof PlanFeatures) => getLimit(planId, f),   [planId]);
  const withinLimit = useCallback(
    (f: keyof PlanFeatures, cur: number) => isWithinLimit(planId, f, cur),
    [planId],
  );

  const upgrade = useCallback((plan: PlanId, cycle: BillingCycle): boolean => {
    if (!session) return false;
    const ok = doUpgrade(session.organizationId, plan, cycle);
    if (ok) load();
    return ok;
  }, [session, load]);

  const cancel = useCallback((): boolean => {
    if (!session) return false;
    const ok = doCancel(session.organizationId);
    if (ok) load();
    return ok;
  }, [session, load]);

  const renew = useCallback((): boolean => {
    if (!session) return false;
    const ok = doRenew(session.organizationId);
    if (ok) load();
    return ok;
  }, [session, load]);

  const trackUsage = useCallback((field: UsageField, by = 1) => {
    if (!session) return;
    incrementUsage(session.organizationId, field, by);
    setUsage(getUsage(session.organizationId));
  }, [session]);

  return (
    <SubCtx.Provider value={{
      subscription, usage, loading, planId, billingHistory: billing,
      can, limit, withinLimit, upgrade, cancel, renew, trackUsage, reload: load,
    }}>
      {children}
    </SubCtx.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSubscription(): SubscriptionCtx {
  const ctx = useContext(SubCtx);
  if (!ctx) throw new Error("useSubscription must be inside <SubscriptionProvider>");
  return ctx;
}
