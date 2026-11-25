import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

const PDF_WIDTH_PX = 720;
const PDF_MARGIN_MM = 15;
const PDF_BODY_TOP_MM = 20;
const PDF_BODY_BOTTOM_MM = 18;

function prepareReport(element: HTMLElement, title?: string) {
  const wrapper = document.createElement('div');
  wrapper.className = 'rf-pdf-export';
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.inert = true;
  wrapper.style.width = `${PDF_WIDTH_PX}px`;

  const content = element.cloneNode(true) as HTMLElement;
  content.removeAttribute('id');
  // Mermaid uses internal SVG IDs for markers and styles, which need to remain intact.
  content.querySelectorAll('canvas').forEach((canvas, index) => {
    const original = element.querySelectorAll('canvas')[index];
    if (original) canvas.getContext('2d')?.drawImage(original, 0, 0);
  });
  content.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
  content.querySelectorAll('details').forEach(details => { details.open = true; });
  if (title && !content.querySelector('h1')) {
    const heading = document.createElement('h1');
    heading.textContent = title;
    content.prepend(heading);
  }
  wrapper.append(content);
  return wrapper;
}

function contentBoundaries(content: HTMLElement) {
  const origin = content.getBoundingClientRect().top;
  const occupied: Array<{ top: number; bottom: number }> = [];
  const collect = (rect: DOMRect) => {
    if (rect.height > 0 && rect.width > 0) occupied.push({ top: rect.top - origin, bottom: rect.bottom - origin });
  };
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim() || node.parentElement?.closest('svg')) continue;
    range.selectNodeContents(node);
    Array.from(range.getClientRects()).forEach(collect);
  }
  content.querySelectorAll('img, canvas, .rf-diagram-content svg').forEach(element => collect(element.getBoundingClientRect()));
  return occupied.sort((first, second) => second.top - first.top);
}

/** Export the rendered report at a fixed print width, independent of the viewport. */
export async function exportToPDF(elementId: string, filename: string, title?: string) {
  const element = document.getElementById(elementId);
  if (!element?.textContent?.trim()) throw new Error('The report has no content to export.');

  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
  const wrapper = prepareReport(element, title);
  document.body.append(wrapper);
  try {
    const content = wrapper.firstElementChild as HTMLElement;
    await document.fonts.ready;
    await Promise.allSettled(Array.from(content.querySelectorAll('img'), image => image.decode()));

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    const bodyWidth = width - PDF_MARGIN_MM * 2;
    const pxPerMm = PDF_WIDTH_PX / bodyWidth;
    const maxPagePixels = Math.floor((height - PDF_BODY_TOP_MM - PDF_BODY_BOTTOM_MM) * pxPerMm);
    const totalHeight = Math.ceil(content.getBoundingClientRect().height);
    const occupied = contentBoundaries(content);
    const offsets = [0];
    while (offsets[offsets.length - 1] < totalHeight) {
      const start = offsets[offsets.length - 1];
      let end = Math.min(start + maxPagePixels, totalHeight);
      if (end < totalHeight) {
        for (const line of occupied) {
          if (line.top < end && line.bottom > end) end = Math.floor(line.top);
        }
      }
      // Oversized content can fill a page, but must never prevent pagination.
      offsets.push(end > start ? end : Math.min(start + maxPagePixels, totalHeight));
    }

    for (let page = 0; page < offsets.length - 1; page++) {
      if (page) pdf.addPage();
      const top = offsets[page];
      const sliceHeight = offsets[page + 1] - top;
      const canvas = await html2canvas(content, {
        x: 0, y: top, width: PDF_WIDTH_PX, height: sliceHeight,
        scale: 1.65, useCORS: true, backgroundColor: '#ffffff', logging: false,
        windowWidth: Math.max(document.documentElement.clientWidth, PDF_WIDTH_PX),
      });
      try {
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.83), 'JPEG', PDF_MARGIN_MM, PDF_BODY_TOP_MM, bodyWidth, sliceHeight / pxPerMm);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }

      pdf.setFontSize(9);
      pdf.setTextColor(80, 94, 118);
      pdf.text('ResearchFlow', PDF_MARGIN_MM, 13);
      pdf.text(`Page ${page + 1} of ${offsets.length - 1}`, width - PDF_MARGIN_MM, height - 9, { align: 'right' });
    }

    await pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`, { returnPromise: true });
  } finally {
    wrapper.remove();
  }
}

/**
 * Simple Markdown to DOCX converter.
 * Note: A full Markdown parser for DOCX is complex, but we can do headlines and paragraphs.
 */
export async function exportToDOCX(content: string, title: string, filename: string) {
  const lines = content.split('\n');
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { before: 200 } }));
      return;
    }

    if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({ text: trimmed.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    } else if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({ text: trimmed.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
    } else if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({ text: trimmed.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(new Paragraph({ text: trimmed.substring(2), bullet: { level: 0 } }));
    } else {
      children.push(new Paragraph({ 
        children: [new TextRun({ text: trimmed, size: 24 })],
        spacing: { after: 120 }
      }));
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

/**
 * Raw JSON export for data scientists.
 */
export function exportToJSON(data: Record<string, unknown> | unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
}
