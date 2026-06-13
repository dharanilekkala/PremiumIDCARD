"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Upload, Download, X, CheckCircle, Sparkles, Layers,
  RefreshCw, Eye, ArrowRight,
  Loader2, ZoomIn, RotateCw, FlipHorizontal, ScanLine, FormInput, Wand2,
  AlertTriangle, FolderOpen, PlusCircle, RotateCcw, Clock, FileText,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Plus,
  Image as ImageIcon, PenLine,
} from "lucide-react";
import { isPdf } from "@/lib/pdfUtils";
import type { PdfInfo } from "@/lib/pdfUtils";
import { useRouter } from "next/navigation";
import DirectEntryMode from "@/components/dashboard/DirectEntryMode";
import FieldDetectionPanel from "@/components/dashboard/FieldDetectionPanel";
import DynamicForm from "@/components/dashboard/DynamicForm";
import CardOverlay from "@/components/dashboard/CardOverlay";
import TemplateCanvas, { TemplateCanvasHandle } from "@/components/dashboard/TemplateCanvas";
import PreviewModal from "@/components/dashboard/PreviewModal";
import {
  analyzeCardImage, detectImageDimensions,
  TemplateAnalysis, DetectedField, BoundingBox,
} from "@/lib/templateAnalyzer";
import { templateStorage, templateToAnalysis, fieldToZone, makeThumbnail, ANALYZER_VERSION, validateTemplate } from "@/lib/templateStorage";
import type { SavedTemplate } from "@/lib/templateStorage";

// ─── Optional extra fields the user can add in the fill phase ────────────────
// ─── Mandatory student fields (always shown, regardless of AI detection) ─────
// These are ALWAYS rendered in the fill phase even if Claude Vision didn't detect
// any text labels (e.g. graphical / blank-template cards).
const MANDATORY_STUDENT_FIELDS: { key: string; label: string; type: DetectedField["type"] }[] = [
  { key: "studentName", label: "Student Name",  type: "text"  },
  { key: "fatherName",  label: "Father Name",   type: "text"  },
  { key: "class",       label: "Class",         type: "text"  },
  { key: "section",     label: "Section",       type: "text"  },
  { key: "phone",       label: "Phone Number",  type: "phone" },
  { key: "address",     label: "Address",       type: "text"  },
];

// "section" is rendered merged into the class line ("Class: 8 – B").
// It needs a form input but NO canvas position slot of its own.
const CANVAS_COMBINED_KEYS = new Set(["section"]);

/**
 * Merge mandatory fields with whatever the AI confirmed.
 * - Fields already present (by key) are kept as-is (preserve AI-detected positions).
 * - "section" gets a form input but no canvas zone (rendered inside the class line).
 * - Remaining mandatory fields get auto-positions below the last known text field.
 * Called once per render in the fill phase; NOT stored in state.
 */
function computeFillFields(
  confirmed: DetectedField[],
  photoBox: BoundingBox | undefined,
  textColor: string,
): DetectedField[] {
  const existingKeys = new Set(confirmed.map(f => f.key));
  const missing      = MANDATORY_STUDENT_FIELDS.filter(m => !existingKeys.has(m.key));
  if (missing.length === 0) return confirmed;

  // Find the lowest occupied vy so we stack below it
  const textVys = confirmed
    .filter(f => f.type !== "photo" && f.position)
    .map(f => f.position!.vy + f.position!.vh / 2);

  const photoBottom = photoBox ? photoBox.y + photoBox.h : 0.60;
  const startY      = Math.max(
    photoBottom + 0.015,
    textVys.length ? Math.max(...textVys) + 0.015 : photoBottom + 0.015,
  );

  // Only fields with their own canvas zone count toward spacing
  const positionedCount = missing.filter(m => !CANVAS_COMBINED_KEYS.has(m.key)).length;
  const rowH = positionedCount > 0
    ? Math.min(0.09, Math.max(0.05, (0.94 - startY) / positionedCount))
    : 0;

  let posIdx = 0;
  const injected: DetectedField[] = missing.map((m) => {
    const isName     = m.key === "studentName" || m.key === "employeeName";
    const isClass    = m.key === "class";
    const isAddress  = /address/i.test(m.key);
    const skipCanvas = CANVAS_COMBINED_KEYS.has(m.key);

    let position: DetectedField["position"] = undefined;
    if (!skipCanvas) {
      const vy = startY + posIdx * rowH + rowH / 2;
      posIdx++;
      position = {
        vx:    0.03,
        vy:    Math.min(vy, 0.95),
        vw:    0.94,
        vh:    isAddress ? rowH * 0.90 : rowH * 0.68,
        fs:    isName ? 16 : isClass ? 13 : 12,
        bold:  isName,
        color: textColor || "#1a1a2e",
        align: "center" as const,
      };
    }

    return {
      id:         `mand_${m.key}`,
      label:      m.label,
      key:        m.key,
      confidence: 100,
      type:       m.type,
      zone:       "bottom" as const,
      enabled:    true,
      required:   true,
      source:     "manual" as const,
      position,
    };
  });

  return [...confirmed, ...injected];
}

// Optional extras — the 6 mandatory fields above handle the core student info.
const OPTIONAL_FIELD_DEFS: { key: string; label: string; type: DetectedField["type"] }[] = [
  { key: "email",      label: "Email",       type: "email" },
  { key: "motherName", label: "Mother Name", type: "text"  },
];

type Phase = "select" | "upload" | "analyzing" | "fields" | "fill";

const PHASE_META: { id: Phase; label: string; icon: React.ElementType }[] = [
  { id: "select",    label: "Choose Source",    icon: FolderOpen },
  { id: "upload",    label: "Upload Reference", icon: Upload     },
  { id: "analyzing", label: "AI Analysis",      icon: ScanLine   },
  { id: "fields",    label: "Detected Fields",  icon: FormInput  },
  { id: "fill",      label: "Fill & Generate",  icon: Wand2      },
];

// ─── Mode chooser shown before entering any workflow ─────────────────────────
function ModeChooser({ onSelect }: { onSelect: (mode: "direct" | "reference") => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-10 max-w-lg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
          <PenLine className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
          Design Manual Builder
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          Create professional ID cards in minutes — no design skills needed.
          Choose how you want to start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Direct Entry */}
        <motion.button
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("direct")}
          className="relative flex flex-col items-start gap-3 sm:gap-4 p-5 sm:p-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-brand-500/30 text-left transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
            style={{ background: "radial-gradient(circle at 10% 20%, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-glow-sm transition-all group-hover:scale-110">
            <PenLine className="w-7 h-7 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-white">Direct Entry Mode</span>
              <span className="text-[9px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">BEGINNER FRIENDLY</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              No reference card needed. Just type in the details, add a photo, and download — done in under 2 minutes!
            </p>
            <ul className="space-y-1.5">
              {["Fill a simple form", "Upload or take a photo", "Live card preview", "Download as PNG"].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-white/40">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full flex items-center justify-end mt-2">
            <span className="text-xs font-bold text-brand-400 group-hover:text-brand-300 transition-colors flex items-center gap-1">
              Start here <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </motion.button>

        {/* Reference Card */}
        <motion.button
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("reference")}
          className="relative flex flex-col items-start gap-3 sm:gap-4 p-5 sm:p-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/30 text-left transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
            style={{ background: "radial-gradient(circle at 10% 20%, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow-sm transition-all group-hover:scale-110">
            <ImageIcon className="w-7 h-7 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-white">Use Reference Card</span>
              <span className="text-[9px] font-black bg-violet-500/20 border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-full">AI POWERED</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Already have an ID card design? Upload it and our AI will detect all the fields automatically.
            </p>
            <ul className="space-y-1.5">
              {["AI field detection", "Auto-fills layout", "Works with any card", "Bulk card generation"].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-white/40">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full flex items-center justify-end mt-2">
            <span className="text-xs font-bold text-violet-400 group-hover:text-violet-300 transition-colors flex items-center gap-1">
              Upload reference <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

export default function ManualBuilderPage() {
  const router = useRouter();
  const [builderMode, setBuilderMode] = useState<"choose" | "direct" | "reference">("choose");
  const [phase, setPhase] = useState<Phase>("select");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [frontImg, setFrontImg] = useState<string | null>(null);
  const [backImg, setBackImg] = useState<string | null>(null);
  const [showFinishedCardWarning, setShowFinishedCardWarning] = useState(false);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null);
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage, setAnalyzeStage] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [showZones, setShowZones] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  /** The SavedTemplate currently loaded (null = fresh analysis) */
  const [loadedTemplate, setLoadedTemplate] = useState<SavedTemplate | null>(null);
  /** "saved" = from localStorage, "fresh" = just analyzed live */
  const [templateSource, setTemplateSource] = useState<"saved" | "fresh" | null>(null);
  /** Re-analyze in-progress */
  const [reAnalyzing, setReAnalyzing] = useState(false);
  const [reAnalyzeStage, setReAnalyzeStage] = useState("");
  /** Fields still missing coordinates after re-analyze */
  const [stillMissing, setStillMissing] = useState<string[]>([]);

  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);
  const [pdfLoading,   setPdfLoading]   = useState(false);
  const [pdfError,     setPdfError]     = useState<string | null>(null);

  const frontRef   = useRef<HTMLInputElement>(null);
  const backRef    = useRef<HTMLInputElement>(null);
  const canvasRef  = useRef<TemplateCanvasHandle>(null);
  const pdfInfoRef = useRef<PdfInfo | null>(null);

  // Load saved templates on mount
  useEffect(() => { setSavedTemplates(templateStorage.list()); }, []);

  // ── Runtime coordinate logging ────────────────────────────────────────────
  // Fires every time the fill step is reached. Open browser DevTools Console
  // to see the exact vx/vy/vw/vh being passed to TemplateCanvas.
  useEffect(() => {
    if (phase !== "fill" || !analysis) return;

    const isStale = loadedTemplate && loadedTemplate.analyzerVersion !== ANALYZER_VERSION;

    console.group("%c🎯 IDForge — Template Coordinates", "color:#6366f1;font-weight:bold;font-size:12px");
    console.log(
      `%cSource: ${templateSource === "saved" ? "📦 Saved Template" : "🔬 Fresh Analysis"}`,
      `color:${templateSource === "saved" ? "#f59e0b" : "#10b981"};font-weight:bold`,
    );
    if (loadedTemplate) {
      console.log(`Template: "${loadedTemplate.name}"`);
      console.log(`Created:  ${new Date(loadedTemplate.createdAt).toLocaleString()}`);
      console.log(
        `%cAnalyzer version: ${loadedTemplate.analyzerVersion ?? "UNKNOWN (old)"}${isStale ? " ⚠️ STALE — click Re-Analyze" : " ✓"}`,
        `color:${isStale ? "#f59e0b" : "#10b981"}`,
      );
    }
    console.log("─────────────────────────────────────");
    if (analysis.photoBox) {
      const pb = analysis.photoBox;
      console.log("%c📷 Photo Box", "color:#8b5cf6;font-weight:bold",
        `x=${(pb.x*100).toFixed(1)}%  y=${(pb.y*100).toFixed(1)}%  w=${(pb.w*100).toFixed(1)}%  h=${(pb.h*100).toFixed(1)}%`);
    } else {
      console.warn("❌ photoBox: NOT DETECTED");
    }
    fields.filter(f => f.enabled).forEach(f => {
      const p = f.position;
      if (!p) { console.error(`❌ ${f.label}: NO POSITION DATA — will not render`); return; }
      const nameWrong = f.key.toLowerCase().includes("name") && p.vy < 0.73;
      console.log(
        `%c${nameWrong ? "⚠️" : "✓"} ${f.label}`,
        `color:${nameWrong ? "#ef4444" : "#6ee7b7"};font-weight:bold`,
        `\n   vx=${(p.vx*100).toFixed(2)}%  vy=${(p.vy*100).toFixed(2)}%${nameWrong ? " ← LIKELY WRONG (expected ~80%)" : ""}`,
        `\n   vw=${(p.vw*100).toFixed(2)}%  vh=${(p.vh*100).toFixed(2)}%`,
        `\n   fs=${p.fs}  bold=${p.bold}  align=${p.align ?? "left"}  color=${p.color}`,
      );
    });
    console.log("─────────────────────────────────────");
    console.log("Enable %c🐛 Debug%c button in Generated Card panel to see bounding boxes on canvas.",
      "color:#f59e0b;font-weight:bold", "color:inherit");
    console.groupEnd();
  }, [phase, analysis, fields, loadedTemplate, templateSource]);

  const loadImage = (file: File, setter: (s: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    setPdfPageCount(0);
    setSelectedPage(1);
    setPdfError(null);
    pdfInfoRef.current = null;

    if (isPdf(file)) {
      setPdfLoading(true);
      try {
        const { loadPdf } = await import("@/lib/pdfUtils");
        const info = await loadPdf(file);
        pdfInfoRef.current = info;
        setPdfPageCount(info.pageCount);
        const dataUrl = await info.getPageDataUrl(1);
        setFrontImg(dataUrl);
      } catch (err) {
        setPdfError(err instanceof Error ? err.message : "Failed to load PDF");
        setFrontImg(null);
      } finally {
        setPdfLoading(false);
      }
      return;
    }
    loadImage(file, setFrontImg);
  };

  const selectFrontPage = async (page: number) => {
    if (!pdfInfoRef.current) return;
    setPdfLoading(true);
    setSelectedPage(page);
    try {
      const dataUrl = await pdfInfoRef.current.getPageDataUrl(page);
      setFrontImg(dataUrl);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    loadImage(file, setBackImg);
  };

  // Load a saved template — skip analysis, jump straight to fill
  const loadTemplate = (t: SavedTemplate) => {
    setFrontImg(t.referenceImage);
    const analysisResult = templateToAnalysis(t);
    setAnalysis(analysisResult);
    setFields(analysisResult.fields);
    setValues({});
    setLoadedTemplate(t);
    setTemplateSource("saved");
    setShowFinishedCardWarning(false);
    setPhase("fill");
  };

  // Force re-analysis of the loaded template with the current (improved) Claude prompt.
  // Overwrites the saved template's zone coordinates with fresh values.
  const reAnalyzeTemplate = useCallback(async () => {
    if (!frontImg || !loadedTemplate) return;
    setReAnalyzing(true);
    setReAnalyzeStage("Detecting dimensions…");

    try {
      const dims = await detectImageDimensions(frontImg);

      const result = await analyzeCardImage(
        frontImg, dims,
        (stage, _key, _pct) => setReAnalyzeStage(stage),
      );

      // Convert Claude's detected fields → template zone definitions
      const newZones = result.fields.filter(f => f.enabled).map((f, i) => fieldToZone(f, i));
      const thumbnail = await makeThumbnail(frontImg);

      const updated: SavedTemplate = {
        ...loadedTemplate,
        zones:           newZones,
        photoBox:        result.photoBox ?? loadedTemplate.photoBox,
        bgColor:         result.bgColor  || loadedTemplate.bgColor,
        textColor:       result.textColor || loadedTemplate.textColor,
        thumbnail,
        updatedAt:       new Date().toISOString(),
        analyzerVersion: ANALYZER_VERSION,
      };

      templateStorage.save(updated);

      const newAnalysis = templateToAnalysis(updated);
      setAnalysis(newAnalysis);
      setFields(newAnalysis.fields);
      setLoadedTemplate(updated);
      setTemplateSource("fresh");

      // Check for fields that still have no coordinates after re-analysis
      const { missing } = validateTemplate(updated.zones);
      setStillMissing(missing);
      if (missing.length > 0) {
        console.warn(
          `⚠️ IDForge — ${missing.length} field(s) still have no coordinates after re-analysis:`,
          missing.join(", "),
          "\nGo to Template Builder → open this template → drag the orange zones to their correct positions.",
        );
      }

      // Log every field's new coordinates to the console
      console.group("%c✅ IDForge — Re-Analysis Complete", "color:#10b981;font-weight:bold");
      console.log("Template:", updated.name, "| Version:", ANALYZER_VERSION);
      if (newAnalysis.photoBox) {
        console.log("%c📷 photoBox", "color:#8b5cf6",
          `x=${(newAnalysis.photoBox.x*100).toFixed(1)}%`,
          `y=${(newAnalysis.photoBox.y*100).toFixed(1)}%`,
          `w=${(newAnalysis.photoBox.w*100).toFixed(1)}%`,
          `h=${(newAnalysis.photoBox.h*100).toFixed(1)}%`);
      }
      newAnalysis.fields.filter(f => f.enabled && f.position).forEach(f => {
        const p = f.position!;
        const warn = f.key.toLowerCase().includes("name") && p.vy < 0.73;
        console.log(
          `%c${warn ? "⚠️" : "✓"} ${f.label}`,
          `color:${warn ? "#ef4444" : "#10b981"}`,
          `vx=${(p.vx*100).toFixed(1)}%`,
          `vy=${(p.vy*100).toFixed(1)}%${warn ? " ← may still be off" : ""}`,
          `vw=${(p.vw*100).toFixed(1)}%  vh=${(p.vh*100).toFixed(1)}%`,
          `fs=${p.fs}  align=${p.align ?? "left"}`,
        );
      });
      console.groupEnd();
    } catch (err) {
      console.error("Re-analysis failed:", err);
    }

    setReAnalyzing(false);
    setReAnalyzeStage("");
  }, [frontImg, loadedTemplate]);

  const startAnalysis = async () => {
    if (!frontImg || !frontFile) return;
    setPhase("analyzing");
    setAnalyzeProgress(0);
    setShowFinishedCardWarning(false);

    const dimensions = await detectImageDimensions(frontImg);
    const result = await analyzeCardImage(
      frontImg,
      dimensions,
      (stage, _key, progress) => {
        setAnalyzeStage(stage);
        setAnalyzeProgress(progress);
      }
    );

    setAnalysis(result);
    setFields(result.fields);
    setLoadedTemplate(null);
    setTemplateSource("fresh");
    // Show warning if card looks finished (has photo + student name)
    const hasPhoto = !!result.photoBox;
    const hasName  = result.fields.some(f => f.key.toLowerCase().includes("name"));
    setShowFinishedCardWarning(hasPhoto && hasName);
    setPhase("fields");
  };

  const setValue = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const [optionalsOpen, setOptionalsOpen] = useState(false);

  const phaseIndex  = PHASE_META.findIndex((p) => p.id === phase);
  const hasAnyValue = Object.values(values).some(v => v.trim() !== "");

  // Fill-phase field list: AI-confirmed fields + any missing mandatory fields.
  // Computed at render time — NOT stored in state — so the fill form always shows
  // the 6 required student fields even when the AI only detected the photo.
  const fillFields = useMemo(() => {
    if (!analysis) return fields.filter(f => f.enabled);
    return computeFillFields(
      fields.filter(f => f.enabled),
      analysis.photoBox,
      analysis.textColor,
    );
  }, [fields, analysis]);

  // Compute a safe auto-position for a newly added optional field
  const computeAutoPos = useCallback((): import("@/lib/templateAnalyzer").FieldPosition => {
    const positioned = fields.filter(f => f.type !== "photo" && f.position).map(f => f.position!);
    const photoBox   = analysis?.photoBox;
    const dims       = analysis?.dimensions;
    const lastVy = positioned.length > 0
      ? Math.max(...positioned.map(p => p.vy + p.vh / 2))
      : photoBox ? photoBox.y + photoBox.h + 0.01 : 0.65;
    const newVy = Math.min(lastVy + 0.09, 0.94);
    return {
      vx: 0.03, vy: newVy, vw: 0.94, vh: 0.07,
      fs: 11, bold: false,
      color: analysis?.textColor ?? "#1a1a2e",
      align: "center" as const,
    };
    void dims; // dims used indirectly via analysis
  }, [fields, analysis]);

  const addOptionalField = useCallback((def: typeof OPTIONAL_FIELD_DEFS[0]) => {
    if (fields.some(f => f.key === def.key)) return;
    const newField: DetectedField = {
      id:         `opt_${def.key}_${Date.now()}`,
      label:      def.label,
      key:        def.key,
      confidence: 100,
      type:       def.type,
      zone:       "bottom",
      enabled:    true,
      required:   false,
      source:     "manual",
      position:   computeAutoPos(),
    };
    setFields(prev => [...prev, newField]);
  }, [fields, computeAutoPos]);

  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    setValues(prev => {
      const field = fields.find(f => f.id === id);
      if (!field) return prev;
      const next = { ...prev };
      delete next[field.key];
      return next;
    });
  }, [fields]);

  // ── Mode routing ──────────────────────────────────────────────────────────
  if (builderMode === "choose") {
    return (
      <div className="h-[calc(100vh-5.5rem)] overflow-y-auto">
        <ModeChooser onSelect={setBuilderMode} />
      </div>
    );
  }

  if (builderMode === "direct") {
    return (
      <div className="h-[calc(100vh-5.5rem)] overflow-hidden">
        <DirectEntryMode onBack={() => setBuilderMode("choose")} />
      </div>
    );
  }

  return (
    <>
    <div className="flex h-[calc(100vh-5.5rem)] gap-4 overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="w-72 xl:w-80 flex flex-col glass-card rounded-2xl border border-white/[0.07] overflow-hidden shrink-0">

        {/* Phase progress */}
        <div className="p-4 border-b border-white/[0.05] space-y-2">
          {PHASE_META.map((p, i) => {
            const done = i < phaseIndex;
            const active = p.id === phase;
            return (
              <div key={p.id} className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${active ? "bg-brand-500/12 border border-brand-500/25" : ""}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  done ? "bg-emerald-500/20 border border-emerald-500/25"
                  : active ? "bg-gradient-to-br from-brand-500 to-violet-500"
                  : "bg-white/5 border border-white/10"
                }`}>
                  {done ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        : <p.icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-white/20"}`} />}
                </div>
                <span className={`text-xs font-semibold ${active ? "text-white" : done ? "text-emerald-400/80" : "text-white/25"}`}>
                  {p.label}
                </span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ── SELECT SOURCE PHASE ── */}
          {phase === "select" && (
            <div className="space-y-4">
              <button onClick={() => setBuilderMode("choose")}
                className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 mb-1">
                ← Back to mode selection
              </button>
              <div>
                <div className="text-xs font-bold text-white mb-1">How do you want to start?</div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Use a saved template for perfect results, or upload a reference card to have AI analyse it.
                </p>
              </div>

              {/* Saved templates */}
              {savedTemplates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Saved Templates ({savedTemplates.length})</div>
                  {savedTemplates.map(t => (
                    <button key={t.id} onClick={() => loadTemplate(t)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl glass-card border border-white/[0.07] hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left group">
                      {t.thumbnail && (
                        <img src={t.thumbnail} alt={t.name} className="w-10 h-7 object-cover rounded-lg shrink-0 border border-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white truncate group-hover:text-brand-300 transition-colors">{t.name}</div>
                        <div className="text-[9px] text-white/30 truncate">{t.zones.length} zones · {t.dimensions.orientation}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-brand-400 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {savedTemplates.length === 0 && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center space-y-2">
                  <FolderOpen className="w-8 h-8 text-white/15 mx-auto" />
                  <p className="text-[10px] text-white/30">No saved templates yet.</p>
                </div>
              )}

              <div className="border-t border-white/[0.05] pt-3 space-y-2">
                <button onClick={() => router.push("/dashboard/template-builder")}
                  className="btn-premium w-full justify-center py-2.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" /> Build New Template
                </button>
                <button onClick={() => setPhase("upload")}
                  className="btn-ghost w-full justify-center py-2.5 text-xs">
                  <Upload className="w-3.5 h-3.5" /> Upload Reference Card (Legacy)
                </button>
              </div>
            </div>
          )}

          {/* ── UPLOAD PHASE ── */}
          {(phase === "upload" || phase === "analyzing") && (
            <div className="space-y-4">
              {/* Front upload */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">
                  Front Side <span className="text-red-400">*</span>
                </label>
                {/* PDF converting spinner */}
                {pdfLoading && (
                  <div className="h-32 rounded-xl border border-brand-500/30 bg-brand-500/5 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                    <p className="text-[10px] text-white/50">Converting PDF…</p>
                  </div>
                )}
                {/* PDF error */}
                {!pdfLoading && pdfError && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/8 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-[10px] font-bold text-red-400">PDF Error</span>
                    </div>
                    <p className="text-[9px] text-white/45 leading-relaxed">{pdfError}</p>
                    <button onClick={() => { setPdfError(null); frontRef.current?.click(); }}
                      className="text-[9px] text-brand-400 hover:text-brand-300">Try another file →</button>
                  </div>
                )}
                {/* Uploaded image preview */}
                {!pdfLoading && !pdfError && frontImg && (
                  <>
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 group">
                      <img src={frontImg} alt="Front" className="w-full max-h-40 object-contain rounded-xl" />
                      {phase !== "analyzing" && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => { setFrontImg(null); setFrontFile(null); setPdfPageCount(0); setSelectedPage(1); pdfInfoRef.current = null; }} className="w-8 h-8 rounded-lg bg-red-500/80 flex items-center justify-center text-white">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => frontRef.current?.click()} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {phase === "analyzing" && (
                        <div className="absolute inset-0 bg-brand-500/10 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {pdfPageCount > 0 && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-violet-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                          <FileText className="w-2 h-2" /> PDF p.{selectedPage}/{pdfPageCount}
                        </div>
                      )}
                    </div>
                    {pdfPageCount > 1 && (
                      <div className="flex items-center gap-1.5 mt-1.5 p-2 rounded-lg bg-violet-500/8 border border-violet-500/20">
                        <span className="text-[9px] text-white/40 shrink-0">Page:</span>
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: Math.min(pdfPageCount, 8) }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => selectFrontPage(p)} disabled={pdfLoading}
                              className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${selectedPage === p ? "bg-violet-500/40 border border-violet-500/60 text-violet-200" : "bg-white/5 border border-white/10 text-white/40 hover:text-white"}`}>{p}</button>
                          ))}
                          {pdfPageCount > 8 && <span className="text-[9px] text-white/25 self-center">+{pdfPageCount - 8}</span>}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* Drop zone */}
                {!pdfLoading && !pdfError && !frontImg && (
                  <button onClick={() => frontRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all flex flex-col items-center justify-center gap-2 group">
                    <Upload className="w-7 h-7 text-white/20 group-hover:text-brand-400 transition-colors" />
                    <div className="text-center">
                      <p className="text-xs text-white/35 group-hover:text-white/55">Upload Front Reference</p>
                      <p className="text-[10px] text-white/20 mt-0.5">JPG · PNG · WEBP · PDF</p>
                    </div>
                  </button>
                )}
                <input ref={frontRef} type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={handleFrontUpload} />
              </div>

              {/* Back upload */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">Back Side (Optional)</label>
                {backImg ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 group">
                    <img src={backImg} alt="Back" className="w-full max-h-24 object-contain rounded-xl" />
                    {phase !== "analyzing" && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => { setBackImg(null); setBackFile(null); }} className="w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => backRef.current?.click()}
                    className="w-full h-20 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/30 transition-all flex flex-col items-center justify-center gap-1.5 group">
                    <Upload className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors" />
                    <p className="text-[10px] text-white/25 group-hover:text-white/45">Upload Back Side</p>
                  </button>
                )}
                <input ref={backRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleBackUpload} />
              </div>

              {/* Analyze button */}
              {frontImg && phase === "upload" && (
                <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  onClick={startAnalysis} className="btn-premium w-full justify-center py-3">
                  <Sparkles className="w-4 h-4" /> Analyze Reference Card
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}

              {/* Analyzing progress */}
              {phase === "analyzing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-xl border border-brand-500/25 bg-brand-500/8 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    <span className="text-xs font-bold text-brand-300">Analyzing…</span>
                    <span className="ml-auto text-xs font-mono text-brand-400">{analyzeProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                      style={{ width: `${analyzeProgress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-[10px] text-white/40 leading-snug">{analyzeStage}</p>
                </motion.div>
              )}
            </div>
          )}

          {/* ── FIELD DETECTION PHASE ── */}
          {phase === "fields" && analysis && (
            <div className="space-y-4">

              {/* ── Finished-card warning ── */}
              {showFinishedCardWarning && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black text-amber-300 mb-1">Finished Card Detected</div>
                      <p className="text-[10px] text-white/50 leading-relaxed">
                        This reference card contains existing student data baked into the image.
                        For <strong className="text-white/70">reliable results</strong>, save it as a
                        reusable template first — then generate cards without overlay artifacts.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => router.push("/dashboard/template-builder")}
                    className="w-full text-[10px] font-bold text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg px-3 py-2 transition-all flex items-center justify-center gap-1.5">
                    <PlusCircle className="w-3 h-3" /> Save as Reusable Template
                  </button>
                  <button onClick={() => setShowFinishedCardWarning(false)}
                    className="w-full text-[10px] text-white/30 hover:text-white/50 transition-colors">
                    Continue anyway (overlay mode)
                  </button>
                </div>
              )}

              {/* Detected card type */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-xs font-black text-emerald-300">
                    Detected Card Type
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-bold text-white">{analysis.categoryLabel}</div>
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                    {analysis.confidence}% confidence
                  </div>
                </div>
                {/* Matched keywords */}
                <div className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-1.5">
                  Matched Keywords
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.matchedKeywords.slice(0, 8).map((kw) => (
                    <span key={kw} className="text-[9px] font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* OCR extracted text */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ScanLine className="w-3 h-3" /> OCR Extracted Text
                </div>
                <div className="space-y-0.5">
                  {analysis.ocrLines.map((line, i) => (
                    <div key={i} className="text-[10px] text-white/50 font-mono leading-relaxed">{line}</div>
                  ))}
                </div>
              </div>

              <FieldDetectionPanel fields={fields} mode={analysis?.mode ?? "manual"} onChange={setFields} />

              {/* Always enabled — mandatory student fields are added automatically */}
              <button
                onClick={() => setPhase("fill")}
                className="btn-premium w-full justify-center py-3"
              >
                <FormInput className="w-4 h-4" />
                Fill Student Details
                <ArrowRight className="w-4 h-4" />
              </button>

              <button onClick={() => { setPhase("upload"); setAnalysis(null); setFields([]); }}
                className="btn-ghost w-full justify-center text-xs py-2">
                ← Re-upload Reference Card
              </button>
            </div>
          )}

          {/* ── FILL PHASE ── */}
          {phase === "fill" && analysis && (
            <div className="space-y-4">
              {/* Back to fields */}
              <button onClick={() => setPhase("fields")} className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1">
                ← Edit detected fields
              </button>

              {/* ── Template Source Banner ── */}
              {loadedTemplate && (
                <div className={`rounded-xl border p-3 space-y-2 ${
                  !loadedTemplate.analyzerVersion || loadedTemplate.analyzerVersion !== ANALYZER_VERSION
                    ? "border-amber-500/40 bg-amber-500/8"
                    : "border-emerald-500/30 bg-emerald-500/6"
                }`}>
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-white/70 truncate">
                        {loadedTemplate.name}
                      </div>
                      <div className="text-[8px] text-white/35 mt-0.5">
                        Created {new Date(loadedTemplate.createdAt).toLocaleDateString()} ·
                        Analyzer: <span className={!loadedTemplate.analyzerVersion || loadedTemplate.analyzerVersion !== ANALYZER_VERSION ? "text-amber-400" : "text-emerald-400"}>
                          {loadedTemplate.analyzerVersion ?? "v1-old"}
                        </span>
                        {loadedTemplate.updatedAt && loadedTemplate.updatedAt !== loadedTemplate.createdAt && (
                          <span className="ml-1 text-emerald-400">· Updated {new Date(loadedTemplate.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(!loadedTemplate.analyzerVersion || loadedTemplate.analyzerVersion !== ANALYZER_VERSION) && (
                    <>
                      <p className="text-[9px] text-amber-300/80 leading-relaxed">
                        ⚠ This template was created with an <strong>older analyzer</strong>. Field coordinates (especially Student Name Y position) may be inaccurate. Re-analyze to fix.
                      </p>
                      <button
                        onClick={reAnalyzeTemplate}
                        disabled={reAnalyzing}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 transition-all"
                      >
                        {reAnalyzing
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> {reAnalyzeStage || "Analyzing…"}</>
                          : <><RotateCcw className="w-3 h-3" /> Re-Analyze with New Prompt</>
                        }
                      </button>
                    </>
                  )}
                  {loadedTemplate.analyzerVersion === ANALYZER_VERSION && (
                    <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Coordinates up to date
                    </div>
                  )}
                </div>
              )}

              {/* Re-analyze button for fresh-analyzed cards */}
              {templateSource === "fresh" && !loadedTemplate && (
                <div className="text-[9px] text-emerald-400 flex items-center gap-1.5 px-1">
                  <CheckCircle className="w-3 h-3" /> Fresh analysis · coordinates from current prompt
                </div>
              )}

              {/* Dynamic form — always shows 6 mandatory fields + any AI-detected extras */}
              <DynamicForm fields={fillFields} values={values} onChange={setValue} />

              {/* Remove buttons for non-required optional fields */}
              {fields.filter(f => !f.required && f.type !== "photo" && f.source === "manual").length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[8px] font-bold text-white/25 uppercase tracking-wider px-1">Added Optional Fields</div>
                  {fields.filter(f => !f.required && f.source === "manual").map(f => (
                    <div key={f.id} className="flex items-center gap-2 px-1">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${values[f.key] ? "bg-emerald-400" : "bg-white/15"}`} />
                      <span className="text-[10px] text-white/50 flex-1 truncate">{f.label}</span>
                      <button onClick={() => removeField(f.id)}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional fields toggle */}
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                <button
                  onClick={() => setOptionalsOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-[10px] font-bold text-white/50">Add Optional Fields</span>
                  </div>
                  {optionalsOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-white/30" />
                    : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                </button>
                <AnimatePresence>
                  {optionalsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden border-t border-white/[0.05]">
                      <div className="p-3 space-y-1.5">
                        <p className="text-[9px] text-white/30 leading-relaxed mb-2">
                          Toggle fields to add them to the form. Only filled fields appear on the generated card.
                        </p>
                        {OPTIONAL_FIELD_DEFS.map(def => {
                          const already = fields.some(f => f.key === def.key);
                          return (
                            <button key={def.key}
                              onClick={() => { if (!already) addOptionalField(def); }}
                              disabled={already}
                              className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-left transition-all ${
                                already
                                  ? "bg-brand-500/10 border border-brand-500/25 cursor-default"
                                  : "hover:bg-white/[0.04] border border-transparent"
                              }`}>
                              {already
                                ? <ToggleRight className="w-4 h-4 text-brand-400 shrink-0" />
                                : <ToggleLeft className="w-4 h-4 text-white/20 shrink-0" />}
                              <span className={`text-[10px] font-medium ${already ? "text-brand-300" : "text-white/40"}`}>{def.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Export */}
              <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                <button
                  onClick={() => canvasRef.current?.downloadPNG(`${analysis?.detectedOrgName || "id-card"}.png`)}
                  className="btn-premium w-full justify-center py-3">
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => canvasRef.current?.downloadPNG(`${analysis?.detectedOrgName || "id-card"}.png`)}
                    className="btn-ghost text-xs py-2 justify-center flex items-center gap-1.5">
                    <Download className="w-3 h-3" />PNG
                  </button>
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="btn-ghost text-xs py-2 justify-center flex items-center gap-1.5">
                    <Eye className="w-3 h-3" />Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: Reference ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

        {/* ── Detected Card Type Banner ── */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl border px-4 py-2.5 flex items-center gap-4 flex-wrap shrink-0"
            style={{ borderColor: `${analysis.dominantColors[3] ?? "#6366f1"}35` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: analysis.dominantColors[3] ?? "#6366f1" }} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Detected Card Type:</span>
              <span className="text-sm font-black text-white">{analysis.categoryLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-white/40">Confidence:</span>
              <span className="text-sm font-black" style={{ color: analysis.dominantColors[3] ?? "#6366f1" }}>
                {analysis.confidence}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.matchedKeywords.slice(0, 5).map((kw) => (
                <span key={kw} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${analysis.dominantColors[3]}18`, border: `1px solid ${analysis.dominantColors[3]}35`, color: analysis.dominantColors[3] ?? "#6366f1" }}>
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-brand-400 to-violet-500" />
            <h3 className="text-sm font-bold text-white">Reference Card</h3>
          </div>
          <div className="flex gap-1.5">
            {analysis && (
              <button
                onClick={() => setShowZones(!showZones)}
                className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all font-semibold flex items-center gap-1.5 ${
                  showZones ? "border-brand-500/40 bg-brand-500/15 text-brand-300" : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                }`}
              >
                <ZoomIn className="w-3 h-3" /> Zones
              </button>
            )}
            {[RotateCw, FlipHorizontal].map((Icon, i) => (
              <button key={i} className="w-7 h-7 rounded-lg bg-white/5 border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 glass-card rounded-2xl border border-white/[0.07] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-grid opacity-15" />
          <AnimatePresence mode="wait">
            {frontImg ? (
              <motion.div key="ref" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="relative p-6">
                <img src={frontImg} alt="reference"
                  className="max-w-sm max-h-72 rounded-2xl shadow-2xl object-contain"
                  style={{ boxShadow: `0 25px 80px rgba(99,102,241,0.25)` }} />
                {phase === "analyzing" && (
                  <motion.div className="absolute inset-6 rounded-2xl pointer-events-none overflow-hidden"
                    style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(99,102,241,0.06) 18px, rgba(99,102,241,0.06) 19px), repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(99,102,241,0.06) 18px, rgba(99,102,241,0.06) 19px)" }}>
                    <motion.div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent"
                      animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }} />
                  </motion.div>
                )}
                {analysis && showZones && analysis.zones.map((z) => {
                  const posMap: Record<string, string> = {
                    "top-left": "top-7 left-7", "top-right": "top-7 right-7",
                    "bottom-right": "bottom-7 right-7", "bottom-left": "bottom-7 left-7",
                    "bottom-center": "bottom-7 left-1/2 -translate-x-1/2",
                    "center-right": "top-1/2 -translate-y-1/2 right-7",
                  };
                  const colors: Record<string, string> = {
                    logo: "#06b6d4", photo: "#8b5cf6", qr: "#10b981",
                    signature: "#ec4899", barcode: "#f59e0b", watermark: "#64748b",
                  };
                  return (
                    <motion.div key={z.type} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                      className={`absolute text-[7px] font-black px-1.5 py-0.5 rounded pointer-events-none ${posMap[z.position] ?? "top-7 left-7"}`}
                      style={{ background: `${colors[z.type]}18`, border: `1.5px solid ${colors[z.type]}65`, color: colors[z.type] }}>
                      {z.type.toUpperCase()} · {z.confidence}%
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="no-ref" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                  <Layers className="w-8 h-8 text-white/10" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/30 mb-1">No reference card uploaded</p>
                  <p className="text-xs text-white/20 max-w-xs">Upload your reference ID card on the left to begin. The system will automatically detect all fields from the template.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analysis info bar */}
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl border border-white/[0.06] p-3 flex items-center gap-4 flex-wrap">
            {[
              { l: "Card Type", v: analysis.categoryLabel },
              { l: "Dimensions", v: `${analysis.dimensions.width}×${analysis.dimensions.height}` },
              { l: "Fields Detected", v: `${analysis.fields.length}` },
              { l: "Confidence", v: `${analysis.confidence}%` },
            ].map(({ l, v }) => (
              <div key={l} className="text-center min-w-0">
                <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">{l}</div>
                <div className="text-xs font-bold text-white truncate">{v}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── RIGHT: Generated Preview ── */}
      <div className="w-72 xl:w-80 flex flex-col gap-3 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
            <h3 className="text-sm font-bold text-white">Generated Card</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.06]">
              {(["front", "back"] as const).map((side) => (
                <button key={side} onClick={() => setPreviewSide(side)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                    previewSide === side ? "bg-emerald-500/20 text-emerald-300" : "text-white/30 hover:text-white"
                  }`}>
                  {side}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
            {analysis && phase === "fill" && hasAnyValue
              // ── Card is ready: render the real canvas or overlay ────────────────
              ? showZones || previewSide === "back"
                ? (
                  <CardOverlay
                    side={previewSide}
                    analysis={analysis}
                    referenceImage={previewSide === "front" ? frontImg : backImg}
                    values={values}
                    showZoneMarkers={showZones}
                  />
                ) : (
                  <TemplateCanvas
                    ref={canvasRef}
                    referenceImage={frontImg}
                    fields={fillFields}
                    values={values}
                    photoBox={analysis.photoBox}
                    textColor={analysis.textColor}
                    bgColor={analysis.bgColor}
                    key={JSON.stringify(values)}
                  />
                )
              // ── Waiting state: no card rendered until user enters data ──────────
              : (
                <div
                  className="rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-center p-6"
                  style={{ aspectRatio: analysis ? `${analysis.dimensions.width} / ${analysis.dimensions.height}` : "856 / 540" }}
                >
                  <Wand2 className="w-8 h-8 text-white/10" />
                  <p className="text-xs text-white/30 leading-relaxed">
                    {!analysis
                      ? "Upload and analyse a reference card to see preview"
                      : phase !== "fill"
                        ? "Confirm detected fields and proceed to Fill & Generate"
                        : "Enter student details to generate the card"
                    }
                  </p>
                </div>
              )
            }
          </div>


          {/* Field summary */}
          {phase === "fill" && analysis && (
            <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">
                Active Fields ({fields.filter((f) => f.enabled).length})
              </div>
              <div className="space-y-1.5">
                {fields.filter((f) => f.enabled).map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${values[f.key] ? "bg-emerald-400" : "bg-white/15"}`} />
                    <span className="text-[10px] text-white/50 flex-1 truncate">{f.label}</span>
                    {values[f.key] && <span className="text-[10px] text-white/30 truncate max-w-[70px]">{values[f.key]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis && phase === "fill" && (
            <div className="space-y-2">
              <button
                onClick={() => canvasRef.current?.downloadPNG(`${analysis.detectedOrgName || "id-card"}.png`)}
                className="btn-premium w-full justify-center py-3">
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => canvasRef.current?.downloadPNG(`${analysis.detectedOrgName || "id-card"}.png`)}
                  className="btn-ghost text-xs py-2 justify-center flex items-center gap-1.5">
                  <Download className="w-3 h-3" />PNG
                </button>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="btn-ghost text-xs py-2 justify-center flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Full-screen Preview Modal ── */}
    {analysis && (
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        referenceImage={frontImg}
        fields={fillFields}
        values={values}
        photoBox={analysis.photoBox}
        textColor={analysis.textColor}
        bgColor={analysis.bgColor}
        filename={`${analysis.detectedOrgName || "id-card"}.png`}
      />
    )}
    </>
  );
}
