"use client";
/**
 * ZoneEditor — visual drag-to-define zone editor.
 *
 * Displays a reference card image and lets the user:
 *  • Drag on empty space   → create a new zone rectangle
 *  • Drag a zone body      → move the zone
 *  • Drag a corner handle  → resize the zone
 *  • Click the ✕ button    → delete the zone
 *
 * All coordinates are stored as 0-1 fractions of the card dimensions.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { X, Camera, Type, Phone, Calendar, Mail, Move } from "lucide-react";
import type { TemplateZoneDef, ZoneFieldType } from "@/lib/templateStorage";

// ─── Zone type config ─────────────────────────────────────────────────────────

const ZONE_META: Record<ZoneFieldType, { color: string; icon: React.ElementType; label: string }> = {
  photo: { color: "#8b5cf6", icon: Camera,   label: "Photo"  },
  text:  { color: "#3b82f6", icon: Type,     label: "Text"   },
  phone: { color: "#10b981", icon: Phone,    label: "Phone"  },
  date:  { color: "#f59e0b", icon: Calendar, label: "Date"   },
  email: { color: "#ec4899", icon: Mail,     label: "Email"  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Box { x: number; y: number; w: number; h: number; }

type DragOp =
  | { op: "none" }
  | { op: "create"; sx: number; sy: number; cx: number; cy: number }
  | { op: "move";   id: string; ox: number; oy: number }
  | { op: "resize"; id: string; handle: "nw" | "ne" | "sw" | "se"; origBox: Box; sx: number; sy: number };

interface Props {
  imageUrl: string;
  dimensions: { width: number; height: number };
  zones: TemplateZoneDef[];
  onChange: (zones: TemplateZoneDef[]) => void;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, v)); }

// ─── Zone overlay ─────────────────────────────────────────────────────────────

function ZoneBox({
  zone, selected,
  onPointerDown, onResizeStart, onDelete, onSelect,
}: {
  zone: TemplateZoneDef;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent, handle: "nw" | "ne" | "sw" | "se") => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const meta = ZONE_META[zone.type];
  // Zones that need manual mapping use orange to alert the user
  const col  = zone.needsManualMapping ? "#f97316" : meta.color;
  const { x, y, w, h } = zone.box;
  const Icon = meta.icon;

  return (
    <div
      className="absolute group"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
      onPointerDown={e => { e.stopPropagation(); onSelect(); onPointerDown(e); }}
    >
      {/* Main body — dashed border for unpositioned zones */}
      <div
        className="absolute inset-0 rounded cursor-move"
        style={{
          background:  `${col}22`,
          border:      `2px ${zone.needsManualMapping ? "dashed" : "solid"} ${col}${selected ? "ff" : "99"}`,
          boxShadow:   selected ? `0 0 0 1px ${col}` : undefined,
          animation:   zone.needsManualMapping ? "pulse 2s infinite" : undefined,
        }}
      />

      {/* "Needs positioning" warning stripe */}
      {zone.needsManualMapping && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded"
            style={{ background: col, color: "#fff", whiteSpace: "nowrap" }}>
            ⚠ DRAG TO CORRECT POSITION
          </span>
        </div>
      )}

      {/* Label badge */}
      <div
        className="absolute -top-5 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white pointer-events-none"
        style={{ background: col, whiteSpace: "nowrap" }}
      >
        <Icon className="w-2.5 h-2.5" />
        {zone.label}
      </div>

      {/* Delete button */}
      <button
        className="absolute -top-4 -right-4 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ background: col }}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <X className="w-3 h-3" />
      </button>

      {/* Resize handles — four corners */}
      {(["nw", "ne", "sw", "se"] as const).map(handle => (
        <div
          key={handle}
          className="absolute w-3 h-3 rounded-sm cursor-pointer border-2 border-white"
          style={{
            background: col,
            top:    handle.startsWith("n") ? -5 : undefined,
            bottom: handle.startsWith("s") ? -5 : undefined,
            left:   handle.endsWith("w")   ? -5 : undefined,
            right:  handle.endsWith("e")   ? -5 : undefined,
            cursor: `${handle}-resize`,
          }}
          onPointerDown={e => { e.stopPropagation(); onResizeStart(e, handle); }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ZoneEditor({ imageUrl, dimensions, zones, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef      = useRef<DragOp>({ op: "none" });
  const [, forceUpdate]  = useState(0); // trigger re-render for preview box
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newType,    setNewType]    = useState<ZoneFieldType>("text");
  const [newLabel,   setNewLabel]   = useState("Field");

  // Convert client coords → 0-1 fractions relative to container
  const toFrac = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: clamp((clientX - r.left) / r.width),
      y: clamp((clientY - r.top)  / r.height),
    };
  }, []);

  // ── Global pointer events (tracks outside container too) ──────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (drag.op === "none") return;
      const { x, y } = toFrac(e.clientX, e.clientY);

      if (drag.op === "create") {
        dragRef.current = { ...drag, cx: x, cy: y };
        forceUpdate(n => n + 1);
        return;
      }

      if (drag.op === "move") {
        const zone = zones.find(z => z.id === drag.id);
        if (!zone) return;
        const nx = clamp(x - drag.ox, 0, 1 - zone.box.w);
        const ny = clamp(y - drag.oy, 0, 1 - zone.box.h);
        // Clear needsManualMapping when user physically moves the zone
        onChange(zones.map(z => z.id === drag.id
          ? { ...z, box: { ...z.box, x: nx, y: ny }, needsManualMapping: undefined }
          : z));
        return;
      }

      if (drag.op === "resize") {
        const { id, handle, origBox, sx, sy } = drag;
        const dx = x - sx, dy = y - sy;
        let { x: bx, y: by, w: bw, h: bh } = origBox;
        if (handle === "se") { bw = Math.max(0.04, bw + dx); bh = Math.max(0.04, bh + dy); }
        if (handle === "sw") { bx += dx; bw = Math.max(0.04, bw - dx); bh = Math.max(0.04, bh + dy); }
        if (handle === "ne") { bw = Math.max(0.04, bw + dx); by += dy; bh = Math.max(0.04, bh - dy); }
        if (handle === "nw") { bx += dx; by += dy; bw = Math.max(0.04, bw - dx); bh = Math.max(0.04, bh - dy); }
        // Clear needsManualMapping when user resizes a zone
        onChange(zones.map(z => z.id === id
          ? { ...z, box: { x: clamp(bx), y: clamp(by), w: clamp(bw, 0, 1 - clamp(bx)), h: clamp(bh, 0, 1 - clamp(by)) }, needsManualMapping: undefined }
          : z));
      }
    };

    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (drag.op === "create") {
        const x = Math.min(drag.sx, drag.cx);
        const y = Math.min(drag.sy, drag.cy);
        const w = Math.abs(drag.cx - drag.sx);
        const h = Math.abs(drag.cy - drag.sy);
        if (w > 0.02 && h > 0.02) {
          const key = newLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
          const id  = `zone_${Date.now()}`;
          const newZone: TemplateZoneDef = {
            id, label: newLabel, key,
            type: newType,
            box: { x, y, w, h },
            fontSize: 11, fontBold: false, color: "#111111", align: "left",
          };
          onChange([...zones, newZone]);
          setSelectedId(id);
        }
      }
      dragRef.current = { op: "none" };
      forceUpdate(n => n + 1);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, [toFrac, zones, onChange, newType, newLabel]);

  // ── Container pointer-down → start creating ───────────────────────────────
  const onContainerDown = useCallback((e: React.PointerEvent) => {
    if (e.target !== containerRef.current) return;
    e.preventDefault();
    const { x, y } = toFrac(e.clientX, e.clientY);
    dragRef.current = { op: "create", sx: x, sy: y, cx: x, cy: y };
    setSelectedId(null);
  }, [toFrac]);

  // ── Preview box while creating ────────────────────────────────────────────
  const drag = dragRef.current;
  const preview = drag.op === "create" ? {
    x: Math.min(drag.sx, drag.cx), y: Math.min(drag.sy, drag.cy),
    w: Math.abs(drag.cx - drag.sx), h: Math.abs(drag.cy - drag.sy),
  } : null;

  const selectedZone = zones.find(z => z.id === selectedId);

  return (
    <div className="space-y-3">
      {/* Zone type + label toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Draw new zone:</span>
        {(Object.keys(ZONE_META) as ZoneFieldType[]).map(t => {
          const m = ZONE_META[t];
          return (
            <button key={t}
              onClick={() => setNewType(t)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background:  newType === t ? `${m.color}30` : "rgba(255,255,255,0.05)",
                border:      `1.5px solid ${newType === t ? m.color : "rgba(255,255,255,0.1)"}`,
                color:       newType === t ? m.color : "rgba(255,255,255,0.4)",
              }}
            >
              <m.icon className="w-3 h-3" />{m.label}
            </button>
          );
        })}
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Label…"
          className="ml-auto text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 w-28 outline-none focus:border-brand-500/50"
        />
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-white/10 select-none"
        style={{
          width: "100%",
          aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          cursor: drag.op === "create" ? "crosshair" : "crosshair",
          userSelect: "none",
        }}
        onPointerDown={onContainerDown}
      >
        {/* Reference image */}
        <img
          src={imageUrl}
          alt="reference"
          className="absolute inset-0 w-full h-full pointer-events-none"
          draggable={false}
        />

        {/* Zone overlays */}
        {zones.map(zone => (
          <ZoneBox
            key={zone.id}
            zone={zone}
            selected={zone.id === selectedId}
            onSelect={() => setSelectedId(zone.id)}
            onPointerDown={e => {
              e.preventDefault();
              const { x, y } = toFrac(e.clientX, e.clientY);
              dragRef.current = { op: "move", id: zone.id, ox: x - zone.box.x, oy: y - zone.box.y };
            }}
            onResizeStart={(e, handle) => {
              e.preventDefault();
              const { x, y } = toFrac(e.clientX, e.clientY);
              dragRef.current = { op: "resize", id: zone.id, handle, origBox: { ...zone.box }, sx: x, sy: y };
            }}
            onDelete={() => {
              onChange(zones.filter(z => z.id !== zone.id));
              if (selectedId === zone.id) setSelectedId(null);
            }}
          />
        ))}

        {/* Preview rectangle while drawing */}
        {preview && preview.w > 0.005 && preview.h > 0.005 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${preview.x * 100}%`, top:   `${preview.y * 100}%`,
              width: `${preview.w * 100}%`, height: `${preview.h * 100}%`,
              border: `2px dashed ${ZONE_META[newType].color}`,
              background: `${ZONE_META[newType].color}18`,
            }}
          />
        )}

        {/* Crosshair hint */}
        {zones.length === 0 && drag.op === "none" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Move className="w-5 h-5 text-white/40 mx-auto mb-1" />
              <p className="text-[10px] text-white/40">Drag to draw zones</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected zone editor panel */}
      {selectedZone && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Edit Selected Zone</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-white/30 block mb-1">Label</label>
              <input
                value={selectedZone.label}
                onChange={e => onChange(zones.map(z => z.id === selectedZone.id ? { ...z, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") } : z))}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/80 outline-none focus:border-brand-500/50"
              />
            </div>
            <div>
              <label className="text-[9px] text-white/30 block mb-1">Type</label>
              <select
                value={selectedZone.type}
                onChange={e => onChange(zones.map(z => z.id === selectedZone.id ? { ...z, type: e.target.value as ZoneFieldType } : z))}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/80 outline-none focus:border-brand-500/50"
              >
                {(Object.keys(ZONE_META) as ZoneFieldType[]).map(t => (
                  <option key={t} value={t}>{ZONE_META[t].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Alignment — only for text fields */}
          {selectedZone.type !== "photo" && (
            <div>
              <label className="text-[9px] text-white/30 block mb-1">Alignment</label>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map(a => (
                  <button key={a}
                    onClick={() => onChange(zones.map(z => z.id === selectedZone.id ? { ...z, align: a } : z))}
                    className="flex-1 py-1 rounded-lg text-[9px] font-bold transition-all capitalize"
                    style={{
                      background: (selectedZone.align ?? "left") === a ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)",
                      border:     `1px solid ${(selectedZone.align ?? "left") === a ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                      color:      (selectedZone.align ?? "left") === a ? "#a5b4fc" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {a === "left" ? "⬅ Left" : a === "center" ? "⬤ Center" : "Right ➡"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 text-[9px] text-white/40">
            {(["x","y","w","h"] as const).map(k => (
              <div key={k}>
                <label className="block mb-0.5 uppercase">{k} %</label>
                <input
                  type="number" min={0} max={100} step={1}
                  value={Math.round(selectedZone.box[k] * 100)}
                  onChange={e => {
                    const v = clamp(Number(e.target.value) / 100, 0, 1);
                    onChange(zones.map(z => z.id === selectedZone.id ? { ...z, box: { ...z.box, [k]: v } } : z));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 text-white/70 outline-none focus:border-brand-500/50"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone legend */}
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {zones.map(z => {
            const m = ZONE_META[z.type];
            return (
              <button key={z.id}
                onClick={() => setSelectedId(z.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all"
                style={{
                  background: `${m.color}22`,
                  border: `1.5px solid ${z.id === selectedId ? m.color : `${m.color}55`}`,
                  color:  m.color,
                }}
              >
                <m.icon className="w-2.5 h-2.5" />{z.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
