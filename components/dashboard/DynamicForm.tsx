"use client";
import { useRef } from "react";
import { DetectedField } from "@/lib/templateAnalyzer";
import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";

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
  const ref = useRef<HTMLInputElement>(null);
  const load = (f: File) => {
    const r = new FileReader();
    r.onload = (e) => onChange(field.key, e.target?.result as string);
    r.readAsDataURL(f);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="sm:col-span-2"
    >
      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/45 uppercase tracking-wide mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 text-xs leading-none">*</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="relative h-28 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group bg-white/[0.02]"
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Photo"
              className="h-24 w-20 object-cover rounded-lg border border-white/10"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(field.key, ""); }}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
              Click to upload {field.label.toLowerCase()}
            </span>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ""; }}
      />
    </motion.div>
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
