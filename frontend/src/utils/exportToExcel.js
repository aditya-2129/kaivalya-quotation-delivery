import * as XLSX from 'xlsx-js-style';
 
/**
 * Exports an array of quotation data to an Excel file.
 * @param {Array} data - Array of quotation objects
 * @param {string} fileName - Suggest filename
 */
export const exportQuotationsToExcel = (data, fileName = 'Approved_Quotations.xlsx') => {
  if (!data || data.length === 0) return;

  // Transform data for better spreadsheet readability
  const transformedData = data.map(q => ({
    'Quotation No': q.quotation_no || q.$id.substring(0, 8),
    'Customer': q.supplier_name || 'N/A',
    'Project Name': q.project_name || 'N/A',
    'Incharge': q.quoting_engineer || 'Unassigned',
    'Date Approved': new Date(q.$createdAt).toLocaleDateString('en-GB'),
    'Unit Price': Math.round((parseFloat(q.unit_price) || 0) * 100) / 100,
    'Total Amount': Math.round((parseFloat(q.total_amount) || 0) * 100) / 100,
    'Quantity': q.quantity || 1
  }));

  // Calculate sum of total amounts
  const sumTotal = transformedData.reduce((acc, curr) => acc + curr['Total Amount'], 0);

  // Append a Total Row at the bottom
  transformedData.push({
    'Quotation No': 'GRAND TOTAL',
    'Customer': '',
    'Project Name': '',
    'Incharge': '',
    'Date Approved': '',
    'Unit Price': '',
    'Total Amount': Math.round(sumTotal * 100) / 100,
    'Quantity': ''
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  
  // Apply beautiful styling loop
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      const isHeader = R === 0;
      const isTotalRow = R === range.e.r;
      const isEvenRow = R % 2 === 0 && !isHeader && !isTotalRow;
      const isNumberCol = (C === 5 || C === 6 || C === 7); // Unit Price(5), Total Amount(6), Quantity(7)

      let fillStyle = null;
      let fontStyle = { name: "Calibri", sz: 11 };
      let alignmentStyle = isNumberCol ? { horizontal: "right", vertical: "center" } : { horizontal: "left", vertical: "center" };
      let borderStyle = {};

      if (isHeader) {
        fillStyle = { fgColor: { rgb: "0F172A" } }; // Slate 900
        fontStyle = { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
        alignmentStyle = { horizontal: "center", vertical: "center" };
      } else if (isTotalRow) {
        fillStyle = { fgColor: { rgb: "ECFDF5" } }; // Emerald 50
        fontStyle = { name: "Calibri", sz: 12, bold: true, color: { rgb: "065F46" } }; // Emerald 800
        if (C === 0) alignmentStyle = { horizontal: "center", vertical: "center" }; // Center "GRAND TOTAL"
        borderStyle = { 
          top: { style: "thick", color: { rgb: "10B981" } },
          bottom: { style: "thick", color: { rgb: "10B981" } } 
        };
      } else {
        if (isEvenRow) fillStyle = { fgColor: { rgb: "F8FAFC" } }; // Slate 50 Zebra
        borderStyle = { bottom: { style: "thin", color: { rgb: "E2E8F0" } } };
      }

      // Special currency formats so Excel treats them as numbers, not raw text
      if (!isHeader && (C === 5 || C === 6) && worksheet[cellAddress].v !== '') {
        worksheet[cellAddress].z = '₹#,##0.00';
      }

      worksheet[cellAddress].s = {
        font: fontStyle,
        alignment: alignmentStyle,
        border: borderStyle,
        ...(fillStyle ? { fill: fillStyle } : {})
      };
    }
  }

  // Custom Row Heights
  const rowHeights = [];
  for (let R = 0; R <= range.e.r; ++R) {
    rowHeights.push({ hpt: R === 0 ? 30 : (R === range.e.r ? 35 : 22) });
  }
  worksheet['!rows'] = rowHeights;

  // Enable auto-filter for the header and all data rows (excluding the GRAND TOTAL row)
  // 8 Columns: A to H
  worksheet['!autofilter'] = { ref: `A1:H${data.length + 1}` };

  // Set column widths
  const wscols = [
    { wch: 15 }, // Quotation No
    { wch: 30 }, // Customer
    { wch: 30 }, // Project Name
    { wch: 18 }, // Incharge
    { wch: 15 }, // Date Approved
    { wch: 18 }, // Unit Price
    { wch: 20 }, // Total Amount
    { wch: 10 }  // Quantity
  ];
  worksheet['!cols'] = wscols;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotations');

  // Generate and download file
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exports an array of purchase order data to an Excel file.
 * @param {Array} data - Array of purchase order objects
 * @param {string} fileName - Suggest filename
 */
export const exportPurchaseOrdersToExcel = (data, fileName = 'Confirmed_Orders.xlsx') => {
  if (!data || data.length === 0) return;

  // Transform data for better spreadsheet readability
  const transformedData = data.map(po => ({
    'PO Number': po.po_number || 'N/A',
    'Quotation No': po.quotation_no || 'N/A',
    'Customer': po.customer_name || 'N/A',
    'Project Name': po.project_name || 'N/A',
    'Lead Engineer': po.engineer_name || 'Unassigned',
    'PO Date': po.po_date ? new Date(po.po_date).toLocaleDateString('en-GB') : 'N/A',
    'Delivery Date': po.delivery_date ? new Date(po.delivery_date).toLocaleDateString('en-GB') : 'N/A',
    'Status': (po.status || 'Received').toUpperCase(),
    'Quoted Amount': Math.round((parseFloat(po.total_amount) || 0) * 100) / 100,
    'Actual Value': Math.round((parseFloat(po.actual_valuation || po.total_amount) || 0) * 100) / 100
  }));

  // Calculate sum of actual values
  const sumActual = transformedData.reduce((acc, curr) => acc + curr['Actual Value'], 0);

  // Append a Total Row at the bottom
  transformedData.push({
    'PO Number': 'GRAND TOTAL',
    'Quotation No': '',
    'Customer': '',
    'Project Name': '',
    'Lead Engineer': '',
    'PO Date': '',
    'Delivery Date': '',
    'Status': '',
    'Quoted Amount': '',
    'Actual Value': Math.round(sumActual * 100) / 100
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  
  // Apply beautiful styling loop
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      const isHeader = R === 0;
      const isTotalRow = R === range.e.r;
      const isEvenRow = R % 2 === 0 && !isHeader && !isTotalRow;
      const isNumberCol = (C === 8 || C === 9); // Quoted Amount(8), Actual Value(9)

      let fillStyle = null;
      let fontStyle = { name: "Calibri", sz: 11 };
      let alignmentStyle = isNumberCol ? { horizontal: "right", vertical: "center" } : { horizontal: "left", vertical: "center" };
      let borderStyle = {};

      if (isHeader) {
        fillStyle = { fgColor: { rgb: "0F172A" } }; // Slate 900
        fontStyle = { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
        alignmentStyle = { horizontal: "center", vertical: "center" };
      } else if (isTotalRow) {
        fillStyle = { fgColor: { rgb: "ECFDF5" } }; // Emerald 50
        fontStyle = { name: "Calibri", sz: 12, bold: true, color: { rgb: "065F46" } }; // Emerald 800
        if (C === 0) alignmentStyle = { horizontal: "center", vertical: "center" }; // Center "GRAND TOTAL"
        borderStyle = { 
          top: { style: "thick", color: { rgb: "10B981" } },
          bottom: { style: "thick", color: { rgb: "10B981" } } 
        };
      } else {
        if (isEvenRow) fillStyle = { fgColor: { rgb: "F8FAFC" } }; // Slate 50 Zebra
        borderStyle = { bottom: { style: "thin", color: { rgb: "E2E8F0" } } };
      }

      // Special currency formats
      if (!isHeader && isNumberCol && worksheet[cellAddress].v !== '') {
        worksheet[cellAddress].z = '₹#,##0.00';
      }

      worksheet[cellAddress].s = {
        font: fontStyle,
        alignment: alignmentStyle,
        border: borderStyle,
        ...(fillStyle ? { fill: fillStyle } : {})
      };
    }
  }

  // Custom Row Heights
  const rowHeights = [];
  for (let R = 0; R <= range.e.r; ++R) {
    rowHeights.push({ hpt: R === 0 ? 30 : (R === range.e.r ? 35 : 22) });
  }
  worksheet['!rows'] = rowHeights;

  // Enable auto-filter for the header and all data rows (excluding the GRAND TOTAL row)
  // 10 Columns: A to J
  worksheet['!autofilter'] = { ref: `A1:J${data.length + 1}` };

  // Set column widths
  const wscols = [
    { wch: 18 }, // PO Number
    { wch: 18 }, // Quotation No
    { wch: 30 }, // Customer
    { wch: 30 }, // Project Name
    { wch: 18 }, // Lead Engineer
    { wch: 15 }, // PO Date
    { wch: 15 }, // Delivery Date
    { wch: 15 }, // Status
    { wch: 20 }, // Quoted Amount
    { wch: 20 }  // Actual Value
  ];
  worksheet['!cols'] = wscols;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Orders');

  // Generate and download file
  XLSX.writeFile(workbook, fileName);
};
