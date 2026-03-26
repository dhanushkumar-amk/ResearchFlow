import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Exports a DOM element to a high-quality PDF.
 */
export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // higher resolution
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(filename);
  } catch (err) {
    console.error('PDF Export failed:', err);
  }
}

/**
 * Simple Markdown to DOCX converter.
 * Note: A full Markdown parser for DOCX is complex, but we can do headlines and paragraphs.
 */
export async function exportToDOCX(content: string, title: string, filename: string) {
  const lines = content.split('\n');
  const children: any[] = [];

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
export function exportToJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
}
