import React, { useState } from 'react';

export default function RejectionModal({ isOpen, onClose, onConfirm, quotationNo, isLoading = false }) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onConfirm(reason);
        // Only reset if we aren't loading anymore (meaning it succeeded or threw)
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden shadow-zinc-950/50 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 leading-tight">Reject Quotation</h3>
                        <p className="text-sm text-zinc-500 mt-0.5">{quotationNo ? `#${quotationNo}` : 'This quotation'}</p>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5">
                        <label htmlFor="rejection-reason" className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                            Reason for Rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="rejection-reason"
                            rows={4}
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Briefly explain why this quotation was rejected to help the user resolve the issue..."
                            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 bg-zinc-50 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors custom-scrollbar resize-none"
                        ></textarea>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={!reason.trim() || isLoading}
                            className="px-6 py-2.5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-wait rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    REJECTING...
                                </>
                            ) : 'REJECT QUOTATION'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
