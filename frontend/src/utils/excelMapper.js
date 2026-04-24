/**
 * Maps a SheetJS Workbook to an array of x-data-spreadsheet data objects.
 * This is the single public API for the ExcelPreviewModal.
 *
 * @param {import('xlsx').WorkBook} wb - The SheetJS workbook
 * @param {typeof import('xlsx')} XLSX - The XLSX library reference (passed to avoid global dependency)
 * @returns {Array} Array of sheet data objects for x-spreadsheet's loadData()
 */
export function convertXlsxToXSpreadsheet(wb, XLSX) {
  return wb.SheetNames.map(name => {
    const ws = wb.Sheets[name];
    const data = mapSheet(ws, XLSX);
    data.name = name;
    return data;
  });
}

// ─── Internal: Map a single SheetJS worksheet to x-spreadsheet format ───

function mapSheet(ws, XLSX) {
  const result = {
    name: 'Sheet',
    rows: {},
    cols: {},
    merges: [],
    styles: [],
  };

  if (!ws || !ws['!ref']) return result;

  const range = XLSX.utils.decode_range(ws['!ref']);

  // ── Merges ──
  if (ws['!merges']) {
    ws['!merges'].forEach(merge => {
      result.merges.push(XLSX.utils.encode_range(merge));
    });
  }

  // ── Column Widths ──
  if (ws['!cols']) {
    ws['!cols'].forEach((col, i) => {
      if (col.wpx) result.cols[i] = { width: col.wpx };
      else if (col.wch) result.cols[i] = { width: col.wch * 9 }; // Improved multiplier for better matching
    });
  }

  // ── Rows & Cells ──
  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowData = { cells: {} };
    let hasData = false;

    // Row Height (HPT → PX approximation)
    if (ws['!rows'] && ws['!rows'][r]) {
      if (ws['!rows'][r].hpt) rowData.height = ws['!rows'][r].hpt * 1.3;
    }

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddress];
      if (!cell) continue;

      hasData = true;

      // Resolve display text: prefer formatted text (cell.w), fall back to raw value (cell.v)
      let displayText = '';
      if (cell.w !== undefined && cell.w !== null) {
        displayText = String(cell.w);
      } else if (cell.v !== undefined && cell.v !== null) {
        displayText = String(cell.v);
      }

      const cellData = { text: displayText };

      // Detect image placeholders and tag them for the UI
      if (displayText.startsWith('[IMG:') && displayText.endsWith(']')) {
        cellData.imageId = displayText.substring(5, displayText.length - 1);
        cellData.text = ''; // Clear text so it doesn't show behind the image overlay
      }

      // ── Style Mapping ──
      if (cell.s) {
        const style = {};

        // Font properties
        if (cell.s.font) {
          if (cell.s.font.bold) style.bold = true;
          if (cell.s.font.sz) style.font = { size: cell.s.font.sz };
          if (cell.s.font.color && cell.s.font.color.rgb) {
            const rgb = cell.s.font.color.rgb;
            style.color = '#' + (rgb.length === 8 ? rgb.substring(2) : rgb);
          }
        }

        // Fill / Background
        if (cell.s.fill && cell.s.fill.fgColor && cell.s.fill.fgColor.rgb) {
          const rgb = cell.s.fill.fgColor.rgb;
          style.bgcolor = '#' + (rgb.length === 8 ? rgb.substring(2) : rgb);
        }

        // Alignment — Canvas textBaseline uses 'middle', not 'center'
        if (cell.s.alignment) {
          if (cell.s.alignment.horizontal) style.align = cell.s.alignment.horizontal;
          if (cell.s.alignment.vertical) {
            const vAlign = cell.s.alignment.vertical;
            style.valign = vAlign === 'center' ? 'middle' : vAlign;
          }
        }

        // Borders
        if (cell.s.border) {
          style.border = {};
          if (cell.s.border.top) style.border.top = ['thin', '#000'];
          if (cell.s.border.bottom) style.border.bottom = ['thin', '#000'];
          if (cell.s.border.left) style.border.left = ['thin', '#000'];
          if (cell.s.border.right) style.border.right = ['thin', '#000'];
        }

        // De-duplicate styles via index reference
        const styleJSON = JSON.stringify(style);
        const styleIndex = result.styles.findIndex(s => JSON.stringify(s) === styleJSON);
        if (styleIndex > -1) {
          cellData.style = styleIndex;
        } else {
          result.styles.push(style);
          cellData.style = result.styles.length - 1;
        }
      }

      rowData.cells[c] = cellData;
    }

    if (hasData) result.rows[r] = rowData;
  }

  // ── Apply Merges to Top-Left Cells ──
  if (ws['!merges']) {
    ws['!merges'].forEach(merge => {
      const r = merge.s.r;
      const c = merge.s.c;
      
      if (!result.rows[r]) result.rows[r] = { cells: {} };
      if (!result.rows[r].cells[c]) result.rows[r].cells[c] = {};
      
      result.rows[r].cells[c].merge = [
        merge.e.r - merge.s.r,
        merge.e.c - merge.s.c
      ];
    });
  }

  return result;
}
