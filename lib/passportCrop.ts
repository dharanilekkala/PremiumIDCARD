/**
 * passportCrop.ts  v3
 * ─────────────────────────────────────────────────────────────────────────────
 * True Passport Photo Normalization Engine
 *
 * Produces professionally-framed passport/ID-card photos across all students:
 *   • Face HEIGHT  = 55 % of crop height          (FACE_TO_CROP_H)
 *   • Eye midpoint = 38 % from top of crop         (EYE_Y_FRAC)
 *   • Face centred at 50 % horizontally            (FACE_CX_FRAC)
 *   • Shoulders and upper chest always visible
 *
 * 4-Tier Detection Pipeline (best available, graceful fallback):
 *
 *   Tier 1  face-api.js  TinyFaceDetector + 68-point landmarks   (all browsers)
 *            Precise chin, brow, and eye-midpoint landmarks.
 *            Models served from /public/models/ (~270 KB, loaded once, cached).
 *
 *   Tier 2  Browser native FaceDetector API                       (Chrome/Edge)
 *            Bounding-box only — eye position approximated from box geometry.
 *
 *   Tier 3  Aspect-ratio heuristic                                (all browsers)
 *            Estimates face position from image proportions.
 *
 * Result is cached per (photoUrl × boxAR) so bulk generation never re-processes
 * the same photo twice.
 */

// ── Passport photo constants ──────────────────────────────────────────────────

/** Face height as a fraction of crop height — all students normalised to same head size. */
const FACE_TO_CROP_H = 0.55;

/** Eye-midpoint Y as a fraction of crop height from top (passport / ID-card standard). */
const EYE_Y_FRAC = 0.38;

/** Face centre X as a fraction of crop width — horizontally centred. */
const FACE_CX_FRAC = 0.50;

// ── Face data returned by any detection tier ──────────────────────────────────

interface FaceData {
  /** Estimated head-top (hair / brow + forehead) to chin bounding box. */
  top:    number;   // px from image top
  left:   number;   // px from image left
  width:  number;   // px
  height: number;   // px
  /** Precise eye-midpoint (best available anchor for vertical positioning). */
  eyeMidX: number;
  eyeMidY: number;
}

// ── Landmark math helpers ─────────────────────────────────────────────────────

function centroid(pts: { x: number; y: number }[]): { x: number; y: number } {
  const n = pts.length;
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / n,
    y: pts.reduce((s, p) => s + p.y, 0) / n,
  };
}

function minYSlice(pts: { x: number; y: number }[], from: number, to: number): number {
  let m = Infinity;
  for (let i = from; i <= to; i++) m = Math.min(m, pts[i].y);
  return m;
}

// ── Model loading (lazy, once per session) ────────────────────────────────────

const MODEL_PATH = "/models";   // served from /public/models/

let _modelsLoaded  = false;
let _modelsPromise: Promise<void> | null = null;

async function ensureModels(): Promise<void> {
  if (_modelsLoaded) return;
  if (!_modelsPromise) {
    _modelsPromise = (async () => {
      // Dynamic import avoids pulling face-api.js into the server bundle
      const fa = await import("face-api.js");
      await Promise.all([
        fa.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
        fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_PATH),
      ]);
      _modelsLoaded = true;
    })().catch(() => {
      // Reset so a future call can retry
      _modelsPromise = null;
    });
  }
  return _modelsPromise ?? Promise.resolve();
}

// ── Tier 1: face-api.js + 68-point landmarks ──────────────────────────────────

async function detectWithFaceApi(img: HTMLImageElement): Promise<FaceData | null> {
  try {
    await ensureModels();
    if (!_modelsLoaded) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fa = await import("face-api.js") as any;
    const results = await fa
      .detectAllFaces(img, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true);   // true = use tiny 68-point model

    if (!results || !results.length) return null;

    // Pick the largest detected face (most prominent person in photo)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const best = results.reduce((a: any, b: any) =>
      a.detection.box.width * a.detection.box.height >
      b.detection.box.width * b.detection.box.height ? a : b
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pts: { x: number; y: number }[] = best.landmarks.positions;

    // ── Eye midpoint ───────────────────────────────────────────────────────────
    // Left eye:  landmarks 36-41
    // Right eye: landmarks 42-47
    const leftEye  = centroid(pts.slice(36, 42));
    const rightEye = centroid(pts.slice(42, 48));
    const eyeMidX  = (leftEye.x + rightEye.x) / 2;
    const eyeMidY  = (leftEye.y + rightEye.y) / 2;

    // ── Head top estimate ──────────────────────────────────────────────────────
    // Brow top = highest Y of eyebrow landmarks 17-26
    // Forehead ≈ 35 % of brow-to-chin height above the brows
    const browTopY   = minYSlice(pts, 17, 26);
    const chinY      = pts[8].y;                      // landmark 8 = chin centre
    const browToChin = chinY - browTopY;
    const headTopY   = browTopY - browToChin * 0.35;

    // ── Face width from outer jaw points 0 & 16 ───────────────────────────────
    const faceLeft  = Math.min(pts[0].x, pts[16].x);
    const faceRight = Math.max(pts[0].x, pts[16].x);

    return {
      top:    headTopY,
      left:   faceLeft,
      width:  faceRight - faceLeft,
      height: chinY - headTopY,
      eyeMidX,
      eyeMidY,
    };
  } catch {
    return null;
  }
}

// ── Tier 2: browser native FaceDetector (Chrome / Edge) ───────────────────────

async function detectNative(img: HTMLImageElement): Promise<FaceData | null> {
  if (typeof window === "undefined" || !("FaceDetector" in window)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fd = new (window as any).FaceDetector({ fastMode: false, maxDetectedFaces: 10 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faces: any[] = await fd.detect(img);
    if (!faces.length) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const best = faces.reduce((a: any, b: any) =>
      a.boundingBox.width * a.boundingBox.height >
      b.boundingBox.width * b.boundingBox.height ? a : b
    );
    const b = best.boundingBox;
    // Approximate eye position: ~40 % down the face bounding box
    return {
      top:     b.top,
      left:    b.left,
      width:   b.width,
      height:  b.height,
      eyeMidX: b.left + b.width  * 0.50,
      eyeMidY: b.top  + b.height * 0.40,
    };
  } catch {
    return null;
  }
}

// ── Tier 3: aspect-ratio heuristic (synchronous, always available) ────────────
// Estimates face position from the overall image aspect ratio.
// Full-body shots have a small face near the top; close-ups have a large face.

function detectHeuristic(iw: number, ih: number, imgAR: number): FaceData {
  const topFrac =
    imgAR < 0.35 ? 0.06 :
    imgAR < 0.50 ? 0.10 :
    imgAR < 0.65 ? 0.14 :
    imgAR < 0.80 ? 0.20 :
    0.26;

  const hFrac =
    imgAR < 0.35 ? 0.08 :
    imgAR < 0.50 ? 0.14 :
    imgAR < 0.65 ? 0.22 :
    imgAR < 0.80 ? 0.34 :
    0.48;

  const faceH   = ih * hFrac;
  const faceW   = faceH * 0.78;
  const faceTop = ih * topFrac;

  return {
    top:     faceTop,
    left:    (iw - faceW) / 2,
    width:   faceW,
    height:  faceH,
    eyeMidX: iw  / 2,
    eyeMidY: faceTop + faceH * 0.38,  // eyes ≈ 38 % down the face bbox
  };
}

// ── Module-level result cache ─────────────────────────────────────────────────
// Key: `${photoUrl}:::${boxAR.toFixed(3)}` — never re-processes the same photo.

const _cache = new Map<string, string>();

/** Clear crop cache — call on workflow reset so blob URLs don't linger. */
export function clearPassportCache(): void {
  _cache.clear();
}

// ── Image loader ──────────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload  = () => res(el);
    el.onerror = () => rej(new Error("passportCrop: image load failed"));
    el.src = src;
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Normalize a student photo to professional passport / ID-card framing.
 *
 * Detection runs in tier order — the best available method wins:
 *   face-api.js landmarks → native FaceDetector → aspect-ratio heuristic
 *
 * Every output crop has:
 *   • Face height  = 55 % of crop height
 *   • Eye midpoint = 38 % from crop top
 *   • Face centred at 50 % horizontally
 *   • Shoulders visible in the lower ~26 % of the frame
 *
 * @param photoUrl  Source photo — data URL or object URL from JSZip.
 * @param boxAR     (photoBox.w × cardPxWidth) / (photoBox.h × cardPxHeight)
 * @returns         JPEG data URL at 0.93 quality, ready for renderCardToDataURL.
 */
export async function passportPhotoCrop(
  photoUrl: string,
  boxAR:    number,
): Promise<string> {
  const cacheKey = `${photoUrl}:::${boxAR.toFixed(3)}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)!;

  const img = await loadImg(photoUrl);
  const iw  = img.naturalWidth;
  const ih  = img.naturalHeight;
  if (!iw || !ih) return photoUrl;

  // ── Run detection pipeline ────────────────────────────────────────────────
  const face =
    (await detectWithFaceApi(img))  ??
    (await detectNative(img))       ??
    detectHeuristic(iw, ih, iw / ih);

  // ── Compute crop dimensions ───────────────────────────────────────────────
  // Scale so detected face height = FACE_TO_CROP_H × cropH.
  let cropH = Math.round(face.height / FACE_TO_CROP_H);
  let cropW = Math.round(cropH * boxAR);

  // Never upscale beyond the source image (prevents blurry magnification).
  if (cropH > ih || cropW > iw) {
    const scale = Math.min(ih / cropH, iw / cropW);
    cropH = Math.floor(cropH * scale);
    cropW = Math.floor(cropW * scale);
  }

  // ── Position the crop window ──────────────────────────────────────────────
  // Anchor: eye midpoint at EYE_Y_FRAC from top, face centre-X at FACE_CX_FRAC.
  let sy = Math.round(face.eyeMidY - cropH * EYE_Y_FRAC);
  let sx = Math.round(face.eyeMidX - cropW * FACE_CX_FRAC);

  // Clamp so the crop rect stays inside the source image.
  sy = Math.max(0, Math.min(sy, ih - cropH));
  sx = Math.max(0, Math.min(sx, iw - cropW));

  // ── Render ────────────────────────────────────────────────────────────────
  const out = document.createElement("canvas");
  out.width  = cropW;
  out.height = cropH;
  out.getContext("2d")!.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

  const result = out.toDataURL("image/jpeg", 0.93);
  _cache.set(cacheKey, result);
  return result;
}
