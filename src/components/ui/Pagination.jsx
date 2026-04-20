import React from 'react';

export default function Pagination({ total, page, limit, onPageChange, label = "Showing" }) {
  return (
    <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between mt-auto">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
        {label} {Math.min(total, (page - 1) * limit + 1)} - {Math.min(total, page * limit)} of {total}
      </div>
      <div className="flex items-center gap-2">
        <button 
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-3 rounded-md border border-zinc-200 bg-white text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm uppercase tracking-tighter"
        >
          Prev
        </button>
        <div className="flex items-center gap-1 px-2 text-[11px] font-mono font-bold text-zinc-900">
          {page} <span className="text-zinc-300 font-normal">/</span> {Math.ceil(total / limit) || 1}
        </div>
        <button 
          disabled={page >= Math.ceil(total / limit)}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-3 rounded-md border border-zinc-200 bg-white text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm uppercase tracking-tighter"
        >
          Next
        </button>
      </div>
    </div>
  );
}
