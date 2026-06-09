"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { OrgType } from "@/lib/orgTypes";

interface Props {
  side: "front" | "back";
  orgType: OrgType;
  values: Record<string, string>;
  referenceImage?: string | null;
  photoImg?: string | null;
  logoImg?: string | null;
  orgName?: string;
}

/** Returns the primary name field value for the given org */
function getName(orgId: string, values: Record<string, string>): string {
  return (
    values.studentName ||
    values.employeeName ||
    values.staffName ||
    values.delegateName ||
    values.name ||
    "Full Name"
  );
}

function getIdNumber(orgId: string, values: Record<string, string>): string {
  return (
    values.admissionNo ||
    values.hallTicketNo ||
    values.regNo ||
    values.employeeId ||
    values.staffId ||
    values.studentId ||
    values.registrationId ||
    values.idNumber ||
    "ID-000"
  );
}

function getSubLine(orgId: string, values: Record<string, string>): string {
  switch (orgId) {
    case "school":
      return [values.class && `Class ${values.class}`, values.section && `Sec ${values.section}`].filter(Boolean).join(" · ") || "Class & Section";
    case "college":
      return [values.course, values.branch, values.year].filter(Boolean).join(" · ") || "Course & Branch";
    case "university":
      return [values.programme, values.department].filter(Boolean).join(" · ") || "Programme · Dept";
    case "coaching":
      return [values.course, values.batch].filter(Boolean).join(" · ") || "Course · Batch";
    case "corporate":
      return [values.designation, values.department].filter(Boolean).join(" · ") || "Designation · Dept";
    case "hospital":
      return [values.designation, values.department].filter(Boolean).join(" · ") || "Role · Department";
    case "event":
      return [values.category, values.organization].filter(Boolean).join(" · ") || "Category · Org";
    default:
      return [values.designation, values.department].filter(Boolean).join(" · ") || "Role";
  }
}

function getBackFields(orgId: string, values: Record<string, string>): { l: string; v: string }[] {
  const base = [
    { l: "Blood Group", v: values.bloodGroup },
    { l: "Phone", v: values.parentMobile || values.phone || values.studentPhone || values.parentPhone },
    { l: "Email", v: values.email },
    { l: "Address", v: values.address },
  ].filter((f) => f.v);

  if (orgId === "school") {
    return [
      { l: "Father", v: values.fatherName },
      { l: "Mother", v: values.motherName },
      { l: "Parent Mob", v: values.parentMobile },
      { l: "Blood Group", v: values.bloodGroup },
      { l: "DOB", v: values.dateOfBirth },
      { l: "Bus Route", v: values.busRoute },
    ].filter((f) => f.v);
  }
  return base;
}

export default function LiveCardPreview({
  side,
  orgType,
  values,
  referenceImage,
  photoImg,
  logoImg,
  orgName = "Organization Name",
}: Props) {
  const name = getName(orgType.id, values);
  const idNum = getIdNumber(orgType.id, values);
  const subLine = getSubLine(orgType.id, values);
  const backFields = getBackFields(orgType.id, values);
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const expiry = values.expiryDate || values.validTill || values.academicYear || "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        aspectRatio: "1.586/1",
        background: referenceImage ? "transparent" : `linear-gradient(135deg, #0d0a1f 0%, #1a1040 60%, #2d1b69 100%)`,
        border: `1px solid ${orgType.color}45`,
        boxShadow: `0 16px 48px ${orgType.color}25`,
      }}
    >
      {/* Reference image as base */}
      {referenceImage && (
        <img
          src={referenceImage}
          alt="reference bg"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.82 }}
        />
      )}

      {/* Dark overlay to make text legible when ref image is used */}
      {referenceImage && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      {/* Decorative gradient strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${orgType.color}, ${orgType.color}80)` }}
      />

      {/* ── FRONT ── */}
      {side === "front" && (
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {logoImg ? (
                <img src={logoImg} alt="logo" className="h-7 max-w-[80px] object-contain mb-1" />
              ) : (
                <div
                  className="inline-flex items-center px-2 py-0.5 rounded text-[7px] font-black text-white mb-1"
                  style={{ background: `${orgType.color}70` }}
                >
                  {orgName.toUpperCase()}
                </div>
              )}
              <div className="text-[6px] text-white/40 font-medium tracking-wide">
                {orgType.cardTitle}
              </div>
            </div>

            {/* Photo — school gets a smaller portrait frame with white border */}
            <div
              className={`rounded-xl overflow-hidden flex items-center justify-center border-2 shrink-0 ${
                orgType.id === "school" ? "w-9 h-11" : "w-12 h-14"
              }`}
              style={{
                background: `${orgType.color}25`,
                borderColor: orgType.id === "school" ? "rgba(255,255,255,0.9)" : `${orgType.color}50`,
                boxShadow: orgType.id === "school" ? "0 2px 8px rgba(0,0,0,0.28)" : undefined,
              }}
            >
              {photoImg ? (
                <img src={photoImg} alt="photo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-base drop-shadow">{initials}</span>
              )}
            </div>
          </div>

          {/* Name + details */}
          <div>
            <div className="text-white font-black text-[14px] leading-tight drop-shadow mb-1 truncate">
              {name}
            </div>

            {/* Non-school: small subline text */}
            {orgType.id !== "school" && (
              <div className="text-white/65 text-[9px] truncate mb-0.5">{subLine}</div>
            )}

            {/* School: unified info card — Father Name, Class-Section, Phone, Address */}
            {orgType.id === "school" && (
              <div className="bg-white rounded-[5px] px-2 py-1 mb-2 space-y-0.5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                {[
                  { l: "Father Name",    v: values.fatherName },
                  { l: "Class-Section",  v: [values.class, values.section].filter(Boolean).join(" - ") },
                  { l: "Phone Number",   v: values.parentMobile || values.phone },
                  { l: "Address",        v: values.address },
                ].filter(f => f.v).slice(0, 4).map(({ l, v }) => (
                  <div key={l} className="flex gap-1">
                    <span className="text-[5.5px] font-medium text-[#6B7280] shrink-0 w-[38px]">{l}:</span>
                    <span className="text-[5.5px] font-bold text-[#111827] truncate">{v}</span>
                  </div>
                ))}
                {!values.fatherName && !values.class && !values.parentMobile && !values.phone && !values.address && (
                  <div className="text-[5.5px] text-[#999] italic">Father · Class · Phone · Address</div>
                )}
              </div>
            )}

            <div className="flex items-end justify-between">
              <div>
                <div className="text-white/35 text-[7px] font-mono">{idNum}</div>
                {expiry && (
                  <div className="text-white/25 text-[7px]">Valid: {expiry}</div>
                )}
              </div>
              {/* QR placeholder */}
              <div className="w-9 h-9 rounded-lg bg-white p-0.5 shadow-sm">
                <div className="w-full h-full bg-gray-900 rounded-sm grid grid-cols-3 gap-px p-0.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`rounded-[1px] ${[0, 2, 4, 6, 8].includes(i) ? "bg-white" : "bg-gray-900"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BACK ── */}
      {side === "back" && (
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            {backFields.slice(0, 5).map(({ l, v }) => (
              <div key={l} className="flex gap-2 text-[9px]">
                <span
                  className="font-semibold shrink-0 w-20"
                  style={{ color: `${orgType.color}90` }}
                >
                  {l}:
                </span>
                <span className="text-white/65 truncate">{v}</span>
              </div>
            ))}
          </div>
          <div
            className="border-t pt-2 text-center"
            style={{ borderColor: `${orgType.color}25` }}
          >
            <div className="text-white/25 text-[7px]">If found, please return to the issuing authority.</div>
            <div
              className="text-[7px] font-mono mt-0.5"
              style={{ color: `${orgType.color}55` }}
            >
              idforge.ai/verify/{idNum}
            </div>
          </div>
        </div>
      )}

      {/* Live indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/75 backdrop-blur-sm text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
        <Sparkles className="w-2 h-2" /> LIVE
      </div>

      {/* Shimmer */}
      <div className="absolute inset-0 shimmer-effect rounded-2xl pointer-events-none opacity-25" />
    </motion.div>
  );
}
