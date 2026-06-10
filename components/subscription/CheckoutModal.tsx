"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  X, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2,
  Building2, User, Mail, Phone, MapPin, CreditCard,
  Smartphone, Landmark, Wallet, RefreshCw,
} from "lucide-react";
import { PLANS, formatPrice, getSubscription, upgradePlan, type PlanId, type BillingCycle } from "@/lib/subscription";
import { loadRazorpayScript, type RazorpayPaymentResponse } from "@/lib/razorpay";

type Step = "billing" | "payment" | "processing" | "success" | "error";

interface BillingInfo {
  org:     string;
  contact: string;
  email:   string;
  phone:   string;
  gst:     string;
  address: string;
}

type PayMethod = "upi" | "card" | "netbanking" | "wallet";

const PAY_METHODS: { id: PayMethod; label: string; sub: string; icon: React.ElementType }[] = [
  { id: "upi",        label: "UPI",          sub: "GPay, PhonePe, Paytm",  icon: Smartphone },
  { id: "card",       label: "Cards",        sub: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net Banking",  sub: "All major banks",        icon: Landmark   },
  { id: "wallet",     label: "Wallets",      sub: "Paytm, Amazon Pay",     icon: Wallet     },
];

interface Props {
  planId:  PlanId;
  cycle:   BillingCycle;
  onClose: () => void;
}

export default function CheckoutModal({ planId, cycle, onClose }: Props) {
  const plan = PLANS[planId];

  const [step,    setStep]    = useState<Step>("billing");
  const [info,    setInfo]    = useState<BillingInfo>({ org: "", contact: "", email: "", phone: "", gst: "", address: "" });
  const [errors,  setErrors]  = useState<Partial<Record<keyof BillingInfo, string>>>({});
  const [method,  setMethod]  = useState<PayMethod>("upi");
  const [invoice, setInvoice] = useState("");
  const [errMsg,  setErrMsg]  = useState("");
  const [rzpOk,   setRzpOk]  = useState(false);

  useEffect(() => { loadRazorpayScript().then(setRzpOk); }, []);

  const basePrice  = plan.price[cycle];
  const gstAmount  = Math.round(basePrice * 0.18);
  const total      = basePrice + gstAmount;

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof BillingInfo, string>> = {};
    if (!info.org.trim())     e.org     = "Organization name is required";
    if (!info.contact.trim()) e.contact = "Contact name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) e.email = "Valid email is required";
    if (!/^[6-9]\d{9}$/.test(info.phone))                e.phone = "10-digit Indian mobile required";
    if (info.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(info.gst))
      e.gst = "Invalid GSTIN format";
    if (!info.address.trim()) e.address = "Billing address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleBillingNext() {
    if (validate()) setStep("payment");
  }

  // ── Payment ─────────────────────────────────────────────────────────────────

  async function handlePay() {
    setStep("processing");
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount:  total * 100,
          currency: "INR",
          receipt:  `rcpt_${planId}_${Date.now()}`,
        }),
      });

      const order = await orderRes.json() as {
        id: string; amount: number; currency: string; demo?: boolean;
      };

      // ── Demo mode ──────────────────────────────────────────────────────────
      if (order.demo) {
        await new Promise(r => setTimeout(r, 1800));
        await handleVerify({
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_order_id:   order.id,
          razorpay_signature:  "demo_sig",
          demo: true,
        });
        return;
      }

      // ── Real Razorpay ──────────────────────────────────────────────────────
      if (!rzpOk) throw new Error("Payment gateway script failed to load");

      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount:      order.amount,
        currency:    order.currency,
        name:        "IDForge AI",
        description: `${plan.name} Plan — ${cycle}`,
        order_id:    order.id,
        prefill:     { name: info.contact, email: info.email, contact: info.phone },
        notes:       { organization: info.org, gst: info.gst || "" },
        theme:       { color: "#6366f1" },
        handler:     (res: RazorpayPaymentResponse) => handleVerify(res),
        modal:       { ondismiss: () => setStep("payment"), confirm_close: true },
      });

      // Stay on "payment" step visually while Razorpay popup is open
      setStep("payment");
      rzp.open();

    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Failed to create payment order");
      setStep("error");
    }
  }

  async function handleVerify(data: RazorpayPaymentResponse & { demo?: boolean }) {
    try {
      const res  = await fetch("/api/razorpay/verify-payment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const ver = await res.json() as { verified: boolean; demo?: boolean; error?: string };

      if (!ver.verified) throw new Error(ver.error ?? "Signature mismatch");

      const existing = getSubscription();
      if (existing) upgradePlan(existing.organizationId, planId, cycle);
      setInvoice(`INV-${Date.now().toString(36).toUpperCase()}`);
      setStep("success");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Payment verification failed");
      setStep("error");
    }
  }

  // ── Field helper ─────────────────────────────────────────────────────────────

  function field(
    id: keyof BillingInfo,
    label: string,
    icon: React.ElementType,
    opts?: { placeholder?: string; optional?: boolean; type?: string }
  ) {
    const Icon = icon;
    return (
      <div>
        <label className="block text-xs font-semibold text-white/50 mb-1.5">
          {label}{opts?.optional && <span className="text-white/25 font-normal ml-1">(optional)</span>}
        </label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input
            type={opts?.type ?? "text"}
            value={info[id]}
            onChange={e => { setInfo(prev => ({ ...prev, [id]: e.target.value })); setErrors(prev => ({ ...prev, [id]: undefined })); }}
            placeholder={opts?.placeholder ?? label}
            className={`w-full bg-white/[0.04] border rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 transition-all ${
              errors[id]
                ? "border-rose-500/50 focus:ring-rose-500/50"
                : "border-white/[0.08] focus:border-brand-500/50 focus:ring-brand-500/30"
            }`}
          />
        </div>
        {errors[id] && <p className="text-[10px] text-rose-400 mt-1">{errors[id]}</p>}
      </div>
    );
  }

  // ── Renewal date ──────────────────────────────────────────────────────────────

  const renewDate = (() => {
    const d = new Date();
    if (cycle === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  })();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg glass-card rounded-3xl border border-white/[0.09] overflow-hidden shadow-2xl"
      >
        {/* Top bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${plan.color}`} />

        {/* Close (not shown during processing) */}
        {step !== "processing" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <div>

              {/* ── STEP: billing ────────────────────────────────────────────────── */}
              {step === "billing" && (
                <>
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-white">Billing Information</h2>
                    <p className="text-xs text-white/40 mt-0.5">Required for your invoice and GST compliance</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {field("org",     "Organization Name",  Building2, { placeholder: "Acme Corp" })}
                    {field("contact", "Contact Person",     User,      { placeholder: "Full name" })}
                    {field("email",   "Email Address",      Mail,      { placeholder: "you@company.com", type: "email" })}
                    {field("phone",   "Phone Number",       Phone,     { placeholder: "10-digit mobile" })}
                    {field("gst",     "GSTIN",              CreditCard,{ placeholder: "22AAAAA0000A1Z5", optional: true })}
                    {field("address", "Billing Address",    MapPin,    { placeholder: "City, State, PIN" })}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={handleBillingNext} className="btn-premium flex-1 justify-center text-sm py-3">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={onClose} className="px-4 py-3 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white hover:border-white/20 transition-all">
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP: payment ────────────────────────────────────────────────── */}
              {step === "payment" && (
                <>
                  <div className="mb-5">
                    <button type="button" onClick={() => setStep("billing")} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors mb-3">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <h2 className="text-lg font-bold text-white">Payment Method</h2>
                    <p className="text-xs text-white/40 mt-0.5">Powered by Razorpay — 256-bit SSL encrypted</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {PAY_METHODS.map(m => {
                      const MIcon = m.icon;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            method === m.id
                              ? "border-brand-500/50 bg-brand-500/10"
                              : "border-white/[0.08] hover:border-white/15 bg-white/[0.02]"
                          }`}
                        >
                          <MIcon className={`w-4 h-4 mb-2 ${method === m.id ? "text-brand-400" : "text-white/30"}`} />
                          <div className="text-xs font-semibold text-white">{m.label}</div>
                          <div className="text-[10px] text-white/30">{m.sub}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-5 space-y-2 text-sm">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Order Summary</p>
                    <div className="flex justify-between text-white/60">
                      <span>{plan.name} Plan ({cycle})</span>
                      <span>{formatPrice(basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-white/40 text-xs">
                      <span>GST (18%)</span>
                      <span>+ {formatPrice(gstAmount)}</span>
                    </div>
                    <div className="border-t border-white/[0.06] pt-2 flex justify-between font-bold text-white">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    {cycle === "annual" && (
                      <p className="text-[10px] text-emerald-400 text-right">Annual billing — save 20% vs monthly</p>
                    )}
                  </div>

                  <button type="button" onClick={handlePay} className="btn-premium w-full justify-center text-sm py-3 mb-2">
                    Pay {formatPrice(total)} Securely <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-white/25 text-center">
                    By paying you agree to our Terms of Service. Subscription auto-renews until cancelled.
                  </p>
                </>
              )}

              {/* ── STEP: processing ─────────────────────────────────────────────── */}
              {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}
                    style={{ boxShadow: `0 8px 24px ${plan.glow}40` }}>
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-white">Processing Payment…</p>
                    <p className="text-xs text-white/40 mt-1">Please do not close this window</p>
                  </div>
                </div>
              )}

              {/* ── STEP: success ────────────────────────────────────────────────── */}
              {step === "success" && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6"
                    style={{ boxShadow: "0 8px 32px #10b98150" }}
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                  <p className="text-sm text-white/40 mb-6 max-w-xs">Welcome to {plan.name}. Your subscription is now active.</p>
                  <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6 text-left space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Invoice</span>
                      <span className="text-white font-mono font-semibold">{invoice}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Plan</span>
                      <span className="text-white font-semibold">{plan.name} ({cycle})</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Amount paid</span>
                      <span className="text-white font-semibold">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Next renewal</span>
                      <span className="text-white font-semibold">{renewDate}</span>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} className="btn-premium w-full justify-center text-sm py-3">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── STEP: error ──────────────────────────────────────────────────── */}
              {step === "error" && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-rose-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Payment Failed</h2>
                  <p className="text-sm text-white/40 mb-2 max-w-xs">{errMsg || "An unexpected error occurred. Please try again."}</p>
                  <p className="text-xs text-white/25 mb-6">Your existing plan remains active and unchanged.</p>
                  <div className="flex gap-3 w-full">
                    <button type="button" onClick={() => setStep("payment")} className="btn-premium flex-1 justify-center text-sm py-3">
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white hover:border-white/20 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

          </div>
        </div>
      </motion.div>
    </div>
  );
}
