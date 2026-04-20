import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, numberToWords, loadImage, safeParseItems, safeParseBreakdown } from '../constants/pdfConstants';

const MARGIN = 10;

export async function generateSinglePagePDF(quote, projectImageUrl = null, { save = true } = {}) {
  if (!quote) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = MARGIN;
  const contentWidth = pageWidth - margin * 2;

  const breakdown = safeParseBreakdown(quote.detailed_breakdown);
  const items = safeParseItems(quote.items);

  doc.setDrawColor(0);
  doc.setLineWidth(0.4);

  // ============================================================
  // 1. HEADER (Logo on left, Details on right with separator lines)
  // ============================================================
  const headerContentH = 26;
  const headerTotalH = 33; // Perfectly matches the line at margin + headerContentH + 7
  
  // Top horizontal separator (thick line)
  doc.setLineWidth(0.4);
  doc.setDrawColor(0);
  doc.line(margin, margin, pageWidth - margin, margin);

  // Logo (left side)
  try {
    const { dataUrl } = await loadImage('/KE_Logo.png');
    if (dataUrl) {
      doc.addImage(dataUrl, 'PNG', margin, margin + 9.5, 52, 14);
    } else {
      throw new Error("Logo missing");
    }
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(COMPANY.NAME, margin, margin + 12);
  }

  // Right-aligned Company Details
  const rightX = pageWidth - margin;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22); 
  doc.setTextColor(30, 64, 125); // Premium Navy Blue
  doc.text(COMPANY.NAME, rightX, margin + 10, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(0, 102, 51); // Dark Green
  doc.text(COMPANY.ADDRESS, rightX, margin + 16, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Mo.${COMPANY.PHONE}, Email: ${COMPANY.EMAIL}`, rightX, margin + 21, { align: 'right' });

  // BOTTOM OF HEADER: GSTN | STATE
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const gstLine = `GSTN : ${COMPANY.GSTIN} | STATE : ${COMPANY.STATE}`;
  doc.text(gstLine, rightX, margin + headerContentH + 5, { align: 'right' });

  // Bottom horizontal separator (below GSTN)
  doc.setLineWidth(0.4);
  doc.setDrawColor(0);
  doc.line(margin, margin + headerContentH + 7, pageWidth - margin, margin + headerContentH + 7);

  // ============================================================
  // 2. CUSTOMER INFO BOX (below header)
  // ============================================================
  const customerBoxY = margin + headerTotalH;
  const customerBoxH = 25;
  doc.rect(margin, customerBoxY, contentWidth, customerBoxH);

  // Quote details divider (vertical line on right side)
  const quoteInfoW = 70;
  const quoteInfoX = pageWidth - margin - quoteInfoW;
  doc.line(quoteInfoX, customerBoxY, quoteInfoX, customerBoxY + customerBoxH);

  // Left side: Customer details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('To', margin + 3, customerBoxY + 6);
  doc.text(`M/s ${quote.supplier_name || ''}`, margin + 12, customerBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let cY = customerBoxY + 11;

  // Add Attn: Contact Person if available
  if (quote.contact_person) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Attn: ${quote.contact_person}`, margin + 12, cY);
    doc.setFont('helvetica', 'normal');
    cY += 4.5;
  }

  // Address / Location
  const displayAddress = quote.address || quote.location || '';
  if (displayAddress) {
    const addressLines = doc.splitTextToSize(displayAddress, quoteInfoX - margin - 14);
    doc.text(addressLines, margin + 12, cY);
    cY += addressLines.length * 4;
  }

  // Contact Details (Phone & Email)
  if (quote.phone || quote.email) {
    const contactLine = [quote.phone, quote.email].filter(Boolean).join(' | ');
    doc.text(contactLine, margin + 12, cY);
    cY += 4.5;
  }

  if (quote.customer_gstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN/UIN : ${quote.customer_gstin}`, margin + 12, cY);
    doc.setFont('helvetica', 'normal');
  }

  // Right side: Quote metadata
  doc.setFontSize(9);
  const qiX = quoteInfoX + 4;
  const qiValX = qiX + 28;
  doc.setFont('helvetica', 'bold');
  doc.text('SR. NO.', qiX, customerBoxY + 7);
  doc.text('DATE', qiX, customerBoxY + 12);
  doc.text('REF NO.', qiX, customerBoxY + 17);
  doc.text('VALID FOR', qiX, customerBoxY + 22);

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${quote.quotation_no || '-'}`, qiValX, customerBoxY + 7);
  doc.text(`: ${quote.inquiry_date ? new Date(quote.inquiry_date).toLocaleDateString('en-GB') : '-'}`, qiValX, customerBoxY + 12);
  doc.text(`: ${breakdown.order_ref_no || '___________'}`, qiValX, customerBoxY + 17);
  doc.text(`: ${breakdown.valid_for || '15 DAYS'}`, qiValX, customerBoxY + 22);

  // ============================================================
  // 3. TAGLINE STRIP (centered company tagline in bordered strip)
  // ============================================================
  const taglineY = customerBoxY + customerBoxH;
  const taglineH = 7;
  doc.rect(margin, taglineY, contentWidth, taglineH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(COMPANY.TAGLINE, pageWidth / 2, taglineY + 4.5, { align: 'center' });

  // ============================================================
  // 4. "QUOTATION" TITLE
  // ============================================================
  const titleY = taglineY + taglineH + 7; // More space after tagline
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth / 2, titleY, { align: 'center', charSpace: 1 });

  // ============================================================
  // 5. MAIN TABLE (with header line and side borders extending down)
  // ============================================================
  const tableStartY = titleY + 2; // More space before table
  doc.line(margin, tableStartY, pageWidth - margin, tableStartY); // Top line of table

  const projectQty = Number(quote.quantity ?? 1);
  const finalGrandTotal = parseFloat(quote.total_amount || 0);
  const consolidatedUnitPrice = finalGrandTotal / projectQty;
  const projectParticular = `${quote.project_name || (items[0]?.part_name ?? 'Industrial Components')}\n(Complete set as per model provided, Precision finished & work suitable)\n\nJob Material – As required`;

  const mainTableData = [[
    '1.',
    projectParticular,
    `${projectQty}\nSet`,
    consolidatedUnitPrice.toFixed(2),
    finalGrandTotal.toFixed(2)
  ]];

  autoTable(doc, {
    startY: tableStartY + 0.5,
    margin: { left: margin, right: margin },
    head: [['Sr. No.', 'Particular', 'Qty.', 'Unit Price', 'Total Price (R)']],
    body: mainTableData,
    theme: 'plain',
    styles: { fontSize: 9, textColor: [0, 0, 0], cellPadding: 2 },
    headStyles: { fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
    },
    didDrawCell: (data) => {
      if (data.row.index === 0 && data.section === 'head') {
        doc.setDrawColor(0);
        doc.setLineWidth(0.4);
        doc.line(margin, data.cell.y + data.cell.height, pageWidth - margin, data.cell.y + data.cell.height);
      }
    }
  });

  // ============================================================
  // 6. SIDE BORDERS (extending from table top down to before the footer)
  // The sample has left and right vertical borders creating a large
  // content box that extends from the table header to the Note line.
  // ============================================================

  // We need to calculate the footer positions FIRST so we know where borders end

  // FOOTER LAYOUT (anchored from bottom of page):
  // From bottom: final italic note (5mm) + contact table (~15mm) + closing box (14mm) + T&C box (65mm) + Note line
  const finalNoteH = 8;
  const contactTableH = 20;
  const closingBoxH = 14;
  const tcBoxH = 65;
  const noteLineH = 10;

  const footerTotalH = finalNoteH + contactTableH + closingBoxH + tcBoxH + noteLineH;
  const footerStartY = pageHeight - margin - footerTotalH;

  // Draw side borders from table top to footer start
  doc.line(margin, tableStartY, margin, footerStartY); // Left side border
  doc.line(pageWidth - margin, tableStartY, pageWidth - margin, footerStartY); // Right side border

  // Grand Total (anchored to the bottom of the content box)
  let grandTotalY = footerStartY - 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Grand Total (INR): ${finalGrandTotal.toFixed(2)}/-`, margin + 5, grandTotalY);

  grandTotalY += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text(`(Rupees ${numberToWords(Math.floor(finalGrandTotal))})`, margin + 5, grandTotalY);

  // Bottom border of the content box (single clean line)
  doc.setLineWidth(0.6);
  doc.line(margin, footerStartY, pageWidth - margin, footerStartY);
  doc.setLineWidth(0.4);

  let noteY = footerStartY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Note –', margin, noteY);

  // ============================================================
  // 7. T&C AND PROJECT IMAGE BOX
  // ============================================================
  const tcBoxY = footerStartY + noteLineH;
  const splitFooterX = pageWidth / 2 + 15;

  doc.rect(margin, tcBoxY, contentWidth, tcBoxH);
  doc.line(splitFooterX, tcBoxY, splitFooterX, tcBoxY + tcBoxH);

  // Terms & Conditions (left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Terms & Conditions', margin + 2, tcBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const tcItems = [
    '• E. & O.E.',
    '• Delivery Period: As mention on PO from the order date and advance.',
    '• Payment Terms: As mutually agreed and finalized with the company.',
    '• Taxes & Duties: GST @ 18% extra as applicable.',
    '• Freight: Charged extra at actuals.'
  ];
  tcItems.forEach((line, i) => {
    doc.text(line, margin + 2, tcBoxY + 12 + (i * 4.5), { maxWidth: splitFooterX - margin - 5 });
  });

  // Signature section
  const sigDividerY = tcBoxY + 36;
  doc.line(margin, sigDividerY, splitFooterX, sigDividerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('We look forward to your valuable order and assure you of our best', margin + 2, sigDividerY + 4);
  doc.text('quality and timely service.', margin + 2, sigDividerY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`for ${COMPANY.NAME}`, margin + 2, sigDividerY + 15);

  // Digital Signature Image
  try {
    const { dataUrl } = await loadImage('/signature.png');
    if (dataUrl) {
      doc.addImage(dataUrl, 'PNG', margin + 5, sigDividerY + 16, 40, 15);
    }
  } catch (e) {
    // No action needed if signature is missing
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Authorized Signature', margin + 5, tcBoxY + tcBoxH - 3);

  // Project snapshot image (right side)
  if (projectImageUrl) {
    try {
      const { dataUrl, width, height } = await loadImage(projectImageUrl);
      if (dataUrl) {
        const boxW = pageWidth - margin - splitFooterX - 4;
        const boxH = tcBoxH - 4;
        const imgRatio = width / height;
        const boxRatio = boxW / boxH;
        let dW, dH;
        if (imgRatio > boxRatio) {
          dW = boxW;
          dH = boxW / imgRatio;
        } else {
          dH = boxH;
          dW = boxH * imgRatio;
        }
        const dX = splitFooterX + 2 + (boxW - dW) / 2;
        const dY = tcBoxY + 2 + (boxH - dH) / 2;
        doc.addImage(dataUrl, 'PNG', dX, dY, dW, dH, undefined, 'FAST');
      } else {
        throw new Error("Image missing");
      }
    } catch (e) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(180);
      doc.text('[ Project Model Reference ]', splitFooterX + 5, tcBoxY + 30);
    }
  }

  // ============================================================
  // 8. CLOSING MESSAGE BANNER
  // ============================================================
  const closingY = tcBoxY + tcBoxH + 2;
  doc.rect(margin, closingY, contentWidth, closingBoxH - 4);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(
    'We thank you for your valuable enquiry and trust this quotation subject to the Terms and conditions given above will find your\napproval. Your order will receive our prompt and careful attention.',
    pageWidth / 2,
    closingY + 4,
    { align: 'center', maxWidth: contentWidth - 4 }
  );

  // ============================================================
  // 9. CONTACT TABLE
  // ============================================================
  const contactY = closingY + closingBoxH - 2;
  const incharge = breakdown.quoting_engineer_details || {};
  const inchargeName = incharge.name || quote.quoting_engineer || '-';
  const inchargePhone = incharge.mobile || '-';
  const inchargeEmail = incharge.email || '-';

  autoTable(doc, {
    startY: contactY,
    margin: { left: margin, right: margin },
    head: [['CONTACT PERSON NAME', 'CALL', 'EMAIL', 'DELEVERY']],
    body: [[inchargeName, inchargePhone, inchargeEmail, breakdown.delivery_period || '']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      cellPadding: 2,
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: [220, 225, 235],
      fontStyle: 'bold',
      textColor: [0, 0, 0]
    }
  });

  // ============================================================
  // 10. FINAL ITALIC NOTE
  // ============================================================
  const finalNoteY = doc.lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(9);
  doc.setTextColor(0, 51, 153);
  doc.text(
    'For any queries regarding the quotation, feel free to contact the concerned person.',
    pageWidth / 2,
    finalNoteY,
    { align: 'center' }
  );

  // Sanitize filename components
  const sanitizedClient = (quote.supplier_name || 'Client').replace(/[/\\?%*:|"<>]/g, '');
  const sanitizedQtn = (quote.quotation_no || 'QTN').replace(/[/\\?%*:|"<>]/g, '');
  const qtnDate = quote.inquiry_date 
    ? new Date(quote.inquiry_date).toLocaleDateString('en-GB').replace(/\//g, '-') 
    : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

  const filename = `${sanitizedClient} ${sanitizedQtn} ${qtnDate}.pdf`.trim();
  
  if (save) doc.save(filename);
  return doc;
}
