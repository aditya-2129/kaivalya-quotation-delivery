import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, safeParseBreakdown } from '../constants/pdfConstants';

const MARGIN = 10;

export async function generateBOPListPDF(quote, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  
  const breakdown = safeParseBreakdown(quote.detailed_breakdown);
  const bopItems = breakdown.bought_out_items || [];

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
      const metadataStr = `BOP LIST | QTN: ${quote.quotation_no} | Page ${pageNo} of ${totalPages}`;
      doc.text(metadataStr, pageWidth - margin, headerY, { align: 'right' });
      
      doc.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
  };

  // Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("PURCHASED COMPONENTS (BOP) LIST", pageWidth / 2, 25, { align: 'center' });
  
  let cY = 32;

  const bopRows = bopItems.map((item, index) => [
    index + 1,
    item.item_name || '—',
    item.unit || 'pcs',
    item.qty || 0,
    `${parseFloat(item.rate || 0).toFixed(2)}`,
    `${(parseFloat(item.rate || 0) * (item.qty || 1)).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: cY,
    margin: { left: margin, right: margin, top: 25 },
    head: [['Sr.', 'Item Description', 'Unit', 'Qty', 'Rate', 'Total']],
    body: bopRows.length > 0 ? bopRows : [['-', 'No items specified', '-', '-', '-', '-']],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 10 }, 
      2: { halign: 'center' }, 
      3: { halign: 'center' }, 
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' }
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

  const filename = `BOP_List_${quote.quotation_no}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
