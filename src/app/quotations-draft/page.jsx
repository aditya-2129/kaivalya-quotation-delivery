"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { THEME } from '@/constants/ui';
import { toast } from 'react-hot-toast';
import { quotationService } from '@/services/quotations-draft';
import { assetService } from '@/services/assets';
import { useRouter } from 'next/navigation';
import { Plus, Database, Search, X, Calendar, ChevronRight } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import QuotationPreviewModal from '@/components/modals/QuotationPreviewModal';
import DownloadOptionsModal from '@/components/modals/DownloadOptionsModal';
import PdfPreviewModal from '@/components/modals/PdfPreviewModal';
import Pagination from '@/components/ui/Pagination';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { generateQuotationPDF } from '@/utils/generateQuotationPDF';
import { generateMaterialListPDF } from '@/utils/generateMaterialListPDF';
import { generateSinglePagePDF } from '@/utils/generateSinglePagePDF';
import { generateProcessSheetPDF } from '@/utils/generateProcessSheetPDF';
import { generateBOPListPDF } from '@/utils/generateBOPListPDF';
import { useAuth } from '@/context/AuthContext';
import { useQuotations, useDeleteQuotation } from '@/features/quotations/api/useQuotations';

export default function QuotationsPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 25;
  const [filters, setFilters] = useState({ 
    search: '', 
    dateRange: { start: null, end: null, label: 'All Time' } 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data, isLoading } = useQuotations(limit, (page - 1) * limit, filters);
  const deleteQuotation = useDeleteQuotation();
  const queryClient = useQueryClient();

  // Implement Realtime Auto-refresh
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.QUOTATIONS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      // If any document is created, updated or deleted, refresh the list
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['quotations'] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPage(1);
  };

  const handleDateRangeChange = (range) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
    setShowDatePicker(false);
    setPage(1);
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });
  const [previewId, setPreviewId] = useState(null);
  const [downloadModal, setDownloadModal] = useState({ open: false, quotation: null });
  const [pdfPreview, setPdfPreview] = useState({ open: false, doc: null, title: '', filename: '' });
  const router = useRouter();

  const quotations = data?.documents || [];
  const total = data?.total || 0;

  const handleDownloadExecution = async (optionId) => {
    const quotation = downloadModal.quotation;
    if (!quotation) return;

    try {
      const fullQuote = await quotationService.getQuotation(quotation.$id);
      let projectImageUrl = null;
      if (fullQuote.project_image) {
        try {
          const rawImg = fullQuote.project_image;
          const parsedImage = typeof rawImg === 'string' ? JSON.parse(rawImg) : rawImg;
          if (parsedImage && parsedImage.$id) {
            projectImageUrl = assetService.getFileView(parsedImage.$id)?.toString();
          }
        } catch (e) {
          console.warn("Failed to parse project image:", e);
        }
      }

      setDownloadModal({ open: false, quotation: null });

      let doc;
      let title = "PDF Preview";
      let filename = "document.pdf";

      if (optionId === 'material') {
        doc = await generateMaterialListPDF(fullQuote, { save: false });
        title = "Material List";
        filename = `MaterialList_${fullQuote.quotation_no}.pdf`;
      } else if (optionId === 'single') {
        doc = await generateSinglePagePDF(fullQuote, projectImageUrl, { save: false });
        title = "Single Page Quotation";
        const sanitizedClient = (fullQuote.supplier_name || 'Client').replace(/[/\\?%*:|"<>]/g, '');
        const sanitizedQtn = (fullQuote.quotation_no || 'QTN').replace(/[/\\?%*:|"<>]/g, '');
        const qtnDate = fullQuote.inquiry_date 
          ? new Date(fullQuote.inquiry_date).toLocaleDateString('en-GB').replace(/\//g, '-') 
          : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        filename = `${sanitizedClient} ${sanitizedQtn} ${qtnDate}.pdf`.trim();
      } else if (optionId === 'process') {
        doc = await generateProcessSheetPDF(fullQuote, { save: false });
        title = "Manufacturing Process Sheet";
        filename = `ProcessSheet_${fullQuote.quotation_no}.pdf`;
      } else if (optionId === 'bop') {
        doc = await generateBOPListPDF(fullQuote, { save: false });
        title = "BOP Procurement List";
        filename = `BOP_List_${fullQuote.quotation_no}.pdf`;
      } else {
        doc = await generateQuotationPDF(fullQuote, projectImageUrl, { save: false });
        title = "Full Technical Quotation";
        filename = `Full_Quotation_${fullQuote.quotation_no}.pdf`;
      }

      setPdfPreview({ open: true, doc, title, filename });
    } catch (err) {
      toast.error("Export failed.");
    }
  };

  const commitDelete = async () => {
    if (!deleteConfirm.row) return;
    try { 
       await deleteQuotation.mutateAsync(deleteConfirm.row.$id); 
       toast.success("Valuation Cancelled.");
       setDeleteConfirm({ open: false, row: null });
    } catch (e) { 
       toast.error("Operation failed.");
    }
  };

  return (
    <DashboardLayout 
      title="New Quotations Log"
      primaryAction={
        <button 
          onClick={() => router.push('/quotations-draft/new')}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 border border-brand-primary/20"
          style={{ fontSize: THEME.FONT_SIZE.SMALL, fontWeight: 'bold' }}
        >
          <Plus className="h-4 w-4" />
          Create New Quotation
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3.5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Global Query Search</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Find by ID, Client Narrative, or Part Number..."
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full h-9.5 pl-9.5 pr-8 rounded-lg border border-zinc-200 bg-white text-[12px] font-medium focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none shadow-sm"
              />
              {filters.search && (
                <button 
                  onClick={() => { setFilters(prev => ({ ...prev, search: '' })); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 md:max-w-[240px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Batch Period</label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
              <button 
                onClick={() => setShowDatePicker(true)}
                className="w-full h-9.5 pl-9.5 pr-8 rounded-lg border border-zinc-200 bg-white text-[12px] font-bold text-left focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none shadow-sm"
              >
                {filters.dateRange.start && filters.dateRange.end ? (
                  <span className="truncate block">
                    {isSameDay(filters.dateRange.start, filters.dateRange.end)
                      ? format(filters.dateRange.start, 'MMM d, y')
                      : `${format(filters.dateRange.start, 'MMM d')} – ${format(filters.dateRange.end, 'MMM d, y')}`}
                  </span>
                ) : (
                  "All Time"
                )}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300">
                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest">Quote Vector / ID</th>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest">Client Name</th>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest">Project Incharge</th>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest text-center">Batch Date</th>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest text-center">Status</th>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest text-right">Valuation Total</th>
                   <th className="px-6 py-4 font-bold text-zinc-950 uppercase tracking-widest text-right">Registry Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {isLoading ? (
                  [1,2,3,4,5,6].map(i => (
                    <tr key={i} className="animate-pulse">
                       <td colSpan="7" className="px-6 py-5">
                          <div className="h-5 bg-zinc-100 rounded w-full" />
                       </td>
                    </tr>
                  ))
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-32 text-center text-zinc-400 italic">
                       <div className="flex flex-col items-center gap-3">
                          <Database className="h-8 w-8 text-zinc-200" />
                          <p style={{ fontSize: THEME.FONT_SIZE.SMALL }}>No matching valuations found.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  quotations.map((row) => (
                    <tr key={row.$id} className="group hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC] transition-all duration-200">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-brand-primary font-bold" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{row.quotation_no || row.$id.substring(0,8)}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">
                         <span className="truncate max-w-[150px] inline-block" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{row.supplier_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">
                         <span className="truncate max-w-[120px] inline-block" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{row.quoting_engineer || 'Unassigned'}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                         {new Date(row.$createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 font-bold uppercase tracking-widest leading-none border ${
                          row.status === 'Completed' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          row.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          row.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-zinc-50 text-zinc-500 border-zinc-200'
                        }`} style={{ fontSize: '9px' }}>
                          {row.status === 'Completed' ? 'Review' : (row.status || 'Draft')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-brand-primary" style={{ fontSize: THEME.FONT_SIZE.BASE }}>
                        ₹{parseFloat(row.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                       <td className="px-6 py-4 text-right">
                          <ActionButtons 
                             onPreview={() => setPreviewId(row.$id)}
                             onDownload={() => setDownloadModal({ open: true, quotation: row })}
                             downloadDisabled={row.status === 'Draft'}
                             onEdit={() => router.push(`/quotations-draft/edit?id=${row.$id}`)} 
                             editDisabled={row.status === 'Approved' && !isAdmin}
                             onDelete={() => setDeleteConfirm({ open: true, row: row })} 
                             deleteDisabled={row.status === 'Approved' && !isAdmin}
                           />
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} label="Showing" />
        </section>
      </div>

      <ConfirmationModal 
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, row: null })}
        onConfirm={commitDelete}
        title="Cancel Valuation?"
        message={`This will mark ${deleteConfirm.row?.quotation_no || 'this record'} as 'Cancelled'.`}
        confirmText="CANCEL VALUATION"
        cancelText="KEEP ACTIVE"
        type="danger"
        isLoading={deleteQuotation.isPending}
      />

      <QuotationPreviewModal 
        isOpen={!!previewId}
        onClose={() => setPreviewId(null)}
        quotationId={previewId}
      />

      <DownloadOptionsModal 
        isOpen={downloadModal.open}
        onClose={() => setDownloadModal({ open: false, quotation: null })}
        onDownload={handleDownloadExecution}
        quotationNo={downloadModal.quotation?.quotation_no}
      />

      {pdfPreview.open && (
        <PdfPreviewModal 
          isOpen={pdfPreview.open}
          onClose={() => setPdfPreview({ ...pdfPreview, open: false })}
          pdfDoc={pdfPreview.doc}
          title={pdfPreview.title}
          filename={pdfPreview.filename}
        />
      )}

      {showDatePicker && (
        <DateRangePicker 
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </DashboardLayout>
  );
}
