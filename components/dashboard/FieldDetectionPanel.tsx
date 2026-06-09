"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  CheckCircle, X, Plus, Pencil, Check, GripVertical,
  Sparkles, ChevronDown, ChevronUp, AlertTriangle, Info,
} from "lucide-react";
import { DetectedField, makeNewField } from "@/lib/templateAnalyzer";

interface Props {
  fields: DetectedField[];
  mode: "ai" | "manual";
  onChange: (fields: DetectedField[]) => void;
}

const CONF_COLOR = (c: number) =>
  c >= 95 ? "#10b981" : c >= 85 ? "#f59e0b" : "#ef4444";

export default function FieldDetectionPanel({ fields, mode, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [expandLow, setExpandLow] = useState(false);

  const enabledCount = fields.filter((f) => f.enabled).length;
  const aiFields  = fields.filter((f) => f.source === "ai");
  const highConf  = aiFields.filter((f) => f.confidence >= 85);
  const lowConf   = aiFields.filter((f) => f.confidence < 85);
  const manual    = fields.filter((f) => f.source === "manual");

  const toggle = (id: string) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));

  const rename = (id: string) => {
    if (!editLabel.trim()) return;
    onChange(fields.map((f) => (f.id === id ? { ...f, label: editLabel.trim() } : f)));
    setEditingId(null);
  };

  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));

  const addField = () => {
    if (!newLabel.trim()) return;
    onChange([...fields, makeNewField(newLabel.trim())]);
    setNewLabel("");
    setShowAdd(false);
  };

  const FieldRow = ({ field }: { field: DetectedField }) => {
    const isEditing = editingId === field.id;
    const isManual  = field.source === "manual";

    return (
      <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all group ${
          field.enabled
            ? "bg-white/[0.03] border-white/[0.08] hover:border-white/15"
            : "bg-transparent border-transparent opacity-35"
        }`}>
        <GripVertical className="w-3.5 h-3.5 text-white/15 cursor-grab shrink-0" />

        <button onClick={() => toggle(field.id)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
            field.enabled ? "border-emerald-500 bg-emerald-500/20" : "border-white/20 bg-transparent"
          }`}>
          {field.enabled && <Check className="w-3 h-3 text-emerald-400" />}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input autoFocus value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") rename(field.id); if (e.key === "Escape") setEditingId(null); }}
              className="w-full h-6 px-2 rounded-lg bg-white/10 border border-brand-500/50 text-xs text-white outline-none" />
          ) : (
            <span className={`text-xs font-medium truncate block ${field.enabled ? "text-white" : "text-white/40"}`}>
              {field.label}
            </span>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-white/25 capitalize">{field.type}</span>
            {isManual && <span className="text-[8px] bg-brand-500/15 text-brand-400 border border-brand-500/20 px-1 rounded">added</span>}
            {field.required && !isManual && <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/20 px-1 rounded">required</span>}
          </div>
        </div>

        {!isManual && (
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${field.confidence}%`, background: CONF_COLOR(field.confidence) }} />
            </div>
            <span className="text-[9px] font-mono" style={{ color: CONF_COLOR(field.confidence) }}>
              {field.confidence}%
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {isEditing ? (
            <button onClick={() => rename(field.id)}
              className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors">
              <Check className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={() => { setEditingId(field.id); setEditLabel(field.label); }}
              className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
          )}
          <button onClick={() => remove(field.id)}
            className="w-6 h-6 rounded-lg bg-red-500/8 flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-500/15 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-bold text-white">
            {mode === "ai" ? "Detected Fields" : "Add Fields"}
          </span>
          <span className="text-xs bg-brand-500/15 text-brand-300 border border-brand-500/25 px-2 py-0.5 rounded-full font-semibold">
            {enabledCount} active
          </span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add field
        </button>
      </div>

      {/* Mode hint */}
      {mode === "ai" && fields.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/6 border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/50 leading-relaxed">
            These fields were read directly from your reference card using AI Vision.
            Uncheck any that you don&apos;t need, or add missing fields below.
          </p>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/25">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/50 leading-relaxed">
            No AI API key found. Look at your reference card and manually add
            each field label you see using the &quot;Add field&quot; button above.
          </p>
        </div>
      )}

      {/* AI detected — high confidence */}
      {highConf.length > 0 && (
        <div className="space-y-1.5">
          <AnimatePresence>{highConf.map((f) => <FieldRow key={f.id} field={f} />)}</AnimatePresence>
        </div>
      )}

      {/* AI detected — low confidence (collapsible) */}
      {lowConf.length > 0 && (
        <div>
          <button onClick={() => setExpandLow(!expandLow)}
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors w-full py-1">
            {expandLow ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {lowConf.length} low-confidence detection{lowConf.length > 1 ? "s" : ""}
          </button>
          <AnimatePresence>
            {expandLow && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="space-y-1.5 overflow-hidden">
                {lowConf.map((f) => <FieldRow key={f.id} field={f} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Manually added fields */}
      {manual.length > 0 && (
        <div>
          {aiFields.length > 0 && (
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[9px] text-white/20 font-bold uppercase tracking-wider">Added manually</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
          )}
          <div className="space-y-1.5">
            <AnimatePresence>{manual.map((f) => <FieldRow key={f.id} field={f} />)}</AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {fields.length === 0 && !showAdd && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Info className="w-8 h-8 text-white/10" />
          <p className="text-[11px] text-white/30 leading-relaxed max-w-52">
            Look at your reference card and add each field label you see printed on it.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add first field
          </button>
        </div>
      )}

      {/* Add field input */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="flex gap-2">
            <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addField(); if (e.key === "Escape") setShowAdd(false); }}
              placeholder="Field name as shown on card, e.g. Class"
              className="flex-1 h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/25 outline-none focus:border-brand-500/50 transition-colors" />
            <button onClick={addField}
              className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 hover:bg-brand-500/30 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAdd(false)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
