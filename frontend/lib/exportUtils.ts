import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Helper to clone an HTML element and copy any active canvas content.
 */
function cloneWithCanvas(original: HTMLElement): HTMLElement {
  const clone = original.cloneNode(true) as HTMLElement;
  
  const originalCanvases = original.querySelectorAll('canvas');
  const clonedCanvases = clone.querySelectorAll('canvas');
  
  for (let i = 0; i < originalCanvases.length; i++) {
    const originalCanvas = originalCanvases[i] as HTMLCanvasElement;
    const clonedCanvas = clonedCanvases[i] as HTMLCanvasElement;
    const context = clonedCanvas.getContext('2d');
    if (context) {
      try {
        context.drawImage(originalCanvas, 0, 0);
      } catch (e) {
        console.warn('Canvas clone failed:', e);
      }
    }
  }
  
  return clone;
}

/**
 * Exports a DOM element to a high-quality PDF with clean page breaks.
 */
export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // Resolve content container
    let contentContainer = element;
    const innerContainer = element.querySelector('.report-content-body');
    if (innerContainer) {
      contentContainer = innerContainer as HTMLElement;
    }

    const originalWidth = contentContainer.offsetWidth || 800;
    const children = Array.from(contentContainer.children);
    
    // Page dimensions based on A4 aspect ratio (210:297)
    const pxPageWidth = originalWidth;
    const pxPageHeight = Math.floor(pxPageWidth * (297 / 210));
    
    // Usable height for page content (reserving space for margins, header, and footer)
    // 50px top/bottom margins, 45px header, 45px footer
    const topBottomMargin = 100; // 50px each
    const headerFooterHeight = 90; // 45px each
    const usableHeight = pxPageHeight - topBottomMargin - headerFooterHeight;

    // Create a temporary hidden container to hold the pages
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = `${pxPageWidth}px`;
    tempContainer.style.boxSizing = 'border-box';
    document.body.appendChild(tempContainer);

    // Apply basic stylesheets for print rendering
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      .mermaid-container {
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
      }
      .mermaid-container svg {
        max-width: 90% !important;
        height: auto !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 15px 0 !important;
      }
      th, td {
        border: 1px solid #e2e8f0 !important;
        padding: 8px 12px !important;
        text-align: left !important;
      }
      th {
        background-color: #f8fafc !important;
        font-weight: 600 !important;
      }
      pre {
        background-color: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        padding: 12px !important;
        white-space: pre-wrap !important;
        word-break: break-all !important;
      }
    `;
    tempContainer.appendChild(styleSheet);

    const proseClasses = element.className
      .split(' ')
      .filter(cls => 
        cls.startsWith('prose') || 
        cls.includes('sans') || 
        cls.includes('serif') || 
        cls.includes('slate') || 
        cls.includes('zinc')
      );
    const textClassName = proseClasses.join(' ');

    const pagesToRender: HTMLDivElement[] = [];

    const createPage = (): { page: HTMLDivElement, contentArea: HTMLDivElement } => {
      const page = document.createElement('div');
      page.style.width = `${pxPageWidth}px`;
      page.style.height = `${pxPageHeight}px`;
      page.style.boxSizing = 'border-box';
      page.style.padding = '50px 60px';
      page.style.backgroundColor = '#ffffff';
      page.style.overflow = 'hidden';
      page.style.display = 'flex';
      page.style.flexDirection = 'column';
      page.style.position = 'relative';

      const contentArea = document.createElement('div');
      contentArea.className = textClassName;
      contentArea.style.flex = '1';
      contentArea.style.display = 'flex';
      contentArea.style.flexDirection = 'column';
      contentArea.style.overflow = 'hidden';
      contentArea.style.width = '100%';

      page.appendChild(contentArea);
      tempContainer.appendChild(page);
      
      return { page, contentArea };
    };

    let { page: currentPage, contentArea: currentContentArea } = createPage();
    pagesToRender.push(currentPage);

    for (const child of children) {
      // Clone the child element including canvas contents if any
      const clone = cloneWithCanvas(child as HTMLElement);
      
      // Append clone to current page content area
      currentContentArea.appendChild(clone);
      
      // Check if it overflows the content area
      if (currentContentArea.scrollHeight > usableHeight) {
        // If it's the only element on the page, keep it to prevent infinite loop
        if (currentContentArea.children.length > 1) {
          // Remove from current page
          currentContentArea.removeChild(clone);
          
          // Start a new page
          const newPageObj = createPage();
          currentPage = newPageObj.page;
          currentContentArea = newPageObj.contentArea;
          pagesToRender.push(currentPage);
          
          // Append clone to the new page content area
          currentContentArea.appendChild(clone);
        }
      }
    }

    // Append headers and footers to all generated pages
    const totalPages = pagesToRender.length;
    pagesToRender.forEach((pageEl, idx) => {
      const pageNum = idx + 1;

      // 1. Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.width = '100%';
      header.style.marginBottom = '15px';
      header.style.paddingBottom = '8px';
      header.style.borderBottom = '1px solid #e2e8f0';
      header.style.fontSize = '9px';
      header.style.color = '#94a3b8';
      header.style.textTransform = 'uppercase';
      header.style.letterSpacing = '1px';
      header.style.fontWeight = '700';
      header.style.fontFamily = 'Inter, sans-serif';

      const headerLeft = document.createElement('span');
      headerLeft.innerText = 'ResearchFlow Intelligence Portfolio';
      header.appendChild(headerLeft);

      const headerRight = document.createElement('span');
      headerRight.innerText = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      header.appendChild(headerRight);

      pageEl.insertBefore(header, pageEl.firstChild);

      // 2. Footer
      const footer = document.createElement('div');
      footer.style.display = 'flex';
      footer.style.justifyContent = 'space-between';
      footer.style.alignItems = 'center';
      footer.style.width = '100%';
      footer.style.marginTop = '15px';
      footer.style.paddingTop = '8px';
      footer.style.borderTop = '1px solid #e2e8f0';
      footer.style.fontSize = '9px';
      footer.style.color = '#94a3b8';
      footer.style.fontFamily = 'Inter, sans-serif';

      const footerLeft = document.createElement('span');
      footerLeft.innerText = 'Confidential - ResearchFlow';
      footer.appendChild(footerLeft);

      const footerRight = document.createElement('span');
      footerRight.innerText = `Page ${pageNum} of ${totalPages}`;
      footer.appendChild(footerRight);

      pageEl.appendChild(footer);
    });

    // Create jsPDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Render each page canvas to PDF
    for (let i = 0; i < pagesToRender.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const pageElement = pagesToRender[i];
      const canvas = await html2canvas(pageElement, {
        scale: 2.5, // Ultra-sharp print quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    
    // Cleanup
    document.body.removeChild(tempContainer);
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
