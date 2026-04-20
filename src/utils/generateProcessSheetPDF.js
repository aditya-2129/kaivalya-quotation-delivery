import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, safeParseItems } from '../constants/pdfConstants';

const MARGIN = 10; // Process sheet uses tighter margins

export async function generateProcessSheetPDF(quote, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = MARGIN;
  
  const items = safeParseItems(quote.items);
  const projectQty = Number(quote.quantity ?? 1);

  // Header for the entire document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY.NAME, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text("MANUFACTURING PROCESS SHEET", pageWidth / 2, 22, { align: 'center' });
  
  doc.setLineWidth(0.4);
  doc.line(margin, 25, pageWidth - margin, 25);

  // Project Info Table
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

  let currentY = doc.lastAutoTable.finalY + 10;

  // Iterate over parts
  items.forEach((item, index) => {
    // Check for page overflow
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
    doc.text(`${index + 1}. PART: ${item.part_name || 'Unnamed Part'} (Qty: ${item.qty || 1} per set)`, margin + 2, currentY + 5.5);
    
    currentY += 10;

    const processes = item.processes || [];
    if (processes.length > 0) {
      const tableData = processes.map((p, pIdx) => {
        const rate = parseFloat(p.rate || p.hourly_rate || 0);
        const setup = parseFloat(p.setup_time || 0);
        const cycle = parseFloat(p.cycle_time || 0);
        const unit = p.unit || 'hr';
        
        let cost = 0;
        if (unit === 'hr') {
          const totalMin = (setup / projectQty) + (cycle * (item.qty || 1));
          cost = (rate * totalMin) / 60;
        } else {
          cost = cycle * (item.qty || 1) * rate;
        }

        return [
          pIdx + 1,
          p.process_name || '-',
          unit === 'hr' ? `${setup} min` : '-',
          unit === 'hr' ? `${cycle} min` : `${cycle} qty`,
          `Rs. ${rate}/${unit}`,
          `Rs. ${cost.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Op.', 'Operation Type', 'Setup Time', 'Cycle Time', 'Machine Rate', 'Est. Cost']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text("No machining processes defined for this part.", margin + 5, currentY);
      currentY += 15;
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Manufacturing Process Sheet | Reference: ${quote.quotation_no}`, margin, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.getHeight() - 10);
  }

  const filename = `ProcessSheet_${quote.quotation_no || 'QTN'}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
