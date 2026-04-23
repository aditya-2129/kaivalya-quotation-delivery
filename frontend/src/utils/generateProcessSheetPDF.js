import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, safeParseItems } from '../constants/pdfConstants';

const MARGIN = 10;

export async function generateProcessSheetPDF(quote, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  
  const items = safeParseItems(quote.items);
  const projectQty = Number(quote.quantity ?? 1);

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
      const metadataStr = `PROCESS SHEET | QTN: ${quote.quotation_no} | Page ${pageNo} of ${totalPages}`;
      doc.text(metadataStr, pageWidth - margin, headerY, { align: 'right' });
      
      doc.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
  };

  // Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("MANUFACTURING PROCESS ROADMAP", pageWidth / 2, 25, { align: 'center' });
  
  let cY = 32;

  // Consolidate all processes into one technical grid
  const allProcesses = [];
  items.forEach((item, index) => {
    if (item.processes && item.processes.length > 0) {
      item.processes.forEach((p, pIdx) => {
        const rate = parseFloat(p.rate || p.hourly_rate || 0);
        const setup = parseFloat(p.setup_time || 0);
        const cycle = parseFloat(p.cycle_time || 0);
        const unit = p.unit || 'hr';
        
        let amount = 0;
        if (unit === 'hr') {
          // Calculation: (Setup Total / Project Qty) + (Cycle time per part * Part Qty)
          // This gives total minutes per set. Multiply by (rate/60) for cost.
          const totalMinutesPerSet = (setup / projectQty) + (cycle * (item.qty || 1));
          amount = (rate / 60) * totalMinutesPerSet;
        } else {
          amount = cycle * (item.qty || 1) * rate;
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
    body: allProcesses.length > 0 ? allProcesses : [['-', 'No processes defined', '-', '-', '-', '-', '-']],
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

  const filename = `ProcessSheet_${quote.quotation_no}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
