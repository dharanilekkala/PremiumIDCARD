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

  // Passport-style photo — 20% increase (96→110, 118→132), fits in 144px section with 6px padding
  const PHOTO_W = 110;
  const PHOTO_H = 132;

  // Detail rows in spec order
  const detailRows: { label: string; value: string }[] = [
    v("idNumber")    ? { label: idLabel,        value: v("idNumber") }    : null,
    v("class")       ? { label: "Class",         value: v("class") }      : null,
    v("bloodGroup")  ? { label: "Blood Group",   value: v("bloodGroup") } : null,
    v("phone")       ? { label: "Phone",         value: v("phone") }      : null,
    v("address")     ? { label: "Address",       value: v("address") }    : null,
    v("department")  ? { label: "Department",    value: v("department") } : null,
    v("dob")         ? { label: "DOB",           value: v("dob") }        : null,
  ].filter(Boolean) as { label: string; value: string }[];

  // Pair rows for 2-column grid
  const pairedRows: [typeof detailRows[0], typeof detailRows[0] | null][] = [];
  for (let i = 0; i < detailRows.length; i += 2) {
    pairedRows.push([detailRows[i], detailRows[i + 1] ?? null]);
  }

  const colCellStyle: React.CSSProperties = {
    flex: 1, display: "flex", alignItems: "flex-start", minWidth: 0,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 7, color: "#64748b", fontWeight: 600,
    width: "42%", flexShrink: 0, lineHeight: 1.5,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  };
  const colonStyle: React.CSSProperties = {
    fontSize: 7, color: "#94a3b8", flexShrink: 0, marginRight: 2,
  };
  const valueStyle: React.CSSProperties = {
    fontSize: 8, color: "#1e293b", fontWeight: 700, lineHeight: 1.5,
    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  };

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

      {/* Header 15% = 72px — logo circle + school name centered */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        height: 72, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "0 14px",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>{orgInitial}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
          <div style={{
            color: "#fff", fontWeight: 900, fontSize: 11,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: 190, lineHeight: 1.25,
          }}>
            {v("organization") || "Organization Name"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 7, marginTop: 2, letterSpacing: 1.4, textTransform: "uppercase" }}>
            {subtitle}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 6.5, marginTop: 1 }}>
            Student Identity Card
          </div>
        </div>
      </div>

      {/* Photo 30% = 144px — passport style, centered, larger */}
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
              <User style={{ color: "#94a3b8", width: 30, height: 30 }} />
              <span style={{ fontSize: 6.5, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>Photo</span>
            </div>
          )}
        </div>
      </div>

      {/* Name 10% = 48px */}
      <div style={{
        height: 48, flexShrink: 0,
        background: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 12px",
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

      {/* Details 30% = 144px — 2-column grid, label 40% / value 60% per column */}
      <div style={{
        height: 144, flexShrink: 0,
        background: "#fff",
        padding: "8px 12px 6px",
        overflow: "hidden",
        display: "flex", flexDirection: "column", gap: 5,
      }}>
        {pairedRows.slice(0, 4).map((pair, ri) => (
          <div key={ri} style={{ display: "flex", gap: 8, minHeight: 26 }}>
            <div style={colCellStyle}>
              <span style={labelStyle}>{pair[0].label}</span>
              <span style={colonStyle}>:</span>
              <span style={valueStyle}>{pair[0].value}</span>
            </div>
            {pair[1] ? (
              <div style={colCellStyle}>
                <span style={labelStyle}>{pair[1].label}</span>
                <span style={colonStyle}>:</span>
                <span style={valueStyle}>{pair[1].value}</span>
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>
        ))}
      </div>

      {/* Footer 15% = 72px — dates space-between, no QR */}
      <div style={{
        height: 72, flexShrink: 0,
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        padding: "0 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 7, lineHeight: 1 }}>
            {v("issueDate") ? `Issue Date: ${v("issueDate")}` : "IDForge AI · Secure Identity"}
          </span>
          {v("expiryDate")
            ? <span style={{ color: "#fff", fontSize: 7.5, fontWeight: 700, lineHeight: 1 }}>Valid Until: {v("expiryDate")}</span>
            : <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 6.5, lineHeight: 1 }}>Not for commercial use</span>
          }
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 6, lineHeight: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
            ID Card
          </span>
          <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 5.5, lineHeight: 1 }}>
            Secure · Official
          </span>
        </div>
      </div>
    </div>
  );
}
