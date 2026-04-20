import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, PDF_DEFAULTS, safeParseBreakdown } from '../constants/pdfConstants';

export async function generateBOPListPDF(quote, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_DEFAULTS.MARGIN;
  
  const breakdown = safeParseBreakdown(quote.detailed_breakdown);
  const bopItems = breakdown.bought_out_items || [];
  const projectQty = Number(quote.quantity ?? 1);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY.NAME, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text("PURCHASED COMPONENTS (BOP) LIST", pageWidth / 2, 22, { align: 'center' });
  
  doc.setLineWidth(0.4);
  doc.line(margin, 25, pageWidth - margin, 25);

  // Project Info
  autoTable(doc, {
    startY: 28,
    margin: { left: margin, right: margin },
    body: [
      ['REFERENCE:', quote.quotation_no || '-', 'PROJECT:', quote.project_name || '-'],
      ['CLIENT:', quote.supplier_name || '-', 'TOTAL QTY:', `${projectQty} Set(s)`]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 25 },
      3: { cellWidth: 'auto' }
    }
  });

  let currentY = doc.lastAutoTable.finalY + 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("BOP Procurement Requirements", margin, currentY);
  currentY += 5;

  if (bopItems.length > 0) {
    const tableData = bopItems.map((item, index) => [
      index + 1,
      item.item_name || '—',
      item.unit || 'pcs',
      item.qty || 0,
      `Rs. ${parseFloat(item.rate || 0).toLocaleString('en-IN')}`,
      `Rs. ${(parseFloat(item.rate || 0) * (item.qty || 1)).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Sr.', 'Description / Part Details', 'Unit', 'Qty / Set', 'Rate', 'Total Value']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9.5, cellPadding: 4 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
      },
      foot: [['', 'CONSOLIDATED BOP VALUE (INR)', '', '', '', `Rs. ${parseFloat(breakdown.bopCost || 0).toLocaleString('en-IN')}`]],
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' }
    });
    currentY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text("No purchased items (BOP) were found in the valuation record for this quotation.", margin + 5, currentY + 5);
    currentY += 15;
  }

  // Footer Message
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("This document is generated for procurement and vendor inquiry purposes only.", margin, doc.internal.pageSize.getHeight() - 15);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - margin - 50, doc.internal.pageSize.getHeight() - 15);

  const filename = `BOP_List_${quote.quotation_no || 'QTN'}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
