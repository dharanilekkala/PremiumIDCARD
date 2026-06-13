"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  GraduationCap, Building2, Stethoscope, PartyPopper,
  Camera, Upload, X, Download, ArrowLeft, RefreshCw,
  User, Check, Loader2, ChevronRight, Image as ImageIcon,
  Phone, Mail, MapPin, Calendar, Droplets, ShieldAlert,
  Hash, Briefcase, Layers, FileText, RectangleVertical, RectangleHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PortraitCard  from "@/components/cards/PortraitCard";
import LandscapeCard from "@/components/cards/LandscapeCard";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type OrgType = "school" | "office" | "hospital" | "event";
type Orientation = "portrait" | "landscape";

interface FieldDef {
  key: string; label: string; type: string;
  placeholder: string; required: boolean; icon: React.ElementType;
}

// â”€â”€â”€ Org types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ORG_TYPES = [
  { id: "school"   as OrgType, label: "School / College",    desc: "Student ID cards with class, roll number & photo",    icon: GraduationCap, color: "#6366f1", from: "#4f46e5", to: "#7c3aed", example: "Schools, colleges, coaching institutes" },
  { id: "office"   as OrgType, label: "Office / Company",    desc: "Employee ID cards with designation & department",      icon: Building2,     color: "#0ea5e9", from: "#0284c7", to: "#0369a1", example: "IT companies, factories, offices" },
  { id: "hospital" as OrgType, label: "Hospital / Clinic",   desc: "Staff ID cards with blood group & emergency contact", icon: Stethoscope,   color: "#10b981", from: "#059669", to: "#047857", example: "Hospitals, clinics, nursing homes" },
  { id: "event"    as OrgType, label: "Event / Conference",  desc: "Attendee & speaker badges for any event",              icon: PartyPopper,   color: "#f59e0b", from: "#d97706", to: "#b45309", example: "Seminars, fests, conferences" },
];

// â”€â”€â”€ Fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FIELDS: Record<OrgType, FieldDef[]> = {
  school: [
    { key: "name",         label: "Student Full Name",  type: "text",  placeholder: "e.g. Rahul Sharma",           required: true,  icon: User          },
    { key: "idNumber",     label: "Roll / ID Number",   type: "text",  placeholder: "e.g. STU-2024-001",           required: true,  icon: Hash          },
    { key: "organization", label: "School / College",   type: "text",  placeholder: "e.g. Delhi Public School",    required: true,  icon: GraduationCap },
    { key: "class",        label: "Class & Section",    type: "text",  placeholder: "e.g. 10-A",                   required: false, icon: Layers        },
    { key: "dob",          label: "Date of Birth",      type: "date",  placeholder: "",                             required: false, icon: Calendar      },
    { key: "bloodGroup",   label: "Blood Group",        type: "text",  placeholder: "e.g. B+",                     required: false, icon: Droplets      },
    { key: "phone",        label: "Parent Phone",       type: "tel",   placeholder: "e.g. 9876543210",             required: false, icon: Phone         },
    { key: "address",      label: "Address",            type: "text",  placeholder: "e.g. 123 Main Street, Delhi", required: false, icon: MapPin        },
    { key: "issueDate",    label: "Issue Date",         type: "date",  placeholder: "",                             required: false, icon: Calendar      },
    { key: "expiryDate",   label: "Valid Until",        type: "date",  placeholder: "",                             required: false, icon: Calendar      },
  ],
  office: [
    { key: "name",             label: "Full Name",          type: "text",  placeholder: "e.g. Priya Mehta",         required: true,  icon: User        },
    { key: "idNumber",         label: "Employee ID",        type: "text",  placeholder: "e.g. EMP-2024-042",        required: true,  icon: Hash        },
    { key: "organization",     label: "Company Name",       type: "text",  placeholder: "e.g. TechCorp India Ltd",  required: true,  icon: Building2   },
    { key: "designation",      label: "Designation / Role", type: "text",  placeholder: "e.g. Software Engineer",   required: false, icon: Briefcase   },
    { key: "department",       label: "Department",         type: "text",  placeholder: "e.g. Engineering",         required: false, icon: Layers      },
    { key: "bloodGroup",       label: "Blood Group",        type: "text",  placeholder: "e.g. O+",                  required: false, icon: Droplets    },
    { key: "phone",            label: "Phone Number",       type: "tel",   placeholder: "e.g. 9876543210",          required: false, icon: Phone       },
    { key: "email",            label: "Email Address",      type: "email", placeholder: "e.g. priya@company.com",   required: false, icon: Mail        },
    { key: "issueDate",        label: "Issue Date",         type: "date",  placeholder: "",                          required: false, icon: Calendar    },
    { key: "expiryDate",       label: "Valid Until",        type: "date",  placeholder: "",                          required: false, icon: Calendar    },
    { key: "emergencyContact", label: "Emergency Contact",  type: "tel",   placeholder: "e.g. 9876543211",          required: false, icon: ShieldAlert },
  ],
  hospital: [
    { key: "name",             label: "Full Name",          type: "text",  placeholder: "e.g. Dr. Anjali Singh",    required: true,  icon: User        },
    { key: "idNumber",         label: "Staff ID",           type: "text",  placeholder: "e.g. DOC-2024-007",        required: true,  icon: Hash        },
    { key: "organization",     label: "Hospital Name",      type: "text",  placeholder: "e.g. Apollo Hospital",     required: true,  icon: Stethoscope },
    { key: "designation",      label: "Designation",        type: "text",  placeholder: "e.g. Senior Doctor",       required: false, icon: Briefcase   },
    { key: "department",       label: "Department",         type: "text",  placeholder: "e.g. Cardiology",          required: false, icon: Layers      },
    { key: "bloodGroup",       label: "Blood Group",        type: "text",  placeholder: "e.g. A+",                  required: false, icon: Droplets    },
    { key: "phone",            label: "Phone Number",       type: "tel",   placeholder: "e.g. 9876543210",          required: false, icon: Phone       },
    { key: "email",            label: "Email",              type: "email", placeholder: "e.g. doctor@hospital.com", required: false, icon: Mail        },
    { key: "issueDate",        label: "Issue Date",         type: "date",  placeholder: "",                          required: false, icon: Calendar    },
    { key: "expiryDate",       label: "Valid Until",        type: "date",  placeholder: "",                          required: false, icon: Calendar    },
    { key: "emergencyContact", label: "Emergency Contact",  type: "tel",   placeholder: "e.g. 9876543211",          required: false, icon: ShieldAlert },
  ],
  event: [
    { key: "name",         label: "Full Name",          type: "text",  placeholder: "e.g. Arjun Verma",         required: true,  icon: User        },
    { key: "idNumber",     label: "Badge Number",       type: "text",  placeholder: "e.g. CONF-2024-099",       required: true,  icon: Hash        },
    { key: "organization", label: "Event / Conference", type: "text",  placeholder: "e.g. TechSummit 2024",     required: true,  icon: PartyPopper },
    { key: "designation",  label: "Role",               type: "text",  placeholder: "e.g. Speaker / Attendee",  required: false, icon: Briefcase   },
    { key: "department",   label: "Company / College",  type: "text",  placeholder: "e.g. IIT Delhi",           required: false, icon: Building2   },
    { key: "phone",        label: "Phone Number",       type: "tel",   placeholder: "e.g. 9876543210",          required: false, icon: Phone       },
    { key: "email",        label: "Email",              type: "email", placeholder: "e.g. arjun@email.com",     required: false, icon: Mail        },
    { key: "issueDate",    label: "Event Date",         type: "date",  placeholder: "",                          required: false, icon: Calendar    },
  ],
};

const SUBTITLE: Record<OrgType, string> = {
  school: "Student Identity Card",
  office: "Employee Identity Card",
  hospital: "Staff Identity Card",
  event: "Event Badge",
};

const ID_LABEL: Record<OrgType, string> = {
  school: "Roll No.", office: "Emp. ID", hospital: "Staff ID", event: "Badge No.",
};

// â”€â”€â”€ Chip component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Chip({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 7.5, fontWeight: 800, color, background: bg, padding: "2px 6px", borderRadius: 20, lineHeight: 1.5, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 2 }}>
      {children}
    </span>
  );
}

// â”€â”€â”€ Field row (label + value, for compact display) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FieldRow({ label, value, accent, accentColor }: { label: string; value: string; accent?: boolean; accentColor?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 6.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, lineHeight: 1 }}>{label}</div>
      <div style={{ fontSize: 9, color: accent ? (accentColor ?? "#6366f1") : "#1e293b", fontWeight: accent ? 800 : 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
        {value}
      </div>
    </div>
  );
}

// â”€â”€â”€ CardPreview â€” delegates to separate PortraitCard / LandscapeCard files â”€â”€â”€â”€
function CardPreview({ orgType, data, photo, orientation = "portrait" }: {
  orgType: OrgType; data: Record<string, string>; photo: string | null; orientation?: Orientation;
}) {
  const theme = ORG_TYPES.find(o => o.id === orgType)!;
  const cardTheme = { from: theme.from, to: theme.to, color: theme.color };
  return orientation === "landscape"
    ? <LandscapeCard data={data} photo={photo} theme={cardTheme} subtitle={SUBTITLE[orgType]} idLabel={ID_LABEL[orgType]} />
    : <PortraitCard  data={data} photo={photo} theme={cardTheme} subtitle={SUBTITLE[orgType]} idLabel={ID_LABEL[orgType]} />;
}

// â”€â”€â”€ Canvas helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// â”€â”€â”€ Canvas chip drawing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg: string, fontSize: number): number {
  ctx.font = `bold ${fontSize}px Arial`;
  const tw = ctx.measureText(text).width;
  const pw = 12; const ph = 6;
  const cw = tw + pw * 2; const ch = fontSize + ph * 2; const cr = ch / 2;
  ctx.fillStyle = bg;
  rr(ctx, x, y, cw, ch, cr);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.fillText(text, x + pw, y + ch * 0.72);
  return cw + 8; // returns width consumed (chip + gap)
}

// â”€â”€â”€ High-res canvas renderer â€” CR80 fixed dimensions, matches HTML preview â”€â”€â”€â”€
async function renderCardToCanvas(
  orgType: OrgType,
  data: Record<string, string>,
  photo: string | null,
  orientation: Orientation = "portrait",
): Promise<HTMLCanvasElement> {
  const SCALE = 3;
  const isLandscape = orientation === "landscape";
  const v = (k: string) => data[k]?.trim() ?? "";
  const theme = ORG_TYPES.find(o => o.id === orgType)!;
  const PAD = 16;

  // â”€â”€ CR80 fixed dimensions â€” match HTML card pixel sizes exactly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const W = isLandscape ? 480 : 300;
  const H = isLandscape ? 300 : 480;

  // Portrait layout constants (300x480) — header 60 / photo 144 / name 40 / details 198 / footer 38
  const P_HEADER_H        = 60;                              // compact header
  const P_PHOTO_W         = 105;                             // 35% of card width
  const P_PHOTO_H         = 130;                             // passport-style height
  const P_PHOTO_X         = Math.round((W - P_PHOTO_W) / 2);
  const P_PHOTO_Y         = P_HEADER_H + 7;                 // (144-130)/2 = 7px padding
  const P_PHOTO_SECTION_H = 144;                             // 30% of 480
  const P_NAME_Y          = P_HEADER_H + P_PHOTO_SECTION_H; // 204
  const P_NAME_H          = 40;                              // compact name section
  const P_DETAILS_Y       = P_NAME_Y + P_NAME_H;            // 244
  const P_DETAILS_H       = 198;                             // remaining space after other sections
  const P_FOOTER_H        = 38;                              // 8% of 480

  // Landscape layout constants (480Ã—300)
  const L_HEADER_H  = 75;
  const L_FOOTER_H  = 24;
  const L_BODY_Y    = L_HEADER_H;
  const L_BODY_H    = H - L_HEADER_H - L_FOOTER_H; // 201
  const L_PHOTO_W   = Math.round(W * 0.30);         // 144 (30% of 480)
  const L_DETAILS_X = L_PHOTO_W + 4;
  const L_DETAILS_W = W - L_DETAILS_X - PAD;
  const L_GRID_COL  = Math.floor((L_DETAILS_W - 18) / 2);

  const HEADER_H = isLandscape ? L_HEADER_H : P_HEADER_H;
  const FOOTER_H = isLandscape ? L_FOOTER_H : P_FOOTER_H;

  // Font sizes â€” match HTML CSS pixel values directly (SCALE handles DPI)
  const F_ORG   = 13;
  const F_SUB   = 7.5;
  const F_NAME  = isLandscape ? 19 : 16;
  const F_DESIG = isLandscape ? 10 : 8.5;
  const F_LABEL = isLandscape ? 7  : 6.5;
  const F_VALUE = isLandscape ? 9.5 : 9;
  const F_CHIP  = isLandscape ? 8  : 7.5;
  const F_SMALL = isLandscape ? 8  : 7.5;
  const F_FOOT  = 8;

  // Portrait detail rows -- label:value format, spec order
  const pDetailRows: { label: string; value: string }[] = [
    v("idNumber")    ? { label: ID_LABEL[orgType], value: v("idNumber") }    : null,
    v("class")       ? { label: "Class",           value: v("class") }       : null,
    v("bloodGroup")  ? { label: "Blood Group",     value: v("bloodGroup") }  : null,
    v("phone")       ? { label: "Phone",            value: v("phone") }       : null,
    v("address")     ? { label: "Address",          value: v("address") }     : null,
    v("department")  ? { label: "Department",       value: v("department") }  : null,
    v("dob")         ? { label: "DOB",              value: v("dob") }         : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const lgridFields: { label: string; value: string; accent?: boolean }[] = [
    v("idNumber")   ? { label: ID_LABEL[orgType], value: v("idNumber"), accent: true } : null,
    v("class")      ? { label: "Class",           value: v("class") }                  : null,
    v("department") ? { label: "Dept.",            value: v("department") }             : null,
    v("dob")        ? { label: "DOB",              value: v("dob") }                    : null,
    v("bloodGroup") ? { label: "Blood",            value: v("bloodGroup") }             : null,
    v("phone")      ? { label: "Phone",            value: v("phone") }                  : null,
  ].filter(Boolean) as { label: string; value: string; accent?: boolean }[];

  // â”€â”€ Create canvas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const canvas  = document.createElement("canvas");
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx     = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // â”€â”€ Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hGrad = ctx.createLinearGradient(0, 0, W, HEADER_H);
  hGrad.addColorStop(0, theme.from);
  hGrad.addColorStop(1, theme.to);
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, W, HEADER_H);

  if (isLandscape) {
    ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    ctx.font = `bold ${F_ORG}px Arial`;
    ctx.fillText(v("organization") || "Organization", PAD, HEADER_H * 0.68, W * 0.62);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `${F_SUB}px Arial`; ctx.textAlign = "right";
    ctx.fillText(SUBTITLE[orgType].toUpperCase(), W - PAD, HEADER_H * 0.68);
  } else {
    // Portrait header: org name centered, no logo placeholder
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `bold ${F_ORG}px Arial`;
    ctx.fillText(v("organization") || "Organization", W / 2, P_HEADER_H * 0.52, W - PAD * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `${F_SUB}px Arial`;
    ctx.fillText(SUBTITLE[orgType].toUpperCase(), W / 2, P_HEADER_H * 0.82, W - PAD * 2);
  }

  // â”€â”€ Load photo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const photoImg = photo
    ? await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = photo;
      }).catch(() => null)
    : null;

  // â”€â”€ Draw photo helper (face-biased crop, optional rounded corners) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function drawPhoto(px: number, py: number, pw: number, ph: number, radius = 0) {
    ctx.save();
    if (radius > 0) {
      rr(ctx, px, py, pw, ph, radius); ctx.fillStyle = "#e2e8f0"; ctx.fill();
      rr(ctx, px, py, pw, ph, radius); ctx.clip();
    } else {
      ctx.fillStyle = "#e2e8f0"; ctx.fillRect(px, py, pw, ph);
      ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    }
    if (photoImg) {
      const iA = photoImg.width / photoImg.height;
      const bA = pw / ph;
      let sx = 0, sy = 0, sw = photoImg.width, sh = photoImg.height;
      if (iA > bA) { sw = photoImg.height * bA; sx = (photoImg.width - sw) / 2; }
      else { sh = photoImg.width / bA; sy = Math.min(photoImg.height * 0.15, (photoImg.height - sh) / 2); }
      ctx.drawImage(photoImg, sx, sy, sw, sh, px, py, pw, ph);
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.font = `bold ${Math.round(pw * 0.18)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("PHOTO", px + pw / 2, py + ph * 0.55);
    }
    ctx.restore();
    ctx.strokeStyle = theme.color + "40"; ctx.lineWidth = radius > 0 ? 3 : 1.5;
    if (radius > 0) { rr(ctx, px, py, pw, ph, radius); ctx.stroke(); }
    else ctx.strokeRect(px, py, pw, ph);
  }

  // -- PORTRAIT layout -- photo(30%) / name(10%) / details(30%) --
  if (!isLandscape) {
    // Photo section background (30%)
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, P_HEADER_H, W, P_PHOTO_SECTION_H);
    ctx.strokeStyle = theme.color + "22"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, P_NAME_Y); ctx.lineTo(W, P_NAME_Y); ctx.stroke();

    // Passport-style photo centered
    drawPhoto(P_PHOTO_X, P_PHOTO_Y, P_PHOTO_W, P_PHOTO_H, 6);

    // Name section background (10%)
    ctx.fillStyle = "#fff"; ctx.fillRect(0, P_NAME_Y, W, P_NAME_H);
    ctx.strokeStyle = theme.color + "22"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, P_NAME_Y + P_NAME_H); ctx.lineTo(W, P_NAME_Y + P_NAME_H); ctx.stroke();

    // Name centered in name zone
    ctx.fillStyle = "#0f172a"; ctx.font = `bold ${F_NAME}px Arial`; ctx.textAlign = "center";
    ctx.fillText(v("name") || "-", W / 2, P_NAME_Y + P_NAME_H * 0.58, W - PAD * 2);
    if (v("designation")) {
      ctx.fillStyle = theme.color; ctx.font = `bold ${F_DESIG}px Arial`; ctx.textAlign = "center";
      ctx.fillText(v("designation"), W / 2, P_NAME_Y + P_NAME_H * 0.88, W - PAD * 2);
    }

    // Details section background
    ctx.fillStyle = "#fff"; ctx.fillRect(0, P_DETAILS_Y, W, P_DETAILS_H);

    // Single column: 110px label fixed + colon + value (address wraps to 2 lines)
    const LBL_W3 = 110;
    const CLN3_X = PAD + LBL_W3 + 2;
    const VAL3_X = CLN3_X + 7;
    const VAL3_W = W - VAL3_X - PAD;
    const ROW_H3 = 20;
    let detY3 = P_DETAILS_Y + 10;

    pDetailRows.slice(0, 8).forEach(pf => {
      ctx.fillStyle = "#64748b"; ctx.font = `${F_LABEL + 1}px Arial`; ctx.textAlign = "left";
      ctx.fillText(pf.label, PAD, detY3 + F_LABEL + 1, LBL_W3);
      ctx.fillStyle = "#94a3b8"; ctx.fillText(":", CLN3_X, detY3 + F_LABEL + 1);
      ctx.fillStyle = "#1e293b"; ctx.font = `bold ${F_VALUE}px Arial`;
      if (pf.label === "Address") {
        const addrLines = wrapText(ctx, pf.value, VAL3_W);
        addrLines.slice(0, 2).forEach((line, li) => {
          ctx.fillText(line, VAL3_X, detY3 + F_VALUE + li * (F_VALUE + 2), VAL3_W);
        });
        detY3 += ROW_H3 + (Math.min(addrLines.length, 2) - 1) * (F_VALUE + 2) + 2;
      } else {
        ctx.fillText(pf.value, VAL3_X, detY3 + F_VALUE, VAL3_W);
        detY3 += ROW_H3;
      }
    });
  }

  // â”€â”€ LANDSCAPE layout â€” photo-left, details-right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  else {
    // Body background
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, L_BODY_Y, W, L_BODY_H);

    // Photo col (full body height, flush edges)
    drawPhoto(0, L_BODY_Y, L_PHOTO_W, L_BODY_H);

    // Divider
    ctx.fillStyle = theme.color + "8c"; ctx.fillRect(L_PHOTO_W, L_BODY_Y, 3, L_BODY_H);

    // Estimate content height to vertically center it
    const contentH =
      Math.round(F_NAME * 1.2) + 2
      + (v("designation") ? F_DESIG + 7 : 0)
      + (lgridFields.length > 0 ? Math.ceil(lgridFields.length / 2) * (F_LABEL + F_VALUE + 5) + 5 : 0)
      + (v("email") ? F_SMALL + 6 : 0)
      + (v("address") ? F_SMALL * 2.8 + 6 : 0)
      + (v("emergencyContact") ? F_SMALL + 6 : 0);
    let dY = L_BODY_Y + Math.max(PAD, Math.round((L_BODY_H - contentH) / 2));

    // Name
    ctx.fillStyle = "#0f172a"; ctx.font = `bold ${F_NAME}px Arial`; ctx.textAlign = "left";
    ctx.fillText(v("name") || "â€”", L_DETAILS_X + PAD, dY + F_NAME, L_DETAILS_W);
    dY += Math.round(F_NAME * 1.2) + 2;

    // Designation
    if (v("designation")) {
      ctx.fillStyle = theme.color; ctx.font = `bold ${F_DESIG}px Arial`;
      ctx.fillText(v("designation"), L_DETAILS_X + PAD, dY + F_DESIG, L_DETAILS_W);
      dY += F_DESIG + 7;
    }

    // 2-col grid
    if (lgridFields.length > 0) {
      const ROW_H = F_LABEL + F_VALUE + 5;
      lgridFields.forEach((f, i) => {
        const col = i % 2; const row = Math.floor(i / 2);
        const fx = col === 0 ? L_DETAILS_X + PAD : L_DETAILS_X + PAD + L_GRID_COL + 18;
        const fy = dY + row * ROW_H;
        ctx.fillStyle = "#94a3b8"; ctx.font = `${F_LABEL}px Arial`; ctx.textAlign = "left";
        ctx.fillText(f.label.toUpperCase(), fx, fy + F_LABEL, L_GRID_COL);
        ctx.fillStyle = f.accent ? theme.color : "#1e293b"; ctx.font = `bold ${F_VALUE}px Arial`;
        ctx.fillText(f.value, fx, fy + F_LABEL + F_VALUE + 2, L_GRID_COL);
      });
      dY += Math.ceil(lgridFields.length / 2) * ROW_H + 5;
    }

    // Email
    if (v("email")) {
      ctx.fillStyle = "#64748b"; ctx.font = `${F_SMALL}px Arial`; ctx.textAlign = "left";
      ctx.fillText(`âœ‰ ${v("email")}`, L_DETAILS_X + PAD, dY + F_SMALL, L_DETAILS_W);
      dY += F_SMALL + 6;
    }

    // Address
    if (v("address")) {
      ctx.fillStyle = "#475569"; ctx.font = `${F_SMALL}px Arial`; ctx.textAlign = "left";
      const addrLines = wrapText(ctx, v("address"), L_DETAILS_W - 14);
      ctx.fillText("ðŸ“", L_DETAILS_X + PAD, dY + F_SMALL, 12);
      addrLines.slice(0, 2).forEach((line, li) => {
        ctx.fillText(line, L_DETAILS_X + PAD + 14, dY + F_SMALL + li * (F_SMALL * 1.4), L_DETAILS_W - 14);
      });
      dY += F_SMALL * 1.4 * Math.min(addrLines.length, 2) + 6;
    }

    // Emergency
    if (v("emergencyContact")) {
      ctx.fillStyle = "#c2410c"; ctx.font = `bold ${F_SMALL}px Arial`; ctx.textAlign = "left";
      ctx.fillText(`SOS: ${v("emergencyContact")}`, L_DETAILS_X + PAD, dY + F_SMALL, L_DETAILS_W);
    }
  }

  // -- Footer (8%) — dates only, no signature --
  const footY = H - FOOTER_H;
  const fGrad = ctx.createLinearGradient(0, footY, W, H);
  fGrad.addColorStop(0, theme.from); fGrad.addColorStop(1, theme.to);
  ctx.fillStyle = fGrad; ctx.fillRect(0, footY, W, FOOTER_H);

  ctx.fillStyle = "rgba(255,255,255,0.70)"; ctx.font = `${F_FOOT}px Arial`; ctx.textAlign = "left";
  ctx.fillText(v("issueDate") ? `Issue: ${v("issueDate")}` : "IDForge AI", PAD, footY + FOOTER_H * 0.62);
  if (v("expiryDate")) {
    ctx.fillStyle = "#fff"; ctx.font = `bold ${F_FOOT}px Arial`; ctx.textAlign = "right";
    ctx.fillText(`Valid: ${v("expiryDate")}`, W - PAD, footY + FOOTER_H * 0.62);
  }
  return canvas;
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface DirectEntryModeProps { onBack: () => void; }

export default function DirectEntryMode({ onBack }: DirectEntryModeProps) {
  const [step, setStep]           = useState<"orgType" | "fill">("orgType");
  const [orgType, setOrgType]     = useState<OrgType | null>(null);
  const [formData, setFormData]   = useState<Record<string, string>>({});
  const [photo, setPhoto]         = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [cameraOpen, setCameraOpen]   = useState(false);
  const [cameraCaptured, setCameraCaptured] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomMult, setZoomMult]   = useState(1.0);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const photoInputRef    = useRef<HTMLInputElement>(null);
  const cameraInputRef   = useRef<HTMLInputElement>(null);
  const videoRef         = useRef<HTMLVideoElement>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const previewAreaRef   = useRef<HTMLDivElement>(null);

  // â”€â”€ Auto-fit: track preview container size â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setContainerSize({ w: r.width, h: r.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // CR80 card dimensions â€” portrait 300Ã—480, landscape 480Ã—300
  const CARD_W = orientation === "landscape" ? 480 : 300;
  const CARD_H = orientation === "landscape" ? 300 : 480;
  const autoScale = containerSize.w > 50
    ? Math.min((containerSize.w * 0.85) / CARD_W, (containerSize.h * 0.85) / CARD_H)
    : 1.0;
  const displayScale = Math.max(0.3, Math.min(4, autoScale * zoomMult));

  const fields = orgType ? FIELDS[orgType] : [];
  const requiredFilled = fields.filter(f => f.required).every(f => formData[f.key]?.trim());

  // â”€â”€ Photo handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePhotoFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handlePhotoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) handlePhotoFile(file);
  };

  // â”€â”€ Camera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startCamera = async () => {
    setCameraError(null); setCameraCaptured(false);
    // getUserMedia requires HTTPS (or localhost). Fall back to native <input capture> on plain HTTP.
    if (!navigator.mediaDevices?.getUserMedia || (location.protocol !== "https:" && location.hostname !== "localhost")) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      }, 100);
    } catch {
      // Permission denied or hardware unavailable — fall back to native picker
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    const c = document.createElement("canvas");
    c.width = vid.videoWidth || 640; c.height = vid.videoHeight || 480;
    c.getContext("2d")!.drawImage(vid, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.92)); setCameraCaptured(true);
  };

  const retakePhoto = () => {
    setCameraCaptured(false);
    if (videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; videoRef.current.play().catch(() => {}); }
  };

  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCameraOpen(false); setCameraCaptured(false);
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const setField = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  // â”€â”€ Download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const downloadPNG = async () => {
    if (!orgType) return;
    setDownloading(true);
    try {
      const canvas = await renderCardToCanvas(orgType, formData, photo, orientation);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${formData.name || "id-card"}-${orientation}.png`; a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) { console.error("Download failed:", err); }
    finally { setDownloading(false); }
  };

  const selectOrg = (id: OrgType) => { setOrgType(id); setFormData({}); setPhoto(null); setStep("fill"); };

  // â”€â”€â”€ STEP 1: Org Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === "orgType") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8">
        <div className="w-full max-w-3xl mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to mode selection
          </button>
        </div>
        <div className="text-center mb-8 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-4">
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-bold text-brand-400">Step 1 of 2 â€” Choose Your Organization Type</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">What type of ID card do you want to create?</h1>
          <p className="text-white/40 text-sm">Select the option that best matches your organization.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {ORG_TYPES.map(org => (
            <motion.button key={org.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => selectOrg(org.id)}
              className="relative flex items-start gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] text-left transition-all group overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                style={{ background: `radial-gradient(circle at 20% 50%, ${org.color}15 0%, transparent 70%)` }} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${org.from}, ${org.to})`, boxShadow: `0 8px 24px ${org.color}40` }}>
                <org.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-black text-white mb-1">{org.label}</div>
                <div className="text-sm text-white/50 mb-2 leading-relaxed">{org.desc}</div>
                <div className="text-[11px] text-white/25 italic">e.g. {org.example}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 shrink-0 mt-4 transition-all group-hover:translate-x-1" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // â”€â”€â”€ STEP 2: Form + Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const selectedOrg = ORG_TYPES.find(o => o.id === orgType)!;

  return (
    <>
    <div className="flex h-full gap-4 overflow-hidden">

      {/* â”€â”€ LEFT: Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-80 xl:w-96 flex flex-col glass-card rounded-2xl border border-white/[0.07] overflow-hidden shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => setStep("orgType")}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${selectedOrg.from}, ${selectedOrg.to})` }}>
              <selectedOrg.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-white">{selectedOrg.label}</div>
              <div className="text-[10px] text-white/30">Fill in the details below</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="h-1 rounded-full flex-1" style={{ background: `linear-gradient(90deg, ${selectedOrg.from}, ${selectedOrg.to})` }} />
            <div className={`h-1 rounded-full flex-1 transition-all ${requiredFilled ? "opacity-100" : "opacity-25"}`}
              style={{ background: `linear-gradient(90deg, ${selectedOrg.from}, ${selectedOrg.to})` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/40">Step 2: Fill Details</span>
            <span className="text-[9px] text-white/40">Step 3: Download</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Photo */}
          <div>
            <div className="text-[10px] font-black text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Profile Photo
            </div>
            {photo ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 group aspect-[3/4] max-h-48">
                <img src={photo} alt="Photo" className="w-full h-full object-cover" style={{ objectPosition: "center 15%" }} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-all"><RefreshCw className="w-3 h-3" /> Change</button>
                  <button onClick={() => setPhoto(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/60 text-white text-xs font-bold hover:bg-red-500/80 transition-all"><X className="w-3 h-3" /> Remove</button>
                </div>
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            ) : (
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed transition-all p-4 text-center space-y-3 ${dragOver ? "border-brand-500/60 bg-brand-500/10" : "border-white/10 bg-white/[0.02]"}`}>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-xs text-white/40">Drag photo here, or</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => photoInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </button>
                  <button onClick={startCamera}
                    className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-white text-xs font-bold transition-all"
                    style={{ background: `linear-gradient(135deg, ${selectedOrg.from}, ${selectedOrg.to})` }}>
                    <Camera className="w-3.5 h-3.5" /> Camera
                  </button>
                </div>
                {cameraError && <p className="text-[10px] text-red-400">{cameraError}</p>}
                <p className="text-[10px] text-white/20">JPG, PNG Â· Optional</p>
              </div>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoInput} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoInput} />
            {photo && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => photoInputRef.current?.click()} className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"><Upload className="w-3 h-3" /> Upload New</button>
                <button onClick={startCamera} className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"><Camera className="w-3 h-3" /> Retake</button>
              </div>
            )}
          </div>

          {/* Fields */}
          <div>
            <div className="text-[10px] font-black text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Card Details
            </div>
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 mb-1.5">
                    <field.icon className="w-3 h-3" />
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key] ?? ""}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-500/50 focus:bg-white/[0.06] transition-all"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download */}
        <div className="p-4 border-t border-white/[0.05] shrink-0 space-y-2">
          {!requiredFilled && <p className="text-[10px] text-white/30 text-center">Fill required fields (*) to enable download</p>}
          <button onClick={downloadPNG} disabled={!requiredFilled || downloading}
            className="w-full h-11 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={requiredFilled ? { background: `linear-gradient(135deg, ${selectedOrg.from}, ${selectedOrg.to})`, boxShadow: `0 8px 24px ${selectedOrg.color}40` } : { background: "#1e293b" }}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Generatingâ€¦" : `Download ${orientation === "portrait" ? "Portrait" : "Landscape"} PNG`}
          </button>
        </div>
      </div>

      {/* â”€â”€ RIGHT: Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

        {/* Preview toolbar */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-brand-400 to-violet-500" />
            <h3 className="text-sm font-bold text-white">Live Preview</h3>
            <span className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">Real-time</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Orientation toggle */}
            <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-xl p-0.5 border border-white/[0.07]">
              {(["portrait", "landscape"] as const).map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${orientation === o ? "bg-brand-500/20 text-brand-300" : "text-white/30 hover:text-white/60"}`}>
                  {o === "portrait" ? <RectangleVertical className="w-3 h-3" /> : <RectangleHorizontal className="w-3 h-3" />}
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
            {requiredFilled && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Check className="w-3.5 h-3.5" /> Ready
              </div>
            )}
          </div>
        </div>

        {/* Preview area â€” auto-fit card */}
        <div ref={previewAreaRef}
          className="flex-1 glass-card rounded-2xl border border-white/[0.07] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-grid opacity-10" />

          {/* Scaled card */}
          <motion.div
            style={{ transform: `scale(${displayScale})`, transformOrigin: "center center" }}
            className="relative z-10"
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {orgType && <CardPreview orgType={orgType} data={formData} photo={photo} orientation={orientation} />}
          </motion.div>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 bg-black/50 backdrop-blur-md rounded-xl px-1.5 py-1 border border-white/10 select-none">
            <button onClick={() => setZoomMult(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}
              className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors text-base font-bold leading-none">
              âˆ’
            </button>
            <span className="text-[10px] text-white/40 w-10 text-center tabular-nums">{Math.round(displayScale * 100)}%</span>
            <button onClick={() => setZoomMult(z => Math.min(3, +(z + 0.1).toFixed(1)))}
              className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors text-base font-bold leading-none">
              +
            </button>
            <div className="w-px h-3 bg-white/10 mx-0.5" />
            <button onClick={() => setZoomMult(1)}
              className="text-[9px] text-white/30 hover:text-white px-1 transition-colors font-bold">
              FIT
            </button>
          </div>

          {/* Required field hints */}
          {!requiredFilled && (
            <div className="absolute bottom-12 left-0 right-0 flex flex-wrap justify-center gap-2 px-4 z-20">
              {fields.filter(f => f.required && !formData[f.key]?.trim()).map(f => (
                <span key={f.key} className="text-[10px] text-white/30 bg-black/30 border border-white/[0.06] px-2 py-1 rounded-full backdrop-blur-sm">
                  {f.label} needed
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="glass-card rounded-xl border border-white/[0.07] p-4 shrink-0">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-2">Tips</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: RectangleVertical, tip: "Portrait: photo centered at top, all details stacked below â€” CR80 54Ã—85.6mm" },
              { icon: RectangleHorizontal, tip: "Landscape: photo on the left, all fields in a grid on the right â€” CR80 85.6Ã—54mm" },
              { icon: Camera,   tip: "Clear front-facing photo â€” face crops to center automatically" },
              { icon: Download, tip: "Downloads a print-ready high-resolution PNG at 300dpi quality" },
            ].map(({ icon: Icon, tip }, i) => (
              <div key={i} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-white/30 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* â”€â”€ Webcam Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
    <AnimatePresence>
      {cameraOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeCamera(); }}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="glass-card rounded-2xl border border-white/[0.08] p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Take a Photo</h3>
                <p className="text-xs text-white/40 mt-0.5">Position face in the center and click Capture</p>
              </div>
              <button onClick={closeCamera} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className={`w-full h-full object-cover ${cameraCaptured ? "hidden" : ""}`} autoPlay playsInline muted />
              {cameraCaptured && photo && <img src={photo} alt="Captured" className="w-full h-full object-cover" />}
              {!cameraCaptured && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-40 rounded-full border-2 border-dashed border-white/30" />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {!cameraCaptured ? (
                <>
                  <button onClick={closeCamera} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                  <button onClick={capturePhoto} className="flex-1 h-11 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all"
                    style={{ background: `linear-gradient(135deg, ${selectedOrg.from}, ${selectedOrg.to})` }}>
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                </>
              ) : (
                <>
                  <button onClick={retakePhoto} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button onClick={closeCamera} className="flex-1 h-11 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all"
                    style={{ background: `linear-gradient(135deg, ${selectedOrg.from}, ${selectedOrg.to})` }}>
                    <Check className="w-4 h-4" /> Use Photo
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
