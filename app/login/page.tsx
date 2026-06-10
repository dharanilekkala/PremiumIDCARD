"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle,
  Loader2, Shield, ChevronRight, RefreshCw,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// ── Demo credentials ──────────────────────────────────────────────────────────

const DEMOS = [
  { role: "SuperAdmin", email: "superadmin@idforge.ai", pw: "Admin@1234", color: "from-amber-500   to-orange-500"  },
  { role: "Admin",      email: "admin@idforge.ai",      pw: "Admin@1234", color: "from-violet-500  to-purple-500"  },
  { role: "Operator",   email: "operator@idforge.ai",   pw: "Admin@1234", color: "from-cyan-500    to-blue-500"    },
  { role: "Viewer",     email: "viewer@idforge.ai",     pw: "Admin@1234", color: "from-slate-500   to-slate-600"   },
];

// ── Error message map ─────────────────────────────────────────────────────────

const ERR: Record<string, string> = {
  invalid_credentials: "Invalid email or password. Please try again.",
  account_locked:      "Account locked after too many failed attempts.",
  account_inactive:    "Your account is inactive. Contact your administrator.",
  account_suspended:   "Your account has been suspended. Contact support.",
};

// ── Inner form (needs AuthContext) ────────────────────────────────────────────

function LoginForm() {
  const router            = useRouter();
  const { login, session, loading } = useAuth();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && session) router.replace("/dashboard");
  }, [session, loading, router]);

  const fill = useCallback((d: typeof DEMOS[0]) => {
    setEmail(d.email);
    setPassword(d.pw);
    setError(null);
  }, []);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);

    const result = await login(email.trim(), password, rememberMe);

    if (result.ok) {
      router.replace("/dashboard");
    } else {
      setError(ERR[result.error] ?? result.error ?? "An error occurred.");
    }
    setSubmitting(false);
  }, [email, password, rememberMe, login, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y:  0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mb-3 shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            ID<span className="gradient-text">Forge</span> AI
          </h1>
          <p className="text-sm text-white/40 mt-1">Enterprise ID Card Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Sign in to your account</h2>
          <p className="text-sm text-white/40 mb-6">
            Enter your credentials to access the dashboard.{" "}
            <a href="/signup" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Create an account
            </a>
          </p>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{   opacity: 0, height: 0 }}
                className="mb-5 flex gap-3 items-start p-3.5 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
                <a href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? "bg-brand-500 border-brand-500" : "border-white/20 bg-white/5"}`}
              >
                {rememberMe && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-sm text-white/50">Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit" disabled={submitting || !email || !password}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-sm mt-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><Shield className="w-4 h-4" /> Sign In</>}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6">
          <p className="text-xs text-white/30 text-center mb-3 flex items-center gap-2 justify-center">
            <RefreshCw className="w-3 h-3" /> Quick sign-in with demo accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMOS.map(d => (
              <button
                key={d.role} onClick={() => fill(d)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/15 transition-all text-left group"
              >
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${d.color} flex items-center justify-center shrink-0`}>
                  <span className="text-[9px] font-black text-white">{d.role.slice(0,2).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/70 truncate">{d.role}</div>
                  <div className="text-[10px] text-white/30 truncate">{d.email.split("@")[0]}</div>
                </div>
                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/40 ml-auto shrink-0" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/20 text-center mt-3">All demo accounts use password: Admin@1234</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page export (wraps with AuthProvider) ─────────────────────────────────────

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
