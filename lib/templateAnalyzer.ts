/**
 * Template Analyzer — types, dimension detection, and the main analysis function.
 *
 * With ANTHROPIC_API_KEY → real Claude Vision (positions, colors, exact fields).
 * Without key            → manual mode: empty field list, user types what they see.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardCategory =
  | "school" | "college" | "employee" | "hospital"
  | "membership" | "event" | "other";

/** Where a field's VALUE text should be rendered on the card (0-1 fractions). */
export interface FieldPosition {
  vx: number;    // left edge of the value text area  (0-1, left → right)
  vy: number;    // vertical CENTER of the value text (0-1, top  → bottom)
  vw: number;    // value area width  as fraction of card width  (also used for erase zone)
  vh: number;    // value area height as fraction of card height (also used for erase zone)
  fs: number;    // font size in pixels at reference resolution
  bold: boolean;
  color: string; // CSS hex colour for value text
  /** Text alignment within the [vx … vx+vw] area — default "left" */
  align: "left" | "center" | "right";
}

export interface BoundingBox {
  x: number; y: number;   // top-left corner (0-1)
  w: number; h: number;   // size (0-1)
}

export interface DetectedField {
  id: string;
  label: string;          // exactly as printed on the card
  key: string;            // camelCase version
  confidence: number;     // 0-100
  type: "text" | "date" | "phone" | "email" | "photo";
  zone: "top" | "middle" | "bottom";
  enabled: boolean;
  required: boolean;
  source: "ai" | "manual";
  position?: FieldPosition;  // present when detected by Claude Vision
  /** True when position was calculated by autoPositionTextFields, NOT detected by AI.
   *  TemplateCanvas uses this to skip the erase step for these fields (preserving
   *  template design elements like coloured boxes, decorative frames, etc.). */
  autoPositioned?: boolean;
}

export interface CardDimensions {
  width: number;
  height: number;
  aspectRatio: number;             // width / height
  orientation: "portrait" | "landscape";
}

export interface TemplateZone {
  type: "logo" | "photo" | "qr" | "signature" | "barcode";
  confidence: number;
  position: string;
  box?: BoundingBox;
}

export interface TemplateAnalysis {
  analysisId: string;
  mode: "ai" | "manual";
  category: CardCategory;
  categoryLabel: string;
  confidence: number;
  detectedOrgName: string;
  cardTitle: string;
  ocrLines: string[];
  matchedKeywords: string[];
  fields: DetectedField[];

  // Spatial layout
  photoBox?: BoundingBox;
  qrBox?: BoundingBox;
  logoBox?: BoundingBox;
  zones: TemplateZone[];       // derived from photo/qr/logo boxes
  /** Non-photo fields for which Claude returned no coordinates — require manual placement */
  missingCoordinateFields?: string[];

  // Design
  bgColor: string;
  accentColor: string;
  textColor: string;
  labelColor: string;
  dominantColors: string[];
  fontStyles: string[];

  dimensions: CardDimensions;
}

// ─── Default text fields per card category ───────────────────────────────────
// Injected when Claude Vision returns < 2 text fields (e.g. only detects photo).

// Mandatory student fields — injected whenever AI detects < 3 text fields.
// Order matches the UI spec: name → father → class → section → phone → address.
const STUDENT_DEFAULTS: { key: string; label: string; type: DetectedField["type"] }[] = [
  { key: "studentName", label: "Student Name",  type: "text"  },
  { key: "fatherName",  label: "Father Name",   type: "text"  },
  { key: "class",       label: "Class",         type: "text"  },
  { key: "section",     label: "Section",       type: "text"  },
  { key: "phone",       label: "Phone Number",  type: "phone" },
  { key: "address",     label: "Address",       type: "text"  },
];

const DEFAULT_CARD_FIELDS: Record<CardCategory, { key: string; label: string; type: DetectedField["type"] }[]> = {
  school:     STUDENT_DEFAULTS,
  college:    STUDENT_DEFAULTS,     // junior college cards use Class, not Course
  employee:   [
    { key: "employeeName", label: "Employee Name", type: "text" },
    { key: "designation",  label: "Designation",   type: "text" },
    { key: "department",   label: "Department",    type: "text" },
  ],
  hospital:   [
    { key: "staffName",   label: "Staff Name",   type: "text" },
    { key: "designation", label: "Designation",  type: "text" },
    { key: "department",  label: "Department",   type: "text" },
  ],
  membership: [
    { key: "memberName", label: "Member Name", type: "text" },
    { key: "memberId",   label: "Member ID",   type: "text" },
  ],
  event:      [
    { key: "attendeeName", label: "Name",       type: "text" },
    { key: "ticketId",     label: "Ticket ID",  type: "text" },
  ],
  // "other" tries to guess from org name; falls back to student defaults
  other:      STUDENT_DEFAULTS,
};

// ─── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_META: Record<CardCategory, { label: string; color: string }> = {
  school:     { label: "School ID Card",       color: "#6366f1" },
  college:    { label: "College ID Card",      color: "#10b981" },
  employee:   { label: "Employee ID Card",     color: "#8b5cf6" },
  hospital:   { label: "Hospital Staff Card",  color: "#ef4444" },
  membership: { label: "Membership Card",      color: "#f59e0b" },
  event:      { label: "Event Pass",           color: "#ec4899" },
  other:      { label: "Identity Card",        color: "#64748b" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+(.)/g, (_, c: string) => c.toUpperCase());
}

function inferZone(vy: number | undefined, index: number, total: number): DetectedField["zone"] {
  if (vy !== undefined) {
    if (vy < 0.35) return "top";
    if (vy > 0.70) return "bottom";
    return "middle";
  }
  if (index < 2) return "top";
  if (index >= total - 3) return "bottom";
  return "middle";
}

// ─── Auto-position helper ─────────────────────────────────────────────────────
// Assigns smart FieldPositions to text fields that have no coordinates yet.
// Uses the photoBox (if any) to determine where the text area starts.

// "section" is displayed merged into the class line in TemplateCanvas.
// It should appear in the form but must NOT occupy its own canvas zone.
const AUTO_POSITION_SKIP = new Set(["section"]);

function autoPositionTextFields(
  fields: DetectedField[],
  photoBox: BoundingBox | undefined,
  dims: CardDimensions,
  textColor: string,
): void {
  // Skip "section" — rendered combined with class ("Class: 8 – B"), not standalone
  const unpositioned = fields.filter(
    f => f.type !== "photo" && !f.position && !AUTO_POSITION_SKIP.has(f.key)
  );
  if (unpositioned.length === 0) return;

  const isPortrait = dims.orientation === "portrait";

  // ── Determine layout mode ────────────────────────────────────────────────────
  // If photo occupies the left/centre column in landscape, text goes to the right.
  // Otherwise (portrait or centred photo), text goes below the photo.
  const photoOnLeft =
    !isPortrait && photoBox !== undefined && photoBox.x < 0.45 && photoBox.w < 0.55;

  let startY: number;
  let fieldVx: number;
  let fieldVw: number;

  if (photoOnLeft) {
    // Landscape: photo on left half → text fills right half
    const rightEdge = (photoBox!.x + photoBox!.w) + 0.03;
    fieldVx = rightEdge;
    fieldVw = Math.max(0.10, 0.96 - rightEdge);
    startY  = 0.20;
  } else {
    // Portrait or centred: text goes below photo.
    // Use the FILL bottom (72 % of zone height) so text starts right after
    // where the photo VISUALLY ends, not at the bottom of the full detected zone.
    // This prevents a large gap when the zone is taller than the photo fill.
    // Use the ZONE bottom so text starts in the template's data section.
    // photoBox.h is capped at 0.40 server-side, so zone bottom ≤ photoBox.y + 0.41.
    const zoneBottom = photoBox
      ? photoBox.y + photoBox.h + 0.015  // 1.5 % gap below photo zone
      : (isPortrait ? 0.54 : 0.45);
    startY  = zoneBottom;
    // Ceiling: ensure data never starts below 58 % — keeps it in the visible data band
    startY  = Math.min(startY, isPortrait ? 0.58 : 0.50);
    fieldVx = 0.03;
    fieldVw = 0.94;
  }

  const bottomBound = isPortrait ? 0.70 : 0.93;
  const available   = Math.max(0.08, bottomBound - startY);
  const rowH        = Math.min(available / unpositioned.length, 0.10);

  unpositioned.forEach((field, i) => {
    const isName    = field.key === "studentName" || field.key === "employeeName" || /name/i.test(field.label);
    const isClass   = field.key === "class";
    const isAddress = /address/i.test(field.key) || /address/i.test(field.label);
    const vy        = startY + i * rowH + rowH / 2;
    field.position = {
      vx:    fieldVx,
      vy:    Math.min(vy, bottomBound - rowH / 2),
      vw:    fieldVw,
      vh:    isAddress ? rowH * 0.90 : rowH * 0.68,
      fs:    isName ? 20 : isClass ? 13 : 12,  // name=20 bold centered, class=13, others=12
      bold:  isName,
      color: textColor || "#1a1a2e",
      align: "center",
    };
    field.autoPositioned = true;
  });
}

// ─── Client-side image utilities ──────────────────────────────────────────────

/** Detect pixel dimensions from a data URL using the browser Image API. */
export function detectImageDimensions(dataUrl: string): Promise<CardDimensions> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      resolve({
        width: w,
        height: h,
        aspectRatio: w / h,
        orientation: h > w ? "portrait" : "landscape",
      });
    };
    img.onerror = () =>
      resolve({ width: 856, height: 540, aspectRatio: 856 / 540, orientation: "landscape" });
    img.src = dataUrl;
  });
}

/** Resize image for the API call — keeps payload small while preserving quality. */
export function resizeForAPI(dataUrl: string, maxPx = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxPx / img.naturalWidth, maxPx / img.naturalHeight, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.90));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Analysis pipeline stages (for the UI animation) ─────────────────────────

export const ANALYSIS_STAGES = [
  { key: "load",       label: "Loading image into analysis pipeline…"        },
  { key: "dims",       label: "Detecting card dimensions and orientation…"   },
  { key: "resize",     label: "Optimising image for Vision engine…"          },
  { key: "vision",     label: "Running Claude Vision OCR on card…"          },
  { key: "labels",     label: "Extracting field labels from OCR output…"    },
  { key: "positions",  label: "Mapping field value positions on card…"       },
  { key: "zones",      label: "Locating photo, logo, and QR regions…"      },
  { key: "colors",     label: "Sampling background and accent colours…"      },
  { key: "classify",   label: "Classifying card type…"                       },
  { key: "confidence", label: "Computing per-field confidence scores…"       },
  { key: "final",      label: "Building strict reusable template…"           },
];

// ─── Main analysis function ───────────────────────────────────────────────────

export async function analyzeCardImage(
  imageDataUrl: string,
  dimensions: CardDimensions,
  onStage: (label: string, key: string, pct: number) => void,
): Promise<TemplateAnalysis> {

  // Play the stage animation while the API round-trip happens
  const animPromise = (async () => {
    for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
      await new Promise(r => setTimeout(r, 120));
      onStage(
        ANALYSIS_STAGES[i].label,
        ANALYSIS_STAGES[i].key,
        Math.round(((i + 1) / ANALYSIS_STAGES.length) * 100),
      );
    }
  })();

  // Resize before sending to API — 800px is sufficient for label extraction
  const resized = await resizeForAPI(imageDataUrl, 800);

  // Call the server-side route
  let apiResult: Record<string, unknown> = { mode: "manual" };
  try {
    const res = await fetch("/api/analyze-card", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageDataUrl: resized }),
    });
    if (res.ok) apiResult = await res.json();
  } catch { /* network error → manual */ }

  await animPromise;

  const mode = (apiResult.mode as "ai" | "manual") ?? "manual";

  // ── Build from Claude Vision response ────────────────────────────────────────
  if (mode === "ai") {
    type RawField = {
      label: string;
      type: DetectedField["type"];
      vx?: number; vy?: number; vw?: number; vh?: number; fs?: number; bold?: boolean; color?: string;
      align?: "left" | "center" | "right";
      /** Set by the API route when vx/vy/vw/vh are absent — forces manual placement */
      hasMissingCoords?: boolean;
      /** Set by the API route when student-name vy < 0.74 (likely the label row) */
      hasSuspiciousCoords?: boolean;
    };

    const rawFields  = (apiResult.fields as RawField[] | undefined) ?? [];
    const category   = (apiResult.cardType as CardCategory) ?? "other";
    const orgName    = (apiResult.orgName   as string) ?? "";
    const cardTitle  = (apiResult.cardTitle as string) ?? "";
    const confidence = (apiResult.confidence as number) ?? 80;
    const keywords   = (apiResult.matchedKeywords as string[]) ?? [];

    // Override orientation from Claude if dimensions were auto-detected
    const claudeOrientation = apiResult.orientation as string;
    const finalDims: CardDimensions = {
      ...dimensions,
      orientation: (claudeOrientation === "portrait" || claudeOrientation === "landscape")
        ? claudeOrientation
        : dimensions.orientation,
    };

    // Bounding boxes
    const photoBox = apiResult.photoBox as BoundingBox | null | undefined;
    const qrBox    = apiResult.qrBox    as BoundingBox | null | undefined;
    const logoBox  = apiResult.logoBox  as BoundingBox | null | undefined;

    // Colors
    const bgColor     = (apiResult.bgColor     as string) ?? "#ffffff";
    const accentColor = (apiResult.accentColor as string) ?? "#2d4a9a";
    const textColor   = (apiResult.textColor   as string) ?? "#1a1a2e";
    const labelColor  = (apiResult.labelColor  as string) ?? "#555555";

    const fields: DetectedField[] = rawFields.map((f, i) => ({
      id:         `field_${i}_${labelToKey(f.label)}`,
      label:      f.label.trim(),
      key:        labelToKey(f.label),
      confidence: 95,
      type:       f.type ?? "text",
      zone:       inferZone(f.vy, i, rawFields.length),
      enabled:    true,
      required:   i < 3,
      source:     "ai" as const,
      // Missing coords (API couldn't extract) or suspicious student-name vy both
      // result in position=undefined, which triggers needsManualMapping in fieldToZone().
      position:   (f.hasMissingCoords || f.hasSuspiciousCoords || f.vx === undefined || f.vy === undefined)
        ? undefined
        : { vx: f.vx, vy: f.vy, vw: f.vw ?? 0.6, vh: f.vh ?? 0.06, fs: f.fs ?? 12, bold: f.bold ?? false, color: f.color ?? textColor, align: f.align ?? "left" },
    }));

    // ── Inject default text fields when AI returned < 3 text fields ─────────────
    // Covers: blank templates with no readable labels, purely-graphical designs,
    // and cards where Claude only detected the phone/address but not name/class.
    const detectedTextCount = fields.filter(f => f.type !== "photo").length;
    if (detectedTextCount < 6) {
      // For category "other", infer from org name (e.g. "Junior College" → student defaults)
      let effectiveCategory: CardCategory = category;
      if (category === "other" || category === "membership" || category === "event") {
        const orgLower = orgName.toLowerCase();
        if (/school|college|junior|primary|high school|vidyalaya|vidya/.test(orgLower)) {
          effectiveCategory = "school";
        } else if (/hospital|clinic|medical|health/.test(orgLower)) {
          effectiveCategory = "hospital";
        } else if (/company|corp|ltd|pvt|enterprise|solutions/.test(orgLower)) {
          effectiveCategory = "employee";
        }
      }

      const defaults     = DEFAULT_CARD_FIELDS[effectiveCategory];
      const existingKeys = new Set(fields.map(f => f.key));
      let defIdx = 0;
      for (const d of defaults) {
        if (!existingKeys.has(d.key)) {
          fields.push({
            id:         `default_${d.key}`,
            label:      d.label,
            key:        d.key,
            confidence: 80,
            type:       d.type,
            zone:       "bottom",
            enabled:    true,
            required:   defIdx === 0,
            source:     "ai",
            position:   undefined,
          });
          defIdx++;
        }
      }
    }

    // ── Auto-position text fields that still have no coordinates ──────────────
    autoPositionTextFields(fields, photoBox ?? undefined, finalDims, textColor);

    const ocrLines = [orgName, cardTitle, ...rawFields.map(f => `${f.label} :`)].filter(Boolean);

    // Only count fields that are STILL unpositioned after auto-position
    const missingCoordinateFields = fields
      .filter(f => !f.position && f.type !== "photo")
      .map(f => f.label);

    // Build zones from detected bounding boxes
    const zones: TemplateZone[] = [];
    if (logoBox) zones.push({ type: "logo",  confidence: 92, position: "top-left",    box: logoBox });
    if (photoBox) zones.push({ type: "photo", confidence: 95, position: "top-right",   box: photoBox });
    if (qrBox)   zones.push({ type: "qr",    confidence: 90, position: "bottom-right", box: qrBox });

    return {
      analysisId: `TMPL-${Date.now().toString(36).toUpperCase()}`,
      mode: "ai",
      category,
      categoryLabel: CATEGORY_META[category]?.label ?? "Identity Card",
      confidence,
      detectedOrgName: orgName,
      cardTitle,
      ocrLines,
      matchedKeywords: keywords,
      fields,
      missingCoordinateFields: missingCoordinateFields.length ? missingCoordinateFields : undefined,
      photoBox:  photoBox  ?? undefined,
      qrBox:     qrBox     ?? undefined,
      logoBox:   logoBox   ?? undefined,
      zones,
      bgColor, accentColor, textColor, labelColor,
      dominantColors: [bgColor, accentColor, textColor],
      fontStyles: ["Inter — field labels", "Inter Bold — name / title"],
      dimensions: finalDims,
    };
  }

  // ── Manual mode fallback ──────────────────────────────────────────────────────
  return {
    analysisId: `TMPL-${Date.now().toString(36).toUpperCase()}`,
    mode: "manual",
    category: "other",
    categoryLabel: "Identity Card",
    confidence: 0,
    detectedOrgName: "",
    cardTitle: "",
    ocrLines: [],
    matchedKeywords: [],
    fields: [],
    zones: [],
    bgColor: "#ffffff", accentColor: "#2d4a9a", textColor: "#1a1a2e", labelColor: "#555555",
    dominantColors: ["#ffffff", "#2d4a9a", "#1a1a2e"],
    fontStyles: [],
    dimensions,
  };
}

// ─── Utility: create a manually-added field ───────────────────────────────────

export function makeNewField(label: string): DetectedField {
  return {
    id:         `manual_${Date.now()}`,
    label:      label.trim(),
    key:        labelToKey(label),
    confidence: 100,
    type:       "text",
    zone:       "middle",
    enabled:    true,
    required:   false,
    source:     "manual",
  };
}

// Backward-compat alias used by manual-builder
export const analyzeTemplate = analyzeCardImage;
