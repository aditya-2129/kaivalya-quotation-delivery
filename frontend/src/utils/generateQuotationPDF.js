import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, COLORS, numberToWords, loadImage, safeParseItems, safeParseBreakdown } from '../constants/pdfConstants';
import { drawSinglePageContent } from './generateSinglePagePDF';

const MARGIN = 10; 

export async function generateQuotationPDF(quote, projectImageUrl = null, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  const contentWidth = pageWidth - margin * 2;
  
  const items = safeParseItems(quote.items);
  const breakdown = safeParseBreakdown(quote.detailed_breakdown);

  // Helper to draw the header on any page (Handles overflow automatically)
  const drawStandardHeader = (doc, pageNo, totalPages) => {
      doc.setPage(pageNo);
      doc.setLineWidth(0.2);
      doc.setDrawColor(180);
      doc.line(margin, margin, pageWidth - margin, margin);

      const headerY = margin + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 64, 125); // Apply Premium Navy Blue for brand consistency
      doc.text(COMPANY.NAME, margin, headerY);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      const metadataStr = `QTN: ${quote.quotation_no} | DATE: ${new Date().toLocaleDateString('en-GB')} | Page ${pageNo} of ${totalPages}`;
      doc.text(metadataStr, pageWidth - margin, headerY, { align: 'right' });
      
      doc.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
  };

  // PAGE 1: Formal Summary (Keep high-fidelity as it is the cover)
  await drawSinglePageContent(doc, quote, projectImageUrl);

  // PAGE 2: MATERIAL LIST (Excel Style)
  doc.addPage();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("SECTION 01: RAW MATERIAL SPECIFICATIONS", pageWidth / 2, 25, { align: 'center' });
  
  let cY = 32; 

  const rawMaterials = items.filter(item => item.material).map((item, index) => {
    const dims = item.dimensions || {};
    const allows = item.allowances || {};
    const p = (v) => parseFloat(v) || 0;
    const r2 = (v) => Math.round(v * 100) / 100;

    let dimStr = '—';
    if (item.shape === 'rect') dimStr = `${dims.l}x${dims.w}x${dims.t}`;
    else if (item.shape === 'round') dimStr = `Dia ${dims.dia} x ${dims.l}`;
    else if (item.shape === 'hex') dimStr = `AF ${dims.af} x ${dims.l}`;

    let rawDimStr = '—';
    if (item.shape === 'rect') {
      rawDimStr = `${r2(p(dims.l) + p(allows.l))}x${r2(p(dims.w) + p(allows.w))}x${r2(p(dims.t) + p(allows.t))}`;
    } else if (item.shape === 'round') {
      rawDimStr = `Dia ${r2(p(dims.dia) + p(allows.dia))} x ${r2(p(dims.l) + p(allows.l))}`;
    } else if (item.shape === 'hex') {
      rawDimStr = `AF ${r2(p(dims.af) + p(allows.af))} x ${r2(p(dims.l) + p(allows.l))}`;
    }

    return [
      index + 1,
      item.part_name || '-',
      item.material.grade || '-',
      dimStr,
      rawDimStr,
      item.qty || 1,
      `${parseFloat(item.material_weight || 0).toFixed(2)} kg`,
      `${(parseFloat(item.material_weight || 0) * (item.qty || 1)).toFixed(2)} kg`,
      `${parseFloat(item.material.base_rate || item.material.rate || 0).toFixed(2)}`,
      `${(parseFloat(item.material_weight || 0) * (item.qty || 1) * parseFloat(item.material.base_rate || item.material.rate || 0)).toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: cY,
    margin: { left: margin, right: margin, top: 25 }, // top margin ensures overflow pages don't overlap header
    head: [['Sr.', 'Part Name', 'Material', 'Dimensions (mm)', 'Raw Dim', 'Qty', 'Unit Wt', 'Total Wt', 'Rate', 'Amount']],
    body: rawMaterials,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 7 }, 
      5: { halign: 'center', cellWidth: 8 }, 
      6: { halign: 'right' }, 
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // PAGE 3: MANUFACTURING PROCESS ROADMAP (Excel Style)
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("SECTION 02: MANUFACTURING PROCESS ROADMAP", pageWidth / 2, 25, { align: 'center' });
  cY = 32;

  const allProcesses = [];
  items.forEach((item, index) => {
    const processes = item.processes || [];
    const qty = item.qty || 1;
    if (processes.length === 0) {
      allProcesses.push([`${index + 1}`, item.part_name, 'Standard Precision', '-', '-', 'Workshop', '0.00', '0.00']);
    } else {
      processes.forEach((p, pIdx) => {
        const rate = parseFloat(p.rate || p.hourly_rate || 0);
        const setup = parseFloat(p.setup_time || 0);
        const cycle = parseFloat(p.cycle_time || 0);
        const unit = p.unit || 'hr';
        
        let amount = 0;
        if (unit === 'hr') {
          // Time is in minutes, rate is per hour. Convert total time to hours.
          const totalTimeMin = setup + (cycle * qty);
          amount = (totalTimeMin / 60) * rate;
        } else {
          // Assume rate is per piece or per minute depending on the system config
          amount = (setup + (cycle * qty)) * rate;
        }

        allProcesses.push([
          pIdx === 0 ? `${index + 1}` : '', 
          pIdx === 0 ? item.part_name : '', 
          p.process_name || '-',
          setup.toFixed(2),
          cycle.toFixed(2),
          `${rate.toFixed(2)}/${unit}`,
          amount.toFixed(2)
        ]);
      });
    }
  });

  autoTable(doc, {
    startY: cY,
    margin: { left: margin, right: margin, top: 25 },
    head: [['Sr.', 'Part Name', 'Operation', 'Setup', 'Cycle', 'Rate', 'Amount']],
    body: allProcesses,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 8 }, 
      3: { halign: 'right' }, 
      4: { halign: 'right' }, 
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // PAGE 4: BOP LIST (Excel Style)
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("SECTION 03: PURCHASED COMPONENTS (BOP)", pageWidth / 2, 25, { align: 'center' });
  cY = 32;

  const bopItems = breakdown.bought_out_items || [];
  const bopRows = bopItems.map((item, index) => [
    index + 1,
    item.item_name || '—',
    item.unit || 'pcs',
    item.qty || 0,
    `${parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${(parseFloat(item.rate || 0) * (item.qty || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: cY,
    margin: { left: margin, right: margin, top: 25 },
    head: [['Sr.', 'Item Description', 'Unit', 'Qty', 'Rate', 'Total']],
    body: bopRows.length > 0 ? bopRows : [['-', 'No items specified', '-', '-', '-', '-']],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  // FINAL PASS: Draw Branding and Page Numbers on ALL pages (Handles overflow automatically)
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    drawStandardHeader(doc, i, totalPages);
    
    if (i === totalPages) {
       doc.setPage(i);
       const sigY = pageHeight - margin - 20;
       doc.setFont('helvetica', 'bold');
       doc.setFontSize(10);
       doc.setTextColor(0);
       doc.text(`for ${COMPANY.NAME}`, pageWidth - margin, sigY, { align: 'right' });
       doc.setFont('helvetica', 'normal');
       doc.text("Authorized Signatory", pageWidth - margin, sigY + 10, { align: 'right' });
    }
  }

  const filename = `Full_Quotation_${quote.quotation_no}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
