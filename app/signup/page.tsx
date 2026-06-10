"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Building2, User, Mail, Lock, Eye, EyeOff,
  Phone, ArrowRight, CheckCircle, Loader2, AlertCircle,
  GraduationCap, Stethoscope, Zap, Calendar, Settings,
  ChevronRight,
} from "lucide-react";
import { type OrgCategory } from "@/lib/auth";
import { apiSignup } from "@/lib/api";

const ORG_OPTIONS: { value: OrgCategory; label: string; desc: string; Icon: React.ElementType; color: string }[] = [
  { value: "school",     label: "School",     desc: "K-12 student IDs",            Icon: GraduationCap, color: "from-brand-500 to-violet-500" },
  { value: "college",    label: "College",    desc: "Degree & diploma IDs",         Icon: GraduationCap, color: "from-emerald-500 to-teal-500"  },
  { value: "university", label: "University", desc: "University student & faculty",  Icon: Building2,     color: "from-amber-500 to-orange-500"  },
  { value: "coaching",   label: "Coaching",   desc: "Coaching institute IDs",        Icon: Zap,           color: "from-cyan-500 to-blue-500"     },
  { value: "corporate",  label: "Corporate",  desc: "Employee identity cards",       Icon: Building2,     color: "from-violet-500 to-purple-600" },
  { value: "hospital",   label: "Hospital",   desc: "Doctor, nurse & staff IDs",    Icon: Stethoscope,   color: "from-red-500 to-rose-600"      },
  { value: "event",      label: "Events",     desc: "Conference & event passes",     Icon: Calendar,      color: "from-pink-500 to-rose-500"     },
  { value: "custom",     label: "Custom",     desc: "Any other organization",        Icon: Settings,      color: "from-slate-500 to-slate-600"   },
];

type Step = "org" | "admin";

export default function SignupPage() {
  const router = useRouter();

  const [step,     setStep]     = useState<Step>("org");
  const [orgName,  setOrgName]  = useState("");
  const [orgType,  setOrgType]  = useState<OrgCategory>("school");
  const [phone,    setPhone]    = useState("");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  function validateOrg(): string | null {
    if (!orgName.trim() || orgName.trim().length < 3) return "Organization name must be at least 3 characters.";
    return null;
  }

  function validateAdmin(): string | null {
    if (!name.trim()) return "Full name is required.";
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  }

  function handleOrgNext(e: React.FormEvent) {
    e.preventDefault();
    const err = validateOrg();
    if (err) { setError(err); return; }
    setError(null);
    setStep("admin");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateAdmin();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);

    try {
      await apiSignup({
        orgName: orgName.trim(), orgType,
        adminName: name.trim(), adminEmail: email.trim(),
        password, phone: phone.trim() || undefined,
      });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070a12] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 60%, #0a0d18 100%)" }}>
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ID<span className="text-brand-400">Forge</span> AI</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Start generating<br />
              <span className="gradient-text">professional IDs</span><br />
              in minutes.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Join thousands of schools, colleges, and companies using IDForge AI
              to create stunning identity cards powered by AI.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "🚀", text: "14-day free trial — no credit card required" },
              { icon: "🎨", text: "AI-powered card generation in seconds"        },
              { icon: "🔒", text: "Enterprise-grade security & RBAC"             },
              { icon: "📊", text: "Analytics, audit logs & user management"      },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm text-white/60">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/20 text-xs">
          © 2026 IDForge AI · Trusted by 10,000+ organizations
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">ID<span className="text-brand-400">Forge</span> AI</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(["org", "admin"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? "bg-brand-500 text-white" :
                  (step === "admin" && s === "org") ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  "bg-white/5 text-white/30 border border-white/10"
                }`}>
                  {step === "admin" && s === "org" ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? "text-white" : "text-white/30"}`}>
                  {s === "org" ? "Organization" : "Admin Account"}
                </span>
                {i < 1 && <ChevronRight className="w-3 h-3 text-white/20" />}
              </div>
            ))}
          </div>

          <AnimatePresence>
            {step === "org" ? (
              <motion.div key="org" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Set up your organization</h1>
                  <p className="text-white/40 text-sm">Tell us about your organization to get started.</p>
                </div>

                <form onSubmit={handleOrgNext} className="space-y-5">
                  {error && (
                    <div className="flex gap-2 items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Organization Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        required value={orgName} onChange={e => setOrgName(e.target.value)}
                        placeholder="e.g. Delhi Public School, Acme Corp"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Organization Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ORG_OPTIONS.map(opt => (
                        <button
                          key={opt.value} type="button"
                          onClick={() => setOrgType(opt.value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                            orgType === opt.value
                              ? "border-brand-500/50 bg-brand-500/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${opt.color} flex items-center justify-center shrink-0`}>
                            <opt.Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{opt.label}</div>
                            <div className="text-[10px] text-white/30">{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 transition-colors"
                      />
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>

            ) : (
              <motion.div key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-1">Create admin account</h1>
                  <p className="text-white/40 text-sm">
                    You&apos;ll be the admin of <span className="text-white/70 font-medium">{orgName}</span>.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex gap-2 items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourorg.com"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters"
                        className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-500/60 transition-colors" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
                        className={`w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border text-sm text-white placeholder:text-white/25 outline-none transition-colors ${
                          confirm && confirm !== password ? "border-red-500/50" : "border-white/10 focus:border-brand-500/60"
                        }`} />
                    </div>
                    {confirm && confirm !== password && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep("org"); setError(null); }}
                      className="h-11 px-5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                      Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 h-11 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><CheckCircle className="w-4 h-4" /> Create Account</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/30 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
