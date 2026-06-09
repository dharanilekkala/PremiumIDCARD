"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How does the AI template recreation work?",
    a: "You upload a photo of your existing ID card. Our AI (powered by Claude Vision API) analyzes the image, detects all design elements — logo position, photo area, text fields, colors, typography, and layout structure. It then recreates a fully editable digital template that matches the original design with 95%+ accuracy.",
  },
  {
    q: "Can I generate ID cards in bulk from Excel?",
    a: "Yes! Upload your Excel file (XLSX/CSV) with employee/student data, optionally upload a ZIP of profile photos, and our system auto-maps columns to ID card fields. You can then generate 1000+ cards in under a minute and download them as a ZIP bundle or batch PDF.",
  },
  {
    q: "How does QR verification work?",
    a: "Every generated ID card includes a unique QR code. When scanned, it opens our verification portal showing the cardholder's details, photo, current status (Active/Inactive/Expired), issue and expiry dates, and scan history. Organizations can also set cards to Inactive instantly.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use AES-256 encryption for data at rest, TLS 1.3 for data in transit, AWS S3 with private buckets for file storage, JWT + optional 2FA authentication, and role-based access control. Enterprise plans include on-premise deployment options.",
  },
  {
    q: "What file formats can I export?",
    a: "Export individual cards as PDF (print-ready, 300 DPI) or PNG. For bulk generation, download a ZIP containing individual files, or a batch PDF with all cards. Digital IDs include shareable URLs. Enterprise plans support custom export formats.",
  },
  {
    q: "Can I use my own custom templates?",
    a: "Absolutely. Upload a photo of any ID card and AI will recreate it as a custom template. You can then save it to your template library, edit it in our visual builder, and use it for bulk generation. All custom templates are private to your organization.",
  },
  {
    q: "Do you have an API for integration?",
    a: "Yes, the Professional and Enterprise plans include REST API access. You can integrate ID card generation into your HRMS, ERP, LMS, or any custom system. The API supports all features including AI generation, QR verification, and digital ID management.",
  },
  {
    q: "What is the trial period?",
    a: "All plans include a 14-day free trial with full access to all features. No credit card required to start. You can generate up to 100 cards during the trial. After the trial, choose a plan or your account becomes a free tier with limited features.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-28 bg-[#070a12] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="section-badge">
            <HelpCircle className="w-3 h-3" />
            FAQ
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Frequently Asked
            <br />
            <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-white pr-4">{faq.q}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                  openIndex === i ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-white/40"
                }`}>
                  {openIndex === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-sm text-white/40 leading-relaxed border-t border-white/[0.05] pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
