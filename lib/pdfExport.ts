/**
 * PDF export utility — wraps a rendered canvas in a single-page PDF.
 * jsPDF is loaded lazily so its ~1 MB bundle is only fetched on first export.
 */

/** Pixels-to-mm conversion assuming 96 DPI (CSS standard) */
const PX_TO_MM = 25.4 / 96;

export async function canvasTopdf(
  canvas: HTMLCanvasElement,
  filename = "id-card.pdf",
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const W = canvas.width;
  const H = canvas.height;
  const mmW = +(W * PX_TO_MM).toFixed(2);
  const mmH = +(H * PX_TO_MM).toFixed(2);

  const doc = new jsPDF({
    orientation: W >= H ? "landscape" : "portrait",
    unit: "mm",
    format: [mmW, mmH],
    compress: true,
  });

  // High-quality JPEG embed
  const imgData = canvas.toDataURL("image/jpeg", 0.97);
  doc.addImage(imgData, "JPEG", 0, 0, mmW, mmH, "", "FAST");
  doc.save(filename);
}
