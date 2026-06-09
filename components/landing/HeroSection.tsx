"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Play, CheckCircle, Zap, Star } from "lucide-react";
import { useState, useEffect } from "react";

const typingPhrases = [
  "Create an ID card for Rahul Kumar, Manager, EMP001",
  "Generate 500 student ID cards from Excel sheet",
  "Recreate this ID template with new employee data",
  "Build a hospital staff badge with QR verification",
];

const stats = [
  { value: "2M+", label: "Cards Generated" },
  { value: "50K+", label: "Organizations" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "Rating" },
];

const trustedBy = ["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro"];

export default function HeroSection() {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const phrase = typingPhrases[currentPhrase];
    const speed = isDeleting ? 30 : 60;

    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < phrase.length) {
        setDisplayText(phrase.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText(phrase.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      } else if (!isDeleting && charIndex === phrase.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setCurrentPhrase((p) => (p + 1) % typingPhrases.length);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentPhrase]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-gradient-bg">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[120px] animate-orb" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[100px] animate-orb-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-cyan-600/10 blur-[150px] animate-orb-slow" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="section-badge">
              <Sparkles className="w-3 h-3" />
              Powered by Claude AI & GPT-4 Vision
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
          >
            Create Thousands of
            <br />
            <span className="gradient-text">Professional ID Cards</span>
            <br />
            <span className="text-white/90">with AI in Minutes</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Upload one sample ID card and let AI automatically recreate the design, generate bulk
            cards, verify identities with QR codes, and manage digital credentials — all from a
            single enterprise platform.
          </motion.p>

          {/* AI Chat Demo Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <div className="glass-card p-1.5 rounded-2xl border border-white/10">
              <div className="bg-[#0d0a1f]/60 rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white/40 text-xs mb-1">Try AI Builder — describe your ID card</p>
                  <p className="text-white/80 text-sm font-mono min-h-[1.25rem]">
                    {displayText}
                    <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse align-middle" />
                  </p>
                </div>
                <button className="btn-premium text-sm shrink-0">
                  Generate <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link href="/dashboard">
              <button className="btn-premium text-base h-13 px-8 py-3.5">
                <Sparkles className="w-5 h-5" />
                Start Building Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button className="btn-ghost text-base h-13 px-8 py-3.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
              Watch Demo
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
          >
            {[
              "No credit card required",
              "14-day free trial",
              "Cancel anytime",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-white/50 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                {item}
              </div>
            ))}
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-20"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="glass-card p-4 rounded-2xl text-center border border-white/[0.06]"
              >
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-white/40 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Hero ID Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Floating ID Cards */}
            <div className="relative h-80 sm:h-96">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-600/20 to-transparent rounded-3xl blur-3xl" />

              {/* Main card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 left-1/2 -translate-x-1/2 w-72 h-44 rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}
              >
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, transparent 50%)",
                  }}
                />
                <div className="p-4 h-full flex flex-col justify-between relative z-10">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="w-14 h-5 rounded-md bg-gradient-to-r from-brand-400 to-violet-400 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">ACME CORP</span>
                      </div>
                      <div className="mt-1 text-[8px] text-white/40">EMPLOYEE IDENTITY CARD</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">RK</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-base">Rahul Kumar</div>
                    <div className="text-white/60 text-[10px]">Senior Manager · Engineering</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-white/40 text-[9px] font-mono">EMP-001-2024</div>
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                        <div className="grid grid-cols-4 gap-0.5 w-6 h-6">
                          {[1,0,1,1,0,1,0,1,1,0,0,1,0,1,1,0].map((dark, i) => (
                            <div key={i} className={`rounded-sm ${dark ? "bg-gray-900" : "bg-white"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer-effect rounded-2xl pointer-events-none" />
              </motion.div>

              {/* Left floating card (smaller) */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [-6, -4, -6] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-20 left-4 sm:left-16 w-48 h-28 rounded-xl overflow-hidden shadow-xl opacity-70"
                style={{
                  background: "linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 100%)",
                  border: "1px solid rgba(52,211,153,0.3)",
                }}
              >
                <div className="p-3 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-3 rounded bg-emerald-500/60" />
                    <div className="w-5 h-5 rounded-full bg-emerald-500/40 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-white">P</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-white/80 font-semibold text-xs">Priya Sharma</div>
                    <div className="text-white/40 text-[8px]">Staff Nurse · ICU</div>
                  </div>
                </div>
              </motion.div>

              {/* Right floating card (smaller) */}
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [5, 7, 5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-24 right-4 sm:right-16 w-44 h-28 rounded-xl overflow-hidden shadow-xl opacity-70"
                style={{
                  background: "linear-gradient(135deg, #1f1000 0%, #3a2000 100%)",
                  border: "1px solid rgba(251,191,36,0.3)",
                }}
              >
                <div className="p-3 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-3 rounded bg-amber-500/60" />
                    <div className="w-5 h-5 rounded-full bg-amber-500/40 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-white">S</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-white/80 font-semibold text-xs">Amit Singh</div>
                    <div className="text-white/40 text-[8px]">Class X-B · Roll 42</div>
                  </div>
                </div>
              </motion.div>

              {/* AI generation indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-card px-4 py-2.5 rounded-full border border-white/10"
              >
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-brand-400"
                      style={{ animation: `pulse 1.5s ${d}s infinite` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/60">AI generating 500 ID cards...</span>
                <span className="text-xs text-emerald-400 font-semibold">94% complete</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Trusted by */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="mt-16"
          >
            <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-6">
              Trusted by 50,000+ organizations worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {trustedBy.map((name) => (
                <div key={name} className="text-white/20 font-bold text-lg hover:text-white/40 transition-colors">
                  {name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
