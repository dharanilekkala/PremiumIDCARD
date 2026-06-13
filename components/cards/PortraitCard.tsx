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

// CR80 Portrait — 300×480px
// Header(15%=72px) → Photo(30%=144px) → Name(10%=48px) → Details(30%=144px) → Footer(15%=72px)
export default function PortraitCard({ data, photo, theme, subtitle, idLabel }: Props) {
  const v = (k: string) => data[k]?.trim() ?? "";

  const orgInitial = (v("organization") || "S").charAt(0).toUpperCase();

  // Passport-style photo: portrait-oriented, centered
  const PHOTO_W = 96;
  const PHOTO_H = 118;  // fits in 144px section (13px top + 118 + 13px bottom)

  // Detail rows — label : value format, left-aligned, spec order
  const detailRows: { label: string; value: string }[] = [
    v("idNumber")    ? { label: idLabel,        value: v("idNumber") }    : null,
    v("class")       ? { label: "Class",         value: v("class") }      : null,
    v("bloodGroup")  ? { label: "Blood Group",   value: v("bloodGroup") } : null,
    v("phone")       ? { label: "Phone",         value: v("phone") }      : null,
    v("address")     ? { label: "Address",       value: v("address") }    : null,
    v("department")  ? { label: "Department",    value: v("department") } : null,
    v("dob")         ? { label: "DOB",           value: v("dob") }        : null,
    v("designation") ? { label: "Role",          value: v("designation") } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const QR_DOTS = [1,1,1,0,1, 1,0,1,0,0, 1,1,1,0,1, 0,0,0,1,0, 1,0,1,1,1];

  return (
    <div style={{
      width: 300, height: 480,
      borderRadius: 12, overflow: "hidden",
      fontFamily: "'Segoe UI', system-ui, Arial, sans-serif",
      boxShadow: "0 20px 56px rgba(0,0,0,0.42)",
      background: "#fff",
      flexShrink: 0,
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Header 15% = 72px ── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        height: 72, flexShrink: 0,
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{orgInitial}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: "#fff", fontWeight: 900, fontSize: 11.5, lineHeight: 1.25,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {v("organization") || "Organization Name"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 7, marginTop: 3, letterSpacing: 1.6, textTransform: "uppercase" }}>
            {subtitle}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 6.5, marginTop: 2 }}>
            Student Identity Card
          </div>
        </div>
      </div>

      {/* ── Photo 30% = 144px — passport style, centered ── */}
      <div style={{
        height: 144, flexShrink: 0,
        background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px solid ${theme.color}22`,
      }}>
        <div style={{
          width: PHOTO_W, height: PHOTO_H,
          borderRadius: 6, overflow: "hidden",
          border: `2.5px solid ${theme.color}55`,
          background: "#dde3ea",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 14px rgba(0,0,0,0.15), 0 0 0 3px ${theme.color}18`,
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
      </div>

      {/* ── Name 10% = 48px ── */}
      <div style={{
        height: 48, flexShrink: 0,
        background: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 14px",
        borderBottom: `1.5px solid ${theme.color}22`,
      }}>
        <div style={{
          fontSize: 15, fontWeight: 900, color: "#0f172a",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
          lineHeight: 1.2,
        }}>
          {v("name") || <span style={{ color: "#cbd5e1", fontWeight: 400, fontSize: 12 }}>Student Name</span>}
        </div>
        {v("designation") && (
          <div style={{
            fontSize: 7, color: theme.color, fontWeight: 700, marginTop: 2,
            textTransform: "uppercase", letterSpacing: 0.8,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
          }}>
            {v("designation")}
          </div>
        )}
      </div>

      {/* ── Details 30% = 144px — label : value rows, left-aligned ── */}
      <div style={{
        height: 144, flexShrink: 0,
        background: "#fff",
        padding: "8px 14px 6px",
        overflow: "hidden",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {detailRows.slice(0, 6).map(f => (
          <div key={f.label} style={{
            display: "flex", alignItems: "baseline", gap: 0, minHeight: 20,
          }}>
            <span style={{
              fontSize: 7.5, color: "#64748b", fontWeight: 600,
              width: 72, flexShrink: 0, lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {f.label}
            </span>
            <span style={{ fontSize: 7.5, color: "#94a3b8", marginRight: 5, flexShrink: 0 }}>:</span>
            <span style={{
              fontSize: 8.5, color: "#1e293b", fontWeight: 700, lineHeight: 1.5, flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Footer 15% = 72px — gradient with QR bottom-right ── */}
      <div style={{
        height: 72, flexShrink: 0,
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Dates */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 7, lineHeight: 1 }}>
            {v("issueDate") ? `Issue Date: ${v("issueDate")}` : "IDForge AI · Secure Identity"}
          </span>
          {v("expiryDate")
            ? <span style={{ color: "#fff", fontSize: 7.5, fontWeight: 700, lineHeight: 1 }}>Valid Until: {v("expiryDate")}</span>
            : <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 6.5, lineHeight: 1 }}>Not for commercial use</span>
          }
        </div>

        {/* QR placeholder — 5×5 grid */}
        <div style={{
          width: 48, height: 48, flexShrink: 0,
          background: "#fff", borderRadius: 5, padding: 4,
          display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}>
          {QR_DOTS.map((c, i) => (
            <div key={i} style={{ background: c ? "#1e293b" : "transparent", borderRadius: 0.5 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
