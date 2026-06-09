"use client";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Anita Mehta",
    role: "HR Director",
    org: "Apollo Hospitals",
    avatar: "AM",
    color: "from-blue-500 to-cyan-500",
    rating: 5,
    text: "IDForge AI transformed our staff ID card process. What used to take 3 days now takes 30 minutes. The AI template recreation is incredibly accurate — it perfectly cloned our existing design.",
  },
  {
    name: "Rajesh Sharma",
    role: "Principal",
    org: "DPS New Delhi",
    avatar: "RS",
    color: "from-emerald-500 to-teal-500",
    rating: 5,
    text: "We generate ID cards for 8,000 students every year. The bulk generation feature is a game-changer. Upload Excel, click generate, download ZIP — done in under 10 minutes.",
  },
  {
    name: "Priya Kapoor",
    role: "Operations Head",
    org: "Infosys Ltd",
    avatar: "PK",
    color: "from-violet-500 to-purple-500",
    rating: 5,
    text: "The QR verification system is brilliant. Security at our gates now scans employee IDs and gets instant verification. The approval workflow with multi-level sign-off is exactly what we needed.",
  },
  {
    name: "Suresh Nair",
    role: "Event Manager",
    org: "IIM Ahmedabad",
    avatar: "SN",
    color: "from-amber-500 to-orange-500",
    rating: 5,
    text: "We used IDForge AI for our annual conference — 1,200 delegate passes generated in 20 minutes. The event pass templates are gorgeous and the digital ID sharing feature impressed everyone.",
  },
  {
    name: "Kavita Singh",
    role: "IT Manager",
    org: "HDFC Bank",
    avatar: "KS",
    color: "from-rose-500 to-pink-500",
    rating: 5,
    text: "Enterprise security features are top-notch. Role-based access, audit logs, encrypted storage, JWT auth — everything our compliance team required. Deployment was smooth with dedicated support.",
  },
  {
    name: "Arun Patel",
    role: "Dean",
    org: "IIT Mumbai",
    avatar: "AP",
    color: "from-cyan-500 to-blue-500",
    rating: 5,
    text: "The AI photo enhancement is remarkable. Student photos automatically get background removed, face centered, and passport cropped. No more manual Photoshop work for thousands of students.",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-28 bg-[#060810] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="section-badge">
            <Star className="w-3 h-3" />
            Customer Stories
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Loved by 50,000+
            <br />
            <span className="gradient-text">Organizations</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">
            From schools to hospitals to Fortune 500 companies — see what they&apos;re saying.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 rounded-2xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role} · {t.org}</div>
                  </div>
                </div>
                <Quote className="w-5 h-5 text-brand-400/40 group-hover:text-brand-400/70 transition-colors" />
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-white/50 leading-relaxed">{t.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
