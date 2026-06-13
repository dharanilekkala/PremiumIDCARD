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
// Header(60px) → Photo(144px) → Name(40px) → Details(flex~198px) → Footer(38px)
export default function PortraitCard({ data, photo, theme, subtitle, idLabel }: Props) {
  const v = (k: string) => data[k]?.trim() ?? "";

  const detailRows: { label: string; value: string; wrap?: boolean }[] = ([
    v("idNumber")   ? { label: idLabel,      value: v("idNumber") }              : null,
    v("class")      ? { label: "Class",       value: v("class") }                : null,
    v("bloodGroup") ? { label: "Blood Group", value: v("bloodGroup") }           : null,
    v("phone")      ? { label: "Phone",       value: v("phone") }                : null,
    v("address")    ? { label: "Address",     value: v("address"), wrap: true }  : null,
    v("department") ? { label: "Department",  value: v("department") }           : null,
    v("dob")        ? { label: "DOB",         value: v("dob") }                  : null,
  ] as ({ label: string; value: string; wrap?: boolean } | null)[]).filter(Boolean) as { label: string; value: string; wrap?: boolean }[];

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

      {/* Header 60px — org name + subtitle centered, no logo */}
      <div style={{
        height: 60, flexShrink: 0,
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2, padding: "0 16px",
      }}>
        <div style={{
          color: "#fff", fontWeight: 900, fontSize: 12, textAlign: "center",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: "100%", lineHeight: 1.2,
        }}>
          {v("organization") || "Organization Name"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 7, letterSpacing: 1.6, textTransform: "uppercase" }}>
          {subtitle}
        </div>
      </div>

      {/* Photo 144px — 105×130px passport style */}
      <div style={{
        height: 144, flexShrink: 0,
        background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px solid ${theme.color}22`,
      }}>
        <div style={{
          width: 105, height: 130,
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

      {/* Name 40px */}
      <div style={{
        height: 40, flexShrink: 0,
        background: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 12px",
        borderBottom: `1.5px solid ${theme.color}22`,
      }}>
        <div style={{
          fontSize: 14, fontWeight: 900, color: "#0f172a",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
          lineHeight: 1.2,
        }}>
          {v("name") || <span style={{ color: "#cbd5e1", fontWeight: 400, fontSize: 11 }}>Student Name</span>}
        </div>
        {v("designation") && (
          <div style={{
            fontSize: 7, color: theme.color, fontWeight: 700, marginTop: 1,
            textTransform: "uppercase", letterSpacing: 0.8,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
          }}>
            {v("designation")}
          </div>
        )}
      </div>

      {/* Details flex — single-col, 110px label, address wraps 2 lines */}
      <div style={{
        flex: 1,
        background: "#fff",
        padding: "8px 12px 6px",
        overflow: "hidden",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        {detailRows.map((f, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 2, alignItems: "flex-start" }}>
            <span style={{ fontSize: 7.5, color: "#64748b", fontWeight: 600, lineHeight: 1.5, whiteSpace: "nowrap" }}>
              {f.label}
            </span>
            <span style={{
              fontSize: 7.5, color: "#1e293b", fontWeight: 700, lineHeight: 1.5,
              overflow: "hidden",
              whiteSpace: f.wrap ? "normal" : "nowrap",
              display: f.wrap ? "-webkit-box" : undefined,
              WebkitLineClamp: f.wrap ? 2 : undefined,
              WebkitBoxOrient: f.wrap ? "vertical" : undefined,
            } as React.CSSProperties}>
              : {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer 38px — dates only, no signature */}
      <div style={{
        height: 38, flexShrink: 0,
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        padding: "0 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: "rgba(255,255,255,0.70)", fontSize: 7 }}>
          {v("issueDate") ? `Issue: ${v("issueDate")}` : "IDForge AI"}
        </span>
        {v("expiryDate") && (
          <span style={{ color: "#fff", fontSize: 7, fontWeight: 700 }}>
            Valid: {v("expiryDate")}
          </span>
        )}
      </div>
    </div>
  );
}
