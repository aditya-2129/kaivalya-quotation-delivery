"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Maximize2, Minimize2, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
// x-spreadsheet CSS and JS are dynamically imported in useEffect to avoid SSR issues
import { convertXlsxToXSpreadsheet } from '@/utils/excelMapper';
import { 
  exportMaterialListToExcel, 
  exportProcessSheetToExcel, 
  exportBOPListToExcel, 
  exportFullQuotationToExcel,
  exportQuotationsToExcel,
  exportPurchaseOrdersToExcel
} from '@/utils/exportToExcel';

const ExcelPreviewModal = ({ 
  isOpen, 
  onClose, 
  onDownload,
  title = "Excel Preview",
  filename = "document.xlsx",
  quotation,
  optionId,
  data
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const spreadsheetRef = useRef(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const initSpreadsheet = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Dynamically import Spreadsheet and its CSS to avoid SSR issues
          await import('x-data-spreadsheet/dist/xspreadsheet.css');
          const SpreadsheetModule = await import('x-data-spreadsheet/dist/xspreadsheet.js');
          
          // Handle different module export formats
          let Spreadsheet = SpreadsheetModule.default || SpreadsheetModule;
          
          // Some bundles wrap the default twice or use a named export
          if (typeof Spreadsheet !== 'function' && Spreadsheet.default) {
            Spreadsheet = Spreadsheet.default;
          }
          
          // If it's still not a function, try to see if it's on the window (last resort for UMD)
          if (typeof Spreadsheet !== 'function' && typeof window !== 'undefined' && window.x_spreadsheet) {
            Spreadsheet = window.x_spreadsheet;
          }

          if (typeof Spreadsheet !== 'function') {
            console.error("Resolved Spreadsheet:", Spreadsheet);
            throw new Error("Spreadsheet engine could not be initialized correctly.");
          }

          let workbook;

          // Generate workbook based on optionId
          if (optionId === 'material_excel') {
            workbook = exportMaterialListToExcel(quotation, null, true);
          } else if (optionId === 'process_excel') {
            workbook = exportProcessSheetToExcel(quotation, null, true);
          } else if (optionId === 'bop_excel') {
            workbook = exportBOPListToExcel(quotation, null, true);
          } else if (optionId === 'full_excel') {
            workbook = exportFullQuotationToExcel(quotation, null, true);
          } else if (optionId === 'quotations_excel') {
            workbook = exportQuotationsToExcel(data, null, true);
          } else if (optionId === 'po_excel') {
            workbook = exportPurchaseOrdersToExcel(data, null, true);
          }

          if (!workbook) {
            throw new Error("Failed to generate preview data.");
          }

          const xData = convertXlsxToXSpreadsheet(workbook, XLSX);

          // Clear container
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }

          // Initialize x-spreadsheet
          const options = {
            mode: 'read',
            showToolbar: false,
            showGrid: true,
            showContextmenu: false,
            view: {
              height: () => containerRef.current?.offsetHeight || 600,
              width: () => containerRef.current?.offsetWidth || 1000,
            },
            row: {
              height: 25,
              len: 100,
            },
            col: {
              len: 26,
              width: 100,
              indexWidth: 60,
              minWidth: 60,
            },
            style: {
              bgcolor: '#ffffff',
              align: 'left',
              valign: 'middle',
              textwrap: false,
              strike: false,
              underline: false,
              color: '#333',
              font: {
                name: 'Helvetica',
                size: 10,
                bold: false,
                italic: false,
              },
            },
          };

          const s = new Spreadsheet(containerRef.current, options)
            .loadData(xData);
          
          spreadsheetRef.current = s;

          // ─── Auto-Resize Fix ───
          // x-spreadsheet only listens to window resize by default.
          // We use a ResizeObserver on the container to trigger a synthetic 
          // window resize event whenever the modal toggles full-screen.
          const observer = new ResizeObserver(() => {
            window.dispatchEvent(new Event('resize'));
          });
          observer.observe(containerRef.current);
          spreadsheetRef.current.__resizeObserver = observer;

          setIsLoading(false);
        } catch (err) {
          console.error("Spreadsheet Init Error:", err);
          setError(err.message || "Could not render spreadsheet preview.");
          setIsLoading(false);
        }
      };

      initSpreadsheet();
    }

    return () => {
      if (spreadsheetRef.current) {
        if (spreadsheetRef.current.__resizeObserver) {
          spreadsheetRef.current.__resizeObserver.disconnect();
        }
        spreadsheetRef.current = null;
      }
    };
  }, [isOpen, optionId, quotation, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full h-full flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 m-0 rounded-0' : 'max-w-6xl max-h-[92vh] rounded-none md:rounded-[32px] border border-zinc-200'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-tight text-zinc-950 leading-none">{title}</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{filename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-10 w-10 hidden md:flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button 
              onClick={onDownload}
              className="px-4 h-10 flex items-center gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-200/50"
            >
              <Download className="h-4 w-4" />
              Download .XLSX
            </button>
            <div className="w-px h-6 bg-zinc-200 mx-1" />
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-zinc-50 relative overflow-hidden flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                <Loader2 className="h-6 w-6 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 animate-pulse">
                Assembling Spreadsheet...
              </p>
            </div>
          )}

          {error ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white">
              <div className="h-20 w-20 rounded-[2.5rem] bg-red-50 flex items-center justify-center mb-8">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-3">Preview Failed</h3>
              <p className="text-sm text-zinc-500 max-w-sm mb-10 leading-relaxed font-medium">{error}</p>
              <button 
                onClick={onDownload}
                className="px-8 h-12 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 shadow-xl shadow-zinc-200"
              >
                <Download className="h-5 w-5" />
                Download Directly
              </button>
            </div>
          ) : (
            <div 
              ref={containerRef} 
              className="w-full h-full x-spreadsheet-container overflow-hidden" 
              style={{ background: '#ffffff' }}
            />
          )}
        </div>

        {/* Mobile Footer Toggle */}
        <div className="md:hidden p-4 border-t border-zinc-100 bg-white flex justify-center">
            <button 
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-zinc-950 text-white font-bold text-[11px] uppercase tracking-widest"
            >
              Close Preview
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelPreviewModal;
