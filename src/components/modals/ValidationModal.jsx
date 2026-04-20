"use client";

import React from 'react';

const ValidationModal = ({ 
  isOpen, 
  onClose, 
  missingFields = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">Incomplete Fields</h3>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-tight text-zinc-400">Please complete the following sections:</p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto pr-2 space-y-1 my-4 scrollbar-thin scrollbar-thumb-zinc-100 scrollbar-track-transparent">
             {missingFields.map((field, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1">
                   <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                   <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight leading-relaxed">{field}</span>
                </div>
             ))}
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full h-11 items-center justify-center rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-zinc-950/20 hover:bg-zinc-900 transition-all active:scale-95 cursor-pointer"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;
