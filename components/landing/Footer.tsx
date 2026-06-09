"use client";
import Link from "next/link";
import { Sparkles, ExternalLink, Link2, Code2, Mail } from "lucide-react";

const footerLinks = {
  Product: ["AI Builder", "Manual Builder", "Bulk Generator", "QR Verification", "Digital IDs", "Templates"],
  Solutions: ["Schools & Colleges", "Corporate", "Hospitals", "Events", "Government", "Enterprise"],
  Resources: ["Documentation", "API Reference", "Blog", "Case Studies", "Security", "Status"],
  Company: ["About Us", "Careers", "Partners", "Press", "Contact", "Privacy Policy"],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#040608] border-t border-white/[0.05] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 py-16 border-b border-white/[0.05]">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                ID<span className="gradient-text">Forge</span> AI
              </span>
            </Link>
            <p className="text-sm text-white/30 leading-relaxed mb-6 max-w-xs">
              Enterprise-grade AI-powered ID card generation platform for organizations of all sizes.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: ExternalLink, href: "#", label: "twitter" },
                { icon: Link2, href: "#", label: "linkedin" },
                { icon: Code2, href: "#", label: "github" },
                { icon: Mail, href: "#", label: "email" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">{category}</div>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/30 hover:text-white/70 transition-colors duration-150">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
          <p className="text-xs text-white/20">
            © 2024 IDForge AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/20">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>
            <span>·</span>
            <span>SOC2 Compliant</span>
            <span>·</span>
            <span>ISO 27001</span>
            <span>·</span>
            <span>GDPR Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
