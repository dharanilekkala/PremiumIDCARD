"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { sendPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    await new Promise(r => setTimeout(r, 800));
    const { ok } = sendPasswordReset(email.trim());
    if (ok) {
      setSent(true);
    } else {
      setError("No account found with that email address.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mb-3 shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">ID<span className="gradient-text">Forge</span> AI</h1>
        </div>

        <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-5">
                  <Mail className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Reset your password</h2>
                <p className="text-sm text-white/40 mb-6">
                  Enter your email and we&apos;ll send a reset link.
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }}
                      className="mb-5 flex gap-3 items-center p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 transition-all"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !email}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send Reset Link"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="sent" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
                <p className="text-sm text-white/40 mb-6">
                  We sent a password reset link to <span className="text-white/70 font-medium">{email}</span>.
                  Check your spam folder if you don&apos;t see it.
                </p>
                <p className="text-xs text-white/25 mb-6">
                  (Demo mode: no email actually sent. Use your current password or contact an Admin to reset it.)
                </p>
                <Link href="/login"
                  className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
