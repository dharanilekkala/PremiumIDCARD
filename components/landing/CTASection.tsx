"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-28 bg-[#060810] overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-brand-600/20 via-violet-600/20 to-cyan-600/15 rounded-full blur-[150px]" />
      </div>
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 section-badge mb-8">
            <Zap className="w-3 h-3" />
            Ready to Get Started?
          </div>

          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Start Creating
            <br />
            <span className="gradient-text">Professional ID Cards</span>
            <br />
            Today
          </h2>

          <p className="text-xl text-white/40 mb-10 max-w-2xl mx-auto">
            Join 50,000+ organizations using IDForge AI. 14-day free trial, no credit card required,
            cancel anytime.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <button className="btn-premium text-base px-8 py-4">
                <Sparkles className="w-5 h-5" />
                Start Free Trial — 14 Days
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-ghost text-base px-8 py-4">
                View Live Demo
              </button>
            </Link>
          </div>

          <p className="mt-6 text-white/25 text-sm">
            No credit card · Full access · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
