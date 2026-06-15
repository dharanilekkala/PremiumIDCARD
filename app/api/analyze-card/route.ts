import { NextRequest, NextResponse } from "next/server";

// Vercel: Claude Vision API can take up to 35s — raise the function timeout ceiling.
// Vercel Hobby = 10s max (AI analysis will degrade gracefully to manual mode).
// Vercel Pro/Enterprise can be raised up to 300s.
export const maxDuration = 60;

/* ─── Prompt ────────────────────────────────────────────────────────────────── */
const PROMPT = `You are a PRECISION coordinate extractor for an ID card template replication system.

The system erases original values from the card and writes new values at EXACTLY the same pixel positions.
Your coordinates are used verbatim -- if your vy is wrong by 10%, the text will appear 10% off.

COORDINATE SYSTEM
=================
ALL coordinates are 0.0-1.0 fractions of the card dimensions:
  x: 0.0 = LEFT edge,  1.0 = RIGHT edge
  y: 0.0 = TOP  edge,  1.0 = BOTTOM edge

For each text field:
  vx = left edge of the VALUE text zone        (fraction of card width)
  vy = VERTICAL CENTER of the VALUE text line  (fraction of card height)
  vw = width  of the VALUE text zone           (fraction of card width)
  vh = height of the VALUE text zone           (fraction of card height)

CRITICAL: vy is the CENTER of the text line, NOT the top edge.
  Example: if a name band spans from y=0.74 to y=0.87, vy = (0.74+0.87)/2 = 0.805


LABELS vs VALUES (MOST IMPORTANT RULE)
=======================================
LABEL = static descriptor printed on EVERY card: "Student Name", "Class", "Mobile"
VALUE = person-specific data on THIS card:        "Katamoni Athulya Sree", "LKG", "9502822422"

You return ONLY the LABEL as the field name.
vx/vy MUST point to where the VALUE text sits -- NOT where the label text sits.

COMMON MISTAKE -- name label vs name value:
  Card has two different text elements:
    "Student Name"  label text    at vy = 0.62   (THIS IS THE LABEL)
    [Yellow band below]
    "Katamoni Athulya Sree"  VALUE at vy = 0.81  (THIS IS THE VALUE)

  WRONG: returning vy=0.62 (the label row)
  RIGHT: returning vy=0.81 (where the actual name value appears)

Card shows "Class  LKG":
  WRONG: vy pointing to the word "Class"
  RIGHT: vy pointing to where "LKG" appears (same line, to the right)

Card shows "Mobile  9502822422":
  RIGHT: vy pointing to where "9502822422" appears


COLORED STRIPS / NAME BANNERS (very common on school cards)
===========================================================
Many school ID cards display the student name in a COLORED HORIZONTAL BAND
(yellow, red, blue strip) near the BOTTOM of the card. Measure it carefully:

  1. Find the TOP edge of the colored band    -> y_top  (e.g. 0.74)
  2. Find the BOTTOM edge of the colored band -> y_bot  (e.g. 0.87)
  3. vy = (y_top + y_bot) / 2                -> 0.805  (CENTER of band)
  4. vh = y_bot - y_top                      -> 0.13   (height of band)
  5. vx = left margin of band (typically 0.02-0.05)
  6. vw = width of band (typically 0.90-0.95 of card width)
  7. align = "center" (names in banners are almost always centered)

  The name band is BELOW the photo, NOT at the same vertical level as the photo.
  Typical position: y_top = 0.70-0.80, y_bot = 0.85-0.92
  So vy for the student name is typically 0.75-0.87 on a school card.

  WARNING: Do NOT confuse the "Student Name" label row (around y=0.60-0.65)
  with the actual name value in the yellow band (around y=0.80-0.85).


TWO COMMON PORTRAIT SCHOOL CARD LAYOUTS
========================================

LAYOUT A — Bottom-band name (yellow/coloured strip near bottom):
  0.00 --- header
  0.24 --- PHOTO STARTS
  0.46 --- "Class  LKG"  VALUE      vy=0.46, vx=0.55, vw=0.40, align="left"
  0.54 --- "Mobile  9502…" VALUE    vy=0.54, vx=0.55, vw=0.40
  0.72 --- PHOTO ENDS
  0.74 --- YELLOW BAND STARTS
  0.81 --- "Katamoni Athulya Sree"  vy=0.81 *** NAME IN BAND ***
  0.88 --- YELLOW BAND ENDS
  0.89 --- "Father : Satyanarayana" vy=0.89
  1.00 --- bottom

LAYOUT B — Mid-card data section (name + details below photo, above footer):
  0.00 --- header / school name
  0.18 --- PHOTO STARTS             photoBox.y = 0.18
  0.52 --- PHOTO ENDS               photoBox.y + photoBox.h = 0.52 (h=0.34)
  0.55 --- "Rudhvika"  (student name VALUE, centred)  vy=0.55
  0.62 --- "Father Name : Suresh"   vy=0.62, align="left"
  0.68 --- "Class : II-B"           vy=0.68
  0.73 --- "Ph: 9515060526"         vy=0.73
  0.78 --- "Address : Kondapur"     vy=0.78
  0.82 --- signature / seal
  0.86 --- footer text (bus depot, address, phone)
  1.00 --- bottom

For LAYOUT B:  student name vy is 0.50–0.68 (NOT 0.74+).
DETECT BOTH LAYOUT TYPES correctly. Never force vy > 0.74 for all student names.

Correct JSON — student name in mid-card data section (LAYOUT B):
  { "label":"Student Name", "type":"text",
    "vx":0.03, "vy":0.55, "vw":0.92, "vh":0.08,
    "fs":16, "bold":true, "color":"#1a1a1a", "align":"center" }

Correct JSON — student name in yellow band (LAYOUT A):
  { "label":"Student Name", "type":"text",
    "vx":0.03, "vy":0.81, "vw":0.92, "vh":0.14,
    "fs":14, "bold":true, "color":"#1a1a1a", "align":"center" }

Correct JSON for class field (either layout):
  { "label":"Class", "type":"text",
    "vx":0.55, "vy":0.46, "vw":0.40, "vh":0.06,
    "fs":11, "bold":false, "color":"#111111", "align":"left" }


PHOTO BOX
=========
Student photo = rectangle/square with a human FACE (passport-style).
NOT the organization logo (logo = circular/abstract graphic in top-left corner).

photoBox uses TOP-LEFT origin + size:
  x = left edge of photo frame   (fraction of card width)
  y = TOP edge of photo frame    (fraction of card height)
  w = photo frame width          (fraction of card width)
  h = photo frame height         (fraction of card height)


OUTPUT FORMAT -- return ONLY raw JSON, no markdown:
====================================================
{
  "orgName":    "ORGANIZATION NAME AS PRINTED",
  "cardTitle":  "CARD TITLE or empty string",
  "cardType":   "school|college|employee|hospital|membership|event|other",
  "confidence": 95,
  "orientation": "portrait|landscape",

  "fields": [
    {
      "label": "Field Label",
      "type":  "text|date|phone|email|photo",
      "vx": 0.03,
      "vy": 0.81,
      "vw": 0.92,
      "vh": 0.14,
      "fs": 14,
      "bold": true,
      "color": "#1a1a1a",
      "align": "center"
    }
  ],

  "photoBox": { "x": 0.03, "y": 0.24, "w": 0.46, "h": 0.48 },
  "qrBox":    null,
  "logoBox":  { "x": 0.02, "y": 0.02, "w": 0.14, "h": 0.10 },

  "bgColor":     "#ffffff",
  "accentColor": "#e53935",
  "textColor":   "#111111",
  "labelColor":  "#555555"
}


BLANK TEMPLATE CARDS (most important section)
=============================================
Many uploaded cards are BLANK TEMPLATES — the design and labels are printed, but no
student data has been filled in yet. The photo zone is empty, name lines are blank, etc.

For a blank template you MUST still detect ALL field zones. The zone is WHERE a value
WOULD be written. Detect zones from printed labels even when no value text is visible.

HOW TO DETECT ZONES FROM LABELS:
  "Father Name :  ___________"
    → label is "Father Name", colon at x≈0.38, blank space after colon
    → vx = x just right of colon  (≈0.40)
    → vy = vertical centre of that label row
    → vw = remaining width to right edge (≈0.55)
    → vh = height of that text line (~0.05)
    → align = "left"

  "Student Name" label above a blank line or underline:
    → vx = left edge of the blank line, vy = centre of blank line
    → vw = width of blank line, vh = line height

SCHOOL CARD — MINIMUM 6 FIELDS REQUIRED
========================================
School ID card templates ALWAYS contain these zones. You MUST detect ALL of them.
If the value area is blank/empty, still return the zone using the label to locate it.

  Required zones (detect even if values are blank):
  1. Photo        – passport photo area (always present)
  2. Student Name – where student name goes (below photo or in coloured band)
  3. Father Name  – "Father Name :", "Father's Name :", "Guardian :"
  4. Class        – "Class :", "Std :", "Grade :" (may be combined with section)
  5. Phone/Mobile – "Ph :", "Mobile :", "Contact :", or any phone-number label
  6. Address      – "Address :", "Addr :", or any address label

If you find fewer than 6 fields for a school card, look harder:
  • Check every text row for label patterns ("Label :  ___")
  • Check the right column for side-by-side label–value layouts
  • Check footer bands for phone / address rows
  • Blank underlines after a label = that label's value zone


MANDATORY RULES
===============
1.  Return ALL fields whose zones you can locate — blank-value zones ARE valid.
2.  Photo field (if photo exists): {"label":"Photo","type":"photo","vx":CENTER_x,"vy":CENTER_y,"vw":photo_w,"vh":photo_h,"fs":0,"bold":false,"color":"#000000","align":"left"}
    Note: photo FIELD uses CENTER for vx/vy; photoBox uses TOP-LEFT for x/y.
3.  type "phone"  -> mobile, phone, contact number
    type "date"   -> DOB, date of birth, valid till, joining date
    type "email"  -> email fields
4.  Order fields TOP-TO-BOTTOM, LEFT-TO-RIGHT.
5.  orientation: "portrait" if card height > width; "landscape" if width > height.
6.  vx/vy/vw/vh are REQUIRED for EVERY field. A field with no coordinates cannot be rendered.
7.  photoBox is REQUIRED when a student face photo exists.
8.  vw: use the FULL width of the value's text area (wider = safer, used for erasing old value).
9.  vh: height of one text line + small padding.
    Normal text: 0.04-0.08. Large name banners: 0.10-0.16.
10. align:
    "center" -> student name inside a full-width colored band (most common for names)
    "left"   -> values that start from a fixed left point (Class, Mobile, Address)
    "right"  -> right-aligned values (rare)
    vx is ALWAYS the LEFT edge of the zone regardless of alignment.
11. bgColor = background color of the DATA section (below the header). Used to erase old values.
12. SELF-CHECK before returning the student name vy:
    - Is the name in a COLORED BAND at the BOTTOM? → vy = center of band (0.74–0.90)
    - Is the name in a MID-CARD DATA SECTION below the photo? → vy = where the name VALUE text sits (0.50–0.72)
    - Never return vy < 0.35 for the student name (that zone is header/logo/photo, never the name value).
    - Never return the LABEL row vy as the VALUE vy.
13. MINIMUM CHECK: Count your detected fields before returning.
    School card with fewer than 6 fields? Go back and find the missing zones.

Return ONLY the JSON object. No markdown. No explanation. No comments.`;

/* ─── Route handler ─────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ mode: "manual" });

  try {
    const { imageDataUrl } = await request.json();
    if (!imageDataUrl?.startsWith("data:image")) {
      return NextResponse.json({ mode: "manual", error: "Invalid image" });
    }

    const [header, base64Data] = imageDataUrl.split(",");
    const mediaType = header.split(";")[0].split(":")[1] as
      | "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Anthropic error:", resp.status, err);
      return NextResponse.json({ mode: "manual", error: `HTTP ${resp.status}` });
    }

    const data = await resp.json();
    const text: string = data.content?.[0]?.type === "text" ? data.content[0].text : "";

    // Strip markdown fences if Claude wraps in ```json...```
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON in response:", text.slice(0, 300));
      return NextResponse.json({ mode: "manual", error: "parse-failed" });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // ── Server-side validation ────────────────────────────────────────────────

    const missingCoordinateFields: string[] = [];
    const coordinateWarnings: string[] = [];

    if (Array.isArray(parsed.fields)) {
      parsed.fields = parsed.fields.filter((f: { label: string; type: string }) => {
        const lbl = (f.label || "").trim();
        if (!lbl) return false;
        if (f.type === "photo") return true;
        // Reject labels that look like actual values (phone numbers, proper names)
        if (/^\+?\d[\d\s\-]{7,}$/.test(lbl)) return false;
        const words = lbl.split(/\s+/);
        if (words.length >= 3 && words.every((w: string) => /^[A-Z][a-z]/.test(w))) return false;
        return true;
      });

      // ── Coordinate sanity check: clamp to [0, 1] ─────────────────────────────
      parsed.fields = parsed.fields.map((f: {
        label: string; type: string;
        vx?: number; vy?: number; vw?: number; vh?: number;
        fs?: number; bold?: boolean; color?: string; align?: string;
      }) => {
        const clamp = (v: number) => Math.max(0, Math.min(1, v));
        if (f.vx !== undefined) f.vx = clamp(f.vx);
        if (f.vy !== undefined) f.vy = clamp(f.vy);
        if (f.vw !== undefined) f.vw = Math.min(clamp(f.vw), 1 - (f.vx ?? 0));
        if (f.vh !== undefined) f.vh = Math.min(clamp(f.vh), 1 - Math.max(0, (f.vy ?? 0) - (f.vh ?? 0) / 2));
        // Cap vh at 0.20 — prevents huge erase zones from a misreported name-band height
        if (f.vh !== undefined && f.vh > 0.20) f.vh = 0.20;
        if (!f.align) f.align = "left";
        if (!f.color) f.color = parsed.textColor ?? "#111111";
        return f;
      });

      // ── Validate: flag fields with missing or suspicious coordinates ──────────
      parsed.fields = parsed.fields.map((f: {
        label: string; type: string;
        vx?: number; vy?: number; vw?: number; vh?: number;
        hasMissingCoords?: boolean; hasSuspiciousCoords?: boolean;
      }) => {
        if (f.type === "photo") return f;

        // Every text field MUST have all four coordinates
        if (f.vx === undefined || f.vy === undefined || f.vw === undefined || f.vh === undefined) {
          missingCoordinateFields.push(f.label);
          console.warn(`⚠ COORD MISSING: "${f.label}" (vx=${f.vx} vy=${f.vy} vw=${f.vw} vh=${f.vh}) — will require manual placement`);
          return { ...f, hasMissingCoords: true };
        }

        // Student Name vy sanity check
        if (/student[\s_-]*name/i.test(f.label) && f.vy < 0.35) {
          const warn = `"${f.label}" vy=${f.vy.toFixed(3)} is in the header zone — likely label text, not the value`;
          coordinateWarnings.push(warn);
          console.warn(`⚠ SUSPICIOUS COORD: ${warn}`);
          return { ...f, hasSuspiciousCoords: true };
        }

        // Phone/mobile in header (vy < 0.30) or footer (vy > 0.87) → institution contact, not student data
        if (/phone|mobile|contact|tel/i.test(f.label)) {
          if (f.vy < 0.30) {
            const warn = `"${f.label}" vy=${f.vy.toFixed(3)} is in the header zone — likely institution contact`;
            coordinateWarnings.push(warn);
            console.warn(`⚠ SUSPICIOUS COORD: ${warn}`);
            return { ...f, hasSuspiciousCoords: true };
          }
          if (f.vy > 0.87) {
            const warn = `"${f.label}" vy=${f.vy.toFixed(3)} is in the footer zone — likely institution contact`;
            coordinateWarnings.push(warn);
            console.warn(`⚠ SUSPICIOUS COORD: ${warn}`);
            return { ...f, hasSuspiciousCoords: true };
          }
        }

        // Any data field detected in the header zone (vy < 0.22) is almost certainly wrong
        if (f.vy < 0.22) {
          const warn = `"${f.label}" vy=${f.vy.toFixed(3)} is in the header zone`;
          coordinateWarnings.push(warn);
          console.warn(`⚠ SUSPICIOUS COORD: ${warn}`);
          return { ...f, hasSuspiciousCoords: true };
        }

        // Any data field in the footer zone (vy > 0.85) belongs to the institution, not student
        if (f.vy > 0.85) {
          const warn = `"${f.label}" vy=${f.vy.toFixed(3)} is in the footer zone`;
          coordinateWarnings.push(warn);
          console.warn(`⚠ SUSPICIOUS COORD: ${warn}`);
          return { ...f, hasSuspiciousCoords: true };
        }

        return f;
      });

      if (missingCoordinateFields.length) parsed.missingCoordinateFields = missingCoordinateFields;
      if (coordinateWarnings.length) parsed.coordinateWarnings = coordinateWarnings;

      // ── Deduplicate phone-type fields ───────────────────────────────────────
      // AI sometimes returns both "Phone Number" (template label text) and "Mobile"
      // (student field) pointing to the same data.  When multiple phone fields exist,
      // keep only the highest-ranked one so the same number never appears twice.
      const phoneFields = parsed.fields.filter((f: { type: string }) => f.type === "phone");
      if (phoneFields.length > 1) {
        const phoneRank = (label: string) => {
          const l = label.toLowerCase().trim();
          if (/^mobile/.test(l)) return 4;
          if (/^contact/.test(l)) return 3;
          if (/^phone$/.test(l)) return 2;
          return 1; // "Phone Number", "Ph", "Ph No", etc.
        };
        const best = phoneFields.reduce(
          (a: { label: string }, b: { label: string }) =>
            phoneRank(b.label) >= phoneRank(a.label) ? b : a,
        );
        parsed.fields = parsed.fields.filter(
          (f: { type: string; label: string }) => f.type !== "phone" || f.label === best.label,
        );
        console.log(
          `  → dedup phone: kept "${best.label}" from [${phoneFields.map((f: { label: string }) => `"${f.label}"`).join(", ")}]`,
        );
      }
    }

    // ── Clamp photoBox to card bounds ─────────────────────────────────────────
    if (parsed.photoBox) {
      const pb = parsed.photoBox;
      pb.x = Math.max(0, Math.min(0.95, pb.x ?? 0));
      // Photo zone must start below the header/logo band (first 30% of card).
      // School cards commonly have a large header (logo + school name + subtitle
      // banner) that can extend down to ~28-34% of card height.  Clamping to 0.34
      // prevents Step 3 from erasing header text and gives a visible gap above photo.
      const rawY      = pb.y ?? 0;
      const rawBottom = rawY + (pb.h ?? 0.4);
      pb.y = Math.max(0.34, Math.min(0.95, rawY));
      pb.w = Math.max(0.05, Math.min(1 - pb.x, pb.w ?? 0.3));
      pb.h = Math.max(0.05, Math.min(rawBottom - pb.y, 1 - pb.y));
      // Cap photo zone height at 40% — prevents AI over-extension into data section.
      pb.h = Math.min(pb.h, 0.40);
    }

    console.log(
      `✓ ${parsed.cardType} | ${parsed.orientation} | ${parsed.fields?.length ?? 0} fields | photo: ${!!parsed.photoBox}` +
      (missingCoordinateFields.length ? ` | ⚠ MISSING COORDS: ${missingCoordinateFields.join(", ")}` : "") +
      (coordinateWarnings.length ? ` | ⚠ SUSPICIOUS: ${coordinateWarnings.join("; ")}` : ""),
      parsed.fields?.map((f: { label: string; vy?: number; align?: string; hasMissingCoords?: boolean; hasSuspiciousCoords?: boolean }) =>
        `  ${f.label}: vy=${f.vy?.toFixed(3)} align=${f.align}${f.hasMissingCoords ? " [MISSING]" : ""}${f.hasSuspiciousCoords ? " [SUSPICIOUS]" : ""}`
      ).join("\n"),
    );

    return NextResponse.json({ mode: "ai", ...parsed });

  } catch (err) {
    console.error("analyze-card error:", err);
    return NextResponse.json({ mode: "manual", error: String(err) });
  }
}
