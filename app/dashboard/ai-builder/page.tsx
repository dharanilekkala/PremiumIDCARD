"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileSpreadsheet, Package, ScanLine, Zap, Download,
  CheckCircle, AlertCircle, Loader2, X, ArrowRight, Bot,
  FileText, Users, FileImage, RefreshCw, Eye, Edit3, Camera,
  AlertTriangle, Shield, Search, Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { renderCardToDataURL } from "@/components/dashboard/TemplateCanvas";
import PhotoEditor from "@/components/PhotoEditor";
import {
  analyzeCardImage, detectImageDimensions,
  TemplateAnalysis, ANALYSIS_STAGES, CardDimensions, DetectedField, BoundingBox,
} from "@/lib/templateAnalyzer";
import { isPdf } from "@/lib/pdfUtils";
import type { PdfInfo } from "@/lib/pdfUtils";
import { clearPassportCache } from "@/lib/passportCrop";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId = "template" | "analysis" | "excel" | "photos" | "mapping" | "preview" | "generate" | "download";

interface ExcelRow {
  studentName:     string;
  fatherName:      string;
  className:       string;
  section:         string;
  phone:           string;
  address:         string;
  employeeName:    string;
  employeeId:      string;
  designation:     string;
  rollNumber:      string;
  studentId:       string;
  admissionNumber: string;
  photoName:       string;
  _raw:            Record<string, string>; // all column values — used for numeric ID auto-detection
}

interface MatchedRecord {
  row:         ExcelRow;
  photoUrl:    string | null;
  confidence:  number;        // 0.0 – 1.0
  matchKey:    string | null;
  matchMethod: "exact" | "id" | "fuzzy" | "none";
  idx:         number;
}

interface ValidationSummary {
  total:            number;
  withPhoto:        number;
  missingPhoto:     number;
  missingName:      number;
  duplicates:       string[];
  lowConfidence:    number;
  // Confidence tiers (spec: auto≥90, review 70-89, reject <70)
  autoAccepted:     number;
  manualReview:     number;
  rejected:         number;
  extraPhotos:      number;
  unusedPhotoKeys:  string[];
}

interface GeneratedCard {
  idx:     number;
  name:    string;
  dataUrl: string;
}

// ─── Phone-field deduplication (client-side) ─────────────────────────────────
// Mirrors server dedup in route.ts — keeps highest-ranked phone when multiple exist.
function dedupePhoneFields(fields: DetectedField[]): DetectedField[] {
  const phoneFields = fields.filter(f => f.type === "phone");
  let result = fields;
  if (phoneFields.length > 1) {
    const rank = (label: string) => {
      const l = label.toLowerCase().trim();
      if (/^mobile/.test(l))  return 4;
      if (/^contact/.test(l)) return 3;
      if (/^phone$/.test(l))  return 2;
      return 1;
    };
    const best = phoneFields.reduce((a, b) => rank(b.label) >= rank(a.label) ? b : a);
    result = fields.filter(f => f.type !== "phone" || f.label === best.label);
  }
  // Always normalize the surviving phone field label to "Mobile".
  return result.map(f =>
    f.type === "phone" && !/^mobile/i.test(f.label) ? { ...f, label: "Mobile" } : f
  );
}

// ─── Fuzzy matching helpers ───────────────────────────────────────────────────

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev.splice(0, n + 1, ...curr);
  }
  return curr[n];
}

function strSim(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const max = Math.max(a.length, b.length);
  return (max - editDistance(a, b)) / max;
}

// ─── Name normalization ───────────────────────────────────────────────────────
// Spec rules: UPPERCASE → remove spaces, underscores, hyphens, specials, extensions
// "K NIKHIL"          → "KNIKHIL"
// "K_NIKHIL.jpg"      → strip ext → "K_NIKHIL" → "KNIKHIL"   ← MATCH ✓
// "S SRI KRISHNA"     → "SSRIKRISHNA"
// "S_SRI_KRISHNA.jpeg"→ "SSRIKRISHNA"                          ← MATCH ✓
// "M-PRAJAVETHA-REDDY"→ "MPRAJAVETHAREDDY"
// "M-PRAJAVETHA-REDDY.png"→ "MPRAJAVETHAREDDY"                ← MATCH ✓
function normalizeForMatch(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ── Numeric photo ID extraction ───────────────────────────────────────────────
// "img_3397.jpg" → "3397"   "3401.jpeg" → "3401"   "photo_001.png" → "001"
const PHOTO_PREFIX_RE = /^(img_?|image_?|photo_?|pic_?|dsc_?n?_?|p_)/i;

function extractPhotoNumericId(fname: string): string | null {
  const base = fname.replace(/\.[^.]+$/, "");            // strip extension
  const stripped = base.replace(PHOTO_PREFIX_RE, "");    // strip known prefix
  if (/^\d+$/.test(stripped)) return stripped;           // pure numeric → done
  // Fallback: first run of 3+ digits anywhere in filename
  const m = base.match(/(\d{3,})/);
  return m ? m[1] : null;
}

function buildPhotoIdLookup(photos: Map<string, string>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [key, url] of photos) {
    if (!key.includes(".")) continue;
    const id = extractPhotoNumericId(key.split("/").pop() ?? key);
    if (!id) continue;
    if (!lookup.has(id)) lookup.set(id, url);
    // Also index the leading-zero-stripped form so "3397" matches "03397" and vice-versa
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed)) {
      const stripped = String(parsed);
      if (stripped !== id && !lookup.has(stripped)) lookup.set(stripped, url);
    }
  }
  console.log(`[IDForge] Photo ID lookup: ${lookup.size} entries — sample: ${[...lookup.keys()].slice(0, 5).join(", ")}`);
  return lookup;
}

// ── Pre-built normalized lookup ──────────────────────────────────────────────
// Built once per matching run so name lookups are O(1) instead of O(n).
interface NormEntry { url: string; key: string; }

function buildNormLookup(photos: Map<string, string>): Map<string, NormEntry> {
  const lookup = new Map<string, NormEntry>();
  for (const [key, url] of photos) {
    if (!key.includes(".")) continue;
    const base = key.replace(/\.[^.]+$/, "");
    const nk   = normalizeForMatch(base);
    if (nk && !lookup.has(nk)) lookup.set(nk, { url, key });
  }
  return lookup;
}

function matchSingle(
  row:          ExcelRow,
  idx:          number,
  photos:       Map<string, string>,
  normLookup:   Map<string, NormEntry>,
  photoIdLookup: Map<string, string>,
  idColumn:     string | null,
): MatchedRecord {
  const s = (v: string) => String(v ?? "").trim().toLowerCase();

  // ── Priority 0: numeric photo ID column match (100 %) ────────────────────
  // Excel value "3397"  +  photo file "IMG_3397.JPG"  →  extracted ID "3397"  → MATCH
  if (idColumn) {
    const idVal = String(row._raw?.[idColumn] ?? "").trim();
    if (idVal) {
      // Try exact value first, then leading-zero-stripped (e.g. "03397" → "3397")
      const parsed = parseInt(idVal, 10);
      const url = photoIdLookup.get(idVal)
        ?? (!isNaN(parsed) ? photoIdLookup.get(String(parsed)) : undefined)
        ?? null;
      if (url) {
        console.log(`[IDForge Match] Row ${idx + 1}: ID col "${idColumn}"="${idVal}" → IMG numeric match (100%)`);
        return { row, photoUrl: url, confidence: 1.00, matchKey: idVal, matchMethod: "id", idx };
      }
    }
  }

  // ── Priority 1–5: ID / filename exact lookup ─────────────────────────────
  const idChecks: { val: string; conf: number }[] = [
    { val: s(row.studentId),       conf: 1.00 },
    { val: s(row.employeeId),      conf: 1.00 },
    { val: s(row.admissionNumber), conf: 1.00 },
    { val: s(row.rollNumber),      conf: 0.95 },
    { val: s(row.photoName),       conf: 1.00 },
  ].filter(c => c.val);

  for (const { val, conf } of idChecks) {
    const url = photos.get(val)
      ?? photos.get(val + ".jpg")  ?? photos.get(val + ".jpeg")
      ?? photos.get(val + ".png")  ?? photos.get(val + ".webp")
      ?? null;
    if (url) {
      const method: MatchedRecord["matchMethod"] = val === s(row.photoName) ? "exact" : "id";
      console.log(`[IDForge Match] Row ${idx + 1}: "${val}" → ID match (${Math.round(conf * 100)}%)`);
      return { row, photoUrl: url, confidence: conf, matchKey: val, matchMethod: method, idx };
    }
  }

  // ── Priority 6: normalized name exact match (90 %) ───────────────────────
  const rawName  = (row.studentName || row.employeeName || "").trim();
  const normName = normalizeForMatch(rawName);

  if (!normName) {
    console.warn(`[IDForge Match] Row ${idx + 1}: no name found — skipping`);
    return { row, photoUrl: null, confidence: 0, matchKey: null, matchMethod: "none", idx };
  }

  const exactHit = normLookup.get(normName);
  if (exactHit) {
    console.log(`[IDForge Match] Row ${idx + 1}: "${rawName}" → norm:"${normName}" = "${exactHit.key}" (90% exact name)`);
    return { row, photoUrl: exactHit.url, confidence: 0.90, matchKey: exactHit.key, matchMethod: "exact", idx };
  }

  // ── Priority 7: fuzzy name match (80 – 89 %) — minimum confidence 80 % ──
  let bestScore = 0, bestEntry: NormEntry | null = null;
  for (const [nk, entry] of normLookup) {
    if (nk.length < normName.length * 0.4 || nk.length > normName.length * 2.5) continue;
    const sim = strSim(normName, nk);
    if (sim >= 0.80 && sim > bestScore) { bestScore = sim; bestEntry = entry; }
  }
  if (bestEntry) {
    // Map raw sim 0.80-1.0 → confidence 0.80-0.89
    const conf = 0.80 + (bestScore - 0.80) * (0.09 / 0.20);
    console.log(`[IDForge Match] Row ${idx + 1}: "${rawName}" → norm:"${normName}" ≈ "${bestEntry.key}" (${Math.round(conf * 100)}% fuzzy)`);
    return { row, photoUrl: bestEntry.url, confidence: Math.min(conf, 0.89), matchKey: bestEntry.key, matchMethod: "fuzzy", idx };
  }

  console.warn(`[IDForge Match] Row ${idx + 1}: "${rawName}" → norm:"${normName}" — NO MATCH (${normLookup.size} photos indexed)`);
  return { row, photoUrl: null, confidence: 0, matchKey: null, matchMethod: "none", idx };
}

// ─── Build per-card values for rendering ─────────────────────────────────────
// Maps detected template field keys → the correct Excel row value.
//
// Claude Vision names fields dynamically via labelToKey(), so the same field
// can appear as "phone", "phoneNumber", "mobileNo", "contactNo", etc.
// This function resolves every detected key regardless of naming variation,
// then also populates the TemplateCanvas fixed-key aliases so both the
// precision path (detected key) and the fallback path (standard key) hit.
//
function buildCardValues(fields: DetectedField[], row: ExcelRow): Record<string, string> {
  const values: Record<string, string> = {};

  for (const field of fields) {
    if (field.type === "photo") continue;
    const k = field.key.toLowerCase();
    let val = "";

    // Student / employee name
    if (
      /studentname|employeename|staffname|membername|attendeename/.test(k) ||
      (k.includes("name") && !k.includes("father") && !k.includes("mother") &&
       !k.includes("school") && !k.includes("college") && !k.includes("org"))
    ) {
      val = row.studentName || row.employeeName;
    }
    // Father / parent / guardian
    else if (/father|parent|guardian|fathersname/.test(k)) {
      val = row.fatherName;
    }
    // Class / grade / standard
    else if (/^class$|classname|grade|standard|std/.test(k)) {
      val = row.className;
    }
    // Section / division
    else if (/^section$|division|div/.test(k)) {
      val = row.section;
    }
    // Phone / mobile / contact
    else if (/phone|mobile|contact|cell|tel/.test(k)) {
      val = row.phone;
    }
    // Address
    else if (/address|addr/.test(k)) {
      val = row.address;
    }
    // Employee ID
    else if (/employeeid|empid|staffid|workid/.test(k)) {
      val = row.employeeId;
    }
    // Designation / role
    else if (/designation|role|jobtitle|position/.test(k)) {
      val = row.designation;
    }
    // Admission / registration number
    else if (/admissionn|admno|regn|regno|adm/.test(k)) {
      val = row.admissionNumber;
    }
    // Roll number
    else if (/rollno|rollnum/.test(k)) {
      val = row.rollNumber;
    }
    // Student ID
    else if (/studentid|studentno/.test(k)) {
      val = row.studentId;
    }

    // Fallback: fuzzy-match the field label against raw Excel column headers
    if (!val && row._raw) {
      const labelNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const [col, colVal] of Object.entries(row._raw)) {
        if (!colVal) continue;
        const colNorm = col.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (colNorm.includes(labelNorm) || labelNorm.includes(colNorm)) {
          val = colVal; break;
        }
      }
    }

    if (val) values[field.key] = val;
  }

  // Always populate the TemplateCanvas fixed-key aliases so the renderer
  // finds values regardless of which code path fired above.
  const ensure = (key: string, fallback: string) => { if (!values[key]) values[key] = fallback; };
  ensure("studentName",     row.studentName  || row.employeeName);
  ensure("employeeName",    row.employeeName);
  ensure("fatherName",      row.fatherName);
  ensure("class",           row.className);
  ensure("section",         row.section);
  ensure("phone",           row.phone);
  ensure("address",         row.address);
  ensure("employeeId",      row.employeeId);
  ensure("designation",     row.designation);
  ensure("rollNumber",      row.rollNumber);
  ensure("admissionNumber", row.admissionNumber);
  ensure("studentId",       row.studentId);

  console.log(
    `[IDForge Values] "${row.studentName || row.employeeName || "row"}":`,
    Object.fromEntries(Object.entries(values).filter(([, v]) => v)),
  );
  return values;
}

interface MatchResult {
  records:           MatchedRecord[];
  idColumn:          string | null;
  idColumnMatchCount: number;
}

function computeAllMatches(rows: ExcelRow[], photos: Map<string, string>): MatchResult {
  const normLookup    = buildNormLookup(photos);
  const photoIdLookup = buildPhotoIdLookup(photos);
  console.log(`[IDForge Match] ${normLookup.size} name-indexed | ${photoIdLookup.size} ID-indexed | ${rows.length} rows`);

  // ── Auto-detect which Excel column holds numeric photo IDs ──────────────
  let idColumn: string | null = null;
  let idColumnMatchCount = 0;

  if (photoIdLookup.size > 0 && rows.length > 0 && rows[0]._raw) {
    const colCount: Record<string, number> = {};
    for (const row of rows) {
      for (const [col, val] of Object.entries(row._raw)) {
        const v = String(val ?? "").trim();
        if (!v) continue;
        const parsed = parseInt(v, 10);
        // Match exact string value OR leading-zero-stripped numeric form
        const hits = photoIdLookup.has(v) || (!isNaN(parsed) && photoIdLookup.has(String(parsed)));
        if (hits) colCount[col] = (colCount[col] ?? 0) + 1;
      }
    }
    for (const [col, count] of Object.entries(colCount)) {
      if (count > idColumnMatchCount) { idColumnMatchCount = count; idColumn = col; }
    }
    if (idColumn)
      console.log(`[IDForge Match] Auto-detected photo ID column: "${idColumn}" (${idColumnMatchCount}/${rows.length} matches)`);
    else
      console.log(`[IDForge Match] No numeric ID column detected — using name matching only`);
  }

  const records = rows.map((row, i) => matchSingle(row, i, photos, normLookup, photoIdLookup, idColumn));
  return { records, idColumn, idColumnMatchCount };
}

function buildValidation(records: MatchedRecord[], photos: Map<string, string>): ValidationSummary {
  const nameCount: Record<string, number> = {};
  const usedKeys  = new Set<string>();

  records.forEach(r => {
    const n = (r.row.studentName || r.row.employeeName).trim();
    if (n) nameCount[n] = (nameCount[n] ?? 0) + 1;
    if (r.matchKey) {
      usedKeys.add(r.matchKey);
      usedKeys.add(r.matchKey.replace(/\.[^.]+$/, "")); // also register base
    }
  });

  // Extra photos = photo files in the ZIP that weren't matched to any record
  const allPhotoFiles   = [...photos.keys()].filter(k => k.includes("."));
  const unusedPhotoKeys = allPhotoFiles.filter(k => !usedKeys.has(k) && !usedKeys.has(k.replace(/\.[^.]+$/, "")));

  return {
    total:           records.length,
    withPhoto:       records.filter(r => r.photoUrl).length,
    missingPhoto:    records.filter(r => !r.photoUrl).length,
    missingName:     records.filter(r => !r.row.studentName && !r.row.employeeName).length,
    duplicates:      Object.entries(nameCount).filter(([, c]) => c > 1).map(([n]) => n),
    lowConfidence:   records.filter(r => r.photoUrl && r.confidence < 0.75).length,
    autoAccepted:    records.filter(r => r.photoUrl && r.confidence >= 0.90).length,
    manualReview:    records.filter(r => r.photoUrl && r.confidence >= 0.80 && r.confidence < 0.90).length,
    rejected:        records.filter(r => !r.photoUrl || r.confidence < 0.80).length,
    extraPhotos:     unusedPhotoKeys.length,
    unusedPhotoKeys,
  };
}

// ─── Column auto-detection ────────────────────────────────────────────────────

const ALIASES: Record<Exclude<keyof ExcelRow, "_raw">, string[]> = {
  studentName:     ["student name","studentname","name","student","full name","fullname"],
  fatherName:      ["father name","fathername","father","father's name","parent name","parent"],
  className:       ["class","grade","std","standard","class name"],
  section:         ["section","sec","div","division"],
  phone:           ["phone","mobile","contact","phone number","mobile number","phone no"],
  address:         ["address","addr","address line"],
  employeeName:    ["employee name","employeename","emp name","staff name"],
  employeeId:      ["employee id","employeeid","emp id","staff id","emp no"],
  designation:     ["designation","role","position","job title","title"],
  rollNumber:      ["roll no","roll number","rollno","rollnumber","roll"],
  studentId:       ["student id","studentid","reg no","regno"],
  admissionNumber: ["admission no","admission number","admno","adm no","adm number","admission"],
  photoName:       ["photo","photo name","photoname","photo file","photo_name","image","image name","filename","file name"],
};

function detectMapping(headers: string[]): Record<keyof ExcelRow, string | null> {
  const m = {} as Record<keyof ExcelRow, string | null>;
  (Object.keys(ALIASES) as (keyof ExcelRow)[]).forEach(k => { m[k] = null; });
  for (const h of headers) {
    const n = h.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(ALIASES) as [keyof ExcelRow, string[]][]) {
      if (!m[field] && aliases.some(a => n === a || n.includes(a))) m[field] = h;
    }
  }
  return m;
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS: { id: StepId; label: string; icon: React.ElementType }[] = [
  { id: "template",  label: "Template",  icon: Upload          },
  { id: "analysis",  label: "AI Scan",   icon: ScanLine        },
  { id: "excel",     label: "Excel",     icon: FileSpreadsheet },
  { id: "photos",    label: "Photos",    icon: Package         },
  { id: "mapping",   label: "AI Match",  icon: Search          },
  { id: "preview",   label: "Preview",   icon: Eye             },
  { id: "generate",  label: "Generate",  icon: Zap             },
  { id: "download",  label: "Download",  icon: Download        },
];

const CONF_COLOR = (c: number) =>
  c >= 0.9 ? "text-emerald-400" : c >= 0.7 ? "text-amber-400" : "text-red-400";
const CONF_LABEL = (c: number) =>
  c >= 0.9 ? "High"            : c >= 0.7 ? "Medium"          : "Low";

// ─── Auto layout for blank / partially-detected templates ────────────────────
// Computes positions for any mandatory text field that the AI didn't locate.
// Fields that already have real AI-detected positions are left untouched.
// Fields marked autoPositioned=true (synthetic coords) are recomputed here too.
function applyAutoLayout(
  fields: DetectedField[],
  photoBox: BoundingBox | undefined,
  textColor: string,
): DetectedField[] {
  // Semantic check — returns true when an existing AI-detected field covers this role
  const hasDetected = (role: string) => fields.some(f => {
    if (!f.position || f.autoPositioned) return false;
    const k = f.key.toLowerCase();
    switch (role) {
      case "studentName":  return /studentname|employeename/.test(k);
      case "fatherName":   return /father|parent|guardian/.test(k);
      case "class":        return /^class$|classname|grade|standard/.test(k);
      case "phone":        return /phone|mobile|contact|tel/.test(k);
      case "address":      return /address/.test(k);
      default:             return k === role;
    }
  });

  const MANDATORY = [
    { key: "studentName", label: "Student Name" },
    { key: "fatherName",  label: "Father Name"  },
    { key: "class",       label: "Class"         },
    { key: "phone",       label: "Phone Number"  },
    { key: "address",     label: "Address"       },
  ] as const;

  const missing = MANDATORY.filter(m => !hasDetected(m.key));
  if (missing.length === 0) return fields;   // all roles have real AI positions

  // Layout constants derived from spec (margin_top 12, row_gap 8, font 11)
  const cappedH     = photoBox ? Math.min(photoBox.h, 0.40) : 0;
  const zoneBottom  = photoBox ? photoBox.y + cappedH + 0.02 : 0.52;
  const startY      = Math.min(Math.max(zoneBottom + 0.020, 0.58), 0.66);

  const NAME_H          = 0.060;
  const DETAIL_TOP_GAP  = 0.016;   // 10 px
  const DETAIL_SLOT     = 0.038;   // font(11) + gap(8) + pad(4) at 608 px
  const BOTTOM          = 0.87;
  const detailStart     = startY + NAME_H + DETAIL_TOP_GAP;

  const DETAIL_ORDER = ["fatherName", "class", "phone", "address"] as const;

  const freshPos = new Map<string, DetectedField["position"]>();

  if (!hasDetected("studentName")) {
    freshPos.set("studentName", {
      vx: 0.03, vy: startY + NAME_H / 2, vw: 0.94, vh: NAME_H * 0.68,
      fs: 16, bold: true, color: textColor || "#1a1a2e", align: "center",
    });
  }

  let idx = 0;
  for (const key of DETAIL_ORDER) {
    if (hasDetected(key)) continue;
    const vy = detailStart + idx * DETAIL_SLOT + DETAIL_SLOT / 2;
    freshPos.set(key, {
      vx: 0.10, vy: Math.min(vy, BOTTOM - DETAIL_SLOT / 2), vw: 0.80, vh: DETAIL_SLOT * 0.70,
      fs: 11, bold: true, color: textColor || "#1a1a2e", align: "left",
    });
    idx++;
  }

  // Re-position existing fields that need synthetic coords, add truly absent ones
  const fieldKeys = new Set(fields.map(f => f.key));
  const result: DetectedField[] = fields.map(f =>
    freshPos.has(f.key) ? { ...f, position: freshPos.get(f.key), autoPositioned: true } : f
  );
  for (const m of MANDATORY) {
    if (fieldKeys.has(m.key) || !freshPos.has(m.key)) continue;
    result.push({
      id: `auto_${m.key}`, key: m.key, label: m.label,
      type: "text", confidence: 100, zone: "bottom",
      enabled: true, required: true, source: "manual",
      autoPositioned: true, position: freshPos.get(m.key),
    } as DetectedField);
  }
  return result;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIBuilderPage() {
  const [step,  setStep]  = useState<StepId>("template");
  const [error, setError] = useState<string | null>(null);

  // Template
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [dims,        setDims]        = useState<CardDimensions | null>(null);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const pdfRef = useRef<PdfInfo | null>(null);

  // Analysis
  const [analysis,        setAnalysis]        = useState<TemplateAnalysis | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage,    setAnalyzeStage]    = useState("");
  const [analyzeIdx,      setAnalyzeIdx]      = useState(0);

  // Excel
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [colMap,    setColMap]    = useState<Record<keyof ExcelRow, string | null> | null>(null);
  const [excelName, setExcelName] = useState("");

  // Photos
  const [photoMap,   setPhotoMap]   = useState<Map<string, string>>(new Map());
  const [zipLoading, setZipLoading] = useState(false);
  const [zipName,    setZipName]    = useState("");

  // AI Matching
  const [matched,        setMatched]        = useState<MatchedRecord[]>([]);
  const [validation,     setValidation]     = useState<ValidationSummary | null>(null);
  const [matchRunning,   setMatchRunning]   = useState(false);
  const [detectedIdCol,  setDetectedIdCol]  = useState<{ col: string; count: number } | null>(null);
  // Field coverage: which detected template fields have Excel values mapped
  const [fieldCoverage,  setFieldCoverage]  = useState<{ label: string; key: string; value: string }[]>([]);

  // Preview
  const [previewCards,   setPreviewCards]   = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editIdx,        setEditIdx]        = useState<number | null>(null);
  const [editRow,        setEditRow]        = useState<ExcelRow | null>(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

  // Generation
  const [generated,      setGenerated]      = useState<GeneratedCard[]>([]);
  const [skippedRecords, setSkippedRecords] = useState<MatchedRecord[]>([]);
  const [genPct,         setGenPct]         = useState(0);
  const [genTotal,       setGenTotal]       = useState(0);
  const [genEta,         setGenEta]         = useState("");
  const abortRef = useRef(false);
  const genStart = useRef(0);

  const stepIdx = STEPS.findIndex(s => s.id === step);
  const isDone  = (id: StepId) => STEPS.findIndex(s => s.id === id) < stepIdx;

  // ── Template upload ──────────────────────────────────────────────────────────
  const handleTemplate = useCallback(async (file: File) => {
    setError(null); setTemplateImg(null); pdfRef.current = null;
    if (isPdf(file)) {
      setPdfLoading(true);
      try {
        const { loadPdf } = await import("@/lib/pdfUtils");
        const info = await loadPdf(file);
        pdfRef.current = info;
        const url = await info.getPageDataUrl(1);
        setTemplateImg(url);
        setDims(await detectImageDimensions(url));
      } catch (e) {
        setError(e instanceof Error ? e.message : "PDF load failed");
      } finally { setPdfLoading(false); }
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      setTemplateImg(url);
      setDims(await detectImageDimensions(url));
    };
    reader.readAsDataURL(file);
  }, []);

  // ── AI template analysis ─────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!templateImg) return;
    setStep("analysis"); setAnalyzeProgress(0); setAnalyzeIdx(0);
    const dimensions = dims ?? await detectImageDimensions(templateImg);
    setDims(dimensions);
    const result = await analyzeCardImage(templateImg, dimensions, (label, _k, pct) => {
      setAnalyzeStage(label);
      setAnalyzeProgress(pct);
      setAnalyzeIdx(Math.floor((pct / 100) * ANALYSIS_STAGES.length));
    });
    setAnalysis(result);
    setStep("excel");
  }, [templateImg, dims]);

  // ── Excel upload ─────────────────────────────────────────────────────────────
  const handleExcel = useCallback(async (file: File) => {
    setError(null); setExcelName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: "array" });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (!raw.length) { setError("Excel file is empty"); return; }
      const headers = Object.keys(raw[0]);
      const mapping = detectMapping(headers);
      setColMap(mapping);
      const str = (v: unknown) => (v == null ? "" : String(v).trim());
      setExcelRows(raw.map(r => ({
        studentName:     str(r[mapping.studentName     ?? ""]),
        fatherName:      str(r[mapping.fatherName      ?? ""]),
        className:       str(r[mapping.className       ?? ""]),
        section:         str(r[mapping.section         ?? ""]),
        phone:           str(r[mapping.phone           ?? ""]),
        address:         str(r[mapping.address         ?? ""]),
        employeeName:    str(r[mapping.employeeName    ?? ""]),
        employeeId:      str(r[mapping.employeeId      ?? ""]),
        designation:     str(r[mapping.designation     ?? ""]),
        rollNumber:      str(r[mapping.rollNumber      ?? ""]),
        studentId:       str(r[mapping.studentId       ?? ""]),
        admissionNumber: str(r[mapping.admissionNumber ?? ""]),
        photoName:       str(r[mapping.photoName       ?? ""]),
        // Store all column values so numeric ID column can be auto-detected at match time
        _raw: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, str(v)])),
      })));
    } catch (e) { setError(e instanceof Error ? e.message : "Excel parse failed"); }
  }, []);

  // ── Photos ZIP ────────────────────────────────────────────────────────────────
  const handleZip = useCallback(async (file: File) => {
    setError(null); setZipName(file.name); setZipLoading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip   = await JSZip.loadAsync(file);
      const map   = new Map<string, string>();
      const EXTS  = [".jpg", ".jpeg", ".png", ".webp"];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const fname = path.split("/").pop()?.toLowerCase() ?? "";
        if (!EXTS.some(e => fname.endsWith(e))) continue;
        const blob = await entry.async("blob");
        const url  = URL.createObjectURL(blob);
        map.set(fname, url);
        const base = fname.replace(/\.[^.]+$/, "");
        if (!map.has(base)) map.set(base, url);
      }
      setPhotoMap(map);
    } catch (e) { setError(e instanceof Error ? e.message : "ZIP extract failed"); }
    finally { setZipLoading(false); }
  }, []);

  // ── AI Matching (auto-runs on entering mapping step) ─────────────────────────
  const triggerMatching = useCallback(() => {
    setMatchRunning(true);
    setTimeout(() => {
      const { records, idColumn, idColumnMatchCount } = computeAllMatches(excelRows, photoMap);
      setMatched(records);
      setValidation(buildValidation(records, photoMap));
      setDetectedIdCol(idColumn ? { col: idColumn, count: idColumnMatchCount } : null);

      // Compute field coverage using first row as sample — shows which template
      // fields have Excel values so the user can spot unmapped columns early.
      if (analysis && excelRows.length > 0) {
        const sample = buildCardValues(analysis.fields, excelRows[0]);
        setFieldCoverage(
          analysis.fields
            .filter(f => f.type !== "photo" && f.enabled)
            .map(f => ({ label: f.label, key: f.key, value: sample[f.key] ?? "" })),
        );
      }

      setMatchRunning(false);
    }, 30);
  }, [excelRows, photoMap, analysis]);

  // ── Change photo for a specific record (manual review) ───────────────────────
  const changePhotoRef = useRef<HTMLInputElement>(null);
  const [changingIdx,   setChangingIdx]  = useState<number | null>(null);
  const [photoEditSrc,  setPhotoEditSrc] = useState<string | null>(null);
  const [photoEditIdx,  setPhotoEditIdx] = useState<number | null>(null);

  const handleChangePhoto = useCallback((file: File) => {
    if (changingIdx === null) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setMatched(prev => {
        const updated = [...prev];
        updated[changingIdx] = { ...updated[changingIdx], photoUrl: url, confidence: 1.0, matchMethod: "exact", matchKey: file.name };
        return updated;
      });
      setPreviewCards([]); // force preview re-render
    };
    reader.readAsDataURL(file);
    setChangingIdx(null);
  }, [changingIdx]);

  const handlePhotoEditApply = useCallback((dataUrl: string) => {
    if (photoEditIdx === null) return;
    setMatched(prev => {
      const updated = [...prev];
      updated[photoEditIdx] = { ...updated[photoEditIdx], photoUrl: dataUrl, confidence: 1.0, matchMethod: "exact" };
      return updated;
    });
    setPreviewCards([]);
    setPhotoEditSrc(null);
    setPhotoEditIdx(null);
  }, [photoEditIdx]);

  useEffect(() => {
    if (step === "mapping" && excelRows.length > 0 && photoMap.size > 0 && matched.length === 0 && !matchRunning) {
      triggerMatching();
    }
  }, [step]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preview render (first 10 cards) ──────────────────────────────────────────
  const renderPreview = useCallback(async () => {
    if (!analysis || !templateImg) return;
    setPreviewLoading(true); setPreviewCards([]);
    const { fields: rawFields, photoBox, textColor } = analysis;
    const fields = dedupePhoneFields(rawFields);

    // Validate: require at least 4 non-photo fields with AI-detected positions
    const positionedCount = fields.filter(f => f.type !== "photo" && f.position && !f.autoPositioned).length;
    if (positionedCount < 4) {
      setError("Template zones not detected correctly. Please re-scan with a filled-in sample card.");
      setPreviewLoading(false);
      return;
    }

    const cards: string[] = [];
    for (const { row, photoUrl } of matched.slice(0, 10)) {
      const values = buildCardValues(fields, row);
      cards.push(await renderCardToDataURL(templateImg, fields, values, photoBox, photoUrl, textColor ?? "#111111", false, true));
    }
    setPreviewCards(cards);
    setPreviewLoading(false);
  }, [analysis, templateImg, matched]);

  useEffect(() => {
    if (step === "preview" && previewCards.length === 0 && matched.length > 0 && !previewLoading) {
      renderPreview();
    }
  }, [step]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bulk generation — only records with a confirmed photo match (confidence ≥ 90%) ──
  const runGeneration = useCallback(async () => {
    if (!analysis || !templateImg) return;
    setStep("generate"); setGenPct(0); setGenerated([]); setGenEta("");
    abortRef.current = false; genStart.current = Date.now();

    // Partition: eligible = matched photo + confidence ≥ 90%, rest → missing-photo report
    const toGenerate = matched.filter(r => r.photoUrl && r.confidence >= 0.90);
    const skipped    = matched.filter(r => !r.photoUrl || r.confidence < 0.90);
    setSkippedRecords(skipped);
    setGenTotal(toGenerate.length);

    if (toGenerate.length === 0) { setStep("download"); return; }

    const { fields: rawFields, photoBox, textColor } = analysis;
    const fields = dedupePhoneFields(rawFields);

    // Validate: require at least 4 non-photo fields with AI-detected positions
    const positionedCount = fields.filter(f => f.type !== "photo" && f.position && !f.autoPositioned).length;
    if (positionedCount < 4) {
      setError("Template zones not detected correctly. Please re-scan with a filled-in sample card.");
      setStep("preview");
      return;
    }

    const cards: GeneratedCard[] = [];
    const CHUNK = 20;

    const processChunk = async (start: number): Promise<void> => {
      if (abortRef.current) return;
      const slice = toGenerate.slice(start, start + CHUNK);

      const results = await Promise.all(slice.map(async ({ row, photoUrl, idx }) => {
        const values = buildCardValues(fields, row);
        const dataUrl = await renderCardToDataURL(templateImg, fields, values, photoBox, photoUrl, textColor ?? "#111111", false, true);
        return { idx, name: row.studentName || row.employeeName || `card_${idx + 1}`, dataUrl };
      }));

      cards.push(...results);
      const pct     = Math.round((cards.length / toGenerate.length) * 100);
      const elapsed = (Date.now() - genStart.current) / 1000;
      const rate    = cards.length / elapsed;
      const rem     = (toGenerate.length - cards.length) / Math.max(rate, 0.1);
      setGenPct(pct);
      setGenerated([...cards]);
      if (rem > 0 && isFinite(rem))
        setGenEta(rem < 60 ? `~${Math.ceil(rem)}s left` : `~${Math.ceil(rem / 60)}m left`);

      if (start + CHUNK < toGenerate.length) {
        await new Promise<void>(r => setTimeout(r, 0)); // yield to UI
        await processChunk(start + CHUNK);
      } else {
        setStep("download");
      }
    };

    await processChunk(0);
  }, [analysis, templateImg, matched]);

  // ── Edit record ───────────────────────────────────────────────────────────────
  const saveEdit = useCallback(() => {
    if (editIdx === null || !editRow) return;
    const updated = [...matched];
    updated[editIdx] = { ...updated[editIdx], row: editRow };
    setMatched(updated);
    setPreviewCards([]); // force re-render of preview
    setEditIdx(null); setEditRow(null);
  }, [editIdx, editRow, matched]);

  // ── Downloads ─────────────────────────────────────────────────────────────────
  const downloadZip = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip   = new JSZip();
    generated.forEach(({ name, dataUrl }, i) => {
      const b64  = dataUrl.split(",")[1];
      const safe = name.replace(/[^\w\s-]/g, "").trim() || `card_${i + 1}`;
      zip.file(`${String(i + 1).padStart(4, "0")}_${safe}.png`, b64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "id-cards.zip"; a.click();
  }, [generated]);

  const downloadPdf = useCallback(async () => {
    if (!generated.length) return;
    const { default: jsPDF } = await import("jspdf");
    const landscape = analysis?.dimensions.orientation === "landscape";
    const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm" });
    const [pw, ph] = landscape ? [297, 210] : [210, 297];
    for (let i = 0; i < generated.length; i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(generated[i].dataUrl, "PNG", 0, 0, pw, ph);
    }
    pdf.save("id-cards-bundle.pdf");
  }, [generated, analysis]);

  // ── Missing-photo Excel report ────────────────────────────────────────────────
  const downloadMissingReport = useCallback(async () => {
    if (!skippedRecords.length) return;
    const XLSX = await import("xlsx");
    const rows = skippedRecords.map(r => ({
      "Student Name":  r.row.studentName  || r.row.employeeName || "",
      "Father Name":   r.row.fatherName   || "",
      "Class":         r.row.className    || "",
      "Section":       r.row.section      || "",
      "Phone Number":  r.row.phone        || "",
      "Photo ID":      r.matchKey ?? r.row.photoName ?? r.row.studentId ?? r.row.rollNumber ?? "",
      "Reason":        !r.photoUrl ? "Photo Not Found" : "Low Confidence Match",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-fit column widths
    const cols = Object.keys(rows[0] ?? {});
    ws["!cols"] = cols.map(k => ({ wch: Math.max(k.length, ...rows.map(r => String(r[k as keyof typeof r] ?? "").length)) + 2 }));
    XLSX.utils.book_append_sheet(wb, ws, "Missing Photos");
    XLSX.writeFile(wb, "Missing_Photos_Report.xlsx");
  }, [skippedRecords]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("template"); setTemplateImg(null); setDims(null); pdfRef.current = null;
    setAnalysis(null); setAnalyzeProgress(0); setAnalyzeStage(""); setAnalyzeIdx(0);
    setExcelName(""); setExcelRows([]); setColMap(null);
    setZipName(""); setPhotoMap(new Map());
    setMatched([]); setValidation(null); setMatchRunning(false); setFieldCoverage([]);
    setPreviewCards([]); setEditIdx(null); setEditRow(null);
    setGenerated([]); setSkippedRecords([]); setGenPct(0); setGenTotal(0); setGenEta(""); abortRef.current = false;
    clearPassportCache();
    setError(null); setShowAllRecords(false);
  }, []);

  // ── Drag helpers ──────────────────────────────────────────────────────────────
  const [drag, setDrag] = useState<string | null>(null);
  const onDO  = (z: string) => (e: React.DragEvent) => { e.preventDefault(); setDrag(z); };
  const onDL  = () => setDrag(null);
  const onDrp = (z: string, fn: (f: File) => void) => (e: React.DragEvent) => {
    e.preventDefault(); setDrag(null); const f = e.dataTransfer.files[0]; if (f) fn(f);
  };

  // ── Upload zone component ─────────────────────────────────────────────────────
  const DropZone = ({
    zone, accept, onFile, icon: Icon, title, subtitle, color,
  }: {
    zone: string; accept: string; onFile: (f: File) => void;
    icon: React.ElementType; title: string; subtitle: string; color: string;
  }) => (
    <label
      onDragOver={onDO(zone)} onDragLeave={onDL} onDrop={onDrp(zone, onFile)}
      className={`min-h-44 glass-card rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
        drag === zone ? `border-${color}-500/60 bg-${color}-500/8` : `border-white/10 hover:border-${color}-500/40 hover:bg-${color}-500/5`
      }`}
    >
      <div className={`w-16 h-16 rounded-2xl bg-${color}-500/15 border border-${color}-500/25 flex items-center justify-center`}>
        <Icon className={`w-8 h-8 text-${color}-400`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/55">{title}</p>
        <p className="text-xs text-white/25 mt-1">{subtitle}</p>
      </div>
      <input type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </label>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] gap-4 overflow-hidden">

      {/* ── Step bar ── */}
      <div className="glass-card rounded-2xl border border-white/[0.07] px-4 py-3 shrink-0 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {STEPS.map((s, i) => {
            const done = isDone(s.id), active = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 transition-opacity ${!done && !active ? "opacity-25" : ""}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    done   ? "bg-emerald-500/20 border border-emerald-500/40"
                    : active ? "bg-gradient-to-br from-brand-500 to-violet-500 shadow-lg shadow-brand-500/20"
                    : "bg-white/5 border border-white/10"}`}>
                    {done ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                          : <s.icon className={`w-4 h-4 ${active ? "text-white" : "text-white/30"}`} />}
                  </div>
                  <span className={`text-[11px] font-bold hidden sm:block ${active ? "text-white" : done ? "text-emerald-400" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px mx-2 shrink-0 ${isDone(STEPS[i + 1].id) ? "bg-emerald-500/40" : "bg-white/[0.06]"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/8 px-4 py-2 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300 flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-3.5 h-3.5 text-white/30 hover:text-white" /></button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        <AnimatePresence mode="wait">

          {/* ══ 1: TEMPLATE ══ */}
          {step === "template" && (
            <motion.div key="template" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Step 1 — Upload ID Card Template</h2>
                  <p className="text-sm text-white/40 mt-1">Upload the school / corporate ID card design. Claude Vision will scan all zones next.</p>
                </div>

                {pdfLoading ? (
                  <div className="min-h-44 glass-card rounded-2xl border border-brand-500/30 flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                    <span className="text-sm text-white/40">Loading PDF…</span>
                  </div>
                ) : templateImg ? (
                  <div className="relative glass-card rounded-2xl border border-emerald-500/30 overflow-hidden bg-black/20 flex items-center justify-center p-4" style={{ minHeight: 180 }}>
                    <img src={templateImg} alt="template" className="max-h-60 max-w-full rounded-xl shadow-2xl object-contain" />
                    <button onClick={() => setTemplateImg(null)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center text-white/60 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-2.5 h-2.5" /> Ready {dims && `· ${dims.width}×${dims.height}`}
                    </div>
                  </div>
                ) : (
                  <DropZone zone="tpl" accept="image/*,.pdf,application/pdf" onFile={handleTemplate}
                    icon={Upload} title="Drop template here or click to browse" subtitle="PNG · JPG · PDF supported" color="brand" />
                )}

                {templateImg && !pdfLoading && (
                  <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    onClick={runAnalysis} className="btn-premium justify-center py-3.5 text-sm">
                    <Bot className="w-4 h-4" /> Analyse Template with AI <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              <div className="glass-card rounded-2xl border border-white/[0.07] p-5 space-y-4 h-fit">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Enterprise Bulk ID Generator</div>
                    <div className="text-[10px] text-brand-400">AI-powered · Fuzzy matching · 5 000+ cards</div>
                  </div>
                </div>
                {([
                  [ScanLine,        "AI template analysis",      "Detects logo, photo zone, text zones, QR, signature automatically"],
                  [FileSpreadsheet, "Smart Excel mapping",        "12 field types — names, IDs, class, section, designation, more"],
                  [Search,          "Fuzzy photo matching",       "Matches photos by filename, student ID, roll number, or name similarity"],
                  [Zap,             "5 000+ cards — queue engine","Chunked parallel generation so the browser never freezes"],
                ] as [React.ElementType, string, string][]).map(([Icon, t, d]) => (
                  <div key={t} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-brand-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white/80">{t}</div>
                      <div className="text-[10px] text-white/35 mt-0.5">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ 2: AI ANALYSIS ══ */}
          {step === "analysis" && (
            <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-white">Step 2 — Claude Vision Scanning Template…</h2>
                <p className="text-sm text-white/40">Detecting logo, school name, photo zone, text zones, QR and signature areas.</p>

                <div className="glass-card rounded-2xl border border-white/[0.07] flex items-center justify-center relative overflow-hidden bg-black/30" style={{ minHeight: 220 }}>
                  {templateImg && <img src={templateImg} alt="scanning" className="max-h-52 object-contain rounded-xl opacity-50" />}
                  <motion.div className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(99,102,241,0.04) 18px,rgba(99,102,241,0.04) 19px)" }}>
                    <motion.div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent"
                      animate={{ top: ["0%","100%","0%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                  </motion.div>
                  <div className="absolute inset-0 flex items-end justify-center pb-4 gap-2 flex-wrap px-4">
                    {["Logo","School Name","Photo Zone","Text Zones","QR Zone","Signature"].map((z, i) => (
                      <motion.span key={z} initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: analyzeProgress > i * 14 ? 1 : 0.2, scale: analyzeProgress > i * 14 ? 1 : 0.9 }}
                        transition={{ duration: 0.4 }}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          analyzeProgress > i * 14 ? "bg-brand-500/30 border-brand-500/50 text-brand-300" : "bg-white/5 border-white/10 text-white/20"
                        }`}>{z}</motion.span>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                      <span className="text-sm font-bold text-white">Vision OCR Running</span>
                    </div>
                    <span className="text-sm font-bold text-brand-300 font-mono">{analyzeProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                      style={{ width: `${analyzeProgress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-[11px] text-white/40">{analyzeStage || "Initialising…"}</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-white/[0.07] p-4 h-fit">
                <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-3">Analysis Pipeline</div>
                <div className="space-y-2.5">
                  {ANALYSIS_STAGES.map((stage, i) => {
                    const done = i < analyzeIdx, active = i === analyzeIdx;
                    return (
                      <div key={i} className={`flex items-center gap-3 ${!done && !active ? "opacity-20" : ""}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          done ? "bg-emerald-500/15 border border-emerald-500/25"
                          : active ? "bg-brand-500/20 border border-brand-500/30"
                          : "bg-white/5 border border-white/[0.06]"}`}>
                          {done ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                          : active ? <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
                          : <ScanLine className="w-3 h-3 text-white/15" />}
                        </div>
                        <span className={`text-[11px] ${done ? "text-white/55" : active ? "text-brand-300" : "text-white/20"}`}>{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ 3: EXCEL ══ */}
          {step === "excel" && (
            <motion.div key="excel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Step 3 — Upload Student / Employee Data</h2>
                  <p className="text-sm text-white/40 mt-1">12 columns auto-detected. The <span className="text-brand-400 font-semibold">photo_name</span> column is used for matching.</p>
                </div>

                {!excelName ? (
                  <DropZone zone="xl" accept=".xlsx,.xls,.csv" onFile={handleExcel}
                    icon={FileSpreadsheet} title="Drop Excel / CSV here" subtitle=".xlsx · .xls · .csv" color="emerald" />
                ) : (
                  <div className="glass-card rounded-2xl border border-emerald-500/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold text-white truncate">{excelName}</span>
                      </div>
                      <button onClick={() => { setExcelName(""); setExcelRows([]); setColMap(null); }} className="ml-3 shrink-0 text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-white/40">{excelRows.length} rows</span>
                      {colMap && <span className="text-emerald-400">{Object.values(colMap).filter(Boolean).length} columns mapped</span>}
                    </div>
                    {colMap && (
                      <div className="grid grid-cols-2 gap-1">
                        {(Object.entries(colMap) as [keyof ExcelRow, string | null][]).map(([field, col]) => (
                          <div key={field} className={`flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-lg ${
                            col ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5 border border-white/[0.06]"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${col ? "bg-emerald-400" : "bg-white/15"}`} />
                            <span className={col ? "text-emerald-300 font-medium" : "text-white/25"}>{field}</span>
                            {col && <span className="text-white/30 truncate ml-auto text-[8px]">{col}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {excelRows.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                        <table className="w-full text-[10px]">
                          <thead><tr className="border-b border-white/[0.05] bg-white/[0.02]">
                            {["#","Name","Class","ID / Roll","Photo file"].map(h => <th key={h} className="text-left px-3 py-1.5 text-white/30 font-semibold">{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {excelRows.slice(0, 5).map((r, i) => (
                              <tr key={i} className="border-b border-white/[0.03]">
                                <td className="px-3 py-1.5 text-white/25">{i + 1}</td>
                                <td className="px-3 py-1.5 text-white/70">{r.studentName || r.employeeName || "—"}</td>
                                <td className="px-3 py-1.5 text-white/45">{[r.className, r.section].filter(Boolean).join("-") || "—"}</td>
                                <td className="px-3 py-1.5 text-white/40 font-mono">{r.studentId || r.rollNumber || r.employeeId || "—"}</td>
                                <td className="px-3 py-1.5 text-brand-400 font-mono">{r.photoName || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {excelRows.length > 0 && (
                  <button onClick={() => setStep("photos")} className="btn-premium justify-center py-3.5 text-sm">
                    Continue to Photo Upload <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="glass-card rounded-2xl border border-white/[0.07] p-5 h-fit space-y-3">
                <div className="text-sm font-bold text-white">Supported Fields (12)</div>
                {([
                  ["student_name / employee_name",  "Name of the person",                true ],
                  ["father_name / parent_name",      "Father or parent name",             false],
                  ["class / grade / standard",       "School class or grade",             false],
                  ["section / division",             "Class section",                     false],
                  ["phone / mobile",                 "Contact number",                    false],
                  ["address",                        "Full address",                      false],
                  ["employee_id / emp_id",           "Employee or staff ID",              false],
                  ["designation / role",             "Job title or designation",          false],
                  ["roll_no / roll_number",          "Student roll number (for matching)",false],
                  ["student_id / admission_no",      "Admission or registration number",  false],
                  ["photo_name / photo / image",     "Photo filename for ZIP matching",   true ],
                ] as [string, string, boolean][]).map(([f, d, req]) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${req ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/25"}`}>
                      {req ? "key" : "opt"}
                    </span>
                    <div>
                      <div className="text-[10px] font-semibold text-white/65 font-mono">{f}</div>
                      <div className="text-[9px] text-white/30">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ 4: PHOTOS ZIP ══ */}
          {step === "photos" && (
            <motion.div key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Step 4 — Upload Photos ZIP</h2>
                  <p className="text-sm text-white/40 mt-1">Bundle all photos in a .zip. AI will match them to rows using filename, ID, or name similarity.</p>
                </div>

                {zipLoading ? (
                  <div className="min-h-44 glass-card rounded-2xl border border-violet-500/30 flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                    <span className="text-sm text-white/40">Extracting {photoMap.size > 0 ? `${Math.floor(photoMap.size / 2)} photos…` : "photos…"}</span>
                  </div>
                ) : !zipName ? (
                  <DropZone zone="zip" accept=".zip,application/zip" onFile={handleZip}
                    icon={Package} title="Drop photos ZIP here" subtitle="JPG · PNG · WEBP inside a .zip" color="violet" />
                ) : (
                  <div className="glass-card rounded-2xl border border-violet-500/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold text-white truncate">{zipName}</span>
                      </div>
                      <button onClick={() => { setZipName(""); setPhotoMap(new Map()); }} className="ml-3 shrink-0 text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-violet-300">
                        <FileImage className="w-3.5 h-3.5" />
                        <span className="font-bold">{Math.floor(photoMap.size / 2)}</span>
                        <span className="text-white/40">photos indexed</span>
                      </div>
                      <div className="text-white/30">{excelRows.length} records to match</div>
                    </div>
                  </div>
                )}

                <button onClick={() => { setMatched([]); setStep("mapping"); }}
                  disabled={!zipName || zipLoading}
                  className="btn-premium justify-center py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  <Search className="w-4 h-4" /> Run AI Matching <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="glass-card rounded-2xl border border-white/[0.07] p-5 h-fit space-y-3">
                <div className="text-sm font-bold text-white">AI Matching Strategy</div>
                {([
                  ["1. Exact filename",  "photo_name column value matched directly to ZIP filename (confidence: 100%)"],
                  ["2. ID matching",     "student_id, roll_no, employee_id used as filename lookup (confidence: 92%)"],
                  ["3. Fuzzy name",      "Student / employee name compared against photo filenames via edit distance (≥55% similarity threshold)"],
                  ["4. Validation",      "Missing photos, duplicates, low-confidence matches all flagged before generation"],
                ] as [string, string][]).map(([t, d]) => (
                  <div key={t} className="flex gap-3">
                    <span className="text-[9px] font-bold bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded h-fit mt-0.5 shrink-0">{t.split(".")[0]}</span>
                    <div>
                      <div className="text-xs font-semibold text-white/70">{t.split(". ")[1]}</div>
                      <div className="text-[10px] text-white/35 mt-0.5">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* hidden file input for "Change Photo" in manual review */}
          <input ref={changePhotoRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleChangePhoto(f); e.target.value = ""; }} />

          {/* ══ 5: AI MAPPING ══ */}
          {step === "mapping" && (
            <motion.div key="mapping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              {matchRunning ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[40vh]">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                    <Search className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">Running AI Matching…</p>
                    <p className="text-sm text-white/40 mt-1">Matching {excelRows.length} records against {Math.floor(photoMap.size / 2)} photos</p>
                  </div>
                </div>
              ) : validation && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">Step 5 — AI Matching Results</h2>
                      <p className="text-sm text-white/40 mt-0.5">Review confidence tiers. Correct low-confidence matches before generating.</p>
                    </div>
                    <button onClick={() => setStep("preview")} className="btn-premium py-2.5 px-5 text-sm">
                      Continue to Preview <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Confidence tier stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                      ["Total Records",            validation.total,        "text-white",       "bg-white/5 border-white/10"],
                      ["Auto-Accepted ≥90%",       validation.autoAccepted, "text-emerald-400", "bg-emerald-500/10 border-emerald-500/20"],
                      ["Manual Review 80–89%",     validation.manualReview, "text-amber-400",   "bg-amber-500/10 border-amber-500/20"],
                      ["Rejected / No Match <80%", validation.rejected,     "text-red-400",     "bg-red-500/10 border-red-500/20"],
                    ] as [string, number, string, string][]).map(([label, val, col, bg]) => (
                      <div key={label} className={`glass-card rounded-xl border p-3 ${bg}`}>
                        <div className={`text-2xl font-black ${col}`}>{val}</div>
                        <div className="text-[9px] text-white/40 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Detected / missing numeric ID column banners */}
                  {detectedIdCol ? (
                    <div className="flex items-center gap-2 text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full w-fit">
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Auto-detected photo ID column:{" "}
                        <span className="font-bold font-mono">&quot;{detectedIdCol.col}&quot;</span>
                        {" — "}{detectedIdCol.count}/{validation.total} rows matched via numeric photo ID
                      </span>
                    </div>
                  ) : validation.withPhoto === 0 && (
                    <div className="flex items-center gap-2 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full w-fit">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        No numeric photo ID column detected. Add a column (e.g.{" "}
                        <span className="font-mono font-bold">photo_id</span>) whose values match the numbers
                        in your photo filenames — e.g.{" "}
                        <span className="font-mono">3397</span> for{" "}
                        <span className="font-mono">IMG_3397.JPG</span>.
                      </span>
                    </div>
                  )}

                  {/* ── Field Mapping Coverage panel ── */}
                  {fieldCoverage.length > 0 && (
                    <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                          <span className="text-sm font-bold text-white">Field Mapping Coverage</span>
                          <span className="text-[10px] text-white/30">(based on first Excel row)</span>
                        </div>
                        <div className="flex gap-3 text-[10px] font-bold">
                          <span className="text-emerald-400">{fieldCoverage.filter(f => f.value).length} mapped</span>
                          {fieldCoverage.some(f => !f.value) && (
                            <span className="text-red-400">{fieldCoverage.filter(f => !f.value).length} missing</span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {fieldCoverage.map(({ label, key, value }) => (
                          <div key={key} className={`flex items-start gap-2 p-2 rounded-xl border ${
                            value
                              ? "bg-emerald-500/5 border-emerald-500/15"
                              : "bg-red-500/5 border-red-500/15"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${value ? "bg-emerald-400" : "bg-red-400"}`} />
                            <div className="min-w-0">
                              <div className="text-[10px] text-white/40 truncate">{label}</div>
                              <div className={`text-[11px] font-semibold truncate ${value ? "text-white/80" : "text-red-400/60 italic"}`}>
                                {value || "Not mapped"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {fieldCoverage.some(f => !f.value) && (
                        <div className="px-4 py-2 border-t border-white/[0.05] bg-amber-500/5">
                          <p className="text-[10px] text-amber-400">
                            ⚠️ Missing fields will be blank on generated cards. Ensure your Excel has columns
                            matching: {fieldCoverage.filter(f => !f.value).map(f => `"${f.label}"`).join(", ")}.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extra info row */}
                  <div className="flex flex-wrap gap-3">
                    {validation.extraPhotos > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full">
                        <FileImage className="w-3.5 h-3.5" />
                        <span><span className="font-bold">{validation.extraPhotos}</span> extra photos in ZIP not matched to any record</span>
                      </div>
                    )}
                    {validation.duplicates.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span><span className="font-bold">{validation.duplicates.length}</span> duplicate names: {validation.duplicates.slice(0, 3).join(", ")}{validation.duplicates.length > 3 ? "…" : ""}</span>
                      </div>
                    )}
                    {validation.missingName > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span><span className="font-bold">{validation.missingName}</span> rows missing student name</span>
                      </div>
                    )}
                  </div>

                  {/* ── Manual review section (70-89%) ── */}
                  {validation.manualReview > 0 && (
                    <div className="glass-card rounded-2xl border border-amber-500/25 overflow-hidden">
                      <div className="px-4 py-3 bg-amber-500/8 border-b border-amber-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="text-sm font-bold text-amber-300">Manual Review Required — {validation.manualReview} records</span>
                            <p className="text-[10px] text-white/35 mt-0.5">These photos matched with 80–89% confidence (fuzzy). Verify or replace each photo.</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-80 overflow-y-auto">
                        {matched.filter(r => r.photoUrl && r.confidence >= 0.80 && r.confidence < 0.90).map(rec => (
                          <div key={rec.idx} className="flex flex-col gap-1.5">
                            <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-black/20">
                              {rec.photoUrl
                                ? <img src={rec.photoUrl} alt={rec.row.studentName || rec.row.employeeName}
                                    className="w-full aspect-[3/4] object-cover" />
                                : <div className="w-full aspect-[3/4] bg-white/5 flex items-center justify-center">
                                    <FileImage className="w-6 h-6 text-white/20" />
                                  </div>}
                              {/* Confidence badge */}
                              <div className="absolute top-1.5 left-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                                {Math.round(rec.confidence * 100)}%
                              </div>
                            </div>
                            <p className="text-[9px] text-white/60 truncate font-medium text-center">
                              {rec.row.studentName || rec.row.employeeName || `Row ${rec.idx + 1}`}
                            </p>
                            <p className="text-[8px] text-amber-400/70 text-center truncate">← {rec.matchKey}</p>
                            <button
                              onClick={() => { setChangingIdx(rec.idx); changePhotoRef.current?.click(); }}
                              className="text-[9px] font-bold text-white/50 hover:text-brand-400 border border-white/10 hover:border-brand-500/40 rounded-lg py-1 transition-all">
                              Change Photo
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Extra/unused photos ── */}
                  {validation.unusedPhotoKeys.length > 0 && (
                    <div className="glass-card rounded-2xl border border-violet-500/20 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-violet-500/15 flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-sm font-bold text-violet-300">Extra Photos ({validation.unusedPhotoKeys.length}) — not matched to any record</span>
                      </div>
                      <div className="p-3 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {validation.unusedPhotoKeys.slice(0, 30).map(key => (
                          <div key={key} className="flex items-center gap-1 text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-mono">
                            {key}
                          </div>
                        ))}
                        {validation.unusedPhotoKeys.length > 30 && (
                          <span className="text-[9px] text-white/30 self-center">+{validation.unusedPhotoKeys.length - 30} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Records table */}
                  <div className="glass-card rounded-2xl border border-white/[0.07] overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/[0.05] flex items-center justify-between">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                        All Match Results ({showAllRecords ? matched.length : Math.min(matched.length, 20)} shown)
                      </span>
                      {matched.length > 20 && (
                        <button onClick={() => setShowAllRecords(v => !v)} className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300">
                          {showAllRecords ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {matched.length}</>}
                        </button>
                      )}
                    </div>
                    <div className="overflow-auto max-h-72">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-[#0d1117] z-10">
                          <tr className="border-b border-white/[0.05]">
                            {["#","Name","Class","Match Key","Method","Confidence","Tier"].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-white/30 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllRecords ? matched : matched.slice(0, 20)).map(({ row, photoUrl, confidence, matchKey, matchMethod, idx }) => (
                            <tr key={idx} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${
                              !photoUrl || confidence < 0.80 ? "bg-red-500/5" : confidence < 0.90 ? "bg-amber-500/5" : ""}`}>
                              <td className="px-3 py-1.5 text-white/25">{idx + 1}</td>
                              <td className="px-3 py-1.5 text-white/75 font-medium">{row.studentName || row.employeeName || "—"}</td>
                              <td className="px-3 py-1.5 text-white/45">{[row.className, row.section].filter(Boolean).join("-") || "—"}</td>
                              <td className="px-3 py-1.5 font-mono text-[10px] text-white/40">{matchKey || "—"}</td>
                              <td className="px-3 py-1.5">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  matchMethod === "exact" ? "bg-emerald-500/20 text-emerald-400"
                                  : matchMethod === "id"  ? "bg-blue-500/20 text-blue-400"
                                  : matchMethod === "fuzzy"? "bg-amber-500/20 text-amber-400"
                                  : "bg-white/5 text-white/25"}`}>{matchMethod}</span>
                              </td>
                              <td className={`px-3 py-1.5 font-bold ${CONF_COLOR(confidence)}`}>
                                {confidence > 0 ? `${Math.round(confidence * 100)}%` : "—"}
                              </td>
                              <td className="px-3 py-1.5">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  !photoUrl || confidence < 0.80 ? "bg-red-500/20 text-red-400"
                                  : confidence < 0.90 ? "bg-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/20 text-emerald-400"}`}>
                                  {!photoUrl || confidence < 0.80 ? "Rejected" : confidence < 0.90 ? "Review" : "Auto ✓"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ══ 6: PREVIEW ══ */}
          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Step 6 — Preview & Correct</h2>
                  <p className="text-sm text-white/40 mt-0.5">First 10 cards rendered. Edit any record, then generate all {matched.length}.</p>
                </div>
                <button onClick={runGeneration} className="btn-premium py-2.5 px-5 text-sm">
                  <Zap className="w-4 h-4" /> Generate All {matched.length} Cards
                </button>
              </div>

              {previewLoading ? (
                <div className="glass-card rounded-2xl border border-white/[0.07] flex items-center justify-center gap-4 py-16">
                  <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-white">Rendering preview cards…</p>
                    <p className="text-xs text-white/35 mt-0.5">Generating first 10 cards with AI layout</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {previewCards.map((dataUrl, i) => {
                    const rec = matched[i];
                    return (
                      <div key={i} className="flex flex-col gap-1.5 group">
                        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg">
                          <img src={dataUrl} alt={`card ${i + 1}`} className="w-full object-contain" />
                          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                            <button
                              onClick={() => { setEditIdx(i); setEditRow({ ...rec.row }); }}
                              className="flex items-center gap-1.5 text-white text-[10px] font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors w-[90px] justify-center">
                              <Edit3 className="w-3 h-3" /> Edit Data
                            </button>
                            <button
                              onClick={() => {
                                if (rec.photoUrl) {
                                  setPhotoEditSrc(rec.photoUrl);
                                  setPhotoEditIdx(rec.idx);
                                } else {
                                  setChangingIdx(rec.idx);
                                  changePhotoRef.current?.click();
                                }
                              }}
                              className="flex items-center gap-1.5 text-white text-[10px] font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors w-[90px] justify-center">
                              <Camera className="w-3 h-3" /> Edit Photo
                            </button>
                          </div>
                          {!rec.photoUrl && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                              <AlertCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-white/40 truncate text-center">
                          {rec.row.studentName || rec.row.employeeName || `Card ${i + 1}`}
                        </p>
                        {rec.photoUrl && rec.confidence < 0.75 && (
                          <p className="text-[8px] text-amber-400 text-center">Fuzzy {Math.round(rec.confidence * 100)}%</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Edit modal */}
              {editIdx !== null && editRow && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-2xl border border-white/[0.1] p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">Edit Record #{editIdx + 1}</h3>
                      <button onClick={() => { setEditIdx(null); setEditRow(null); }} className="text-white/30 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ["studentName",  "Student Name"],
                        ["fatherName",   "Father Name"],
                        ["className",    "Class"],
                        ["section",      "Section"],
                        ["phone",        "Phone"],
                        ["address",      "Address"],
                        ["employeeName", "Employee Name"],
                        ["employeeId",   "Employee ID"],
                        ["designation",  "Designation"],
                        ["photoName",    "Photo Filename"],
                      ] as [Exclude<keyof ExcelRow, "_raw">, string][]).map(([key, label]) => (
                        <div key={key} className={key === "address" ? "col-span-2" : ""}>
                          <label className="text-[10px] text-white/40 block mb-1">{label}</label>
                          <input
                            value={editRow[key]}
                            onChange={e => setEditRow(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                            className="w-full text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 outline-none focus:border-brand-500/50 transition-colors placeholder:text-white/20"
                            placeholder={label}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={saveEdit} className="btn-premium flex-1 justify-center py-2.5 text-sm">
                        <CheckCircle className="w-4 h-4" /> Save Changes
                      </button>
                      <button onClick={() => { setEditIdx(null); setEditRow(null); }}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/50 text-sm font-bold hover:text-white hover:border-white/20 transition-all">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ 7: GENERATE ══ */}
          {step === "generate" && (
            <motion.div key="generate" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="flex flex-col items-center justify-center gap-6 min-h-[55vh]">
              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-brand-500/30">
                <Zap className="w-12 h-12 text-white" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-white">Generating ID Cards…</h2>
                <p className="text-white/40 mt-2 text-sm">{generated.length} of {genTotal} matched cards · {genEta}</p>
              </div>
              <div className="w-full max-w-lg space-y-2">
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                    style={{ width: `${genPct}%` }} transition={{ duration: 0.3 }} />
                </div>
                <div className="flex justify-between text-xs text-white/30">
                  <span>{genPct}% complete</span>
                  <span>Chunk size 20 · parallel</span>
                </div>
              </div>
              {generated.length > 0 && (
                <p className="text-[11px] text-white/25 italic">Last: {generated[generated.length - 1]?.name}</p>
              )}
            </motion.div>
          )}

          {/* ══ 8: DOWNLOAD ══ */}
          {step === "download" && (
            <motion.div key="download" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{generated.length} ID Cards Generated!</h2>
                  <p className="text-white/40 text-sm mt-0.5">
                    {skippedRecords.length > 0
                      ? `${skippedRecords.length} records skipped — no matching photo found.`
                      : "All matched records generated successfully."}
                  </p>
                </div>
              </div>

              {/* Generation summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  ["Total Records",    matched.length,          "text-white",        "bg-white/5 border-white/10"],
                  ["Generated Cards",  generated.length,        "text-emerald-400",  "bg-emerald-500/10 border-emerald-500/20"],
                  ["Missing Photos",   skippedRecords.length,   skippedRecords.length > 0 ? "text-amber-400" : "text-white/30",
                                                                skippedRecords.length > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/10"],
                  ["Match Rate",       matched.length > 0 ? Math.round((generated.length / matched.length) * 100) : 0,
                                       "text-brand-400",        "bg-brand-500/10 border-brand-500/20"],
                ] as [string, number, string, string][]).map(([label, val, col, bg]) => (
                  <div key={label} className={`glass-card rounded-xl border p-3 ${bg}`}>
                    <div className={`text-2xl font-black ${col}`}>
                      {label === "Match Rate" ? `${val}%` : val}
                    </div>
                    <div className="text-[9px] text-white/40 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Download buttons — 3 columns when missing report available */}
              <div className={`grid gap-4 ${skippedRecords.length > 0 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                <button onClick={downloadZip}
                  className="glass-card rounded-2xl border border-brand-500/30 bg-brand-500/8 p-6 flex flex-col items-center gap-3 hover:bg-brand-500/18 transition-all group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-brand-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">Download ZIP</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{generated.length} PNG files · numbered</div>
                  </div>
                  <span className="text-[10px] text-brand-400 font-semibold font-mono">Generated_ID_Cards.zip</span>
                </button>

                <button onClick={downloadPdf}
                  className="glass-card rounded-2xl border border-violet-500/30 bg-violet-500/8 p-6 flex flex-col items-center gap-3 hover:bg-violet-500/18 transition-all group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">Download PDF Bundle</div>
                    <div className="text-[11px] text-white/40 mt-0.5">All {generated.length} cards — one PDF</div>
                  </div>
                  <span className="text-[10px] text-violet-400 font-semibold font-mono">id-cards-bundle.pdf</span>
                </button>

                {skippedRecords.length > 0 && (
                  <button onClick={downloadMissingReport}
                    className="glass-card rounded-2xl border border-amber-500/30 bg-amber-500/8 p-6 flex flex-col items-center gap-3 hover:bg-amber-500/18 transition-all group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">Missing Photos Report</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{skippedRecords.length} records — no photo found</div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold font-mono">Missing_Photos_Report.xlsx</span>
                  </button>
                )}
              </div>

              {/* Missing records preview table */}
              {skippedRecords.length > 0 && (
                <div className="glass-card rounded-2xl border border-amber-500/20 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-amber-500/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm font-bold text-amber-300">
                        {skippedRecords.length} Records Skipped — Photo Not Matched
                      </span>
                    </div>
                    <button
                      onClick={() => { setMatched([]); setStep("mapping"); }}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-brand-400 hover:text-brand-300 border border-brand-500/30 hover:border-brand-500/50 px-3 py-1 rounded-lg transition-all">
                      <RefreshCw className="w-3 h-3" /> Fix &amp; Regenerate
                    </button>
                  </div>
                  <div className="overflow-auto max-h-52">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-[#0d1117] z-10">
                        <tr className="border-b border-white/[0.05]">
                          {["#", "Name", "Class", "Photo ID", "Reason"].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-white/30 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {skippedRecords.slice(0, 30).map(({ row, matchKey, photoUrl, confidence, idx }) => (
                          <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="px-3 py-1.5 text-white/25">{idx + 1}</td>
                            <td className="px-3 py-1.5 text-white/70 font-medium">{row.studentName || row.employeeName || "—"}</td>
                            <td className="px-3 py-1.5 text-white/45">{[row.className, row.section].filter(Boolean).join("-") || "—"}</td>
                            <td className="px-3 py-1.5 font-mono text-[10px] text-white/40">{matchKey ?? row.photoName ?? row.studentId ?? "—"}</td>
                            <td className="px-3 py-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                !photoUrl ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                                {!photoUrl ? "Photo Not Found" : `Low Confidence (${Math.round(confidence * 100)}%)`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {skippedRecords.length > 30 && (
                      <p className="text-[10px] text-white/25 text-center py-2">
                        +{skippedRecords.length - 30} more in the Excel report
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Generated cards grid preview */}
              {generated.length > 0 && (
                <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-3">
                    Generated Cards — first {Math.min(generated.length, 12)} of {generated.length}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {generated.slice(0, 12).map(({ dataUrl, name, idx }) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <img src={dataUrl} alt={name} className="w-full rounded-lg shadow-md border border-white/10 object-contain" />
                        <p className="text-[8px] text-white/25 truncate text-center">{name}</p>
                      </div>
                    ))}
                    {generated.length > 12 && (
                      <div className="flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] aspect-video">
                        <span className="text-xs text-white/25">+{generated.length - 12}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button onClick={reset} className="flex items-center gap-2 text-sm text-white/30 hover:text-brand-400 transition-colors self-start">
                <RefreshCw className="w-4 h-4" /> Start over with a new template
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Photo editor modal */}
      <AnimatePresence>
        {photoEditSrc && (
          <PhotoEditor
            src={photoEditSrc}
            onApply={handlePhotoEditApply}
            onClose={() => { setPhotoEditSrc(null); setPhotoEditIdx(null); }}
            accent={{ from: "#6366f1", to: "#7c3aed" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
