"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera, Check, X, FlipHorizontal, Loader2, AlertTriangle, RotateCcw,
} from "lucide-react";

declare global {
  interface Window {
    FaceDetector?: new (opts?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
      detect(src: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

type ModalState = "requesting" | "live" | "preview" | "error";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export default function CameraModal({ open, onClose, onCapture }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [modalState, setModalState] = useState<ModalState>("requesting");
  const [preview,    setPreview]    = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hint,       setHint]       = useState("Center your face in the oval");
  const [capturing,  setCapturing]  = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    stopStream();
    setModalState("requesting");
    setHint("Center your face in the oval");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg("Camera API unavailable. Please use a secure (HTTPS) connection or a modern browser.");
      setModalState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try { await video.play(); } catch { /* autoplay blocked – user interaction will resume */ }
      }
      setModalState("live");
    } catch (err) {
      const msg = (err instanceof Error ? err.message : "").toLowerCase();
      if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
        setErrorMsg("Camera permission denied. Allow camera access in your browser settings and try again.");
      } else if (msg.includes("notfound") || msg.includes("devicenotfound")) {
        setErrorMsg("No camera found. Connect a camera and try again.");
      } else {
        setErrorMsg(`Could not start camera: ${err instanceof Error ? err.message : err}`);
      }
      setModalState("error");
    }
  }, [stopStream]);

  // Start / stop camera when modal opens or closes
  useEffect(() => {
    if (open) {
      setPreview(null);
      setCapturing(false);
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return stopStream;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const flipCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturing) return;
    setCapturing(true);

    const vw = video.videoWidth  || 640;
    const vh = video.videoHeight || 480;

    let cropX = 0, cropY = 0, cropW = vw, cropH = vh;
    let faceFound = false;

    // Try FaceDetector API (Chrome / Android Chrome)
    try {
      if (typeof window !== "undefined" && window.FaceDetector) {
        const fd    = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: false });
        const faces = await fd.detect(video);
        if (faces.length > 0) {
          faceFound = true;
          const f       = faces[0].boundingBox;
          const padAbove = f.height * 0.65;
          const padBelow = f.height * 1.30;
          const padSide  = f.width  * 0.45;
          const rawH     = padAbove + f.height + padBelow;
          const rawW     = f.width + padSide * 2;
          // Force 3:4 portrait aspect
          const finalH = Math.max(rawH, rawW * (4 / 3));
          const finalW = finalH * (3 / 4);
          cropX = Math.max(0, f.left + f.width / 2 - finalW / 2);
          cropY = Math.max(0, f.top  - padAbove);
          cropW = Math.min(finalW, vw - cropX);
          cropH = Math.min(finalH, vh - cropY);
          setHint("✓ Face detected — passport crop applied");
        }
      }
    } catch { /* FaceDetector unavailable — fall through */ }

    if (!faceFound) {
      // Center portrait crop fallback (3:4, upper portion of frame)
      const targetW = Math.min(vw * 0.62, vh * 0.75);
      const targetH = targetW * (4 / 3);
      cropX = (vw - targetW) / 2;
      cropY = Math.max(0, vh * 0.05);
      cropW = targetW;
      cropH = Math.min(targetH, vh - cropY);
    }

    // Output at passport-safe resolution (480 × ~640)
    const outW = 480;
    const outH = Math.round(outW * (cropH / cropW));
    canvas.width  = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    setPreview(dataUrl);
    setModalState("preview");
    setCapturing(false);
  }, [capturing, stopStream]);

  const retake = useCallback(() => {
    setPreview(null);
    setHint("Center your face in the oval");
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const usePhoto = useCallback(() => {
    if (preview) {
      onCapture(preview);
      onClose();
    }
  }, [preview, onCapture, onClose]);

  const isFront = facingMode === "user";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="camera-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            key="camera-panel"
            initial={{ opacity: 0, scale: 0.90, y: 28 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.90, y: 28 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/[0.10] shadow-2xl"
            style={{ background: "linear-gradient(160deg, #0d0d1f 0%, #131328 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
                >
                  <Camera style={{ width: 18, height: 18 }} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Capture Student Photo</div>
                  <div className="text-[10px] text-white/35">Auto passport crop · Face detection</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.12] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Viewport ── */}
            <div className="relative bg-black overflow-hidden" style={{ aspectRatio: "4 / 3" }}>

              {/* Requesting */}
              {modalState === "requesting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
                  </div>
                  <span className="text-sm text-white/50">Starting camera…</span>
                </div>
              )}

              {/* Error */}
              {modalState === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-red-300 mb-2">Camera Unavailable</div>
                    <p className="text-xs text-white/40 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Live video — mirrored in selfie mode for natural preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  display:   modalState === "live" ? "block" : "none",
                  transform: isFront ? "scaleX(-1)" : "none",
                }}
              />

              {/* Captured preview — not mirrored (real appearance) */}
              {modalState === "preview" && preview && (
                <img
                  src={preview}
                  alt="Captured photo"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Oval face guide overlay */}
              {modalState === "live" && (
                <>
                  {/* Vignette surround */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 50% 64% at 50% 40%, transparent 70%, rgba(0,0,0,0.72) 100%)",
                    }}
                  />
                  {/* Oval ring */}
                  <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      left: "25%", right: "25%",
                      top: "7%",   bottom: "26%",
                      border: "2px solid rgba(139,92,246,0.80)",
                      boxShadow:
                        "0 0 0 1px rgba(139,92,246,0.22), inset 0 0 0 1px rgba(139,92,246,0.15)",
                    }}
                  />
                  {/* Corner brackets — top-left */}
                  <div className="absolute pointer-events-none" style={{ top: "6.5%", left: "24.2%", width: 16, height: 16, borderTop: "2.5px solid rgba(139,92,246,0.95)", borderLeft: "2.5px solid rgba(139,92,246,0.95)" }} />
                  {/* top-right */}
                  <div className="absolute pointer-events-none" style={{ top: "6.5%", right: "24.2%", width: 16, height: 16, borderTop: "2.5px solid rgba(139,92,246,0.95)", borderRight: "2.5px solid rgba(139,92,246,0.95)" }} />
                  {/* bottom-left */}
                  <div className="absolute pointer-events-none" style={{ bottom: "25.5%", left: "24.2%", width: 16, height: 16, borderBottom: "2.5px solid rgba(139,92,246,0.95)", borderLeft: "2.5px solid rgba(139,92,246,0.95)" }} />
                  {/* bottom-right */}
                  <div className="absolute pointer-events-none" style={{ bottom: "25.5%", right: "24.2%", width: 16, height: 16, borderBottom: "2.5px solid rgba(139,92,246,0.95)", borderRight: "2.5px solid rgba(139,92,246,0.95)" }} />
                  {/* Hint */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                    <span
                      className="text-[11px] font-semibold text-white/85 rounded-full px-3 py-1 border border-white/10"
                      style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)" }}
                    >
                      {hint}
                    </span>
                  </div>
                </>
              )}

              {/* Preview badge */}
              {modalState === "preview" && (
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span
                    className="text-[10px] font-bold text-white rounded-full px-2.5 py-1"
                    style={{ background: "rgba(5,150,105,0.82)", backdropFilter: "blur(8px)" }}
                  >
                    ✓ Passport crop applied
                  </span>
                </div>
              )}
            </div>

            {/* ── Controls ── */}
            <div className="px-5 py-4 space-y-3">

              {/* Live controls */}
              {modalState === "live" && (
                <>
                  <div className="flex items-center gap-3">
                    {/* Flip camera */}
                    <button
                      onClick={flipCamera}
                      title={`Switch to ${isFront ? "rear" : "front"} camera`}
                      className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.14] transition-all shrink-0"
                    >
                      <FlipHorizontal className="w-5 h-5" />
                    </button>
                    {/* Capture */}
                    <button
                      onClick={capturePhoto}
                      disabled={capturing}
                      className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-60 transition-all"
                      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 55%, #6366f1 100%)" }}
                    >
                      {capturing
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                        : <><Camera className="w-4 h-4" /> Capture Photo</>
                      }
                    </button>
                  </div>
                  <p className="text-[9px] text-center text-white/22 leading-relaxed">
                    Front &amp; rear camera · Auto passport crop · Face centering
                  </p>
                </>
              )}

              {/* Preview controls */}
              {modalState === "preview" && (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={retake}
                    className="flex-1 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center gap-2 text-sm font-bold text-white/65 hover:text-white hover:bg-white/[0.14] transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </button>
                  <button
                    onClick={usePhoto}
                    className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
                  >
                    <Check className="w-4 h-4" />
                    Use Photo
                  </button>
                </div>
              )}

              {/* Error controls */}
              {modalState === "error" && (
                <button
                  onClick={() => startCamera(facingMode)}
                  className="w-full h-11 rounded-2xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center gap-2 text-sm font-bold text-white/60 hover:text-white hover:bg-white/[0.14] transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              )}
            </div>
          </motion.div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
