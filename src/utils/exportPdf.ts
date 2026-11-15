import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export interface ExportPdfOptions {
  fileName: string;
  subject: string;
  readingMode: boolean;
}

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

export async function exportBlocksToPdf(
  rootElement: HTMLElement,
  { fileName, subject, readingMode }: ExportPdfOptions
): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const blocks = Array.from(
    rootElement.querySelectorAll<HTMLElement>('[data-pdf-block="true"]')
  );
  if (blocks.length === 0) {
    throw new Error('No hay contenido de resumen disponible para exportar.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 34;
  const marginTop = 34;
  const marginBottom = 42;
  const usableWidth = pageWidth - marginX * 2; // 527.28 pt
  const maxY = pageHeight - marginBottom;

  const pageBgRgb: [number, number, number] = readingMode
    ? [250, 246, 235] // #FAF6EB warm cream
    : [255, 255, 255];
  const blockBgHex = readingMode ? '#FAF6EB' : '#FFFFFF';

  const paintPageBackground = () => {
    pdf.setFillColor(pageBgRgb[0], pageBgRgb[1], pageBgRgb[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  paintPageBackground();

  let currentY = marginTop;
  const blockGapPt = 10;

  for (let i = 0; i < blocks.length; i++) {
    const el = blocks[i];
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      backgroundColor: blockBgHex,
      cacheBust: false,
    });

    let drawWidth = usableWidth;
    let drawHeight = (rect.height / rect.width) * drawWidth;

    const availableOnFullPage = maxY - marginTop;
    if (drawHeight > availableOnFullPage) {
      const shrink = availableOnFullPage / drawHeight;
      drawHeight *= shrink;
      drawWidth *= shrink;
    }

    if (currentY > marginTop && currentY + drawHeight > maxY) {
      pdf.addPage();
      paintPageBackground();
      currentY = marginTop;
    }

    const offsetX = marginX + (usableWidth - drawWidth) / 2;
    pdf.addImage(dataUrl, 'PNG', offsetX, currentY, drawWidth, drawHeight, undefined, 'FAST');
    currentY += drawHeight + blockGapPt;
  }

  // Add clean, subtle footer on every page
  const totalPages = pdf.getNumberOfPages();
  const footerInk: [number, number, number] = readingMode
    ? [110, 98, 84]
    : [100, 116, 139];
  const shortSubject = subject.length > 68 ? `${subject.slice(0, 65)}...` : subject;

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(footerInk[0], footerInk[1], footerInk[2]);
    pdf.text(`Códice · ${shortSubject}`, marginX, pageHeight - 18);
    pdf.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, pageHeight - 18, {
      align: 'right',
    });
  }

  const cleanName = sanitizeFileName(fileName) || 'Resumen_Codice';
  pdf.save(`${cleanName}.pdf`);
}
