"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { THEME } from '@/constants/ui';
import { toast } from 'react-hot-toast';
import { approvedQuotationService } from '@/services/quotations-approved';
import { assetService } from '@/services/assets';
import { COMPANY } from '@/constants/pdfConstants';
import QuotationPreviewModal from '@/components/modals/QuotationPreviewModal';
import DownloadOptionsModal from '@/components/modals/DownloadOptionsModal';
import PdfPreviewModal from '@/components/modals/PdfPreviewModal';
import Pagination from '@/components/ui/Pagination';
import { generateQuotationPDF } from '@/utils/generateQuotationPDF';
import { generateMaterialListPDF } from '@/utils/generateMaterialListPDF';
import { generateSinglePagePDF } from '@/utils/generateSinglePagePDF';
import { generateProcessSheetPDF } from '@/utils/generateProcessSheetPDF';
import { generateBOPListPDF } from '@/utils/generateBOPListPDF';
import { exportQuotationsToExcel } from '@/utils/exportToExcel';
import { useApprovedQuotations, useApprovedMetrics } from '@/features/quotations/api/useApprovedQuotations';
import { useUsers } from '@/features/admin/api/useUsers';
import { Search, Filter, X, Calendar, FileCheck, TrendingUp, ChevronRight, FileSpreadsheet, Briefcase, Clock } from 'lucide-react';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { format, isSameDay } from 'date-fns';
import LogPoModal from '@/components/modals/LogPoModal';

export default function ApprovedQuotationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 25;
  const [filters, setFilters] = useState({ 
    search: '', 
    engineer: 'All', 
    dateRange: { start: null, end: null, label: 'All Time' } 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  // Implement Realtime Auto-refresh
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.QUOTATIONS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['approved-quotations'] });
        queryClient.invalidateQueries({ queryKey: ['approved-metrics'] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const [logPoModal, setLogPoModal] = useState({ open: false, quotation: null });

  const { data: usersData } = useUsers();
  const engineers = usersData?.documents || [];

  const { data, isLoading } = useApprovedQuotations(limit, (page - 1) * limit, filters);
  const { data: metrics, isLoading: metricsLoading } = useApprovedMetrics(filters);


  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("Preparing registry export...");
      
      // Fetch everything matching filters (up to 5000 records)
      const allData = await approvedQuotationService.listApprovedQuotations(5000, 0, filters);
      
      exportQuotationsToExcel(allData.documents, `Approved_Quotations_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.dismiss();
      toast.success("Registry exported successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPage(1);
  };

  const handleEngineerChange = (e) => {
    setFilters(prev => ({ ...prev, engineer: e.target.value }));
    setPage(1);
  };

  const handleDateRangeChange = (range) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
    setShowDatePicker(false);
    setPage(1);
  };

  const [previewId, setPreviewId] = useState(null);
  const [downloadModal, setDownloadModal] = useState({ open: false, quotation: null });
  const [pdfPreview, setPdfPreview] = useState({ open: false, doc: null, title: '', filename: '' });

  const handlePoLogged = () => {
    queryClient.invalidateQueries({ queryKey: ['approved-quotations'] });
    queryClient.invalidateQueries({ queryKey: ['approved-metrics'] });
  };

  const quotations = data?.documents || [];
  const total = data?.total || 0;

  const handleDownloadExecution = async (optionId) => {
    const quotation = downloadModal.quotation;
    if (!quotation) return;

    try {
      const fullQuote = await approvedQuotationService.getQuotation(quotation.$id);
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

  const handleSendEmail = async (quotation) => {
    try {
      toast.loading("Preparing professional quotation export...");
      const fullQuote = await approvedQuotationService.getQuotation(quotation.$id);
      
      // Temporarily disabled project image loading to prevent CORS fetch errors
      // Will revisit this once Appwrite platform domains are fully propagated
      let projectImageUrl = null;
      /*
      if (fullQuote.project_image) {
        try {
          const rawImg = fullQuote.project_image;
          const parsedImage = typeof rawImg === 'string' ? JSON.parse(rawImg) : rawImg;
          if (parsedImage && parsedImage.$id) {
            projectImageUrl = assetService.getFileView(parsedImage.$id)?.toString();
          }
        } catch (e) {
          console.warn("Project image ignored for email logic:", e);
        }
      }
      */

      // 1. Generate and Save the Single Page PDF
      // await generateSinglePagePDF(fullQuote, null, { save: true });
      
      // 2. Prepare Professional MNC Body
      const clientName = fullQuote.supplier_name || 'Valued Client';
      const engineer = fullQuote.quoting_engineer || 'Engineering Team';
      const projectName = fullQuote.project_name || 'Project Specified';
      const qtnNo = fullQuote.quotation_no || fullQuote.$id;
      const contactNo = fullQuote.contact_phone || '';

      const subject = encodeURIComponent(`Technical Quotation: ${qtnNo} | ${projectName}`);
      
      const bodyText = [
        `Dear ${clientName},`,
        '',
        `SUBJECT: SUBMISSION OF TECHNICAL QUOTATION - ${qtnNo}`,
        '',
        `We are pleased to submit our formal technical proposal for "${projectName}" as per your recent inquiry.`,
        '',
        `Please find the detailed single-page quotation attached for your review. This proposal has been engineered to meet your specific technical requirements and quality standards.`,
        '',
        `Should you have any technical queries or require further clarification regarding the commercial terms, please do not hesitate to reach out to our project division.`,
        '',
        `Best Regards,`,
        '',
        `${engineer}`,
        `Project Division | ${COMPANY.NAME}`,
        '',
        '_________________________________________________',
        `${COMPANY.NAME.toUpperCase()}`,
        `${COMPANY.TAGLINE}`,
        '_________________________________________________',
        `${COMPANY.ADDRESS}`,
        `T: +91 ${COMPANY.PHONE} | E: ${COMPANY.EMAIL}`,
        '',
        'CONFIDENTIALITY NOTE: The information contained in this email is intended only for the use of the individual or entity named above and may contain information that is privileged, confidential and exempt from disclosure under applicable law.'
      ].join('\n');

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${fullQuote.contact_email || ''}&su=${subject}&body=${encodeURIComponent(bodyText)}`;
      
      toast.dismiss();
      toast.success("Quotation Ready! Drag and drop the downloaded PDF into Gmail.");
      
      window.open(gmailUrl, '_blank');
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to prepare professional export.");
      console.error(err);
    }
  };

  return (
    <DashboardLayout 
      title="Approved Quotations Log"
      primaryAction={
        <button
          onClick={handleExportExcel}
          disabled={isExporting || quotations.length === 0}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-white shadow-lg shadow-emerald-200/50 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/20"
          style={{ fontSize: THEME.FONT_SIZE.SMALL, fontWeight: 'bold' }}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {isExporting ? "Exporting..." : "Export Quotation"}
        </button>
      }
    >
      <div className="flex flex-col gap-6">

        {/* Metrics Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-600 border border-emerald-200/50">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none">Total Value in Scope</p>
                <p className="mt-1 text-lg font-black text-emerald-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `₹${(metrics?.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600 border border-blue-200/50">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest leading-none">Total Count</p>
                <p className="mt-1 text-lg font-black text-blue-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `${metrics?.count || 0} Records`}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-amber-100 bg-amber-50/30 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-amber-600 border border-amber-200/50">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-widest leading-none">This Month</p>
                <p className="mt-1 text-lg font-black text-amber-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `₹${(metrics?.thisMonthValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Filters Section */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3.5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Global Query Search</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="text" 
                placeholder="ID, Client, or Part Number..."
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
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 md:max-w-[200px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Project Incharge</label>
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
              <select 
                value={filters.engineer}
                onChange={handleEngineerChange}
                className="w-full h-9.5 pl-9.5 pr-8 rounded-lg border border-zinc-200 bg-white text-[12px] font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none appearance-none cursor-pointer shadow-sm"
              >
                <option value="All">All Incharges</option>
                {engineers.map(u => (
                  <option key={u.$id} value={u.name}>{u.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300">
                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex-1 md:max-w-[240px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Time Period</label>
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
                  "All History"
                )}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-300">
                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr style={{ fontSize: '10px' }}>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em]">Reference Vector</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em]">Client Narrative</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em]">Lead Engineer</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Protocol Date</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Status</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Valuation Total</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Utility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  [1,2,3,4,5,6].map(i => (
                    <tr key={i} className="animate-pulse">
                       <td className="px-6 py-5"><div className="h-5 w-24 bg-zinc-100 rounded" /></td>
                       <td className="px-6 py-5"><div className="h-5 w-48 bg-zinc-100 rounded" /></td>
                       <td className="px-6 py-5"><div className="h-5 w-32 bg-zinc-100 rounded" /></td>
                       <td className="px-6 py-5"><div className="h-5 w-20 bg-zinc-100 rounded mx-auto" /></td>
                       <td className="px-6 py-5"><div className="h-5 w-20 bg-zinc-100 rounded mx-auto" /></td>
                       <td className="px-6 py-5"><div className="h-5 w-24 bg-zinc-100 rounded ml-auto" /></td>
                       <td className="px-6 py-5"><div className="h-8 w-20 bg-zinc-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-32 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-200">
                             <FileCheck className="h-8 w-8" />
                          </div>
                          <p className="text-zinc-500 font-medium italic" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                             No entries detected in the approved registry.
                          </p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  quotations.map((row) => (
                    <tr key={row.$id} className="group hover:bg-brand-primary/[0.03] transition-all duration-200">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-brand-primary font-black tracking-tight" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{row.quotation_no || row.$id.substring(0,8)}</span>
                            {/* <span className="font-mono text-zinc-400 uppercase tracking-tighter" style={{ fontSize: '10px' }}>{row.part_number || 'No Part Ref'}</span> */}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-bold">
                         <span className="truncate max-w-[180px] inline-block" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{row.supplier_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-semibold italic">
                         <span className="truncate max-w-[120px] inline-block" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{row.quoting_engineer || 'Unassigned'}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-zinc-400" style={{ fontSize: '10px' }}>
                         {new Date(row.$createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex rounded-lg px-2.5 py-1 font-black uppercase tracking-widest leading-none border bg-emerald-50 text-emerald-600 border-emerald-100" style={{ fontSize: '9px' }}>
                          Approved
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-emerald-900" style={{ fontSize: THEME.FONT_SIZE.BASE }}>
                        ₹{parseFloat(row.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                           {/* Preview */}
                           <button 
                               onClick={() => setPreviewId(row.$id)} 
                               className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm active:scale-90"
                               title="Preview Protocol"
                           >
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           </button>
                           {/* Download */}
                           <button 
                               onClick={() => setDownloadModal({ open: true, quotation: row })}
                               className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-90"
                               title="Export Assets"
                           >
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           </button>
                           {/* Email */}
                           <button 
                               onClick={() => handleSendEmail(row)}
                               className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-90"
                               title="Send via Email"
                           >
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                               </svg>
                           </button>
                           {/* Log PO */}
                           <button
                             onClick={() => setLogPoModal({ open: true, quotation: row })}
                             className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-90"
                             title="Log Purchase Order"
                           >
                             <Briefcase className="h-4 w-4" />
                           </button>
                         </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} label="Tracking" />
        </section>
      </div>

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

      <PdfPreviewModal 
        isOpen={pdfPreview.open}
        onClose={() => setPdfPreview({ ...pdfPreview, open: false })}
        pdfDoc={pdfPreview.doc}
        title={pdfPreview.title}
        filename={pdfPreview.filename}
      />

      {showDatePicker && (
        <DateRangePicker 
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      <LogPoModal 
        isOpen={logPoModal.open}
        onClose={() => setLogPoModal({ open: false, quotation: null })}
        quotation={logPoModal.quotation}
        onSuccess={handlePoLogged}
      />
    </DashboardLayout>
  );
}
