/**
 * lib/subscription.ts — Subscription system: plans, billing, usage tracking
 * All storage is localStorage-based (mirrors auth.ts pattern).
 * In production: replace with real payment gateway + server-side records.
 */

// ── Plan types ─────────────────────────────────────────────────────────────────

export type PlanId             = "starter" | "professional" | "business" | "enterprise";
export type BillingCycle       = "monthly" | "annual";
export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "expired" | "past_due";

export interface PlanFeatures {
  organizations:           number;   // -1 = unlimited
  users:                   number;
  templates:               number;
  cards_per_month:         number;
  manual_builder:          boolean;
  ai_builder:              boolean;
  ai_builder_unlimited:    boolean;  // true for Professional+
  ai_template_analysis:    boolean;
  bulk_generation:         boolean;
  excel_import:            boolean;
  zip_photo_upload:        boolean;
  analytics:               boolean;
  user_management:         boolean;
  audit_logs:              boolean;
  verification_system:     boolean;
  digital_id_cards:        boolean;
  pdf_export:              boolean;
  png_export:              boolean;
  white_label:             boolean;
  api_access:              boolean;
  multi_school_management: boolean;
  custom_integrations:     boolean;
  priority_support:        boolean;
}

export interface Plan {
  id:              PlanId;
  name:            string;
  tagline:         string;
  price:           { monthly: number; annual: number }; // INR
  popular?:        boolean;
  color:           string;   // gradient CSS
  glow:            string;   // hex for box-shadow
  displayFeatures: string[];
  missingFeatures: string[];
  features:        PlanFeatures;
}

// ── Plan catalogue ─────────────────────────────────────────────────────────────

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Perfect for individuals & small teams",
    price: { monthly: 999, annual: 799 },
    color: "from-emerald-500 to-teal-500",
    glow: "#10b981",
    displayFeatures: [
      "500 ID cards / month",
      "5 templates",
      "1 user seat",
      "Manual builder",
      "AI Builder (quota-based)",
      "PDF & PNG export",
      "QR code generation",
      "Email support",
    ],
    missingFeatures: ["Bulk generation", "Analytics", "User management"],
    features: {
      organizations: 1, users: 1, templates: 5, cards_per_month: 500,
      manual_builder: true, ai_builder: true, ai_builder_unlimited: false,
      ai_template_analysis: false, bulk_generation: false, excel_import: false,
      zip_photo_upload: false, analytics: false, user_management: false,
      audit_logs: false, verification_system: false, digital_id_cards: false,
      pdf_export: true, png_export: true, white_label: false, api_access: false,
      multi_school_management: false, custom_integrations: false, priority_support: false,
    },
  },

  professional: {
    id: "professional",
    name: "Professional",
    tagline: "For growing organizations with AI needs",
    price: { monthly: 2999, annual: 2399 },
    popular: true,
    color: "from-brand-500 to-violet-500",
    glow: "#6366f1",
    displayFeatures: [
      "5,000 ID cards / month",
      "Unlimited templates",
      "5 user seats",
      "Unlimited AI Builder",
      "Bulk generation (Excel import)",
      "ZIP photo upload",
      "Advanced analytics",
      "User management",
      "PDF & PNG export",
      "Priority email support",
    ],
    missingFeatures: ["Audit logs", "Digital ID cards"],
    features: {
      organizations: 1, users: 5, templates: -1, cards_per_month: 5000,
      manual_builder: true, ai_builder: true, ai_builder_unlimited: true,
      ai_template_analysis: true, bulk_generation: true, excel_import: true,
      zip_photo_upload: true, analytics: true, user_management: true,
      audit_logs: false, verification_system: false, digital_id_cards: false,
      pdf_export: true, png_export: true, white_label: false, api_access: false,
      multi_school_management: false, custom_integrations: false, priority_support: false,
    },
  },

  business: {
    id: "business",
    name: "Business",
    tagline: "Scale securely with enterprise controls",
    price: { monthly: 5999, annual: 4799 },
    color: "from-violet-500 to-purple-600",
    glow: "#8b5cf6",
    displayFeatures: [
      "25,000 ID cards / month",
      "Unlimited templates",
      "10 user seats",
      "Unlimited AI Builder",
      "Bulk + Excel + ZIP uploads",
      "Full analytics & audit logs",
      "QR verification portal",
      "Digital ID cards",
      "Priority support",
    ],
    missingFeatures: ["White-label", "API access"],
    features: {
      organizations: 1, users: 10, templates: -1, cards_per_month: 25000,
      manual_builder: true, ai_builder: true, ai_builder_unlimited: true,
      ai_template_analysis: true, bulk_generation: true, excel_import: true,
      zip_photo_upload: true, analytics: true, user_management: true,
      audit_logs: true, verification_system: true, digital_id_cards: true,
      pdf_export: true, png_export: true, white_label: false, api_access: false,
      multi_school_management: false, custom_integrations: false, priority_support: true,
    },
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Unlimited scale with dedicated support",
    price: { monthly: 14999, annual: 11999 },
    color: "from-amber-500 to-orange-500",
    glow: "#f59e0b",
    displayFeatures: [
      "Unlimited ID cards",
      "Unlimited organizations",
      "Unlimited user seats",
      "White-label solution",
      "Full API access",
      "Multi-school management",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "Priority phone support",
    ],
    missingFeatures: [],
    features: {
      organizations: -1, users: -1, templates: -1, cards_per_month: -1,
      manual_builder: true, ai_builder: true, ai_builder_unlimited: true,
      ai_template_analysis: true, bulk_generation: true, excel_import: true,
      zip_photo_upload: true, analytics: true, user_management: true,
      audit_logs: true, verification_system: true, digital_id_cards: true,
      pdf_export: true, png_export: true, white_label: true, api_access: true,
      multi_school_management: true, custom_integrations: true, priority_support: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "professional", "business", "enterprise"];

// ── Subscription record ────────────────────────────────────────────────────────

export interface Subscription {
  id:             string;
  userId:         string;
  organizationId: string;
  plan:           PlanId;
  status:         SubscriptionStatus;
  billingCycle:   BillingCycle;
  startDate:      string;
  endDate:        string;
  renewsAt:       string;
  cancelledAt?:   string;
  trialEndsAt?:   string;
}

// ── Usage record ───────────────────────────────────────────────────────────────

export interface UsageRecord {
  organizationId:      string;
  period:              string; // "YYYY-MM"
  cardsGenerated:      number;
  aiBuilderUsage:      number;
  templatesCreated:    number;
  usersCount:          number;
  organizationsCount:  number;
}

export type UsageField = "cardsGenerated" | "aiBuilderUsage" | "templatesCreated" | "usersCount" | "organizationsCount";

// ── Billing record ─────────────────────────────────────────────────────────────

export interface BillingRecord {
  id:          string;
  date:        string;
  amount:      number;
  plan:        PlanId;
  cycle:       BillingCycle;
  status:      "paid" | "failed" | "refunded";
  invoiceNo:   string;
}

// ── localStorage keys ──────────────────────────────────────────────────────────

const LS_SUB     = "idforge_subscription";
const LS_USAGE   = "idforge_usage";
const LS_BILLING = "idforge_billing";

// ── Helpers ────────────────────────────────────────────────────────────────────

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function makeSeedSub(orgId: string, userId: string): Subscription {
  const now  = new Date();
  const end  = new Date(now);
  end.setMonth(end.getMonth() + 1);
  const trial = new Date(now.getTime() + 14 * 86400_000);
  return {
    id:             `sub_${Date.now()}`,
    userId,
    organizationId: orgId,
    plan:           "professional",
    status:         "trialing",
    billingCycle:   "monthly",
    startDate:      now.toISOString(),
    endDate:        end.toISOString(),
    renewsAt:       end.toISOString(),
    trialEndsAt:    trial.toISOString(),
  };
}

function makeEmptyUsage(orgId: string): UsageRecord {
  return {
    organizationId:     orgId,
    period:             currentPeriod(),
    cardsGenerated:     0,
    aiBuilderUsage:     0,
    templatesCreated:   0,
    usersCount:         1,
    organizationsCount: 1,
  };
}

function makeSeedBilling(sub: Subscription): BillingRecord[] {
  const plan   = PLANS[sub.plan];
  const amount = plan.price[sub.billingCycle];
  const months = ["Jan","Feb","Mar","Apr","May","Jun"];
  const now    = new Date();
  return months.map((_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    return {
      id:        `inv_${d.getTime()}`,
      date:      d.toISOString(),
      amount,
      plan:      sub.plan,
      cycle:     sub.billingCycle,
      status:    "paid" as const,
      invoiceNo: `INV-${2025}${String(d.getMonth() + 1).padStart(2,"0")}-${String(i + 1).padStart(4,"0")}`,
    };
  }).reverse();
}

// ── Subscription CRUD ──────────────────────────────────────────────────────────

export function getSubscription(orgId?: string): Subscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_SUB);
    if (!raw) return null;
    const sub = JSON.parse(raw) as Subscription;
    if (orgId && sub.organizationId !== orgId) return null;
    return sub;
  } catch { return null; }
}

export function saveSubscription(sub: Subscription): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_SUB, JSON.stringify(sub));
}

export function initSubscription(orgId: string, userId: string): Subscription {
  const existing = getSubscription(orgId);
  if (existing) return existing;
  const seed = makeSeedSub(orgId, userId);
  saveSubscription(seed);
  // also seed billing history
  if (!localStorage.getItem(LS_BILLING)) {
    localStorage.setItem(LS_BILLING, JSON.stringify(makeSeedBilling(seed)));
  }
  return seed;
}

export function upgradePlan(orgId: string, plan: PlanId, cycle: BillingCycle): boolean {
  const sub = getSubscription(orgId);
  if (!sub) return false;
  const now = new Date();
  const end = new Date(now);
  if (cycle === "monthly") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  const updated: Subscription = {
    ...sub, plan, billingCycle: cycle, status: "active",
    startDate: now.toISOString(), endDate: end.toISOString(),
    renewsAt: end.toISOString(), cancelledAt: undefined, trialEndsAt: undefined,
  };
  saveSubscription(updated);
  // Append billing record
  const amount  = PLANS[plan].price[cycle];
  const history = getBillingHistory();
  history.unshift({
    id:        `inv_${now.getTime()}`,
    date:      now.toISOString(),
    amount,
    plan,
    cycle,
    status:    "paid",
    invoiceNo: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2,"0")}-${String(history.length + 1).padStart(4,"0")}`,
  });
  localStorage.setItem(LS_BILLING, JSON.stringify(history));
  return true;
}

export function cancelSubscription(orgId: string): boolean {
  const sub = getSubscription(orgId);
  if (!sub) return false;
  saveSubscription({ ...sub, status: "cancelled", cancelledAt: new Date().toISOString() });
  return true;
}

export function renewSubscription(orgId: string): boolean {
  const sub = getSubscription(orgId);
  if (!sub) return false;
  const now = new Date();
  const end = new Date(now);
  if (sub.billingCycle === "monthly") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  saveSubscription({ ...sub, status: "active", endDate: end.toISOString(), renewsAt: end.toISOString(), cancelledAt: undefined });
  return true;
}

// ── Billing history ────────────────────────────────────────────────────────────

export function getBillingHistory(): BillingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_BILLING);
    return raw ? (JSON.parse(raw) as BillingRecord[]) : [];
  } catch { return []; }
}

// ── Usage tracking ─────────────────────────────────────────────────────────────

export function getUsage(orgId: string): UsageRecord {
  if (typeof window === "undefined") return makeEmptyUsage(orgId);
  try {
    const raw = localStorage.getItem(LS_USAGE);
    if (!raw) return makeEmptyUsage(orgId);
    const map = JSON.parse(raw) as Record<string, UsageRecord>;
    return map[`${orgId}_${currentPeriod()}`] ?? makeEmptyUsage(orgId);
  } catch { return makeEmptyUsage(orgId); }
}

function saveUsage(orgId: string, usage: UsageRecord): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LS_USAGE);
  const map = raw ? (JSON.parse(raw) as Record<string, UsageRecord>) : {};
  map[`${orgId}_${currentPeriod()}`] = usage;
  localStorage.setItem(LS_USAGE, JSON.stringify(map));
}

export function incrementUsage(orgId: string, field: UsageField, by = 1): void {
  const usage = getUsage(orgId);
  (usage[field] as number) += by;
  saveUsage(orgId, usage);
}

// ── Feature access helpers ─────────────────────────────────────────────────────

export function hasFeature(planId: PlanId, feature: keyof PlanFeatures): boolean {
  const f = PLANS[planId]?.features;
  if (!f) return false;
  const val = f[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0; // 0 = none, -1 or positive = has it
  return false;
}

export function getLimit(planId: PlanId, feature: keyof PlanFeatures): number {
  const f = PLANS[planId]?.features;
  if (!f) return 0;
  const val = f[feature];
  return typeof val === "number" ? val : (val ? -1 : 0);
}

export function isWithinLimit(planId: PlanId, feature: keyof PlanFeatures, current: number): boolean {
  const limit = getLimit(planId, feature);
  if (limit === -1) return true;
  return current < limit;
}

// ── Plan display helpers ───────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getPlanBadgeColor(plan: PlanId): { bg: string; text: string; border: string } {
  const map: Record<PlanId, { bg: string; text: string; border: string }> = {
    starter:      { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    professional: { bg: "bg-brand-500/10",   text: "text-brand-400",   border: "border-brand-500/20"   },
    business:     { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20"  },
    enterprise:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20"   },
  };
  return map[plan];
}

export function getRequiredPlanForFeature(feature: keyof PlanFeatures): PlanId {
  for (const planId of PLAN_ORDER) {
    if (hasFeature(planId, feature)) return planId;
  }
  return "enterprise";
}
