import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, safeParseItems, safeParseBreakdown } from '../constants/pdfConstants';

const MARGIN = 10; 

export async function generateMaterialListPDF(quote, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  
  const items = safeParseItems(quote.items);
  const breakdown = safeParseBreakdown(quote.detailed_breakdown);

  // Helper to draw the header on any page
  const drawStandardHeader = (doc, pageNo, totalPages) => {
      doc.setPage(pageNo);
      doc.setLineWidth(0.2);
      doc.setDrawColor(180);
      doc.line(margin, margin, pageWidth - margin, margin);

      const headerY = margin + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 64, 125); // Premium Navy Blue
      doc.text(COMPANY.NAME, margin, headerY);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      const metadataStr = `MATERIAL LIST | QTN: ${quote.quotation_no} | Page ${pageNo} of ${totalPages}`;
      doc.text(metadataStr, pageWidth - margin, headerY, { align: 'right' });
      
      doc.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
  };

  let cY = 25;

  // SECTION 01: RAW MATERIAL REQUIREMENTS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("SECTION 01: RAW MATERIAL SPECIFICATIONS", pageWidth / 2, 25, { align: 'center' });
  cY = 32;

  const rawMaterials = items.filter(item => item.material).map((item, index) => {
    const dims = item.dimensions || {};
    let dimStr = '—';
    if (item.shape === 'rect') dimStr = `${dims.l}x${dims.w}x${dims.t}`;
    else if (item.shape === 'round') dimStr = `Dia ${dims.dia} x ${dims.l}`;
    else if (item.shape === 'hex') dimStr = `AF ${dims.af} x ${dims.l}`;

    return [
      index + 1,
      item.part_name || '-',
      item.material.grade || '-',
      dimStr,
      item.qty || 1,
      `${parseFloat(item.material_weight || 0).toFixed(2)} kg`,
      `${(parseFloat(item.material_weight || 0) * (item.qty || 1)).toFixed(2)} kg`,
      `${parseFloat(item.material.base_rate || item.material.rate || 0).toFixed(2)}`,
      `${(parseFloat(item.material_weight || 0) * (item.qty || 1) * parseFloat(item.material.base_rate || item.material.rate || 0)).toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: cY,
    margin: { left: margin, right: margin, top: 25 },
    head: [['Sr.', 'Part Name', 'Material', 'Dimensions (mm)', 'Qty', 'Unit Wt', 'Total Wt', 'Rate', 'Amount']],
    body: rawMaterials,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 8 }, 
      4: { halign: 'center', cellWidth: 10 }, 
      5: { halign: 'right' }, 
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // FINAL PASS: Draw Branding and Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
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

  const filename = `MaterialList_${quote.quotation_no}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
