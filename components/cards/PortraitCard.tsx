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
// Header(15%=72px) → Photo(70% wide=210px, ~158px tall) → Name → Details(flex:1) → Barcode+QR → Footer
export default function PortraitCard({ data, photo, theme, subtitle, idLabel }: Props) {
  const v = (k: string) => data[k]?.trim() ?? "";

  const PHOTO_W = 210; // 70% of 300px
  const PHOTO_H = 158; // fits in 35% section with padding

  const orgInitial = (v("organization") || "S").charAt(0).toUpperCase();

  const gridFields: { label: string; value: string }[] = [
    v("idNumber")   ? { label: idLabel,        value: v("idNumber") }   : null,
    v("class")      ? { label: "Class",         value: v("class") }     : null,
    v("department") ? { label: "Department",    value: v("department") } : null,
    v("dob")        ? { label: "Date of Birth", value: v("dob") }       : null,
    v("bloodGroup") ? { label: "Blood Group",   value: v("bloodGroup") } : null,
    v("designation")? { label: "Role",          value: v("designation") } : null,
  ].filter(Boolean) as { label: string; value: string }[];

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

      {/* ── Header 15% (~72px): emblem + school name + subtitle ── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        padding: "10px 14px 8px",
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0, minHeight: 72,
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
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 7, marginTop: 2.5, letterSpacing: 1.6, textTransform: "uppercase" }}>
            {subtitle}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 6.5, marginTop: 2 }}>
            Student Identity Card
          </div>
        </div>
      </div>

      {/* ── Photo 35%: 70% card width, portrait-friendly ──────── */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        paddingTop: 12, paddingBottom: 8,
        background: "#f8fafc", flexShrink: 0,
      }}>
        <div style={{
          width: PHOTO_W, height: PHOTO_H,
          borderRadius: 8, overflow: "hidden",
          border: `2.5px solid ${theme.color}55`,
          background: "#dde3ea",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 18px rgba(0,0,0,0.14), 0 0 0 4px ${theme.color}18`,
        }}>
          {photo ? (
            <img
              src={photo} alt="Photo"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              <User style={{ color: "#94a3b8", width: 40, height: 40 }} />
              <span style={{ fontSize: 7.5, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase" }}>Passport Photo</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Name + designation ─────────────────────────────────── */}
      <div style={{
        background: "#f8fafc", textAlign: "center",
        padding: "5px 16px 4px", flexShrink: 0,
      }}>
        <div style={{
          fontSize: 15, fontWeight: 900, color: "#0f172a",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25,
        }}>
          {v("name") || <span style={{ color: "#cbd5e1", fontWeight: 400, fontSize: 12 }}>Student Name</span>}
        </div>
        {v("designation") && (
          <div style={{
            fontSize: 7.5, color: theme.color, fontWeight: 700, marginTop: 1.5,
            textTransform: "uppercase", letterSpacing: 0.8,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {v("designation")}
          </div>
        )}
      </div>

      {/* Accent divider */}
      <div style={{
        height: 1.5, margin: "3px 14px", flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${theme.color}45, transparent)`,
      }} />

      {/* ── Details (flex:1) — 2-col grid + contact rows ────────── */}
      <div style={{
        flex: 1, background: "#fff",
        padding: "4px 10px",
        display: "flex", flexDirection: "column", gap: 3,
        overflow: "hidden",
      }}>
        {/* 2-col field grid */}
        {gridFields.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 7px" }}>
            {gridFields.map(f => (
              <div key={f.label} style={{
                background: "#f8fafc", borderRadius: 5, padding: "3px 6px",
                borderLeft: `2px solid ${theme.color}50`, minWidth: 0,
              }}>
                <div style={{ fontSize: 5.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1 }}>
                  {f.label}
                </div>
                <div style={{
                  fontSize: 8.5, color: "#1e293b", fontWeight: 700, lineHeight: 1.4, marginTop: 0.5,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phone + Email */}
        {(v("phone") || v("email")) && (
          <div style={{ display: "flex", gap: 6 }}>
            {v("phone") && (
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 5, padding: "3px 6px", borderLeft: `2px solid ${theme.color}50`, minWidth: 0 }}>
                <div style={{ fontSize: 5.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Phone</div>
                <div style={{ fontSize: 8.5, color: "#1e293b", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v("phone")}
                </div>
              </div>
            )}
            {v("email") && (
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 5, padding: "3px 6px", borderLeft: `2px solid ${theme.color}50`, minWidth: 0 }}>
                <div style={{ fontSize: 5.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Email</div>
                <div style={{ fontSize: 7.5, color: "#1e293b", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v("email")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Address — 2-line max */}
        {v("address") && (
          <div style={{ background: "#f8fafc", borderRadius: 5, padding: "3px 6px", borderLeft: `2px solid ${theme.color}50` }}>
            <div style={{ fontSize: 5.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Address</div>
            <div style={{ fontSize: 7.5, color: "#334155", lineHeight: 1.4, maxHeight: `${2 * 1.4 * 7.5}px`, overflow: "hidden" }}>
              {v("address")}
            </div>
          </div>
        )}

        {/* Emergency */}
        {v("emergencyContact") && (
          <div style={{ background: "#fff5f5", borderRadius: 5, padding: "3px 6px", borderLeft: "2px solid #f87171" }}>
            <div style={{ fontSize: 5.5, color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.5 }}>Emergency</div>
            <div style={{ fontSize: 8, color: "#7f1d1d", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {v("emergencyContact")}
            </div>
          </div>
        )}
      </div>

      {/* ── Barcode + QR row ───────────────────────────────────── */}
      <div style={{
        background: "#f8fafc", borderTop: "1px solid #e2e8f0",
        padding: "5px 12px",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        {/* Barcode strips */}
        <div style={{ display: "flex", gap: 0.8, alignItems: "stretch", height: 24, flexShrink: 0 }}>
          {[2,1,3,1,2,1,1,3,1,2,1,3,2,1,1,2,3,1,2,1].map((w, i) => (
            <div key={i} style={{ width: w, background: i % 2 === 0 ? "#1e293b" : "transparent" }} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 6, color: "#64748b", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {v("idNumber") || "ID-XXXXXXXXX"}
          </div>
          {v("issueDate") && <div style={{ fontSize: 5.5, color: "#94a3b8", marginTop: 0.5 }}>Issued: {v("issueDate")}</div>}
        </div>
        {/* QR placeholder — 5×5 dot grid */}
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          background: "#fff", border: "1px solid #cbd5e1", borderRadius: 3,
          display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0.5, padding: 2,
        }}>
          {[1,1,1,0,1, 1,0,1,0,0, 1,1,1,0,1, 0,0,0,1,0, 1,0,1,1,1].map((c, i) => (
            <div key={i} style={{ background: c ? "#1e293b" : "transparent", borderRadius: 0.5 }} />
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        padding: "5px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 6.5 }}>IDForge AI • Secure Identity</span>
        {v("expiryDate")
          ? <span style={{ color: "#fff", fontSize: 7, fontWeight: 700 }}>Valid: {v("expiryDate")}</span>
          : <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 6.5 }}>Not for commercial use</span>
        }
      </div>
    </div>
  );
}
