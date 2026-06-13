"use client";
import { useRef, useState } from "react";
import { DetectedField } from "@/lib/templateAnalyzer";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Crop } from "lucide-react";
import CameraModal from "./CameraModal";
import PhotoEditor from "@/components/PhotoEditor";

interface Props {
  fields: DetectedField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const INPUT_TYPE: Record<string, string> = {
  date: "date",
  phone: "tel",
  email: "email",
  text: "text",
};

function PhotoField({ field, value, onChange }: { field: DetectedField; value: string; onChange: (k: string, v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = (f: File) => {
    const r = new FileReader();
    r.onload = (e) => onChange(field.key, e.target?.result as string);
    r.readAsDataURL(f);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="sm:col-span-2">
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/45 uppercase tracking-wide mb-2">
          {field.label}
          {field.required && <span className="text-red-400 text-xs leading-none">*</span>}
        </label>

        {value ? (
          /* ── Photo selected: preview + 3-button action row ── */
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/25 bg-black/20">
              <img src={value} alt="Student photo" className="w-full h-32 object-contain" />
              <button
                onClick={() => onChange(field.key, "")}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/60 bg-white/[0.05] border border-white/[0.09] hover:text-white hover:bg-white/[0.10] hover:border-white/20 transition-all rounded-xl"
                style={{ height: 40 }}
              >
                <Upload style={{ width: 14, height: 14 }} />
                Change
              </button>
              <button
                onClick={() => setEditorOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:text-emerald-200 transition-all rounded-xl"
                style={{ height: 40 }}
              >
                <Crop style={{ width: 14, height: 14 }} />
                Edit Photo
              </button>
              <button
                onClick={() => setCameraOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white transition-all rounded-xl"
                style={{ height: 40, background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 55%, #6366f1 100%)" }}
              >
                <Camera style={{ width: 14, height: 14 }} />
                Retake
              </button>
            </div>
          </div>
        ) : (
          /* ── No photo: placeholder + Upload / Take Photo buttons ── */
          <div className="space-y-2">
            <div className="h-20 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center">
                <Camera className="w-4.5 h-4.5 text-brand-400/60" />
              </div>
              <span className="text-[9px] text-white/25">No photo selected</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-white/60 bg-white/[0.05] border border-white/[0.09] hover:text-white hover:bg-white/[0.10] hover:border-white/20 transition-all rounded-xl"
                style={{ height: 44, borderRadius: 12 }}
              >
                <Upload style={{ width: 18, height: 18 }} />
                Upload Photo
              </button>
              <button
                onClick={() => setCameraOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all"
                style={{ height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 55%, #6366f1 100%)" }}
              >
                <Camera style={{ width: 18, height: 18 }} />
                Take Photo
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ""; }}
        />
      </motion.div>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => onChange(field.key, dataUrl)}
      />

      <AnimatePresence>
        {editorOpen && value && (
          <PhotoEditor
            src={value}
            onApply={(cropped) => { onChange(field.key, cropped); setEditorOpen(false); }}
            onClose={() => setEditorOpen(false)}
            accent={{ from: "#7c3aed", to: "#6366f1" }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function DynamicForm({ fields, values, onChange }: Props) {
  const active = fields.filter((f) => f.enabled);

  if (active.length === 0) {
    return (
      <div className="text-center py-8 text-white/25 text-xs">
        No fields enabled. Go back and enable at least one field.
      </div>
    );
  }

  const photoFields = active.filter((f) => f.type === "photo");
  const textFields = active.filter((f) => f.type !== "photo");

  // Group text fields by zone
  const byZone: Record<string, DetectedField[]> = {};
  for (const f of textFields) {
    if (!byZone[f.zone]) byZone[f.zone] = [];
    byZone[f.zone].push(f);
  }
  const zoneOrder = ["top", "middle", "bottom"];
  const zoneLabel: Record<string, string> = {
    top: "Header Details",
    middle: "Main Information",
    bottom: "Additional Info",
  };

  return (
    <div className="space-y-5">
      {/* Photo fields first */}
      {photoFields.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Photo</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {photoFields.map((f) => (
              <PhotoField key={f.id} field={f} value={values[f.key] ?? ""} onChange={onChange} />
            ))}
          </div>
        </div>
      )}

      {/* Text fields grouped by zone */}
      {zoneOrder.filter((z) => byZone[z]?.length).map((zone) => (
        <div key={zone}>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">
              {zoneLabel[zone]}
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {byZone[zone].map((field, i) => {
              const isAddress = /address/i.test(field.key) || /address/i.test(field.label);
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={isAddress ? "sm:col-span-2" : ""}
                >
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/45 uppercase tracking-wide mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-400 text-xs leading-none">*</span>}
                  </label>
                  {isAddress ? (
                    <textarea
                      value={values[field.key] ?? ""}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      placeholder="Enter full address"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-xs text-white placeholder:text-white/20 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all resize-none leading-relaxed"
                    />
                  ) : (
                    <input
                      type={INPUT_TYPE[field.type] ?? "text"}
                      value={values[field.key] ?? ""}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/[0.08] text-xs text-white placeholder:text-white/20 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
