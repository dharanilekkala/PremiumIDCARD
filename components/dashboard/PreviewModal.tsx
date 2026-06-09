"use client";
/**
 * PreviewModal — full-screen generated card preview.
 *
 * Features:
 *  • Renders the card at native canvas resolution
 *  • Zoom controls (25 % … 300 %) with keyboard shortcuts + / -
 *  • Fit-to-screen button
 *  • Download PNG / Download full-res
 *  • ESC to close
 *  • Click backdrop to close
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ZoomIn, ZoomOut, Download, Maximize2,
  RotateCcw, Loader2,
} from "lucide-react";
import TemplateCanvas, { TemplateCanvasHandle } from "./TemplateCanvas";
import type { DetectedField, BoundingBox } from "@/lib/templateAnalyzer";

interface Props {
  open: boolean;
  onClose: () => void;
  referenceImage: string | null;
  fields: DetectedField[];
  values: Record<string, string>;
  photoBox?: BoundingBox;
  textColor?: string;
  bgColor?: string;
  filename?: string;
}

const ZOOM_STEPS  = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300];
const ZOOM_DEFAULT = 100;

export default function PreviewModal({
  open, onClose,
  referenceImage, fields, values, photoBox, textColor, bgColor,
  filename = "id-card.png",
}: Props) {
  const canvasRef   = useRef<TemplateCanvasHandle>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const [zoom,      setZoom]      = useState(ZOOM_DEFAULT);
  const [fitZoom,   setFitZoom]   = useState(ZOOM_DEFAULT);
  const [mounted,   setMounted]   = useState(false);
  const [rendered,  setRendered]  = useState(false);

  // Portal mount guard
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  // Reset state every time modal opens
  useEffect(() => {
    if (open) { setZoom(ZOOM_DEFAULT); setRendered(false); }
  }, [open]);

  // Auto-compute fit-to-screen zoom when canvas renders
  const onCanvasMount = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;
    // Give the canvas a tick to render at native size
    requestAnimationFrame(() => {
      const wrap = wrapRef.current;
      if (!wrap || !node.width || !node.height) return;
      const availW = wrap.clientWidth  - 80;
      const availH = wrap.clientHeight - 80;
      const fit = Math.min(availW / node.width, availH / node.height, 1) * 100;
      const snapped = ZOOM_STEPS.reduce((prev, cur) =>
        Math.abs(cur - fit) < Math.abs(prev - fit) ? cur : prev, ZOOM_STEPS[0]);
      setFitZoom(snapped);
      setZoom(snapped);
      setRendered(true);
    });
  }, []);

  // Zoom helpers — declared before the keyboard effect that references them
  const zoomIn  = useCallback(() => setZoom(z => {
    const next = ZOOM_STEPS.find(s => s > z);
    return next ?? z;
  }), []);
  const zoomOut = useCallback(() => setZoom(z => {
    const prev = [...ZOOM_STEPS].reverse().find(s => s < z);
    return prev ?? z;
  }), []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")             { onClose(); return; }
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-")                  zoomOut();
      if (e.key === "0")                  setZoom(fitZoom);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, fitZoom, zoomIn, zoomOut]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="preview-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[999] flex flex-col bg-black/90 backdrop-blur-md"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* ── Top bar ─────────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-black/50 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-white">Generated Card</div>
              {rendered && (
                <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  {zoom}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom out */}
              <button
                onClick={zoomOut}
                disabled={zoom <= ZOOM_STEPS[0]}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-25 transition-all"
                title="Zoom out  (−)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom stepper */}
              <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden">
                {[50, 75, 100, 150, 200].map(z => (
                  <button key={z}
                    onClick={() => setZoom(z)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                      zoom === z
                        ? "bg-brand-500/30 text-brand-300"
                        : "text-white/30 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {z}%
                  </button>
                ))}
              </div>

              {/* Zoom in */}
              <button
                onClick={zoomIn}
                disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-25 transition-all"
                title="Zoom in  (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Fit to screen */}
              <button
                onClick={() => setZoom(fitZoom)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="Fit to screen (0)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Reset zoom */}
              <button
                onClick={() => setZoom(100)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="100% (reset)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Download */}
              <button
                onClick={() => canvasRef.current?.downloadPNG(filename)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500/20 border border-brand-500/30 text-xs font-bold text-brand-300 hover:bg-brand-500/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download PNG
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Canvas area ──────────────────────────────────────────── */}
          <div
            ref={wrapRef}
            className="flex-1 overflow-auto flex items-center justify-center p-10"
            style={{ scrollbarGutter: "stable" }}
          >
            {/* Loading spinner until canvas first renders */}
            {!rendered && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin opacity-60" />
              </div>
            )}

            <motion.div
              animate={{ opacity: rendered ? 1 : 0, scale: rendered ? 1 : 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                transform:       `scale(${zoom / 100})`,
                transformOrigin: "center center",
                // Reserve the full native space so scroll works at all zoom levels
                minWidth:  "max-content",
                minHeight: "max-content",
              }}
            >
              <TemplateCanvas
                ref={canvasRef}
                referenceImage={referenceImage}
                fields={fields}
                values={values}
                photoBox={photoBox}
                textColor={textColor}
                bgColor={bgColor}
                // Notify us when the canvas element mounts so we can compute fit-zoom
                onMount={onCanvasMount}
                className="shadow-2xl"
              />
            </motion.div>
          </div>

          {/* ── Footer hint ──────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-center py-2 border-t border-white/[0.05]">
            <p className="text-[10px] text-white/20">
              Press <kbd className="bg-white/10 px-1 rounded text-white/30">Esc</kbd> to close ·
              <kbd className="bg-white/10 px-1 rounded text-white/30 ml-1">+</kbd> /
              <kbd className="bg-white/10 px-1 rounded text-white/30">−</kbd> to zoom ·
              <kbd className="bg-white/10 px-1 rounded text-white/30 ml-1">0</kbd> to fit
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
