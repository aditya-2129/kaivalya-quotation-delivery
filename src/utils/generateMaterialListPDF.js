import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, PDF_DEFAULTS, safeParseItems, safeParseBreakdown } from '../constants/pdfConstants';

export async function generateMaterialListPDF(quote, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_DEFAULTS.MARGIN;
  const contentWidth = pageWidth - margin * 2;

  // Header Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 102, 51); // Brand Green
  doc.text(COMPANY.NAME, margin, 20);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(COMPANY.TAGLINE, margin, 24);
  doc.text(`${COMPANY.ADDRESS} | Ph: ${COMPANY.PHONE}`, margin, 28);
  
  doc.setDrawColor(200);
  doc.line(margin, 32, pageWidth - margin, 32);

  // Title Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("BILL OF MATERIALS (BOP) & PROCUREMENT LIST", margin, 42);
  
  // Quote Info Block
  doc.setFillColor(248, 251, 252);
  doc.rect(margin, 46, contentWidth, 20, 'F');
  doc.setDrawColor(230);
  doc.rect(margin, 46, contentWidth, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("REFERENCE:", margin + 5, 52);
  doc.text("CLIENT:", margin + 5, 58);
  doc.text("PROJECT:", margin + 5, 63);
  
  doc.setFont('helvetica', 'normal');
  doc.text(quote.quotation_no || 'N/A', margin + 30, 52);
  doc.text(quote.supplier_name || 'N/A', margin + 30, 58);
  doc.text(quote.project_name || 'N/A', margin + 30, 63);
  
  doc.text("DATE:", pageWidth - margin - 40, 52);
  doc.text(new Date().toLocaleDateString('en-GB'), pageWidth - margin - 25, 52);

  let y = 75;

  const breakdown = safeParseBreakdown(quote.detailed_breakdown);
  const bopItems = breakdown.bought_out_items || [];

  // 1. PROJECT-WIDE PURCHASED COMPONENTS (BOP)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("1. PURCHASED COMPONENTS (BOP)", margin, y);
  y += 5;

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
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Sr.', 'Item Description', 'Unit', 'Qty', 'Rate', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [0, 102, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      foot: [['', 'TOTAL BOP VALUE', '', '', '', `Rs. ${parseFloat(breakdown.bopCost || 0).toLocaleString('en-IN')}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' }
    });
    y = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text("No purchased components defined for this quotation.", margin + 5, y + 5);
    y += 15;
  }

  // 2. RAW MATERIAL REQUIREMENTS
  const items = safeParseItems(quote.items);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("2. RAW MATERIAL REQUIREMENTS", margin, y);
  y += 5;

  const rawMaterials = items.filter(item => item.material).map((item, index) => {
    const dims = item.dimensions || {};
    let dimStr = '—';
    if (item.shape === 'rect') dimStr = `${dims.l}x${dims.w}x${dims.t}`;
    else if (item.shape === 'round') dimStr = `Dia ${dims.dia} x ${dims.l}`;
    else if (item.shape === 'hex') dimStr = `AF ${dims.af} x ${dims.l}`;

    return [
      index + 1,
      item.part_name || `Part ${index + 1}`,
      item.material.grade || item.material.name || '—',
      dimStr,
      item.qty || 1,
      `${parseFloat(item.material_weight || 0).toFixed(3)} kg`,
      `${(parseFloat(item.material_weight || 0) * (item.qty || 1)).toFixed(3)} kg`
    ];
  });

  if (rawMaterials.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Sr.', 'Part Name', 'Material Grade', 'Dimensions (mm)', 'Qty', 'Unit Wt', 'Total Wt']],
      body: rawMaterials,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    });
    y = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text("No raw materials defined for this quotation.", margin + 5, y + 5);
    y += 15;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Kaivalya Engineering - Material List | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 10);
  }

  const filename = `MaterialList_${quote.quotation_no || 'QTN'}.pdf`;
  if (save) doc.save(filename);
  return doc;
}
