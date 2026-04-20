import React from 'react';

export default function ActionButtons({ onPreview, onDownload, onEmail, onEdit, onDelete, downloadDisabled, emailDisabled, editDisabled, deleteDisabled }) {
  return (
    <div className="flex justify-end gap-1.5">
      {onPreview && (
        <button 
           onClick={onPreview} 
           className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm"
           title="Preview"
        >
           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
      )}
      {onDownload && (
        <button 
           onClick={downloadDisabled ? undefined : onDownload} 
           disabled={downloadDisabled}
           className={`h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border transition-all shadow-sm ${
             downloadDisabled 
             ? 'opacity-50 cursor-not-allowed text-zinc-400 bg-zinc-50 border-zinc-100' 
             : 'border-zinc-200 bg-white text-zinc-400 hover:text-emerald-600 hover:border-emerald-200'
           }`}
           title={downloadDisabled ? "Finalize quotation to unlock PDF export" : "Download PDF"}
        >
           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
      )}
      {onEmail && (
        <button 
           onClick={emailDisabled ? undefined : onEmail} 
           disabled={emailDisabled}
           className={`h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border transition-all shadow-sm ${
             emailDisabled 
             ? 'opacity-50 cursor-not-allowed text-zinc-400 bg-zinc-50 border-zinc-100' 
             : 'border-zinc-200 bg-white text-zinc-400 hover:text-blue-600 hover:border-blue-200'
           }`}
           title={emailDisabled ? "Finalize quotation to unlock email sharing" : "Send via Email"}
        >
           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
        </button>
      )}
      <button 
         onClick={editDisabled ? undefined : onEdit} 
         disabled={editDisabled}
         className={`h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border transition-all shadow-sm ${
           editDisabled 
           ? 'opacity-50 cursor-not-allowed text-zinc-400 bg-zinc-50 border-zinc-100' 
           : 'border-zinc-200 bg-white text-zinc-400 hover:text-brand-primary hover:border-brand-primary/30'
         }`}
         title={editDisabled ? "Approved documents cannot be edited" : "Edit"}
      >
         <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      </button>
      <button 
         onClick={deleteDisabled ? undefined : onDelete} 
         disabled={deleteDisabled}
         className={`h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg border transition-all shadow-sm ${
           deleteDisabled 
           ? 'opacity-50 cursor-not-allowed text-zinc-400 bg-zinc-50 border-zinc-100' 
           : 'border-zinc-200 bg-white text-zinc-400 hover:text-red-600 hover:border-red-200'
         }`}
         title={deleteDisabled ? "Approved documents cannot be deleted" : "Delete"}
      >
         <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );
}

