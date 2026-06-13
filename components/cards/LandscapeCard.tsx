"use client";
import { User } from "lucide-react";

interface Theme { from: string; to: string; color: string; }
interface Props {
  data: Record<string, string>;
  photo: string | null;
  theme: Theme;
  subtitle: string;
  idLabel: string;
}

// CR80 Landscape — 480×300px
// Header(25%=75px) → [Photo(30%=144px) | Details(70%)] → Footer(24px)
// Barcode sits at bottom of photo column
export default function LandscapeCard({ data, photo, theme, subtitle, idLabel }: Props) {
  const v = (k: string) => data[k]?.trim() ?? "";

  const HEADER_H = 75;  // 25% of 300
  const FOOTER_H = 24;
  const BODY_H   = 300 - HEADER_H - FOOTER_H; // 201px
  const PHOTO_W  = 144; // 30% of 480
  const PHOTO_H  = Math.round(BODY_H * 0.72); // ~145px (face + shoulders)

  const orgInitial = (v("organization") || "S").charAt(0).toUpperCase();

  const detailFields: { label: string; value: string; accent?: boolean }[] = [
    v("idNumber")   ? { label: idLabel,        value: v("idNumber"),    accent: true } : null,
    v("class")      ? { label: "Class",         value: v("class") }                   : null,
    v("department") ? { label: "Department",    value: v("department") }              : null,
    v("dob")        ? { label: "Date of Birth", value: v("dob") }                    : null,
    v("bloodGroup") ? { label: "Blood Group",   value: v("bloodGroup") }             : null,
    v("designation")? { label: "Role",          value: v("designation") }            : null,
  ].filter(Boolean) as { label: string; value: string; accent?: boolean }[];

  return (
    <div style={{
      width: 480, height: 300,
      borderRadius: 12, overflow: "hidden",
      fontFamily: "'Segoe UI', system-ui, Arial, sans-serif",
      boxShadow: "0 20px 56px rgba(0,0,0,0.42)",
      background: "#fff",
      flexShrink: 0,
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Header 25% (~75px): emblem + org + identity badge ─── */}
      <div style={{
        background: `linear-gradient(120deg, ${theme.from} 0%, ${theme.to} 100%)`,
        height: HEADER_H,
        padding: "10px 18px",
        display: "flex", alignItems: "center", gap: 14,
        flexShrink: 0,
      }}>
        {/* Emblem circle */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>{orgInitial}</span>
        </div>
        {/* Org name + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {v("organization") || "Organization Name"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 8.5, marginTop: 3, letterSpacing: 1.8, textTransform: "uppercase" }}>
            {subtitle}
          </div>
        </div>
        {/* Identity card badge */}
        <div style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 6, padding: "5px 12px", flexShrink: 0, textAlign: "center",
        }}>
          <div style={{ color: "#fff", fontSize: 8, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Identity</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 6.5, letterSpacing: 0.5 }}>Card</div>
        </div>
      </div>

      {/* ── Body: [Photo col 30%] | [Details col 70%] ──────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Photo column — 30% width, gradient bg */}
        <div style={{
          width: PHOTO_W, flexShrink: 0,
          background: `linear-gradient(180deg, ${theme.from}22 0%, ${theme.to}14 100%)`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between",
          padding: "10px 10px 6px",
          borderRight: `2px solid ${theme.color}30`,
        }}>
          {/* Photo frame */}
          <div style={{
            width: PHOTO_W - 24, height: PHOTO_H,
            borderRadius: 8, overflow: "hidden",
            border: `2px solid ${theme.color}55`,
            background: "#dde3ea",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            {photo ? (
              <img
                src={photo} alt="Photo"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <User style={{ color: "#94a3b8", width: 28, height: 28 }} />
                <span style={{ fontSize: 6.5, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>Photo</span>
              </div>
            )}
          </div>

          {/* Barcode at bottom of photo column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <div style={{ display: "flex", gap: 0.7, alignItems: "stretch", height: 16 }}>
              {[2,1,2,1,3,1,1,2,1,3,1,2,1,1,2,3,1,2,1,2].map((w, i) => (
                <div key={i} style={{ width: w, background: i % 2 === 0 ? theme.from : "transparent" }} />
              ))}
            </div>
            <div style={{ fontSize: 5.5, color: "#94a3b8", letterSpacing: 0.3, textAlign: "center" }}>
              {(v("idNumber") || "XXXXXXXX").slice(0, 12)}
            </div>
          </div>
        </div>

        {/* Details column — 70% */}
        <div style={{
          flex: 1, padding: "10px 14px 8px",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          minWidth: 0, overflow: "hidden",
          background: "#fff",
        }}>

          {/* Name + designation */}
          <div style={{ borderBottom: `1px solid ${theme.color}25`, paddingBottom: 6 }}>
            <div style={{
              fontSize: 19, fontWeight: 900, color: "#0f172a", lineHeight: 1.15,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {v("name") || <span style={{ color: "#cbd5e1", fontWeight: 400, fontSize: 14 }}>Student Name</span>}
            </div>
            {v("designation") && (
              <div style={{
                fontSize: 9, color: theme.color, fontWeight: 700, marginTop: 2,
                textTransform: "uppercase", letterSpacing: 0.8,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {v("designation")}
              </div>
            )}
          </div>

          {/* 2-col detail grid */}
          {detailFields.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "4px 12px", flex: 1,
              alignContent: "start", paddingTop: 6,
            }}>
              {detailFields.map(f => (
                <div key={f.label} style={{ minWidth: 0, paddingBottom: 2 }}>
                  <div style={{ fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>
                    {f.label}
                  </div>
                  <div style={{
                    fontSize: 9.5, lineHeight: 1.4,
                    fontWeight: f.accent ? 800 : 600,
                    color: f.accent ? theme.color : "#1e293b",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contact: phone, email, address */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", marginTop: 4 }}>
            {v("phone") && (
              <span style={{ fontSize: 8, color: "#475569", whiteSpace: "nowrap" }}>
                <span style={{ color: theme.color }}>📞</span> {v("phone")}
              </span>
            )}
            {v("email") && (
              <span style={{ fontSize: 7.5, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                ✉ {v("email")}
              </span>
            )}
            {v("address") && (
              <div style={{
                fontSize: 7.5, color: "#64748b", width: "100%", lineHeight: 1.35,
                maxHeight: `${2 * 1.35 * 7.5}px`, overflow: "hidden",
              }}>
                📍 {v("address")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(120deg, ${theme.from} 0%, ${theme.to} 100%)`,
        height: FOOTER_H,
        padding: "0 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 7 }}>
          {v("issueDate") ? `Issued: ${v("issueDate")}` : "IDForge AI"}
        </span>
        {v("expiryDate") && (
          <span style={{ color: "#fff", fontSize: 7.5, fontWeight: 700 }}>Valid: {v("expiryDate")}</span>
        )}
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 6.5 }}>Secure Identity</span>
      </div>
    </div>
  );
}
