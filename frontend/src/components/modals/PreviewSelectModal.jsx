import React from 'react';
import { X, FileText, Table } from 'lucide-react';

export default function PreviewSelectModal({ isOpen, onClose, onSelectNormal, onSelectExcel, quotationNo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50/50">
          <div>
            <h3 className="text-[14px] font-black text-zinc-900 uppercase tracking-widest">Select Preview</h3>
            {quotationNo && (
              <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Quotation Ref: <span className="font-bold text-brand-primary">{quotationNo}</span></p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex gap-4">
          
          <button 
            onClick={onSelectNormal}
            className="flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-zinc-100 bg-white hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
          >
            <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
              <FileText className="h-6 w-6 text-zinc-400 group-hover:text-brand-primary transition-colors" />
            </div>
            <div className="text-center">
              <div className="text-[12px] font-bold text-zinc-800">Normal Preview</div>
              <div className="text-[10px] text-zinc-500 mt-1 px-2 leading-tight">Web-based visual preview of the quotation.</div>
            </div>
          </button>

          <button 
            onClick={onSelectExcel}
            className="flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-zinc-100 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
              <Table className="h-6 w-6 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div className="text-center">
              <div className="text-[12px] font-bold text-zinc-800">Excel Preview</div>
              <div className="text-[10px] text-zinc-500 mt-1 px-2 leading-tight">Full quotation grid mapping and calculations.</div>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}
