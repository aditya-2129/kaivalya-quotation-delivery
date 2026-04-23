import * as XLSX from 'xlsx-js-style';
 
/**
 * Exports an array of quotation data to an Excel file.
 * @param {Array} data - Array of quotation objects
 * @param {string} fileName - Suggest filename
 */
export const exportQuotationsToExcel = (data, fileName = 'Approved_Quotations.xlsx', returnWorkbook = false) => {
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
  if (returnWorkbook) return workbook;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exports an array of purchase order data to an Excel file.
 * @param {Array} data - Array of purchase order objects
 * @param {string} fileName - Suggest filename
 */
export const exportPurchaseOrdersToExcel = (data, fileName = 'Confirmed_Orders.xlsx', returnWorkbook = false) => {
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
  if (returnWorkbook) return workbook;
  XLSX.writeFile(workbook, fileName);
};

// ─── HELPER: Add branded header block to a worksheet ───
// Inserts 4 rows above the data: Company name, doc metadata, section title, blank separator.
// Returns the row offset so that subsequent styling knows where the data table starts.
function addSheetHeader(worksheet, { docLabel, qtnNo, sectionTitle, colCount }) {
  const COMPANY_NAME = 'KAIVALYA ENGINEERING';
  const docMeta = `${docLabel} | QTN: ${qtnNo || '—'}`;

  // Shift existing rows down by 4 to make room for the header
  XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: 'A1' }); // placeholder — shift done via origin below

  // Read current range, then rebuild with header prepended
  const origRef = worksheet['!ref'];
  const origRange = XLSX.utils.decode_range(origRef);

  // We'll insert 4 rows: [0] Company + Meta, [1] blank, [2] Section Title, [3] blank separator
  const HEADER_ROWS = 4;

  // Shift all existing cells down by HEADER_ROWS
  for (let R = origRange.e.r; R >= origRange.s.r; --R) {
    for (let C = origRange.s.c; C <= origRange.e.c; ++C) {
      const oldAddr = XLSX.utils.encode_cell({ r: R, c: C });
      const newAddr = XLSX.utils.encode_cell({ r: R + HEADER_ROWS, c: C });
      if (worksheet[oldAddr]) {
        worksheet[newAddr] = worksheet[oldAddr];
        delete worksheet[oldAddr];
      }
    }
  }

  // Shift existing row heights down
  if (worksheet['!rows']) {
    const oldRows = worksheet['!rows'];
    const newRows = new Array(HEADER_ROWS).fill({ hpt: 22 });
    worksheet['!rows'] = [...newRows, ...oldRows];
  }

  // Update range to include new rows
  origRange.e.r += HEADER_ROWS;
  worksheet['!ref'] = XLSX.utils.encode_range(origRange);

  // Shift merges down
  if (worksheet['!merges']) {
    worksheet['!merges'] = worksheet['!merges'].map(m => ({
      s: { r: m.s.r + HEADER_ROWS, c: m.s.c },
      e: { r: m.e.r + HEADER_ROWS, c: m.e.c }
    }));
  }

  // Shift autofilter down
  if (worksheet['!autofilter']) {
    const afRange = XLSX.utils.decode_range(worksheet['!autofilter'].ref);
    afRange.s.r += HEADER_ROWS;
    afRange.e.r += HEADER_ROWS;
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(afRange) };
  }

  const lastCol = Math.max(colCount - 1, 0);
  const midCol = Math.floor(lastCol / 2);
  const metaCol = midCol + 1;

  // Row 0: Company Name (left) + Doc Meta (right)
  worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })] = { v: COMPANY_NAME, t: 's' };
  worksheet[XLSX.utils.encode_cell({ r: 0, c: metaCol })] = { v: docMeta, t: 's' };

  // Row 1: Empty (line separator effect)

  // Row 2: Section Title (centered, merged)
  worksheet[XLSX.utils.encode_cell({ r: 2, c: 0 })] = { v: sectionTitle, t: 's' };

  // Row 3: Empty (spacer before data table)

  // Add merges for header rows
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  // Merge company name
  if (midCol > 0) {
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: midCol } });
  }
  // Merge doc metadata
  if (lastCol > metaCol) {
    worksheet['!merges'].push({ s: { r: 0, c: metaCol }, e: { r: 0, c: lastCol } });
  }
  // Merge section title across all columns
  worksheet['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } });

  // Style header area
  // Row 0: Company name — bold navy, large
  worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })].s = {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '1E407D' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
  // Row 0: Doc metadata — right-aligned, small gray
  worksheet[XLSX.utils.encode_cell({ r: 0, c: metaCol })].s = {
    font: { name: 'Calibri', sz: 9, color: { rgb: '666666' } },
    alignment: { horizontal: 'right', vertical: 'center' }
  };

  // Row 2: Section title — centered, bold, medium
  worksheet[XLSX.utils.encode_cell({ r: 2, c: 0 })].s = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  // Set header row heights
  const rowHeights = worksheet['!rows'] || [];
  rowHeights[0] = { hpt: 28 }; // Company row
  rowHeights[1] = { hpt: 8 };  // Separator
  rowHeights[2] = { hpt: 24 }; // Section title
  rowHeights[3] = { hpt: 8 };  // Spacer
  worksheet['!rows'] = rowHeights;

  return HEADER_ROWS;
}

// ─── HELPER: Apply professional styling to a worksheet ───
function applyProfessionalStyling(worksheet, { numberCols = [], currencyCols = [], dataStartRow = 0 } = {}) {
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  // Only style from dataStartRow onwards (skip branded header rows)
  for (let R = dataStartRow; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      const isHeader = R === dataStartRow;
      const isTotalRow = R === range.e.r;
      const isEvenRow = (R - dataStartRow) % 2 === 0 && !isHeader && !isTotalRow;
      const isNumCol = numberCols.includes(C) || currencyCols.includes(C);

      let fillStyle = null;
      let fontStyle = { name: "Calibri", sz: 11 };
      let alignmentStyle = isNumCol
        ? { horizontal: "right", vertical: "center" }
        : { horizontal: "left", vertical: "center" };
      let borderStyle = {};

      if (isHeader) {
        fillStyle = { fgColor: { rgb: "0F172A" } };
        fontStyle = { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
        alignmentStyle = { horizontal: "center", vertical: "center" };
      } else if (isTotalRow) {
        fillStyle = { fgColor: { rgb: "ECFDF5" } };
        fontStyle = { name: "Calibri", sz: 12, bold: true, color: { rgb: "065F46" } };
        if (C === 0) alignmentStyle = { horizontal: "center", vertical: "center" };
        borderStyle = {
          top: { style: "thick", color: { rgb: "10B981" } },
          bottom: { style: "thick", color: { rgb: "10B981" } }
        };
      } else {
        if (isEvenRow) fillStyle = { fgColor: { rgb: "F8FAFC" } };
        borderStyle = { bottom: { style: "thin", color: { rgb: "E2E8F0" } } };
      }

      // Currency format
      if (!isHeader && currencyCols.includes(C) && worksheet[cellAddress].v !== '') {
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

  // Row heights (only for data rows, header rows handled by addSheetHeader)
  const rowHeights = worksheet['!rows'] || [];
  for (let R = dataStartRow; R <= range.e.r; ++R) {
    rowHeights[R] = { hpt: R === dataStartRow ? 30 : (R === range.e.r ? 35 : 22) };
  }
  worksheet['!rows'] = rowHeights;
}


// ─── MATERIAL LIST EXCEL EXPORT ───
function safeParseItems(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function safeParseBreakdown(raw) {
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

/**
 * Exports a single quotation's raw material list to an Excel file.
 * @param {Object} quote - Full quotation object
 * @param {string} fileName - Output filename
 */
export const exportMaterialListToExcel = (quote, fileName, returnWorkbook = false) => {
  if (!quote) return;
  if (!fileName) fileName = `MaterialList_${quote.quotation_no || 'Export'}.xlsx`;

  const items = safeParseItems(quote.items);

  const rows = items.filter(item => item.material).map((item, index) => {
    const dims = item.dimensions || {};
    let dimStr = '—';
    if (item.shape === 'rect') dimStr = `${dims.l}x${dims.w}x${dims.t}`;
    else if (item.shape === 'round') dimStr = `Dia ${dims.dia} x ${dims.l}`;
    else if (item.shape === 'hex') dimStr = `AF ${dims.af} x ${dims.l}`;

    const unitWt = parseFloat(item.material_weight || 0);
    const qty = item.qty || 1;
    const rate = parseFloat(item.material.base_rate || item.material.rate || 0);

    return {
      'Sr.': index + 1,
      'Part Name': item.part_name || '—',
      'Material / Grade': item.material.grade || '—',
      'Dimensions (mm)': dimStr,
      'Qty': qty,
      'Unit Weight (kg)': Math.round(unitWt * 100) / 100,
      'Total Weight (kg)': Math.round(unitWt * qty * 100) / 100,
      'Rate (₹/kg)': Math.round(rate * 100) / 100,
      'Amount (₹)': Math.round(unitWt * qty * rate * 100) / 100
    };
  });

  // Total row
  const totalWt = rows.reduce((sum, r) => sum + r['Total Weight (kg)'], 0);
  const totalAmt = rows.reduce((sum, r) => sum + r['Amount (₹)'], 0);
  rows.push({
    'Sr.': 'TOTAL',
    'Part Name': '',
    'Material / Grade': '',
    'Dimensions (mm)': '',
    'Qty': '',
    'Unit Weight (kg)': '',
    'Total Weight (kg)': Math.round(totalWt * 100) / 100,
    'Rate (₹/kg)': '',
    'Amount (₹)': Math.round(totalAmt * 100) / 100
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Add branded header (shifts data down by 4 rows)
  const headerOffset = addSheetHeader(worksheet, {
    docLabel: 'MATERIAL LIST',
    qtnNo: quote.quotation_no,
    sectionTitle: 'SECTION 01: RAW MATERIAL SPECIFICATIONS',
    colCount: 9
  });

  // Currency cols: Rate(7), Amount(8)  |  Number cols: Qty(4), Unit Wt(5), Total Wt(6)
  applyProfessionalStyling(worksheet, { numberCols: [4, 5, 6], currencyCols: [7, 8], dataStartRow: headerOffset });

  // Column widths
  worksheet['!cols'] = [
    { wch: 6 },   // Sr.
    { wch: 22 },  // Part Name
    { wch: 20 },  // Material
    { wch: 22 },  // Dimensions
    { wch: 8 },   // Qty
    { wch: 16 },  // Unit Weight
    { wch: 16 },  // Total Weight
    { wch: 14 },  // Rate
    { wch: 16 }   // Amount
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Material List');
  if (returnWorkbook) return workbook;
  XLSX.writeFile(workbook, fileName);
};


// ─── PROCESS SHEET EXCEL EXPORT ───

/**
 * Exports a single quotation's manufacturing process sheet to an Excel file.
 * @param {Object} quote - Full quotation object
 * @param {string} fileName - Output filename
 */
export const exportProcessSheetToExcel = (quote, fileName, returnWorkbook = false) => {
  if (!quote) return;
  if (!fileName) fileName = `ProcessSheet_${quote.quotation_no || 'Export'}.xlsx`;

  const items = safeParseItems(quote.items);
  const projectQty = Number(quote.quantity ?? 1);

  const rows = [];
  items.forEach((item, index) => {
    if (item.processes && item.processes.length > 0) {
      item.processes.forEach((p, pIdx) => {
        const rate = parseFloat(p.rate || p.hourly_rate || 0);
        const setup = parseFloat(p.setup_time || 0);
        const cycle = parseFloat(p.cycle_time || 0);
        const unit = p.unit || 'hr';

        let amount = 0;
        if (unit === 'hr') {
          amount = ((setup + (cycle * (item.qty || 1))) / 60) * rate;
        } else {
          amount = (setup + (cycle * (item.qty || 1))) * rate;
        }

        rows.push({
          'Sr.': pIdx === 0 ? index + 1 : '',
          'Part Name': pIdx === 0 ? (item.part_name || '—') : '',
          'Operation': p.process_name || '—',
          'Setup (min)': Math.round(setup * 100) / 100,
          'Cycle (min)': Math.round(cycle * 100) / 100,
          'Rate': `${rate.toFixed(2)}/${unit}`,
          'Amount (₹)': Math.round(amount * 100) / 100
        });
      });
    }
  });

  // Total row
  const totalAmt = rows.reduce((sum, r) => sum + (typeof r['Amount (₹)'] === 'number' ? r['Amount (₹)'] : 0), 0);
  rows.push({
    'Sr.': 'TOTAL',
    'Part Name': '',
    'Operation': '',
    'Setup (min)': '',
    'Cycle (min)': '',
    'Rate': '',
    'Amount (₹)': Math.round(totalAmt * 100) / 100
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 1 ? rows : [{
    'Sr.': '—', 'Part Name': 'No processes defined', 'Operation': '—',
    'Setup (min)': '—', 'Cycle (min)': '—', 'Rate': '—', 'Amount (₹)': '—'
  }]);

  // Add branded header (shifts data down by 4 rows)
  const headerOffset = addSheetHeader(worksheet, {
    docLabel: 'PROCESS SHEET',
    qtnNo: quote.quotation_no,
    sectionTitle: 'SECTION 02: MANUFACTURING PROCESS SHEET',
    colCount: 7
  });

  applyProfessionalStyling(worksheet, { numberCols: [3, 4], currencyCols: [6], dataStartRow: headerOffset });

  worksheet['!cols'] = [
    { wch: 6 },   // Sr.
    { wch: 22 },  // Part Name
    { wch: 24 },  // Operation
    { wch: 14 },  // Setup
    { wch: 14 },  // Cycle
    { wch: 16 },  // Rate
    { wch: 16 }   // Amount
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Process Sheet');
  if (returnWorkbook) return workbook;
  XLSX.writeFile(workbook, fileName);
};


// ─── BOP (BOUGHT-OUT PARTS) LIST EXCEL EXPORT ───

/**
 * Exports a single quotation's BOP list to an Excel file.
 * @param {Object} quote - Full quotation object
 * @param {string} fileName - Output filename
 */
export const exportBOPListToExcel = (quote, fileName, returnWorkbook = false) => {
  if (!quote) return;
  if (!fileName) fileName = `BOP_List_${quote.quotation_no || 'Export'}.xlsx`;

  const breakdown = safeParseBreakdown(quote.detailed_breakdown);
  const bopItems = breakdown.bought_out_items || [];

  const rows = bopItems.map((item, index) => {
    const rate = parseFloat(item.rate || 0);
    const qty = item.qty || 1;
    return {
      'Sr.': index + 1,
      'Item Description': item.item_name || '—',
      'Unit': item.unit || 'pcs',
      'Qty': qty,
      'Rate (₹)': Math.round(rate * 100) / 100,
      'Total (₹)': Math.round(rate * qty * 100) / 100
    };
  });

  // Total row
  const totalAmt = rows.reduce((sum, r) => sum + r['Total (₹)'], 0);
  rows.push({
    'Sr.': 'TOTAL',
    'Item Description': '',
    'Unit': '',
    'Qty': '',
    'Rate (₹)': '',
    'Total (₹)': Math.round(totalAmt * 100) / 100
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 1 ? rows : [{
    'Sr.': '—', 'Item Description': 'No items specified', 'Unit': '—',
    'Qty': '—', 'Rate (₹)': '—', 'Total (₹)': '—'
  }]);

  // Add branded header (shifts data down by 4 rows)
  const headerOffset = addSheetHeader(worksheet, {
    docLabel: 'BOP LIST',
    qtnNo: quote.quotation_no,
    sectionTitle: 'SECTION 03: BOP PROCUREMENT LIST',
    colCount: 6
  });

  applyProfessionalStyling(worksheet, { numberCols: [3], currencyCols: [4, 5], dataStartRow: headerOffset });

  worksheet['!cols'] = [
    { wch: 6 },   // Sr.
    { wch: 36 },  // Item Description
    { wch: 10 },  // Unit
    { wch: 8 },   // Qty
    { wch: 16 },  // Rate
    { wch: 18 }   // Total
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BOP List');
  if (returnWorkbook) return workbook;
  XLSX.writeFile(workbook, fileName);
};

// ─── FULL QUOTATION (Multi-Sheet Workbook) ───
export const exportFullQuotationToExcel = (quote, fileName = 'Full_Quotation.xlsx', returnWorkbook = false) => {
  if (!quote) return;

  const items = safeParseItems(quote.items);
  const breakdown = safeParseBreakdown(quote.detailed_breakdown);
  const projectQty = Number(quote.quantity ?? 1);

  const workbook = XLSX.utils.book_new();

  // ────────────────────────────────────────────────
  // SHEET 1: NEW SHEET (Placeholder)
  // ────────────────────────────────────────────────
  const newSheetData = [
    ['New Sheet'],
    ['(Please specify the content for this sheet)']
  ];
  const newSheetWS = XLSX.utils.aoa_to_sheet(newSheetData);
  XLSX.utils.book_append_sheet(workbook, newSheetWS, 'Cover'); // Temporary name

  // ────────────────────────────────────────────────
  // SHEET 2: QUOTATION SUMMARY
  // ────────────────────────────────────────────────
  const summaryData = [];
  const docMeta = `FULL QUOTATION | QTN: ${quote.quotation_no || '—'}`;

  // Company header block (matches addSheetHeader style but includes address)
  summaryData.push(['KAIVALYA ENGINEERING', '', docMeta]);
  summaryData.push(['Manufacturing & Supply of SPM, Precision Tools, Die & Components', '', '']);
  summaryData.push(['Pavana Industrial Premises, Bhoseri, PCMC, Pune 411044', '', '']);
  summaryData.push(['Phone: 9527352858  |  Email: info@kaivalya.co.in', '', '']);
  summaryData.push(['GSTIN: 27AAKPF1080D1Z4  |  State: Maharashtra CODE:27', '', '']);
  summaryData.push(['', '', '']); // spacer

  // Quotation metadata block
  summaryData.push(['SECTION 01: QUOTATION SUMMARY', '', '']);
  summaryData.push(['', '', '']); // spacer
  summaryData.push(['Field', 'Value', '']);
  summaryData.push(['Quotation No.', quote.quotation_no || '—', '']);
  summaryData.push(['Date', quote.inquiry_date ? new Date(quote.inquiry_date).toLocaleDateString('en-GB') : '—', '']);
  summaryData.push(['Customer', quote.supplier_name || '—', '']);
  summaryData.push(['Project Name', quote.project_name || '—', '']);
  summaryData.push(['Contact Person', quote.contact_person || '—', '']);
  summaryData.push(['Phone', quote.contact_phone || '—', '']);
  summaryData.push(['Email', quote.contact_email || '—', '']);
  summaryData.push(['Project Incharge', quote.quoting_engineer || '—', '']);
  summaryData.push(['Revision', quote.revision_no || '—', '']);
  summaryData.push(['Ref No.', breakdown.order_ref_no || '—', '']);
  summaryData.push(['Valid For', breakdown.valid_for || '15 DAYS', '']);
  summaryData.push(['Delivery Date', quote.delivery_date ? new Date(quote.delivery_date).toLocaleDateString('en-GB') : '—', '']);
  summaryData.push(['Quantity', projectQty, '']);
  summaryData.push(['Production Mode', quote.production_mode || '—', '']);
  summaryData.push(['', '', '']); // spacer

  // Cost breakdown ledger
  summaryData.push(['SECTION 02: VALUATION LEDGER', '', '']);
  summaryData.push(['', '', '']); // spacer
  summaryData.push(['Cost Head', 'Per Unit (₹)', 'Total (₹)']);

  const matCost = parseFloat(breakdown.materialCost || 0);
  const labCost = parseFloat(breakdown.laborCost || 0);
  const bopCostVal = parseFloat(breakdown.bopCost || 0);
  const treatCost = parseFloat(breakdown.treatmentCost || 0);
  const unitSubtotal = parseFloat(breakdown.unitSubtotal || quote.subtotal || 0);
  const markupPct = parseFloat(quote.markup || 0);
  const unitFinal = parseFloat(breakdown.unitFinal || quote.unit_price || 0);
  const engCost = parseFloat(breakdown.engineeringCost || 0);
  const commCost = parseFloat(breakdown.commercialCost || 0);
  const grandTotal = parseFloat(quote.total_amount || 0);

  summaryData.push(['Raw Material', r2(matCost), r2(matCost * projectQty)]);
  summaryData.push(['Machining / Labour', r2(labCost), r2(labCost * projectQty)]);
  summaryData.push(['Bought-Out Parts (BOP)', r2(bopCostVal), r2(bopCostVal * projectQty)]);
  summaryData.push(['Surface Treatments', r2(treatCost), r2(treatCost * projectQty)]);
  summaryData.push(['', '', '']);
  summaryData.push(['Unit Subtotal', r2(unitSubtotal), '']);
  summaryData.push([`Markup (${markupPct}%)`, r2(unitFinal - unitSubtotal), '']);
  summaryData.push(['Unit Price (Final)', r2(unitFinal), '']);
  summaryData.push(['', '', '']);
  summaryData.push(['Qty × Unit Price', '', r2(unitFinal * projectQty)]);
  summaryData.push(['Engineering / Design', '', r2(engCost)]);
  summaryData.push(['Logistics / Packaging', '', r2(commCost)]);
  summaryData.push(['', '', '']);
  summaryData.push(['GRAND TOTAL (₹)', '', r2(grandTotal)]);

  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);

  // Style the summary sheet
  const sRange = XLSX.utils.decode_range(summaryWS['!ref']);
  for (let R = sRange.s.r; R <= sRange.e.r; ++R) {
    for (let C = sRange.s.c; C <= sRange.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!summaryWS[addr]) summaryWS[addr] = { v: '', t: 's' };

      const val = summaryWS[addr].v;
      let style = { font: { name: 'Calibri', sz: 11 }, alignment: { vertical: 'center' } };

      // Company header rows (0-4)
      if (R === 0) {
        if (C === 0) {
          style.font = { name: 'Calibri', sz: 16, bold: true, color: { rgb: '1E407D' } };
          style.alignment = { horizontal: 'left', vertical: 'center' };
        } else if (C === 2) {
          style.font = { name: 'Calibri', sz: 9, color: { rgb: '666666' } };
          style.alignment = { horizontal: 'right', vertical: 'center' };
        }
      } else if (R >= 1 && R <= 4) {
        if (C === 0) {
          style.font = { name: 'Calibri', sz: 10, color: { rgb: '555555' } };
          style.alignment = { horizontal: 'left', vertical: 'center' };
        }
      }


      // Section headers (row 6 and row 24)
      if (val === 'SECTION 01: QUOTATION SUMMARY' || val === 'SECTION 02: VALUATION LEDGER') {
        style.font = { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } };
        style.alignment = { horizontal: 'center', vertical: 'center' };
      }

      // Table headers
      if ((val === 'Field' && R === 8) || (val === 'Value' && R === 8) ||
          (val === 'Cost Head' && R === 26) || (val === 'Per Unit (₹)' && R === 26) || (val === 'Total (₹)' && R === 26)) {
        style.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
        style.fill = { fgColor: { rgb: '3C3C3C' } };
        style.alignment = { horizontal: C > 0 ? 'right' : 'left', vertical: 'center' };
      }

      // Grand Total row
      if (val === 'GRAND TOTAL (₹)') {
        style.font = { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
        style.fill = { fgColor: { rgb: '047857' } };
      }
      if (R === sRange.e.r && C > 0) {
        style.font = { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
        style.fill = { fgColor: { rgb: '047857' } };
        if (val !== '') style.numFmt = '₹#,##0.00';
        style.alignment = { horizontal: 'right', vertical: 'center' };
      }

      // Currency columns in ledger
      if (typeof val === 'number' && R > 26) {
        style.numFmt = '₹#,##0.00';
        style.alignment = { horizontal: 'right', vertical: 'center' };
      }


      summaryWS[addr].s = style;
    }
  }

  summaryWS['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }];

  // Custom Row Heights for visual breathing room
  const rowHeights = [];
  for (let R = 0; R <= sRange.e.r; ++R) {
    if (R === 0) rowHeights.push({ hpt: 28 }); // Company Name
    else if (R >= 1 && R <= 4) rowHeights.push({ hpt: 16 }); // Address
    else if (R === 5 || R === 7 || R === 23 || R === 25) rowHeights.push({ hpt: 8 }); // Spacers
    else if (R === 6 || R === 24) rowHeights.push({ hpt: 24 }); // Section titles
    else rowHeights.push({ hpt: 22 }); // Data rows
  }
  summaryWS['!rows'] = rowHeights;

  // Merges for the summary sheet
  summaryWS['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },  // Company Name spans A-B (C is Doc Meta)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },  // Address lines span A-C
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },  // SECTION 01: QUOTATION SUMMARY
    { s: { r: 24, c: 0 }, e: { r: 24, c: 2 } } // SECTION 02: VALUATION LEDGER
  ];


  // ────────────────────────────────────────────────
  // SHEET 2: MATERIAL LIST
  // ────────────────────────────────────────────────
  const matRows = items.filter(item => item.material).map((item, index) => {
    const dims = item.dimensions || {};
    let dimStr = '—';
    if (item.shape === 'rect') dimStr = `${dims.l}x${dims.w}x${dims.t}`;
    else if (item.shape === 'round') dimStr = `Dia ${dims.dia} x ${dims.l}`;
    else if (item.shape === 'hex') dimStr = `AF ${dims.af} x ${dims.l}`;

    const unitWt = parseFloat(item.material_weight || 0);
    const qty = item.qty || 1;
    const rate = parseFloat(item.material.base_rate || item.material.rate || 0);

    return {
      'Sr.': index + 1,
      'Part Name': item.part_name || '—',
      'Material': item.material.grade || '—',
      'Dimensions (mm)': dimStr,
      'Qty': qty,
      'Unit Wt (kg)': r2(unitWt),
      'Total Wt (kg)': r2(unitWt * qty),
      'Rate (₹/kg)': r2(rate),
      'Amount (₹)': r2(unitWt * qty * rate)
    };
  });

  const matTotal = matRows.reduce((s, r) => s + r['Amount (₹)'], 0);
  matRows.push({
    'Sr.': 'TOTAL', 'Part Name': '', 'Material': '', 'Dimensions (mm)': '',
    'Qty': '', 'Unit Wt (kg)': '', 'Total Wt (kg)': '', 'Rate (₹/kg)': '',
    'Amount (₹)': r2(matTotal)
  });

  const matWS = XLSX.utils.json_to_sheet(matRows);
  const matHeaderOffset = addSheetHeader(matWS, {
    docLabel: 'MATERIAL LIST',
    qtnNo: quote.quotation_no,
    sectionTitle: 'SECTION 01: RAW MATERIAL SPECIFICATIONS',
    colCount: 9
  });
  applyProfessionalStyling(matWS, { numberCols: [4], currencyCols: [5, 6, 7, 8], dataStartRow: matHeaderOffset });
  matWS['!cols'] = [
    { wch: 6 }, { wch: 24 }, { wch: 18 }, { wch: 22 },
    { wch: 6 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(workbook, matWS, 'Material List');

  // ────────────────────────────────────────────────
  // SHEET 3: PROCESS SHEET
  // ────────────────────────────────────────────────
  const procRows = [];
  items.forEach((item, index) => {
    const processes = item.processes || [];
    const qty = item.qty || 1;
    if (processes.length === 0) {
      procRows.push({
        'Sr.': index + 1, 'Part Name': item.part_name || '—',
        'Operation': 'Standard Precision', 'Setup (min)': 0,
        'Cycle (min)': 0, 'Rate': '—', 'Amount (₹)': 0
      });
    } else {
      processes.forEach((p, pIdx) => {
        const rate = parseFloat(p.rate || p.hourly_rate || 0);
        const setup = parseFloat(p.setup_time || 0);
        const cycle = parseFloat(p.cycle_time || 0);
        const unit = p.unit || 'hr';
        let amount = 0;
        if (unit === 'hr') {
          amount = ((setup + (cycle * qty)) / 60) * rate;
        } else {
          amount = (setup + (cycle * qty)) * rate;
        }
        procRows.push({
          'Sr.': pIdx === 0 ? index + 1 : '',
          'Part Name': pIdx === 0 ? item.part_name || '—' : '',
          'Operation': p.process_name || '—',
          'Setup (min)': r2(setup),
          'Cycle (min)': r2(cycle),
          'Rate': `${r2(rate)}/${unit}`,
          'Amount (₹)': r2(amount)
        });
      });
    }
  });

  const procTotal = procRows.reduce((s, r) => s + (typeof r['Amount (₹)'] === 'number' ? r['Amount (₹)'] : 0), 0);
  procRows.push({
    'Sr.': 'TOTAL', 'Part Name': '', 'Operation': '',
    'Setup (min)': '', 'Cycle (min)': '', 'Rate': '',
    'Amount (₹)': r2(procTotal)
  });

  const procWS = XLSX.utils.json_to_sheet(procRows);
  const procHeaderOffset = addSheetHeader(procWS, {
    docLabel: 'PROCESS SHEET',
    qtnNo: quote.quotation_no,
    sectionTitle: 'SECTION 02: MANUFACTURING PROCESS SHEET',
    colCount: 7
  });
  applyProfessionalStyling(procWS, { numberCols: [3, 4], currencyCols: [6], dataStartRow: procHeaderOffset });
  procWS['!cols'] = [
    { wch: 6 }, { wch: 24 }, { wch: 24 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(workbook, procWS, 'Process Sheet');

  // ────────────────────────────────────────────────
  // SHEET 4: BOP LIST
  // ────────────────────────────────────────────────
  const bopItems = breakdown.bought_out_items || [];
  const bopRows = bopItems.map((item, index) => ({
    'Sr.': index + 1,
    'Item Description': item.item_name || '—',
    'Unit': item.unit || 'pcs',
    'Qty': item.qty || 0,
    'Rate (₹)': r2(parseFloat(item.rate || 0)),
    'Total (₹)': r2(parseFloat(item.rate || 0) * (item.qty || 1))
  }));

  const bopTotal = bopRows.reduce((s, r) => s + r['Total (₹)'], 0);
  bopRows.push({
    'Sr.': 'TOTAL', 'Item Description': '', 'Unit': '',
    'Qty': '', 'Rate (₹)': '', 'Total (₹)': r2(bopTotal)
  });

  const bopWS = XLSX.utils.json_to_sheet(bopRows.length > 1 ? bopRows : [{
    'Sr.': '—', 'Item Description': 'No items specified', 'Unit': '—',
    'Qty': '—', 'Rate (₹)': '—', 'Total (₹)': '—'
  }]);
  const bopHeaderOffset = addSheetHeader(bopWS, {
    docLabel: 'BOP LIST',
    qtnNo: quote.quotation_no,
    sectionTitle: 'SECTION 03: BOP PROCUREMENT LIST',
    colCount: 6
  });
  applyProfessionalStyling(bopWS, { numberCols: [3], currencyCols: [4, 5], dataStartRow: bopHeaderOffset });
  bopWS['!cols'] = [
    { wch: 6 }, { wch: 36 }, { wch: 10 },
    { wch: 8 }, { wch: 16 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, bopWS, 'BOP List');

  XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

  // ────────────────────────────────────────────────
  // WRITE FILE
  // ────────────────────────────────────────────────
  if (returnWorkbook) return workbook;
  XLSX.writeFile(workbook, fileName);
};

// ─── Utility: Round to 2 decimal places ───
function r2(val) {
  return Math.round(parseFloat(val || 0) * 100) / 100;
}
