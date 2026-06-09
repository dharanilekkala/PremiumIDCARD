/**
 * PDF.js v6 — client-side PDF-to-image conversion.
 *
 * pdfjs-dist is loaded lazily (dynamic import) so the ~1 MB bundle
 * is only fetched when the user actually selects a PDF file.
 * The worker is served from /pdf.worker.min.mjs (copied to public/).
 */

const WORKER_SRC    = "/pdf.worker.min.mjs";
const RENDER_SCALE  = 2.5;   // ~300 DPI equivalent for a typical ID-card PDF
const THUMB_SCALE   = 0.4;   // low-res thumbnail for page previews

// Singleton — initialised once, reused for all subsequent calls
let _pdfjs: typeof import("pdfjs-dist") | null = null;

async function getLib() {
  if (_pdfjs) return _pdfjs;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  _pdfjs = lib;
  return lib;
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface PdfInfo {
  /** Total number of pages in the document */
  pageCount: number;
  /** JPEG data-URL of page 1 at low resolution — used as a list thumbnail */
  thumbnailUrl: string;
  /**
   * Render any page to a high-resolution JPEG data-URL.
   * @param pageNum  1-based page number
   * @param scale    Render scale (default: 2.5 ≈ 300 DPI)
   */
  getPageDataUrl: (pageNum: number, scale?: number) => Promise<string>;
}

// ─── Internal helper ───────────────────────────────────────────────────────────

async function renderPage(
  doc: import("pdfjs-dist").PDFDocumentProxy,
  pageNum: number,
  scale: number,
): Promise<string> {
  const page     = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement("canvas");
  canvas.width   = Math.round(viewport.width);
  canvas.height  = Math.round(viewport.height);

  // pdfjs v6 prefers `canvas` param; keep canvasContext for compatibility
  await page.render({ canvas, viewport }).promise;
  await page.cleanup();

  return canvas.toDataURL("image/jpeg", 0.92);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Load a PDF File and return a PdfInfo handle.
 *
 * Throws a user-friendly Error for:
 *  - Password-protected / encrypted PDFs
 *  - Corrupted / invalid PDF structure
 *  - Empty PDFs (0 pages)
 */
export async function loadPdf(file: File): Promise<PdfInfo> {
  const { getDocument } = await getLib();
  const data = new Uint8Array(await file.arrayBuffer());

  let doc: import("pdfjs-dist").PDFDocumentProxy;
  try {
    doc = await getDocument({ data }).promise;
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? String(err);
    if (/password|encrypt/i.test(msg))
      throw new Error("This PDF is password-protected. Remove the password and try again.");
    if (/invalid|corrupt/i.test(msg))
      throw new Error("PDF appears to be corrupted or is not a valid PDF file.");
    throw new Error(`Could not open PDF: ${msg}`);
  }

  if (doc.numPages === 0) throw new Error("PDF contains no pages.");

  const thumbnailUrl = await renderPage(doc, 1, THUMB_SCALE);

  return {
    pageCount:      doc.numPages,
    thumbnailUrl,
    getPageDataUrl: (pageNum, scale = RENDER_SCALE) =>
      renderPage(doc, pageNum, scale),
  };
}

/**
 * Returns true if the file is a PDF (by MIME type or extension).
 * Does NOT load pdfjs — safe to call synchronously at any time.
 */
export const isPdf = (file: File): boolean =>
  file.type === "application/pdf" ||
  file.name.toLowerCase().endsWith(".pdf");
