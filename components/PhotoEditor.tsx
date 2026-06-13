"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, Check, Crosshair } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  src: string;
  onApply: (dataUrl: string) => void;
  onClose: () => void;
  accent: { from: string; to: string };
}

// Display canvas — 2× the 105×130 photo output ratio
const FW = 210;
const FH = 260;

export default function PhotoEditor({ src, onApply, onClose, accent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const rafRef    = useRef<number>(0);
  const dragRef   = useRef({ active: false, startX: 0, startY: 0, startPX: 0, startPY: 0 });

  const [zoom, setZoom] = useState(1);
  const [rot,  setRot]  = useState(0);
  const [pan,  setPan]  = useState({ x: 0, y: 0 });
  const [faceState, setFaceState] = useState<"idle" | "running" | "found" | "missed">("idle");

  // Mutable refs so RAF/event handlers always see latest values
  const zR = useRef(zoom); zR.current = zoom;
  const rR = useRef(rot);  rR.current = rot;
  const pR = useRef(pan);  pR.current = pan;

  const redraw = useCallback(() => {
    const cv  = canvasRef.current;
    const img = imgRef.current;
    if (!cv || !img) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, FW, FH);
    ctx.save();
    ctx.translate(FW / 2 + pR.current.x, FH / 2 + pR.current.y);
    ctx.rotate((rR.current * Math.PI) / 180);
    ctx.scale(zR.current, zR.current);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, []);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(redraw);
  }, [zoom, rot, pan, redraw]);

  const fitCover = useCallback((img: HTMLImageElement) => {
    setZoom(Math.max(FW / img.naturalWidth, FH / img.naturalHeight));
    setPan({ x: 0, y: 0 });
    setRot(0);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; fitCover(img); };
    img.src = src;
  }, [src, fitCover]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onPD = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPX: pR.current.x, startPY: pR.current.y };
  };
  const onPM = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const { startX, startY, startPX, startPY } = dragRef.current;
    setPan({ x: startPX + e.clientX - startX, y: startPY + e.clientY - startY });
  };
  const onPU = () => { dragRef.current.active = false; };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(8, z * (e.deltaY > 0 ? 0.92 : 1.09))));
  };

  // ── Auto face center ───────────────────────────────────────────────────────
  const autoCenter = async () => {
    const img = imgRef.current;
    if (!img) return;
    setFaceState("running");
    let found = false;

    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        // @ts-expect-error — experimental Shape Detection API (Chrome/Edge)
        const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await fd.detect(img);
        if (faces.length > 0) {
          const { x, y, width, height } = faces[0].boundingBox;
          // Zoom so face fills ~60% of frame width; at least cover mode
          const newZ = Math.max(FW / img.naturalWidth, (FW * 0.6) / width);
          // Face center → horizontal center, 35% down (passport eyes-at-upper-third)
          const newPX = -(x + width / 2 - img.naturalWidth  / 2) * newZ;
          const newPY = FH * 0.35 - FH / 2 - (y + height / 2 - img.naturalHeight / 2) * newZ;
          setZoom(newZ);
          setPan({ x: newPX, y: newPY });
          found = true;
        }
      } catch { /* FaceDetector unavailable or flag-gated */ }
    }

    if (!found) {
      const i = imgRef.current!;
      setZoom(Math.max(FW / i.naturalWidth, FH / i.naturalHeight));
      setPan({ x: 0, y: -FH * 0.07 });  // slight upward bias — faces tend to be upper half
      setRot(0);
    }

    setFaceState(found ? "found" : "missed");
    setTimeout(() => setFaceState("idle"), 2500);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;
    // High-res output: 315×390 (matches 105×130 @ SCALE=3 in canvas renderer)
    const OW = 315, OH = 390, ratio = OW / FW;
    const oc  = document.createElement("canvas");
    oc.width  = OW; oc.height = OH;
    const ctx = oc.getContext("2d")!;
    ctx.translate(OW / 2 + pan.x * ratio, OH / 2 + pan.y * ratio);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(zoom * ratio, zoom * ratio);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    onApply(oc.toDataURL("image/jpeg", 0.94));
  };

  const toolBtn =
    "flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 border border-white/[0.08] " +
    "text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-[9px] font-bold disabled:opacity-40";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="glass-card rounded-2xl border border-white/[0.09] p-5 w-full max-w-xs space-y-4 select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white">Edit Photo</h3>
            <p className="text-[10px] text-white/40 mt-0.5">Drag · Scroll to zoom · Rotate</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas — passport frame 210×260 */}
        <div className="relative mx-auto rounded-xl overflow-hidden border"
          style={{ width: FW, height: FH, borderColor: accent.from + "55", background: "#111827" }}>
          <canvas
            ref={canvasRef} width={FW} height={FH}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}
            onWheel={onWheel}
          />
          {/* Rule-of-thirds guides */}
          <div className="absolute inset-0 pointer-events-none">
            {[33.33, 66.66].map(p => (
              <div key={`h${p}`} className="absolute inset-x-0"
                style={{ top: `${p}%`, height: 1, background: "rgba(255,255,255,0.08)" }} />
            ))}
            {[33.33, 66.66].map(p => (
              <div key={`v${p}`} className="absolute inset-y-0"
                style={{ left: `${p}%`, width: 1, background: "rgba(255,255,255,0.08)" }} />
            ))}
          </div>
          {/* Status overlays */}
          {faceState === "running" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm rounded-xl">
              <span className="text-xs text-white font-bold animate-pulse">Detecting face…</span>
            </div>
          )}
          {(faceState === "found" || faceState === "missed") && (
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                faceState === "found"
                  ? "text-emerald-300 bg-emerald-950/80 border-emerald-800/40"
                  : "text-amber-300 bg-amber-950/80 border-amber-800/40"
              }`}>
                {faceState === "found" ? "Face detected & centered" : "Auto-centered (best fit)"}
              </span>
            </div>
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.3, +(z * 0.9).toFixed(3)))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/[0.08] text-white/40 hover:text-white transition-all shrink-0">
            <ZoomOut className="w-3 h-3" />
          </button>
          <input type="range" min={0.3} max={8} step={0.01} value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-brand-500" />
          <button onClick={() => setZoom(z => Math.min(8, +(z * 1.1).toFixed(3)))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/[0.08] text-white/40 hover:text-white transition-all shrink-0">
            <ZoomIn className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-white/30 w-9 text-right tabular-nums shrink-0">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Tool buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button className={toolBtn} onClick={() => setRot(r => r - 90)}>
            <RotateCcw className="w-3.5 h-3.5" /> CCW
          </button>
          <button className={toolBtn} onClick={() => setRot(r => r + 90)}>
            <RotateCw className="w-3.5 h-3.5" /> CW
          </button>
          <button className={toolBtn} onClick={autoCenter} disabled={faceState === "running"}>
            <Crosshair className="w-3.5 h-3.5" /> Center
          </button>
          <button className={toolBtn} onClick={() => { if (imgRef.current) fitCover(imgRef.current); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Apply / Cancel */}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={handleApply}
            className="flex-1 h-10 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all"
            style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
            <Check className="w-3.5 h-3.5" /> Apply Crop
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
