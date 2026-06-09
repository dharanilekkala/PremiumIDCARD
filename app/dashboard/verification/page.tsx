"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { QrCode, CheckCircle, XCircle, Clock, Search, Eye, History, Shield } from "lucide-react";
import { QRCodeCanvas as QRCode } from "qrcode.react";

type Card = { id: string; name: string; dept: string; status: string; issued: string; expires: string; scans: number };
type Scan = { id: string; name: string; time: string; location: string; result: string };

const cards: Card[] = [];
const scanHistory: Scan[] = [];

export default function VerificationPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Card | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<"valid" | "invalid" | null>(null);

  const filtered = cards.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = () => {
    if (!verifyInput) return;
    const found = cards.find((c) => c.id.toLowerCase() === verifyInput.toLowerCase());
    setVerifyResult(found && found.status === "active" ? "valid" : "invalid");
  };

  return (
    <div className="space-y-6">
      {/* Quick Verify */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl border border-white/[0.07]"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Quick ID Verification</h3>
            <p className="text-xs text-white/40">Enter an ID number to verify instantly</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            value={verifyInput}
            onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null); }}
            placeholder="Enter ID number (e.g., EMP001)"
            className="flex-1 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 transition-colors font-mono"
          />
          <button onClick={handleVerify} className="btn-premium px-6">
            <QrCode className="w-4 h-4" />
            Verify
          </button>
        </div>
        {verifyResult && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
              verifyResult === "valid"
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            {verifyResult === "valid" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div>
              <div className={`text-sm font-bold ${verifyResult === "valid" ? "text-emerald-400" : "text-red-400"}`}>
                {verifyResult === "valid" ? "Identity Verified" : "Verification Failed"}
              </div>
              <div className="text-xs text-white/40">
                {verifyResult === "valid"
                  ? `Card ${verifyInput} is active and valid`
                  : `Card ${verifyInput} is inactive, expired, or not found`}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card List */}
        <div className="lg:col-span-1 glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cards..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/50"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-96">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                <QrCode className="w-8 h-8 text-white/10" />
                <p className="text-xs text-white/25">No cards found</p>
              </div>
            ) : filtered.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelected(card)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left ${
                  selected?.id === card.id ? "bg-brand-500/10" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/60 to-violet-500/60 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {card.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{card.name}</div>
                  <div className="text-[10px] text-white/30">{card.id}</div>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  card.status === "active" ? "bg-emerald-400"
                  : card.status === "inactive" ? "bg-amber-400"
                  : "bg-red-400"
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Card Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* QR Preview */}
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 rounded-2xl border border-white/[0.07]"
            >
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* QR */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-2xl">
                    <QRCode value={`https://idforge.ai/verify/${selected.id}`} size={120} />
                  </div>
                  <div className="text-xs text-white/30 text-center font-mono">{selected.id}</div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                      <p className="text-sm text-white/40">{selected.dept}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      selected.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : selected.status === "inactive"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                        : "bg-red-500/15 text-red-400 border border-red-500/25"
                    }`}>
                      {selected.status === "active" ? <CheckCircle className="w-3 h-3" />
                        : selected.status === "inactive" ? <Clock className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />}
                      {selected.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Issue Date",   value: selected.issued },
                      { label: "Expiry Date",  value: selected.expires },
                      { label: "Total Scans",  value: `${selected.scans} times` },
                      { label: "Card ID",      value: selected.id },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                        <div className="text-[10px] text-white/30 mb-0.5">{item.label}</div>
                        <div className="text-sm font-semibold text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="btn-ghost text-xs py-2 px-3">
                      <Eye className="w-3.5 h-3.5" />
                      View Card
                    </button>
                    <button className={`text-xs py-2 px-3 rounded-xl font-semibold transition-all ${
                      selected.status === "active"
                        ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    } flex items-center gap-1.5`}>
                      {selected.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-6 rounded-2xl border border-white/[0.07] flex flex-col items-center justify-center gap-3 min-h-[220px]">
              <QrCode className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/25">Select a card from the list to view details</p>
            </div>
          )}

          {/* Scan History */}
          <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
              <History className="w-4 h-4 text-white/40" />
              <span className="text-sm font-bold text-white">Recent Scan History</span>
            </div>
            {scanHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <History className="w-7 h-7 text-white/10" />
                <p className="text-xs text-white/25">No scan history yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {scanHistory.map((scan, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      scan.result === "verified" ? "bg-emerald-500/15" : "bg-red-500/15"
                    }`}>
                      {scan.result === "verified"
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{scan.name}</div>
                      <div className="text-[10px] text-white/30">{scan.id} · {scan.location}</div>
                    </div>
                    <div className="text-[10px] text-white/30">{scan.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
