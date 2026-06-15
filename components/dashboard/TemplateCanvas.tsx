"use client";
/**
 * TemplateCanvas — Clean Erase-Then-Replace Pipeline
 *
 * STEP 1  Draw reference image at exact native resolution
 * STEP 2  Erase ALL original text values using pixel-sampled local bg color
 * STEP 3  Erase original student photo (always, from all fields)
 * STEP 4  Insert user's new text values at exact positions
 * STEP 5  Insert user's uploaded photo into photo frame (cover-fit, full body)
 *
 * Design notes:
 * - bgImg AND user photo are both pre-loaded before any canvas draw, so the
 *   entire render is one synchronous pass — no async flicker / "two photos" flash.
 * - sampleLocalBg samples 5 px strips on all 4 sides of an erase zone and uses
 *   the MEDIAN colour, not average. This matches gradient / multi-section card
 *   backgrounds far better than a global bgColor constant.
 * - Photo erase uses a 2 px outward pad — tight enough to cover edge bleed
 *   without ever touching footer, signature, or seal graphics below/beside the zone.
 * - Photos are cover-fit inside 90 % of the detected photo zone (5 % margin
 *   each side). No expansion beyond the detected box. User can crop via Edit Photo.
 */
import {
  useEffect, useRef, forwardRef, useImperativeHandle, useCallback,
} from "react";
import { DetectedField, BoundingBox } from "@/lib/templateAnalyzer";

export interface TemplateCanvasHandle {
  downloadPNG: (filename?: string) => void;
  downloadPDF: (filename?: string) => Promise<void>;
  getDataURL: () => string;
}

interface Props {
  referenceImage: string | null;
  fields: DetectedField[];
  values: Record<string, string>;
  photoBox?: BoundingBox;
  bgColor?: string;    // accepted for API compat but no longer used — sampling replaces it
  textColor?: string;
  className?: string;
  /** Show field bounding boxes, coordinates, alignment and font debug overlay */
  debug?: boolean;
  /** Called with the canvas element once it is first mounted — used by PreviewModal for fit-zoom calculation */
  onMount?: (canvas: HTMLCanvasElement) => void;
}

// ─── Median helper ────────────────────────────────────────────────────────────
const median = (a: number[]): number => {
  a.sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
};

// ─── Text background sampler ──────────────────────────────────────────────────
// For text erase zones we sample from the TOP and BOTTOM padding strips of the
// zone itself (guaranteed background pixels: they're above/below the text line).
// This is far more reliable than sampling outside the zone, which for cards like
// "yellow name banner above a coloured footer" mixes two different background
// colours and produces a wrong (beige) result.
function sampleTextBg(
  ctx: CanvasRenderingContext2D,
  ex: number, ey: number, ew: number, eh: number,
  pad: number,          // TEXT_PAD — the guaranteed-background strip height
  W: number, H: number,
): string {
  const x0 = Math.max(0, Math.round(ex));
  const y0 = Math.max(0, Math.round(ey));
  const sw = Math.max(1, Math.min(Math.round(ew), W - x0));
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];

  const collect = (d: Uint8ClampedArray) => {
    for (let i = 0; i < d.length; i += 4) {
      rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
    }
  };

  // Top pad strip: these pixels are ABOVE the text → same background as the text area
  const topH = Math.min(pad, Math.round(eh / 2));
  if (topH > 0 && sw > 0) collect(ctx.getImageData(x0, y0, sw, topH).data);

  // Bottom pad strip: pixels BELOW the text → also background
  const botY = Math.max(0, Math.round(ey + eh) - pad);
  const botH = Math.min(pad, Math.round(eh / 2));
  if (botH > 0 && sw > 0 && botY + botH <= H)
    collect(ctx.getImageData(x0, botY, sw, botH).data);

  // Fallback: sample from the 4 outside strips (wider, 10 px) if we got nothing useful
  if (rs.length < 20) {
    const strip = 10;
    const sh = Math.max(1, Math.min(Math.round(eh), H - y0));
    if (y0 >= strip)          collect(ctx.getImageData(x0, y0 - strip, sw, strip).data);
    if (y0 + sh + strip <= H) collect(ctx.getImageData(x0, y0 + sh,    sw, strip).data);
  }

  if (rs.length === 0) return "#ffffff";
  return `rgb(${median(rs)},${median(gs)},${median(bs)})`;
}

// ─── Photo edge background sampler ───────────────────────────────────────────
// Samples four corners + top-centre strip of the USER'S photo to determine
// the most representative background colour. This is used to fill the
// letterbox/pillarbox gaps in contain mode so the photo blends naturally.
function samplePhotoEdgeBg(img: HTMLImageElement): string {
  try {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const sw = Math.min(iw, 120);
    const sh = Math.min(ih, 120);
    const c  = document.createElement("canvas");
    c.width = sw; c.height = sh;
    const x = c.getContext("2d")!;
    x.drawImage(img, 0, 0, sw, sh);

    const cs = Math.max(2, Math.floor(Math.min(sw, sh) * 0.12));
    const rs: number[] = [], gs: number[] = [], bs: number[] = [];

    const collect = (sx: number, sy: number, w: number, h: number) => {
      if (w < 1 || h < 1) return;
      const d = x.getImageData(sx, sy, w, h).data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 10) continue; // skip transparent pixels
        rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
      }
    };

    // Four corners
    collect(0,       0,       cs, cs);
    collect(sw - cs, 0,       cs, cs);
    collect(0,       sh - cs, cs, cs);
    collect(sw - cs, sh - cs, cs, cs);
    // Top-centre strip — typically background for portrait photos
    collect(Math.floor(sw * 0.3), 0, Math.floor(sw * 0.4), Math.min(5, sh));

    if (rs.length === 0) return "#f0f0f0";
    return `rgb(${median(rs)},${median(gs)},${median(bs)})`;
  } catch {
    return "#f0f0f0";
  }
}

// ─── Photo background sampler ─────────────────────────────────────────────────
// For photo zones, samples 10 px strips on all 4 sides starting 5 px AWAY from
// the zone edge. This avoids photo-frame pixels and gives a better estimate of
// the card background that will fill the erased photo region.
function samplePhotoBg(
  ctx: CanvasRenderingContext2D,
  ex: number, ey: number, ew: number, eh: number,
  W: number, H: number,
): string {
  const gap = 5, strip = 10;
  const x0 = Math.max(0, Math.round(ex));
  const y0 = Math.max(0, Math.round(ey));
  const sw = Math.max(1, Math.min(Math.round(ew), W - x0));
  const sh = Math.max(1, Math.min(Math.round(eh), H - y0));
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];

  const collect = (d: Uint8ClampedArray) => {
    for (let i = 0; i < d.length; i += 4) {
      rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
    }
  };

  if (y0 - gap - strip >= 0)        collect(ctx.getImageData(x0, y0 - gap - strip, sw, strip).data);
  if (y0 + sh + gap + strip <= H)   collect(ctx.getImageData(x0, y0 + sh + gap,    sw, strip).data);
  if (x0 - gap - strip >= 0)        collect(ctx.getImageData(x0 - gap - strip, y0, strip, sh).data);
  if (x0 + sw + gap + strip <= W)   collect(ctx.getImageData(x0 + sw + gap,    y0, strip, sh).data);

  if (rs.length === 0) return "#f0f0f0";
  return `rgb(${median(rs)},${median(gs)},${median(bs)})`;
}

// ─── Rounded rectangle path ───────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w,     y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r,     y + h);
  ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
  ctx.lineTo(x,         y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}

// ─── Field value formatter ────────────────────────────────────────────────────
// Returns the display string for a field:
//   • studentName/employeeName → UPPERCASE (most prominent)
//   • class                   → "{class} - {section}" plain row value (detail card)
//   • section                 → "" (merged into the class row value, never standalone)
//   • detail fields           → raw value  (label added by renderer)
function formatFieldValue(fieldKey: string, values: Record<string, string>): string {
  const v = (values[fieldKey] ?? "").trim();

  switch (fieldKey) {
    case "section":
      return ""; // merged into class row

    case "class": {
      const sec = (values["section"] ?? "").trim();
      if (!v && !sec) return "";
      if (v && sec)  return `${v}-${sec}`;
      return v || sec;
    }

    // Student name rendered uppercase — most prominent element on card
    case "studentName":
    case "employeeName":
      return v.toUpperCase();

    // Detail fields — label is added separately by the premium renderer
    case "fatherName":
    case "motherName":
    case "phone":
    case "address":
      return v;

    case "email":
      return v;

    default:
      return v;
  }
}

// ─── Letter-spacing helper (Canvas has no native letter-spacing) ─────────────
function measureLetterSpaced(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return Math.max(0, w - spacing);
}

function fillTextLetterSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,  // centre X (for center-aligned text)
  y: number,
  spacing: number,
): void {
  const totalW = measureLetterSpaced(ctx, text, spacing);
  let x = cx - totalW / 2;
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
}

// ─── Word-wrap helper (for address / long text) ───────────────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";

  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      if (lines.length >= maxLines) { lines[maxLines - 1] += " …"; break; }
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

// ─── Auto-fit font size ───────────────────────────────────────────────────────
// Shrinks the font point-size until the measured text width ≤ maxW.
// Never drops below minFs so text stays readable.
// Callers pass a makeFont factory so weight/family stay consistent.
function fitFontSize(
  ctx:      CanvasRenderingContext2D,
  text:     string,
  maxW:     number,
  startFs:  number,
  minFs:    number,
  makeFont: (sz: number) => string,
): number {
  let sz = Math.max(startFs, minFs);
  ctx.font = makeFont(sz);
  while (sz > minFs && ctx.measureText(text).width > maxW) {
    sz = Math.max(sz - 0.5, minFs);
    ctx.font = makeFont(sz);
  }
  return sz;
}

// ─── Color contrast helper ────────────────────────────────────────────────────
// Returns true when a hex color is too light to read on a white/light background.
function isLightColor(color: string): boolean {
  if (!color || !color.startsWith("#") || color.length < 7) return false;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

// ─── Debug zone colors ────────────────────────────────────────────────────────
const DBG_COL: Record<string, string> = {
  photo: "#a855f7", text: "#3b82f6", phone: "#10b981",
  date: "#f59e0b", email: "#ec4899",
};

// ─── Core draw — synchronous, both images already loaded ─────────────────────
//
// photoOnly = true  →  Photo-Replacement Mode
//   • Steps 1, 3, 5 only: draw template as-is, erase old photo, insert new photo.
//   • Template text, logo, borders, colours, layout — ALL locked / untouched.
//
// noErase = true  →  Zone-Replacement Mode (AI Builder with blank templates)
//   • Steps 1, 3, 4, 5: template drawn; text zones are NOT erased.
//   • Template's pre-printed labels ("Father Name :", "Class :") stay intact.
//   • For detail fields: renders only the student VALUE at the detected zone
//     position (no extra "LABEL :" prefix) — the template label is already there.
//   • Eliminates the white-box artefact caused by the over-wide Step 2 erase.
//
// noErase = false, photoOnly = false  →  Full Mode (Manual Builder)
//   • All 5 steps: erase original values + render user-supplied text + photo.
//
function drawCard(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bgImg: HTMLImageElement,
  pImg: HTMLImageElement | null,
  fields: DetectedField[],
  values: Record<string, string>,
  photoBox: BoundingBox | undefined,
  textColor: string,
  photoOnly = false,
  noErase   = false,  // true → skip Step 2; render values-only for detail fields
  debug = false,
) {
  const W = bgImg.naturalWidth;
  const H = bgImg.naturalHeight;
  canvas.width  = W;
  canvas.height = H;

  // ══════════════════════════════════════════════
  // STEP 1: Draw reference image
  // ══════════════════════════════════════════════
  ctx.drawImage(bgImg, 0, 0, W, H);

  const enabled   = fields.filter(f => f.enabled);
  const TEXT_PAD  = 6;    // vertical-only pad for text erase — keeps horizontal bounds exact
  const PHOTO_PAD = 2;    // px padding around photo erase zone — minimal, preserves footer/signature

  // ══════════════════════════════════════════════
  // STEP 2: Erase original text values
  // Only erases fields that will actually be re-rendered. Fields with empty
  // display values (e.g. "section" when merged into "class") are skipped so
  // the template's original content at that zone is preserved.
  // Skipped entirely in Photo-Replacement Mode (photoOnly=true).
  // ══════════════════════════════════════════════
  // Keys whose rendered string uses "Label : Value" format — also need wider erase
  // to cover any pre-printed label text sitting LEFT of the detected value zone.
  const DETAIL_KEYS = new Set([
    "fatherName", "fathersName", "motherName", "parentName", "guardianName",
    "class", "grade", "className", "section",
    "phone", "phoneNumber", "mobileNumber", "contactNumber", "mobile", "contact",
    "email", "emailAddress", "emailId",
    "address", "addressLine",
    "rollNumber", "admissionNumber", "studentId", "employeeId", "designation",
  ]);
  // Known student-data keys — always erase the detected zone even when the
  // replacement value is empty so the original template value is cleared.
  const ALWAYS_ERASE_KEYS = new Set([
    "studentName", "employeeName",
    "fatherName", "fathersName", "motherName", "parentName",
    "class", "section", "grade", "className",
    "phone", "phoneNumber", "mobileNumber", "contactNumber", "mobile", "contact",
    "email", "emailAddress",
    "address", "addressLine",
    "rollNumber", "admissionNumber", "studentId", "employeeId", "designation",
  ]);
  const CARD_MARGIN = Math.round(W * 0.05);   // 5% left/right card margin (~20px)

  // noErase=true (AI Builder / zone-replacement): skip erase entirely.
  // The blank template has no values to erase; erasing creates white boxes.
  if (!photoOnly && !noErase) {
    enabled.forEach(field => {
      if (field.type === "photo") return;
      // Auto-positioned fields have synthetic coords, not real template positions —
      // erasing them would destroy decorative frames, coloured boxes, signature, etc.
      if (field.autoPositioned) return;
      const displayVal = formatFieldValue(field.key, values);
      // Erase if: (a) has a new value to render, OR (b) is a known data field so the
      // original template value is cleared even when the replacement is blank (e.g. section).
      if (!displayVal && !ALWAYS_ERASE_KEYS.has(field.key)) return;
      const pos = field.position;
      if (!pos || pos.vx === undefined || pos.vy === undefined) return;

      const y  = pos.vy * H;
      const fs = Math.max(pos.fs ?? 12, 9);

      const HEADER_SAFE_Y = Math.round(H * 0.23); // never erase inside header/logo band
      const baseH   = Math.max(Math.round(pos.vh * H), Math.round(fs * 1.8));
      const rawEY   = Math.max(0, Math.round(y - baseH / 2) - TEXT_PAD);
      const eraseY  = Math.max(rawEY, HEADER_SAFE_Y);
      const eraseH  = Math.min(baseH + TEXT_PAD * 2 - (eraseY - rawEY), H - eraseY);
      if (eraseH <= 0) return;

      // For detail fields, extend erase leftward from the detected value-start (vx)
      // all the way back to the card margin. This covers any pre-printed label text
      // ("Father Name :") that sits to the left of where Claude detected the value.
      const isDetail = DETAIL_KEYS.has(field.key);
      const valueStartX = Math.round(pos.vx * W);
      const valueEndX   = Math.min(Math.round((pos.vx + pos.vw) * W), W);
      const eraseX = isDetail ? CARD_MARGIN : valueStartX;
      const eraseW = Math.max(valueEndX - eraseX, 0);
      if (eraseW <= 0) return;

      ctx.fillStyle = sampleTextBg(ctx, eraseX, eraseY, eraseW, eraseH, TEXT_PAD, W, H);
      ctx.fillRect(eraseX, eraseY, eraseW, eraseH);
    });
  }

  // ══════════════════════════════════════════════
  // STEP 3: Erase original student photo
  // Search ALL fields (enabled or not) so the original photo is always
  // removed even if the user unchecked the photo field in step 3.
  // Uses a 2 px outward pad — tight enough to cover edge bleed without
  // touching adjacent footer / signature graphics.
  // ══════════════════════════════════════════════
  const photoFieldAll     = fields.find(f => f.type === "photo");
  const photoFieldEnabled = enabled.find(f => f.type === "photo");
  // pImg (already loaded) is only available when user enabled + uploaded a photo
  const hasNewPhoto       = !!(pImg && photoFieldEnabled);

  const box: BoundingBox | undefined =
    photoBox ??
    (photoFieldAll?.position
      ? {
          x: Math.max(0, photoFieldAll.position.vx - photoFieldAll.position.vw / 2),
          y: Math.max(0, photoFieldAll.position.vy - photoFieldAll.position.vh / 2),
          w: photoFieldAll.position.vw,
          h: photoFieldAll.position.vh,
        }
      : undefined);

  if (box) {
    const px = Math.max(0, Math.round(box.x * W));
    const py = Math.max(0, Math.round(box.y * H));
    const pw = Math.min(Math.round(box.w * W), W - px);
    const ph = Math.min(Math.round(box.h * H), H - py);

    if (pw > 4 && ph > 4) {
      // Erase with outward pad to cover original photo edges and any frame bleed.
      // PHOTO_HEADER_SAFE_Y: never erase above 34% of card height — school card
      // headers (logo + school name + subtitle banner) commonly extend to ~28-34%.
      const PHOTO_HEADER_SAFE_Y = Math.round(H * 0.34);
      const ePx = Math.max(0, px - PHOTO_PAD);
      const ePy = Math.max(PHOTO_HEADER_SAFE_Y, py - PHOTO_PAD);
      const ePw = Math.min(pw + PHOTO_PAD * 2, W - ePx);
      const ePh = Math.min(ph + PHOTO_PAD * 2 - (ePy - Math.max(0, py - PHOTO_PAD)), H - ePy);

      ctx.fillStyle = samplePhotoBg(ctx, ePx, ePy, ePw, ePh, W, H);
      ctx.fillRect(ePx, ePy, ePw, ePh);

      // No placeholder drawn when user hasn't uploaded a photo yet —
      // the erased area shows the card background, which is the correct blank state.
    }
  }

  // ══════════════════════════════════════════════
  // STEP 4: Insert new text values at exact positions
  // Skipped in Photo-Replacement Mode (photoOnly=true) — template text is
  // locked. Student name, class, father name etc. on the printed template
  // are preserved exactly as they appear on the reference card.
  // ══════════════════════════════════════════════

  // Pre-render validation (always run so debug overlay works correctly)
  const noPosFlds = enabled.filter(f => f.type !== "photo" && !f.position && f.key !== "section");
  if (!photoOnly && noPosFlds.length > 0) {
    console.warn(`[IDForge TemplateCanvas] No position — skipping: ` +
      noPosFlds.map(f => `"${f.label}"`).join(", "));
  }
  if (debug) {
    console.group("%c[IDForge Canvas] Step 4", "color:#6366f1;font-weight:bold");
    console.log(`Canvas: ${W}×${H}px  photoOnly=${photoOnly}`);
  }

  if (!photoOnly) {
    // noErase: sort so student name renders before all detail fields,
    // then enforce a floor so details never appear above the name.
    const CONTENT_NUDGE = noErase ? Math.round(H * 0.02) : 0;

    const renderOrder = noErase
      ? [...enabled].sort((a, b) => {
          const aIsName = a.key === "studentName" || a.key === "employeeName";
          const bIsName = b.key === "studentName" || b.key === "employeeName";
          if (aIsName && !bIsName) return -1;
          if (!aIsName && bIsName) return  1;
          return (a.position?.vy ?? 0) - (b.position?.vy ?? 0);
        })
      : enabled;

    // Pre-compute where detail fields must start: below the student name text.
    let lastDetailRenderY = 0;
    if (noErase) {
      const nameF = renderOrder.find(f =>
        (f.key === "studentName" || f.key === "employeeName") && f.position);
      if (nameF?.position) {
        const nY  = Math.round(nameF.position.vy * H) + CONTENT_NUDGE;
        const nFs = Math.max(nameF.position.fs ?? 18, 15);
        lastDetailRenderY = nY + Math.round(nFs * 2.5);
      }
    }

    // ── MAIN TEXT RENDER LOOP ───────────────────────────────────────────────
    renderOrder.forEach(field => {
    if (field.type === "photo") return;

    const displayVal = formatFieldValue(field.key, values);
    const pos        = field.position;

    if (debug && pos) {
      console.log(`%c✓ "${field.label}"`, "color:#10b981;font-weight:bold",
        `vy=${(pos.vy*100).toFixed(1)}%  val="${displayVal || "(skip)"}"`);
    }

    if (!displayVal) return;
    if (!pos || pos.vx === undefined || pos.vy === undefined) return;

    const isName    = field.key === "studentName" || field.key === "employeeName";
    const isDetail  = !isName && DETAIL_KEYS.has(field.key);
    const isAddress = /address/i.test(field.key);

    // Apply nudge; detail fields respect lastDetailRenderY floor to stay below name.
    const rawAT   = Math.round((pos.vy - pos.vh / 2) * H) + CONTENT_NUDGE;
    const areaH   = Math.max(Math.round(pos.vh * H), 4);
    const rawY    = Math.round(pos.vy * H) + CONTENT_NUDGE;
    const y       = (isDetail && noErase && lastDetailRenderY > 0)
                    ? Math.max(rawY, lastDetailRenderY) : rawY;
    const areaTop = (isDetail && noErase && lastDetailRenderY > 0)
                    ? y - Math.round(areaH / 2) : rawAT;

    // Name: ≥15px, 800-weight for prominence (spec: 18). Details: 10px default, ≤12px cap.
    const fs     = isName   ? Math.max(pos.fs ?? 18, 15)
                 : isDetail ? Math.min(Math.max(pos.fs ?? 10, 9), 12)
                 :             Math.max(pos.fs ?? 11, 9);
    const weight = isName ? "800" : "700";
    const align  = isName ? "center" : (pos.align ?? "left");

    // All fields use their stored vx/vw (set by computeFillFields).
    const renderLeft  = Math.round(pos.vx * W);
    const renderRight = Math.min(Math.round((pos.vx + pos.vw) * W), W - CARD_MARGIN);
    const renderW     = Math.max(renderRight - renderLeft, 40);
    const drawX       = align === "center" ? renderLeft + Math.round(renderW / 2)
                      : align === "right"  ? renderLeft + renderW
                      : renderLeft;
    // Detail fields: "LABEL : VALUE" all-caps. Name: uppercase for prominence.
    const renderStr = isDetail ? `${field.label.toUpperCase()} : ${displayVal.toUpperCase()}`
                    : isName   ? displayVal.toUpperCase()
                    :             displayVal;

    // Use detected color — guard against light text on light background.
    // Name always uses #111111 when detected color is light (spec: high-contrast dark).
    const rawColor  = pos.color || textColor;
    const safeColor = isName
      ? (isLightColor(rawColor) ? "#111827" : rawColor)
      : isLightColor(rawColor)
      ? (isLightColor(textColor) ? "#374151" : textColor)
      : rawColor;
    const mkFont = (sz: number, w = weight) => `${w} ${sz}px Poppins, Inter, Arial, sans-serif`;

    const clipH = Math.max(areaH, isAddress ? Math.round(fs * 3.8) : Math.round(fs * 2.4));

    // Protect footer: skip fields that start in the bottom 50px.
    const FOOTER_SAFE_Y = H - 50;
    if (areaTop >= FOOTER_SAFE_Y) return;
    const safeClipH = Math.min(clipH, FOOTER_SAFE_Y - areaTop);

    ctx.save();
    ctx.beginPath();
    ctx.rect(renderLeft, areaTop, Math.max(renderW, 1), safeClipH);
    ctx.clip();
    ctx.textBaseline = "middle";
    ctx.fillStyle    = safeColor;
    ctx.textAlign    = align as CanvasTextAlign;

    if (isDetail) {
      if (noErase) {
        // Zone-replace mode: render "LABEL : VALUE" at the detected zone, no erase.
        // Bold uppercase text overrides the template's pre-printed label.
        if (isAddress) {
          const lines = wrapText(ctx, renderStr, renderW * 0.96, 2);
          const lineH = Math.round(fs * 1.5);
          const topY  = y - Math.round(((lines.length - 1) * lineH) / 2);
          lines.forEach((ln, i) => {
            const lineFs = fitFontSize(ctx, ln, renderW * 0.96, fs, 7, mkFont);
            ctx.font = mkFont(lineFs);
            ctx.textAlign = "left";
            ctx.fillText(ln, renderLeft, topY + i * lineH);
          });
        } else {
          // Two-pass: label 8px/600, value 9px/700 — spec label_font_size/value_font_size.
          const labelPart = `${field.label.toUpperCase()} :`;
          const valuePart = ` ${displayVal.toUpperCase()}`;
          // Fit full string at max 9px; cap label to 8px.
          const vFs = fitFontSize(ctx, renderStr, renderW * 0.96, Math.min(fs, 9), 6, mkFont);
          const lFs = Math.min(vFs, 8);
          ctx.textAlign = "left";
          ctx.font      = mkFont(lFs, "600");
          ctx.fillText(labelPart, renderLeft, y);
          const labelW  = ctx.measureText(labelPart).width;
          ctx.font      = mkFont(vFs, "700");
          ctx.fillText(valuePart, renderLeft + labelW, y);
        }
      } else {
        // Full erase-and-replace mode: two-column "LABEL : VALUE"
        const LABEL_COL_W = Math.min(Math.round(W * 0.30), 90); // 90px per spec
        const valueX      = renderLeft + LABEL_COL_W;
        const valueW      = Math.max(renderRight - valueX, 20);
        const labelStr    = `${field.label} :`;

        // Render label column
        const labelFs = fitFontSize(ctx, labelStr, LABEL_COL_W - 4, fs, 7, mkFont);
        ctx.font      = mkFont(labelFs);
        ctx.textAlign = "left";
        ctx.fillText(labelStr, renderLeft, y);

        // Render value column (wrap for address)
        if (isAddress) {
          const lines = wrapText(ctx, displayVal, valueW * 0.98, 2);
          const lineH = Math.round(fs * 1.5);
          const topY  = y - Math.round(((lines.length - 1) * lineH) / 2);
          lines.forEach((ln, i) => {
            const lineFs = fitFontSize(ctx, ln, valueW * 0.98, fs, 7, mkFont);
            ctx.font = mkFont(lineFs, "normal");
            ctx.textAlign = "left";
            ctx.fillText(ln, valueX, topY + i * lineH);
          });
        } else {
          const valueFs = fitFontSize(ctx, displayVal, valueW * 0.98, fs, 7, mkFont);
          ctx.font      = mkFont(valueFs, "normal");
          ctx.textAlign = "left";
          ctx.fillText(displayVal, valueX, y);
        }
      }
    } else if (isAddress) {
      const lines = wrapText(ctx, renderStr, renderW * 0.96, 2);
      const lineH = Math.round(fs * 1.5);
      const topY  = y - Math.round(((lines.length - 1) * lineH) / 2);
      lines.forEach((ln, i) => {
        const lineFs = fitFontSize(ctx, ln, renderW * 0.96, fs, 7, mkFont);
        ctx.font = mkFont(lineFs);
        ctx.fillText(ln, drawX, topY + i * lineH);
      });
    } else {
      const actualFs = fitFontSize(ctx, renderStr, renderW * 0.96, fs, 7, mkFont);
      ctx.font = mkFont(actualFs);
      ctx.fillText(renderStr, drawX, y);
    }

    // Advance floor so the next detail field starts below this one.
    if (isDetail && noErase && lastDetailRenderY > 0) {
      lastDetailRenderY = y + Math.round(fs * 2.2);
    }

    ctx.restore();
  });



  } // end if (!photoOnly) — Step 4 text rendering

  if (debug) console.groupEnd();

  // ══════════════════════════════════════════════
  // STEP 5: Insert uploaded photo — FULL FRAME COVER
  //
  // The photo fills 100% of the visible photo frame with zero empty space.
  // Implementation: CSS object-fit:cover + object-position:center top.
  //
  // The draw area is EXPANDED by `brd` pixels on every side to fill both
  // the inner photo box AND the white-border zone in a single operation.
  // This eliminates the white margin that appeared when the border was drawn
  // separately and the photo only covered the inner box.
  //
  // Cover maths (source crop → destination fill):
  //   imgAR > boxAR  →  fit height, centre-crop width  (landscape photo)
  //   imgAR ≤ boxAR  →  fit width,  face-first crop height  (portrait photo)
  // ══════════════════════════════════════════════
  if (pImg && box) {
    const px = Math.max(0, Math.round(box.x * W));
    // Never draw the photo above the header band — same 34% floor as Step 3 erase.
    // Raising from 0.30 → 0.34 adds visible breathing room between the college
    // banner and the student photo.
    const PHOTO_PLACE_MIN_Y = Math.round(H * 0.34);
    const rawPy = Math.max(0, Math.round(box.y * H));
    const py = Math.max(rawPy, PHOTO_PLACE_MIN_Y);
    const pw = Math.min(Math.round(box.w * W), W - px);
    // Cap zone height at 28% so rendered photo stays ~18% after floor-clamp math.
    const rawPh = Math.min(Math.round(Math.min(box.h, 0.28) * H), H - rawPy);
    const ph = Math.max(rawPh - (py - rawPy), 20);

    if (pw > 4 && ph > 4) {
      // Photo frame: 95% of detected zone — maximises photo while keeping a
      // small inset so the rounded clip doesn't clip edge pixels.
      const PHOTO_FILL_SCALE = 0.95;
      const MOVE_DOWN        = Math.round(H * 30 / 608); // 30 px on 608 px reference
      const fillW = Math.round(pw * PHOTO_FILL_SCALE);
      const fillH = Math.round(ph * PHOTO_FILL_SCALE);
      const fillX = px + Math.round((pw - fillW) / 2);
      const fillY = Math.min(
        py + Math.round((ph - fillH) / 2) + MOVE_DOWN,
        py + ph - fillH,  // never push below zone bottom
      );
      const r = Math.max(4, Math.round(Math.min(fillW, fillH) * 0.05));

      // ── Drop-shadow behind photo ────────────────────────────────────────────
      ctx.save();
      ctx.shadowColor   = "rgba(0,0,0,0.22)";
      ctx.shadowBlur    = Math.round(W * 0.032);
      ctx.shadowOffsetY = Math.round(W * 0.005);
      roundRect(ctx, fillX, fillY, fillW, fillH, r);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fill();
      ctx.restore();

      // ── COVER: fill box completely, face-first crop ──
      // Landscape → fit height, center-crop width.
      // Portrait/square → fit width, top-align (face is in the upper portion).
      const imgW  = pImg.naturalWidth;
      const imgH  = pImg.naturalHeight;
      const imgAR = imgW / imgH;
      const boxAR = fillW / fillH;

      let dw: number, dh: number, dx: number, dy: number;
      if (imgAR > boxAR) {
        // Landscape photo — fill height, center-crop width
        dh = fillH;
        dw = Math.round(fillH * imgAR);
        dx = fillX + Math.round((fillW - dw) / 2);
        dy = fillY;
      } else {
        // Portrait/square photo — fill width, face-first (top) crop
        dw = fillW;
        dh = Math.round(fillW / imgAR);
        dx = fillX;
        dy = fillY;
      }

      ctx.save();
      roundRect(ctx, fillX, fillY, fillW, fillH, r);
      ctx.clip();
      ctx.drawImage(pImg, 0, 0, imgW, imgH, dx, dy, dw, dh);
      ctx.restore();

      // ── Subtle inner highlight stroke ───────────────────────────────────────
      ctx.save();
      roundRect(ctx, fillX, fillY, fillW, fillH, r);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ══════════════════════════════════════════════
  // DEBUG OVERLAY — drawn last, on top of everything
  // Shows every field's bounding box, exact coordinates,
  // alignment, font size and color so you can verify
  // positions match the reference card exactly.
  // Only rendered when debug=true.
  // ══════════════════════════════════════════════
  if (!debug) return;

  const labelSz  = Math.max(9,  Math.round(W * 0.026));
  const dashLen  = Math.max(4,  Math.round(W * 0.010));
  const dashGap  = Math.max(2,  Math.round(W * 0.006));
  const lineW    = Math.max(1.5, W * 0.004);

  // Helper: draw a pill badge positioned above (or below) a zone
  const badge = (text: string, bx: number, by: number, bw: number, col: string, line2?: string) => {
    ctx.save();
    ctx.font = `bold ${labelSz}px Arial, sans-serif`;
    const lines = [text, ...(line2 ? [line2] : [])];
    const maxTw = Math.max(...lines.map(l => ctx.measureText(l).width));
    const pad   = 4;
    const lh    = labelSz + 3;
    const bh    = lh * lines.length + pad * 2;
    const lx    = Math.min(Math.max(0, bx), W - maxTw - pad * 2 - 2);
    const ly    = by > bh + 6 ? by - bh - 4 : by + Math.max(Math.round(W * 0.03), 6);
    ctx.fillStyle = col + "f0";
    ctx.fillRect(lx, ly, maxTw + pad * 2, bh);
    // Thin left accent strip
    ctx.fillStyle = col;
    ctx.fillRect(lx, ly, 3, bh);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => ctx.fillText(l, lx + pad + 3, ly + pad + lh * i + lh / 2));
    ctx.restore();
  };

  // ── Photo zone ────────────────────────────────────────────────────────────
  if (box) {
    const col = DBG_COL.photo;
    const px  = Math.round(box.x * W), py  = Math.round(box.y * H);
    const pw  = Math.round(box.w * W), ph  = Math.round(box.h * H);
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth   = lineW * 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle   = col + "22";
    ctx.fillRect(px, py, pw, ph);
    badge(
      `ZONE: Photo  |  x:${(box.x*100).toFixed(1)}%  y:${(box.y*100).toFixed(1)}%  ${(box.w*100).toFixed(1)}×${(box.h*100).toFixed(1)}%`,
      px, py, pw, col,
    );
    ctx.restore();
  }

  // ── Text field zones ──────────────────────────────────────────────────────
  let noposY = 8;
  enabled.forEach(field => {
    if (field.type === "photo") return;
    const pos = field.position;
    const col = DBG_COL[field.type] ?? "#6366f1";
    const val = values[field.key] ?? "";

    // Fields with no position data — show red banner at top
    if (!pos) {
      ctx.save();
      ctx.fillStyle = "#ef4444dd";
      const msg = `❌ NO POSITION — Zone: "${field.label}" | Cannot render`;
      ctx.font = `bold ${labelSz}px Arial, sans-serif`;
      const tw = ctx.measureText(msg).width;
      ctx.fillRect(4, noposY, tw + 12, labelSz + 8);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(msg, 10, noposY + labelSz / 2 + 4);
      ctx.restore();
      noposY += labelSz + 10;
      return;
    }

    const zx = Math.round(pos.vx * W);
    const zy = Math.round((pos.vy - pos.vh / 2) * H);
    const zw = Math.max(Math.round(pos.vw * W), 80);
    const zh = Math.max(Math.round(pos.vh * H), Math.round((pos.fs ?? 12) * 2.4));

    // Plausibility check for the name field
    const k = field.key.toLowerCase();
    const plausible = !(k.includes("name") && pos.vy < 0.50);
    const borderCol = plausible ? col : "#ef4444";

    ctx.save();
    // Zone fill
    ctx.fillStyle = borderCol + "18";
    ctx.fillRect(zx, zy, zw, zh);
    // Zone border — solid if value present, dashed if empty
    ctx.strokeStyle = borderCol;
    ctx.lineWidth   = lineW;
    ctx.setLineDash(val ? [] : [dashLen, dashGap]);
    ctx.strokeRect(zx, zy, zw, zh);
    ctx.setLineDash([]);

    // Horizontal center-Y line (vy baseline)
    const vy_px = Math.round(pos.vy * H);
    ctx.strokeStyle = borderCol + "99";
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(zx, vy_px); ctx.lineTo(zx + zw, vy_px); ctx.stroke();
    ctx.setLineDash([]);

    // Badge line 1: zone + coordinates
    const line1 = `ZONE: "${field.label}"  |  x:${(pos.vx*100).toFixed(1)}%  y:${(pos.vy*100).toFixed(1)}%  ${(pos.vw*100).toFixed(1)}×${(pos.vh*100).toFixed(1)}%`;
    // Badge line 2: value + font info
    const line2 = `Value: "${val || "(empty)"}"  |  fs:${pos.fs ?? "?"} ${pos.bold ? "bold" : ""}  align:${pos.align ?? "left"}  color:${pos.color}`;
    badge(line1, zx, zy, zw, borderCol, line2);

    // Plausibility warning overlay
    if (!plausible) {
      ctx.save();
      ctx.fillStyle = "#ef4444cc";
      ctx.font = `bold ${Math.round(labelSz * 0.9)}px Arial, sans-serif`;
      const warnTxt = `⚠️ PLAUSIBILITY FAIL: "${field.label}" vy=${(pos.vy*100).toFixed(0)}% — check coordinates`;
      ctx.fillStyle = "#ef4444ee";
      const wtw = ctx.measureText(warnTxt).width;
      ctx.fillRect(zx, zy + zh + 2, wtw + 8, labelSz + 6);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(warnTxt, zx + 4, zy + zh + 2 + (labelSz + 6) / 2);
      ctx.restore();
    }
    ctx.restore();
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const TemplateCanvas = forwardRef<TemplateCanvasHandle, Props>(function TemplateCanvas(
  { referenceImage, fields, values, photoBox, textColor = "#111111", className, debug = false, onMount },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !referenceImage) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const photoFieldEnabled = fields.find(f => f.enabled && f.type === "photo");
    const photoSrc = photoFieldEnabled ? values[photoFieldEnabled.key] : undefined;

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";

    bgImg.onload = () => {
      if (photoSrc) {
        // Load original photo directly — drawCard cover-fits it into the detected
        // photo zone, preserving full body: uniform, tie, badge, shoulders visible.
        const pImg = new Image();
        pImg.onload  = () => drawCard(ctx, canvas, bgImg, pImg,  fields, values, photoBox, textColor, false, false, debug);
        pImg.onerror = () => drawCard(ctx, canvas, bgImg, null,  fields, values, photoBox, textColor, false, false, debug);
        pImg.src = photoSrc;
      } else {
        drawCard(ctx, canvas, bgImg, null, fields, values, photoBox, textColor, false, false, debug);
      }
    };
    bgImg.onerror = () => {};
    bgImg.src = referenceImage;
  }, [referenceImage, fields, values, photoBox, textColor, debug]);

  useEffect(() => { render(); }, [render]);
  // Fire onMount after first render so the PreviewModal can read canvas dimensions
  useEffect(() => {
    const c = canvasRef.current;
    if (c && onMount) onMount(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMount]);

  useImperativeHandle(ref, () => ({
    downloadPNG(filename = "id-card.png") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const a = document.createElement("a");
      a.download = filename;
      a.href = canvas.toDataURL("image/png");
      a.click();
    },
    async downloadPDF(filename = "id-card.pdf") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { canvasTopdf } = await import("@/lib/pdfExport");
      await canvasTopdf(canvas, filename);
    },
    getDataURL() {
      return canvasRef.current?.toDataURL("image/png") ?? "";
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`block rounded-xl shadow-2xl ${className ?? ""}`}
      style={{ maxWidth: "100%", maxHeight: "100%", imageRendering: "crisp-edges" }}
    />
  );
});

export default TemplateCanvas;

// ─── Standalone off-screen renderer for bulk generation ──────────────────────
// Loads both images asynchronously then calls drawCard synchronously,
// returning the finished canvas as a PNG data-URL.
export function renderCardToDataURL(
  templateSrc: string,
  fields: DetectedField[],
  values: Record<string, string>,
  photoBox: BoundingBox | undefined,
  photoSrc: string | null,
  textColor = "#111111",
  /** Photo-Replacement Mode — only swap the photo, lock everything else. */
  photoOnly = false,
  /** Zone-Replacement Mode — skip Step 2 erase; inject values only (no label prefix). */
  noErase   = false,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { reject(new Error("no canvas ctx")); return; }

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onerror = () => reject(new Error("template load failed"));
    bgImg.onload = () => {
      const finish = (pImg: HTMLImageElement | null) => {
        drawCard(ctx, canvas, bgImg, pImg, fields, values, photoBox, textColor, photoOnly, noErase);
        resolve(canvas.toDataURL("image/png"));
      };
      if (photoSrc) {
        const pImg = new Image();
        pImg.onload  = () => finish(pImg);
        pImg.onerror = () => finish(null);
        pImg.src = photoSrc;
      } else {
        finish(null);
      }
    };
    bgImg.src = templateSrc;
  });
}
