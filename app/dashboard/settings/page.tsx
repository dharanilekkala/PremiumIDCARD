"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Building2, Bell, Shield, Key, Palette, Globe, Save,
  Eye, EyeOff, CheckCircle
} from "lucide-react";

const tabs = [
  { id: "org", label: "Organization", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "api", label: "API Keys", icon: Key },
  { id: "branding", label: "Branding", icon: Palette },
];

export default function SettingsPage() {
  const [active, setActive] = useState("org");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Nav */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === tab.id ? "bg-brand-500/20 text-brand-300" : "text-white/40 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/[0.07] p-6"
      >
        {active === "org" && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white mb-5">Organization Settings</h3>
            {[
              { label: "Organization Name", placeholder: "ACME Corporation", type: "text" },
              { label: "Domain", placeholder: "acme.com", type: "text" },
              { label: "Industry", placeholder: "Technology", type: "text" },
              { label: "Contact Email", placeholder: "admin@acme.com", type: "email" },
              { label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  defaultValue={field.placeholder}
                  className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {active === "notifications" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white mb-5">Notification Preferences</h3>
            {[
              { label: "Card Generated", desc: "Notify when a new ID card is created", enabled: true },
              { label: "Bulk Job Complete", desc: "Notify when bulk generation finishes", enabled: true },
              { label: "QR Verification", desc: "Notify on each QR scan attempt", enabled: false },
              { label: "Card Expiry", desc: "Alert 30 days before card expires", enabled: true },
              { label: "New User Joined", desc: "Notify when a team member joins", enabled: false },
              { label: "Monthly Report", desc: "Send monthly usage summary", enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-white/30 mt-0.5">{item.desc}</div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-all ${
                    item.enabled ? "bg-brand-500" : "bg-white/10"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    item.enabled ? "left-5" : "left-1"
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {active === "security" && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white mb-5">Security Settings</h3>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-400">Security Score: 87/100</div>
                <div className="text-xs text-white/40 mt-0.5">Good security posture. Enable 2FA to reach 100.</div>
              </div>
            </div>
            {[
              { label: "Two-Factor Authentication", desc: "Add an extra layer of security", enabled: false },
              { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
              { label: "IP Whitelist", desc: "Restrict access to specific IP addresses", enabled: false },
              { label: "Audit Logs", desc: "Track all user actions", enabled: true },
              { label: "Watermark Protection", desc: "Embed invisible watermarks in cards", enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-white/30 mt-0.5">{item.desc}</div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative cursor-pointer transition-all ${
                    item.enabled ? "bg-brand-500" : "bg-white/10"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    item.enabled ? "left-5" : "left-1"
                  }`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {active === "api" && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white mb-5">API Keys</h3>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xs text-white/40 mb-2">Production API Key</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm text-white/60 truncate">
                  {showKey ? "sk-idforge-prod-1a2b3c4d5e6f7g8h9i0j" : "sk-idforge-prod-••••••••••••••••••••"}
                </div>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xs text-white/40 mb-2">Sandbox API Key</div>
              <div className="font-mono text-sm text-white/60">sk-idforge-test-••••••••••••••••••••</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <div className="text-xs text-amber-400">Rate Limits: 1,000 req/min · 100,000 req/day</div>
            </div>
            <button className="btn-ghost text-sm flex items-center gap-2">
              <Key className="w-4 h-4" />
              Regenerate API Key
            </button>
          </div>
        )}

        {active === "branding" && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white mb-5">Custom Branding</h3>
            {[
              { label: "Primary Color", type: "color", value: "#6366f1" },
              { label: "Organization Name on Cards", type: "text", value: "ACME Corporation" },
              { label: "Footer Text", type: "text", value: "www.acme.com" },
              { label: "Verification URL", type: "url", value: "verify.acme.com" },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  defaultValue={field.value}
                  className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-white/[0.06] flex justify-end">
          <button onClick={handleSave} className={`btn-premium flex items-center gap-2 ${saved ? "from-emerald-500 to-teal-500" : ""}`}>
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
