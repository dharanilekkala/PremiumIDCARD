/**
 * Template Storage — client-side persistence for reusable card templates.
 *
 * A "template" is NOT a finished student ID card.
 * It is a reference image + zone map (photo box, text field positions).
 * Templates are saved once and reused to generate many cards.
 */

export type ZoneFieldType = "photo" | "text" | "date" | "phone" | "email";

export interface TemplateZoneDef {
  id: string;
  label: string;
  key: string;
  type: ZoneFieldType;
  /** Bounding box in 0-1 fractions of the card dimensions (top-left origin) */
  box: { x: number; y: number; w: number; h: number };
  fontSize: number;
  fontBold: boolean;
  color: string;
  /** Text alignment within the zone — default "left" */
  align: "left" | "center" | "right";
  /**
   * True when this zone was created from a field with NO Claude-detected coordinates.
   * The box is a placeholder — the user must manually draw the correct zone.
   * TemplateCanvas skips rendering for zones still flagged needsManualMapping.
   */
  needsManualMapping?: boolean;
}

/** Validate all zones in a template before saving.
 *  Returns { valid, missing } where missing = zone labels that still need manual positioning. */
export function validateTemplate(zones: TemplateZoneDef[]): { valid: boolean; missing: string[] } {
  const missing = zones
    .filter(z => z.type !== "photo" && z.needsManualMapping === true)
    .map(z => z.label);
  return { valid: missing.length === 0, missing };
}

/**
 * Bump this string whenever the Claude Vision prompt is changed.
 * Saved templates that don't carry this version were built with the old prompt
 * and may have inaccurate coordinates — they show a "Re-Analyze" warning.
 */
export const ANALYZER_VERSION = "2025-06-v3";

/**
 * Bump this string whenever the coordinate extraction logic or validation rules
 * change (independent of the prompt). Templates with an older coordinateVersion
 * should be re-analyzed to benefit from improved accuracy.
 */
export const COORDINATE_VERSION = "2025-06-v1";

export interface SavedTemplate {
  id: string;
  name: string;
  orgName: string;
  category: string;
  /** Compressed thumbnail data URL for list view */
  thumbnail: string;
  /** Full-resolution reference image data URL */
  referenceImage: string;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
    orientation: "portrait" | "landscape";
  };
  zones: TemplateZoneDef[];
  /** Explicit photo bounding box (top-left origin, 0-1 fractions) */
  photoBox?: { x: number; y: number; w: number; h: number };
  bgColor: string;
  textColor: string;
  createdAt: string;
  /** ISO timestamp of last coordinate update (via re-analysis) */
  updatedAt?: string;
  /** Prompt version used when coordinates were extracted — compare against ANALYZER_VERSION */
  analyzerVersion?: string;
  /** Coordinate extraction logic version — compare against COORDINATE_VERSION */
  coordinateVersion?: string;
}

const STORAGE_KEY = "idforge_templates_v1";

function load(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

export const templateStorage = {
  list():                    SavedTemplate[]       { return load(); },
  get(id: string):           SavedTemplate | null  { return load().find(t => t.id === id) ?? null; },
  save(t: SavedTemplate):    void {
    // Hard guard — never persist a template with fields that still need manual positioning.
    // The template-builder UI already blocks the button, but this catches any code path
    // that bypasses the UI (e.g. programmatic saves or future API integrations).
    const { valid, missing } = validateTemplate(t.zones);
    if (!valid) {
      throw new Error(
        `Template contains fields with missing coordinates. Re-analysis required. Missing: ${missing.join(", ")}`
      );
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([t, ...load().filter(x => x.id !== t.id)]));
  },
  delete(id: string):        void                  { localStorage.setItem(STORAGE_KEY, JSON.stringify(load().filter(t => t.id !== id))); },
};

// ─── Convert a SavedTemplate back into TemplateAnalysis fields ────────────────
// Used when loading a template into the generation (fill) step.
import type { DetectedField, TemplateAnalysis, BoundingBox, CardDimensions } from "./templateAnalyzer";

function labelToKey(label: string): string {
  return label.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "").trim()
    .replace(/\s+(.)/g, (_, c: string) => c.toUpperCase());
}

export function templateToAnalysis(t: SavedTemplate): TemplateAnalysis {
  const fields: DetectedField[] = t.zones.map((z, i) => ({
    id:         z.id,
    label:      z.label,
    key:        z.key || labelToKey(z.label),
    confidence: 100,
    type:       z.type,
    zone:       (z.box.y + z.box.h / 2) < 0.35 ? "top" : (z.box.y + z.box.h / 2) > 0.70 ? "bottom" : "middle",
    enabled:    true,
    required:   i < 3,
    source:     "ai" as const,
    // Zones still awaiting manual mapping have a placeholder box — do NOT
    // convert them to a real FieldPosition or TemplateCanvas will render
    // text at the wrong position.  Setting position=undefined causes Step 4
    // to skip the field entirely, which is the correct behaviour.
    position:   z.needsManualMapping ? undefined : z.type !== "photo"
      ? {
          vx:    z.box.x,
          vy:    z.box.y + z.box.h / 2,
          vw:    z.box.w,
          vh:    z.box.h,
          fs:    z.fontSize,
          bold:  z.fontBold,
          color: z.color,
          align: z.align ?? "left",
        }
      : {
          vx:    z.box.x + z.box.w / 2,
          vy:    z.box.y + z.box.h / 2,
          vw:    z.box.w,
          vh:    z.box.h,
          fs:    0,
          bold:  false,
          color: "#000000",
          align: "left" as const,
        },
  }));

  const dims: CardDimensions = t.dimensions;

  // Photo box: use explicit t.photoBox, fall back to the photo-type zone's box
  const photoZone = t.zones.find(z => z.type === "photo");
  const photoBox: BoundingBox | undefined =
    t.photoBox ??
    (photoZone ? { x: photoZone.box.x, y: photoZone.box.y, w: photoZone.box.w, h: photoZone.box.h } : undefined);

  return {
    analysisId:       t.id,
    mode:             "ai",
    category:         (t.category as TemplateAnalysis["category"]) ?? "other",
    categoryLabel:    t.name,
    confidence:       100,
    detectedOrgName:  t.orgName,
    cardTitle:        t.name,
    ocrLines:         [],
    matchedKeywords:  [],
    fields,
    photoBox,
    qrBox:            undefined,
    logoBox:          undefined,
    zones:            [],
    bgColor:          t.bgColor,
    accentColor:      "#2d4a9a",
    textColor:        t.textColor,
    labelColor:       "#555555",
    dominantColors:   [t.bgColor, "#2d4a9a"],
    fontStyles:       [],
    dimensions:       dims,
  };
}

// ─── Convert a DetectedField → TemplateZoneDef ───────────────────────────────
// Shared by Template Builder (save step) and Manual Builder (re-analyze step).
//
// IMPORTANT: if the field has no Claude-detected position (pos === undefined),
// the zone is flagged needsManualMapping=true and given a PLACEHOLDER box.
// The placeholder is visible (center of card) so the user can see it in the
// Zone Editor and drag it to the correct location.
// TemplateCanvas and templateToAnalysis() both skip needsManualMapping zones
// so no garbage is rendered on the generated card.
export function fieldToZone(f: DetectedField, index = 0): TemplateZoneDef {
  const pos = f.position;
  const missing = !pos;

  // Real box from Claude coordinates
  const box = pos
    ? {
        x: f.type === "photo" ? Math.max(0, pos.vx - pos.vw / 2) : pos.vx,
        y: Math.max(0, pos.vy - pos.vh / 2),
        w: pos.vw,
        h: pos.vh,
      }
    // Placeholder: stacked in the left column at 5% intervals so multiple
    // missing fields don't overlap and are easy to see and drag into place.
    : {
        x: 0.04,
        y: Math.min(0.92, 0.40 + index * 0.07),
        w: 0.55,
        h: 0.055,
      };

  return {
    id:                f.id,
    label:             f.label,
    key:               f.key,
    type:              f.type as ZoneFieldType,
    box,
    fontSize:          pos?.fs    ?? 11,
    fontBold:          pos?.bold  ?? false,
    color:             pos?.color ?? "#111111",
    align:             (pos?.align ?? "left") as "left" | "center" | "right",
    needsManualMapping: missing ? true : undefined,
  };
}

/** Create a compressed thumbnail from a data URL (max 200px wide) */
export function makeThumbnail(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(200 / img.naturalWidth, 120 / img.naturalHeight, 1);
      const c = document.createElement("canvas");
      c.width  = Math.round(img.naturalWidth  * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
