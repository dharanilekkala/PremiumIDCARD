"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { DetectedField, TemplateAnalysis } from "@/lib/templateAnalyzer";

interface Props {
  side: "front" | "back";
  analysis: TemplateAnalysis;
  referenceImage: string | null;
  values: Record<string, string>;
  showZoneMarkers?: boolean;
}

// ─── Value helpers ────────────────────────────────────────────────────────────

function getField(fields: DetectedField[], ...hints: string[]): DetectedField | undefined {
  for (const hint of hints) {
    const f = fields.find(
      (f) => f.enabled && f.type !== "photo" && f.key.toLowerCase().includes(hint.toLowerCase())
    );
    if (f) return f;
  }
  return undefined;
}

function val(field: DetectedField | undefined, values: Record<string, string>): string {
  return (field && values[field.key]) || "";
}

function photoValue(fields: DetectedField[], values: Record<string, string>): string {
  const f = fields.find((f) => f.enabled && f.type === "photo");
  return (f && values[f.key]) || "";
}

function bodyRows(
  fields: DetectedField[],
  values: Record<string, string>,
  skip: Set<string>
): { label: string; value: string }[] {
  return fields
    .filter(
      (f) => f.enabled && f.type !== "photo" && !skip.has(f.key.toLowerCase()) && values[f.key]
    )
    .map((f) => ({ label: f.label, value: values[f.key] }));
}

// ─── Template Preview (Step 3) ────────────────────────────────────────────────

function TemplatePreview({ analysis, referenceImage }: { analysis: TemplateAnalysis; referenceImage: string | null }) {
  const { dimensions, dominantColors, accentColor, detectedOrgName, zones } = analysis;
  const accent = accentColor ?? dominantColors[1] ?? "#6366f1";

  const ZONE_COLOR: Record<string, string> = {
    logo: "#06b6d4", photo: "#8b5cf6", qr: "#10b981", signature: "#ec4899", barcode: "#f59e0b",
  };
  const ZONE_POS: Record<string, string> = {
    "top-left": "top-2 left-2", "top-right": "top-2 right-2", "top-center": "top-2 left-1/2 -translate-x-1/2",
    "bottom-left": "bottom-2 left-2", "bottom-right": "bottom-2 right-2", "bottom-center": "bottom-2 left-1/2 -translate-x-1/2",
    "center-left": "top-1/2 -translate-y-1/2 left-2", "center-right": "top-1/2 -translate-y-1/2 right-2",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ aspectRatio: dimensions.aspectRatio, border: `1px solid ${accent}40` }}
    >
      {referenceImage ? (
        <img src={referenceImage} alt="template" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${dominantColors[0] ?? "#0d0a1f"},${dominantColors[1] ?? "#1a1040"})` }} />
      )}

      {zones.map((z) => (
        <div key={z.type}
          className={`absolute text-[7px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-sm ${ZONE_POS[z.position] ?? "top-2 left-2"}`}
          style={{ background: `${ZONE_COLOR[z.type] ?? "#fff"}25`, border: `1.5px solid ${ZONE_COLOR[z.type] ?? "#fff"}80`, color: ZONE_COLOR[z.type] ?? "#fff" }}>
          {z.type.toUpperCase()} · {z.confidence}%
        </div>
      ))}

      {detectedOrgName && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-[8px] font-bold text-white/80 px-2 py-1 rounded-lg text-center truncate"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            {detectedOrgName}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Generated Front Card ─────────────────────────────────────────────────────

function GeneratedFront({ analysis, referenceImage, values }: { analysis: TemplateAnalysis; referenceImage: string | null; values: Record<string, string> }) {
  const { fields, dimensions, dominantColors, accentColor, bgColor, detectedOrgName, categoryLabel } = analysis;
  const enabled = fields.filter((f) => f.enabled);
  const accent = accentColor ?? dominantColors[1] ?? "#6366f1";
  const bg0 = bgColor ?? dominantColors[0] ?? "#0d0a1f";
  const bg1 = dominantColors[1] ?? "#1a1040";

  const photo = photoValue(enabled, values);
  const nameField = getField(enabled, "name");
  const idField = getField(enabled, "id", "no", "number", "roll", "registration", "admission", "member");
  const namVal = val(nameField, values);
  const idVal = val(idField, values);
  const subFields = [getField(enabled, "class"), getField(enabled, "branch"), getField(enabled, "department"),
    getField(enabled, "course"), getField(enabled, "designation"), getField(enabled, "section")]
    .filter((f): f is DetectedField => !!f && !!values[f.key]);
  const subLine = subFields.slice(0, 2).map((f) => values[f.key]).join(" · ");

  const skipKeys = new Set([
    nameField?.key ?? "", idField?.key ?? "",
    ...subFields.map((f) => f.key),
  ].map((k) => k.toLowerCase()));
  const rows = bodyRows(enabled, values, skipKeys);
  const hasAny = namVal || idVal || subLine || rows.length > 0 || photo;
  const initials = namVal.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";

  const photoZone = analysis.zones?.find((z: { type: string; position: string }) => z.type === "photo");
  const photoOnRight = !photoZone || photoZone.position.includes("right") || photoZone.position.includes("center");
  const isPortrait = dimensions.orientation === "portrait";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        aspectRatio: dimensions.aspectRatio,
        background: referenceImage ? "transparent" : `linear-gradient(135deg,${bg0},${bg1})`,
        border: `1px solid ${accent}40`,
        boxShadow: `0 16px 48px ${accent}18`,
      }}
    >
      {/* Reference image */}
      {referenceImage && (
        <img src={referenceImage} alt="template" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Readability overlay */}
      {referenceImage && (
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(135deg,${bg0}d8 0%,${bg0}90 50%,${bg0}b0 100%)` }} />
      )}

      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg,${accent},${accent}40)` }} />

      <div className={`absolute inset-0 p-3 flex ${isPortrait ? "flex-col" : "flex-col"} justify-between`}>

        {/* Header row */}
        <div className={`flex ${isPortrait ? "flex-col items-center gap-1" : "items-start justify-between gap-2"}`}>
          <div className={`${isPortrait ? "text-center" : "flex-1 min-w-0"}`}>
            <div className="text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded inline-block mb-0.5"
              style={{ background: `${accent}30`, color: accent }}>
              {categoryLabel}
            </div>
            <div className={`text-[8px] font-bold text-white/70 drop-shadow ${isPortrait ? "text-center" : "truncate"}`}>
              {detectedOrgName || "Organization"}
            </div>
          </div>

          {/* Photo */}
          {(!isPortrait || !photoOnRight) && (
            <div className="rounded-xl overflow-hidden flex items-center justify-center border-2 shrink-0 drop-shadow-lg"
              style={{
                width: isPortrait ? "3rem" : "2.75rem",
                height: isPortrait ? "3.75rem" : "3.25rem",
                background: `${accent}20`,
                borderColor: `${accent}50`,
              }}>
              {photo
                ? <img src={photo} alt="Photo" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-sm drop-shadow">{initials}</span>}
            </div>
          )}
          {!isPortrait && photoOnRight && (
            <div className="rounded-xl overflow-hidden flex items-center justify-center border-2 shrink-0 drop-shadow-lg"
              style={{ width: "2.75rem", height: "3.25rem", background: `${accent}20`, borderColor: `${accent}50` }}>
              {photo
                ? <img src={photo} alt="Photo" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-sm drop-shadow">{initials}</span>}
            </div>
          )}
        </div>

        {/* Portrait centered photo */}
        {isPortrait && photoOnRight && (
          <div className="flex justify-center my-1">
            <div className="rounded-xl overflow-hidden flex items-center justify-center border-2 drop-shadow-lg"
              style={{ width: "3rem", height: "3.75rem", background: `${accent}20`, borderColor: `${accent}50` }}>
              {photo
                ? <img src={photo} alt="Photo" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-base drop-shadow">{initials}</span>}
            </div>
          </div>
        )}

        {/* Body */}
        {hasAny ? (
          <div className="flex-1 flex flex-col justify-center py-1 min-h-0">
            {namVal && (
              <div className={`text-white font-black leading-tight drop-shadow mb-0.5 ${isPortrait ? "text-[11px] text-center" : "text-[12px] truncate"}`}>
                {namVal}
              </div>
            )}
            {subLine && (
              <div className={`text-white/65 text-[8px] drop-shadow mb-0.5 ${isPortrait ? "text-center" : "truncate"}`}>{subLine}</div>
            )}
            {idVal && (
              <div className={`text-[7px] font-mono drop-shadow mb-1 ${isPortrait ? "text-center" : ""}`} style={{ color: `${accent}cc` }}>{idVal}</div>
            )}
            <div className="space-y-px mt-0.5">
              {rows.slice(0, 5).map(({ label, value }) => (
                <div key={label} className="flex gap-1.5 text-[6.5px] leading-tight">
                  <span className="text-white/40 shrink-0 w-14 truncate">{label}:</span>
                  <span className="text-white/70 truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-white/20 text-[9px] italic">Fill fields to preview</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-end justify-between">
          <div className="text-[6px] text-white/20 font-mono drop-shadow">
            idforge.ai/verify/{idVal || "ID"}
          </div>
          <div className="w-7 h-7 rounded-md bg-white p-0.5 shadow-md shrink-0">
            <div className="w-full h-full rounded-sm bg-gray-900 grid grid-cols-3 gap-px p-px">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`rounded-[1px] ${[0, 2, 4, 6, 8].includes(i) ? "bg-white" : "bg-gray-900"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasAny && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-emerald-500/80 backdrop-blur-sm text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
          <Sparkles className="w-2 h-2" /> LIVE
        </div>
      )}
    </motion.div>
  );
}

// ─── Generated Back Card ──────────────────────────────────────────────────────

function GeneratedBack({ analysis, referenceImage, values }: { analysis: TemplateAnalysis; referenceImage: string | null; values: Record<string, string> }) {
  const { fields, dimensions, dominantColors, accentColor, bgColor } = analysis;
  const enabled = fields.filter((f) => f.enabled && f.type !== "photo");
  const accent = accentColor ?? dominantColors[1] ?? "#6366f1";
  const bg0 = bgColor ?? dominantColors[0] ?? "#0d0a1f";
  const nameField = getField(enabled, "name");
  const idField = getField(enabled, "id", "no", "number", "roll", "registration", "admission");
  const idVal = val(idField, values);
  const skipKeys = new Set([nameField?.key ?? "", idField?.key ?? ""].map((k) => k.toLowerCase()));
  const rows = bodyRows(enabled, values, skipKeys);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ aspectRatio: dimensions.aspectRatio, border: `1px solid ${accent}40` }}
    >
      {referenceImage
        ? <><img src={referenceImage} alt="back" className="absolute inset-0 w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0" style={{ background: `${bg0}d8` }} /></>
        : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${bg0},${dominantColors[1] ?? bg0})` }} />}

      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="space-y-1.5">
          {val(nameField, values) && (
            <div className="text-white/80 text-xs font-bold mb-2">{val(nameField, values)}</div>
          )}
          {rows.length > 0
            ? rows.map(({ label, value }) => (
                <div key={label} className="flex gap-2 text-[9px]">
                  <span className="font-semibold shrink-0 w-28 text-white/40">{label}:</span>
                  <span className="text-white/65 truncate">{value}</span>
                </div>
              ))
            : <div className="text-white/15 text-[10px] italic">Fill fields to see back side</div>}
        </div>
        <div className="border-t pt-2 flex flex-col items-center gap-0.5" style={{ borderColor: `${accent}20` }}>
          <div className="text-white/20 text-[7px] text-center">If found, please return to the issuing authority.</div>
          <div className="text-[7px] font-mono text-center" style={{ color: `${accent}50` }}>
            idforge.ai/verify/{idVal || "ID"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CardOverlay({ side, analysis, referenceImage, values, showZoneMarkers = false }: Props) {
  if (showZoneMarkers) return <TemplatePreview analysis={analysis} referenceImage={referenceImage} />;
  if (side === "back") return <GeneratedBack analysis={analysis} referenceImage={referenceImage} values={values} />;
  return <GeneratedFront analysis={analysis} referenceImage={referenceImage} values={values} />;
}
