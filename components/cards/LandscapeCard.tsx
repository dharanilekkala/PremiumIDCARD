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
// Header(75px) → [Photo(144px) | Details(flex)] → Footer(24px)
export default function LandscapeCard({ data, photo, theme, subtitle, idLabel }: Props) {
  const v = (k: string) => data[k]?.trim() ?? "";

  const HEADER_H = 75;
  const FOOTER_H = 24;
  const BODY_H   = 300 - HEADER_H - FOOTER_H; // 201px
  const PHOTO_W  = 144;
  const PHOTO_H  = Math.round(BODY_H * 0.85); // ~171px (face + shoulders)

  const orgInitial = (v("organization") || "O").charAt(0).toUpperCase();

  // Detail grid fields — excludes address (handled separately as full-width row)
  const detailFields: { label: string; value: string; accent?: boolean }[] = ([
    v("idNumber")    ? { label: idLabel,        value: v("idNumber"),    accent: true } : null,
    v("class")       ? { label: "Class",         value: v("class") }                   : null,
    v("fatherName")  ? { label: "Father Name",    value: v("fatherName") }              : null,
    v("department")  ? { label: "Department",     value: v("department") }              : null,
    v("bloodGroup")  ? { label: "Blood Group",    value: v("bloodGroup") }             : null,
    v("phone")       ? { label: "Phone",         value: v("phone") }                  : null,
    v("dob")         ? { label: "DOB",           value: v("dob") }                    : null,
    v("email")       ? { label: "Email",         value: v("email") }                  : null,
  ] as ({ label: string; value: string; accent?: boolean } | null)[]).filter(Boolean) as { label: string; value: string; accent?: boolean }[];

  const labelStyle: React.CSSProperties = {
    fontSize: 7.5, color: "#64748b", fontWeight: 600,
    lineHeight: 1.4,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  };

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

      {/* ── Header 75px ─────────────────────────────────────────── */}
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
          background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.40)",
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
          <div style={{ color: "rgba(255,255,255,0.80)", fontSize: 8.5, marginTop: 3, letterSpacing: 1.8, textTransform: "uppercase" }}>
            {subtitle}
          </div>
        </div>
        {/* Badge */}
        <div style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.30)",
          borderRadius: 6, padding: "5px 12px", flexShrink: 0, textAlign: "center",
        }}>
          <div style={{ color: "#fff", fontSize: 8, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>Identity</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 6.5, letterSpacing: 0.5 }}>Card</div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Photo column — 144px */}
        <div style={{
          width: PHOTO_W, flexShrink: 0,
          background: `linear-gradient(180deg, ${theme.from}22 0%, ${theme.to}14 100%)`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "10px 10px 10px",
          borderRight: `2px solid ${theme.color}30`,
        }}>
          <div style={{
            width: PHOTO_W - 24, height: PHOTO_H,
            borderRadius: 8, overflow: "hidden",
            border: `2px solid ${theme.color}55`,
            background: "#dde3ea",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            {photo ? (
              <img src={photo} alt="Photo"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <User style={{ color: "#94a3b8", width: 28, height: 28 }} />
                <span style={{ fontSize: 6.5, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>Photo</span>
              </div>
            )}
          </div>
        </div>

        {/* Details column */}
        <div style={{
          flex: 1, padding: "10px 14px 8px",
          display: "flex", flexDirection: "column",
          minWidth: 0, overflow: "hidden",
          background: "#fff",
          gap: 0,
        }}>

          {/* Name + designation */}
          <div style={{ borderBottom: `1px solid ${theme.color}22`, paddingBottom: 5, flexShrink: 0 }}>
            <div style={{
              fontSize: 18, fontWeight: 900, color: "#0f172a", lineHeight: 1.15,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {v("name") || <span style={{ color: "#cbd5e1", fontWeight: 400, fontSize: 14 }}>Student Name</span>}
            </div>
            {v("designation") && (
              <div style={{
                fontSize: 8.5, color: theme.color, fontWeight: 700, marginTop: 2,
                textTransform: "uppercase", letterSpacing: 0.8,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {v("designation")}
              </div>
            )}
          </div>

          {/* Single-col grid: [label 140px] [value] — 1 field per row */}
          {detailFields.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              rowGap: 8,
              columnGap: 8,
              paddingTop: 7, flex: 1, alignContent: "start",
              overflow: "hidden",
            }}>
              {detailFields.flatMap((f, i) => [
                <span key={`${i}l`} style={labelStyle}>{f.label}</span>,
                <span key={`${i}v`} style={{
                  fontSize: 8, fontWeight: f.accent ? 700 : 500,
                  color: f.accent ? theme.color : "#1e293b",
                  lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  : {f.value}
                </span>,
              ])}
            </div>
          )}

          {/* Address — same 2-col grid, value wraps 2 lines */}
          {v("address") && (
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", columnGap: 8, marginTop: 5, alignItems: "flex-start", flexShrink: 0 }}>
              <span style={labelStyle}>Address</span>
              <span style={{
                fontSize: 8, fontWeight: 500, color: "#475569", lineHeight: 1.4,
                display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
                overflow: "hidden",
              } as React.CSSProperties}>
                : {v("address")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer 24px ──────────────────────────────────────────── */}
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
        <span style={{ color: "rgba(255,255,255,0.50)", fontSize: 6.5 }}>Secure Identity</span>
      </div>
    </div>
  );
}
