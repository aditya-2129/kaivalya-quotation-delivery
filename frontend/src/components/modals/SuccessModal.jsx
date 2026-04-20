"use client";

import React from 'react';

const SuccessModal = ({ 
  isOpen, 
  onClose, 
  onDownload, 
  onViewList,
  title = "Submission Successful", 
  message = "Process verification complete. Document has been registered in the central repository.", 
  quotationNo = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-50 mb-6 relative">
              <div className="absolute inset-0 rounded-[2rem] bg-emerald-500/10 animate-ping duration-1000" />
              <svg className="h-10 w-10 text-emerald-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-black uppercase tracking-widest text-zinc-950 mb-2">{title}</h3>
            {quotationNo && (
              <div className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest mb-3">
                Ref: {quotationNo}
              </div>
            )}
            <p className="text-[13px] font-medium text-zinc-400 max-w-[280px] leading-relaxed">
              {message}
            </p>
          </div>

          <div className="space-y-3 mt-10">
            <button
              onClick={onDownload}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-brand-primary text-zinc-950 text-[12px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all active:scale-95 border border-brand-primary/20 cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF Document
            </button>
            
            <button
              onClick={onViewList}
              className="w-full h-14 flex items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 text-[12px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all cursor-pointer"
            >
              Return to Registry
            </button>
          </div>
        </div>
        
        <div className="px-10 py-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Kaivalya Engineering • ERP System
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
