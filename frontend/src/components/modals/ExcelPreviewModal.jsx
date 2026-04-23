"use client";

import React, { useState } from 'react';
import { X, Download, Maximize2, Minimize2, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { THEME } from '@/constants/ui';

const ExcelPreviewModal = ({ 
  isOpen, 
  onClose, 
  onDownload,
  title = "Excel Preview",
  filename = "document.xlsx"
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full h-full flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 m-0 rounded-0' : 'max-w-5xl max-h-[90vh] rounded-none md:rounded-[32px] border border-zinc-200'}`}>
        
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
              title={isFullscreen ? "Minimize" : "Fullscreen"}
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

        {/* Content Placeholder */}
        <div className="flex-1 bg-zinc-50 relative overflow-hidden flex flex-col p-4 md:p-8">
            <div className="w-full h-full bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                {/* Excel-like Tabs */}
                <div className="flex bg-zinc-100 border-b border-zinc-200 px-4">
                    {['Sheet1', 'Summary', 'Calculations'].map((sheet, i) => (
                        <div key={sheet} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-r border-zinc-200 ${i === 0 ? 'bg-white text-emerald-600 border-t-2 border-t-emerald-500' : 'text-zinc-400'}`}>
                            {sheet}
                        </div>
                    ))}
                </div>

                {/* Spreadsheet UI Placeholder */}
                <div className="flex-1 overflow-auto relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 backdrop-blur-[2px] z-10 text-center p-8">
                        <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 shadow-inner animate-bounce">
                            <FileSpreadsheet className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-2">Live Preview Pending</h2>
                        <p className="max-w-xs text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em] leading-relaxed">
                            We are currently optimizing the real-time excel engine. 
                            Download the file to view full technical breakdowns.
                        </p>
                        
                        <div className="mt-10 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-100 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Multi-Sheet Data</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-100 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Auto Formatting</span>
                            </div>
                        </div>
                    </div>

                    {/* Dummy Spreadsheet Grid */}
                    <div className="w-full">
                        <div className="flex border-b border-zinc-200 bg-zinc-50">
                            <div className="w-12 h-8 border-r border-zinc-200" />
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(col => (
                                <div key={col} className="flex-1 h-8 border-r border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                    {col}
                                </div>
                            ))}
                        </div>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(row => (
                            <div key={row} className="flex border-b border-zinc-100">
                                <div className="w-12 h-10 border-r border-zinc-200 bg-zinc-50 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                    {row}
                                </div>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(col => (
                                    <div key={col} className="flex-1 h-10 border-r border-zinc-100 p-2">
                                        <div className="h-2 w-full bg-zinc-50 rounded-full opacity-50" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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
