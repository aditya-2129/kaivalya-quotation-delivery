"use client";

import React, { useState } from 'react';

const DownloadOptionsModal = ({ 
  isOpen, 
  onClose, 
  onDownload, 
  quotationNo = "QTN-00000"
}) => {
  const [activeFormat, setActiveFormat] = useState('pdf'); // 'pdf' or 'excel'

  if (!isOpen) return null;

  const downloadOptions = [
    {
      id: 'single',
      title: 'Single Page',
      description: 'Quick summary with key figures and totals.',
      pdfOnly: true,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100 hover:border-blue-300'
    },
    {
      id: 'full',
      title: 'Full Quotation',
      description: 'Comprehensive breakdown with all technical details & cost ledger.',
      pdfOnly: false,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100 hover:border-emerald-300'
    },
    {
      id: 'material',
      title: 'Material List',
      description: 'Raw material specifications with weights, rates & amounts.',
      pdfOnly: false,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100 hover:border-amber-300'
    },
    {
      id: 'process',
      title: 'Process Sheet',
      description: 'Manufacturing plan with setup, cycle times & operation costs.',
      pdfOnly: false,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100 hover:border-rose-300'
    },
    {
      id: 'bop',
      title: 'BOP List',
      description: 'Purchased components and standard parts for procurement.',
      pdfOnly: false,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100 hover:border-indigo-300'
    }
  ];

  const filteredOptions = activeFormat === 'excel' 
    ? downloadOptions.filter(o => !o.pdfOnly) 
    : downloadOptions;

  const handleOptionClick = (optionId) => {
    if (activeFormat === 'excel') {
      onDownload(`${optionId}_excel`);
    } else {
      onDownload(optionId);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-zinc-200">
        {/* Header */}
        <div className="p-8 pb-0 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950">Export Quotation</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Reference: {quotationNo}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format Toggle */}
        <div className="px-8 pt-5">
          <div className="flex bg-zinc-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setActiveFormat('pdf')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                activeFormat === 'pdf'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => setActiveFormat('excel')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                activeFormat === 'excel'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 4v16M15 4v16M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              Excel
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-5">
          <div className="grid gap-3">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className={`flex items-center gap-4 p-4 rounded-3xl border text-left transition-all group active:scale-[0.98] ${option.borderColor} bg-white hover:bg-zinc-50`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${option.bgColor} ${option.color}`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-black uppercase tracking-widest text-zinc-950 group-hover:text-zinc-900 leading-none">
                    {option.title}
                  </h4>
                  <p className="mt-1.5 text-[11px] font-bold text-zinc-400 leading-snug">
                    {option.description}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors ${
                    activeFormat === 'excel' 
                      ? 'bg-emerald-50 text-emerald-500 group-hover:text-emerald-700' 
                      : 'bg-zinc-50 text-zinc-300 group-hover:text-zinc-600'
                  }`}>
                    {activeFormat === 'excel' ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 14h18M9 4v16M15 4v16M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${
                    activeFormat === 'excel' ? 'text-emerald-500' : 'text-zinc-300'
                  }`}>
                    {activeFormat === 'excel' ? '.xlsx' : '.pdf'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
           <div className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
             activeFormat === 'excel' ? 'text-emerald-500' : 'text-zinc-400'
           }`}>
              {activeFormat === 'excel' ? '⬤ Excel (.xlsx) format' : '⬤ PDF document format'}
           </div>
           <button 
             onClick={onClose}
             className="text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-800 transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadOptionsModal;
