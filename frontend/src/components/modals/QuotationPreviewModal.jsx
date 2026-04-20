"use client";

import React, { useState, useEffect } from 'react';
import { quotationService } from '@/services/quotations-draft';
import { assetService } from '@/services/assets';
import AssetPreviewModal from '@/components/modals/AssetPreviewModal';

const QuotationPreviewModal = ({ isOpen, onClose, quotationId }) => {
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (!isOpen || !quotationId) return;
    
    const fetchQuotation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await quotationService.getQuotation(quotationId);
        setQuote(data);
      } catch (err) {
        console.error("Failed to fetch quotation for preview:", err);
        setError("Failed to load quotation data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotation();
  }, [isOpen, quotationId]);

  if (!isOpen) return null;

  // Parse items and breakdown from JSON strings
  let items = [];
  let breakdown = {};
  let projectImage = null;
  let inquiryPdfs = [];
  let inquiryCadFiles = [];
  let bopItems = [];

  if (quote) {
    try { items = JSON.parse(quote.items || '[]'); } catch (e) { items = []; }
    try { breakdown = JSON.parse(quote.detailed_breakdown || '{}'); } catch (e) { breakdown = {}; }
    try { 
       projectImage = quote.project_image ? (typeof quote.project_image === 'string' ? JSON.parse(quote.project_image) : quote.project_image) : null; 
       if (projectImage && projectImage.localPreview) delete projectImage.localPreview;
    } catch (e) { 
       projectImage = null; 
    }
    // 2. Parse Inquiry Files (Project Level) — read directly from quote fields
    try {
      const rawPdfs = quote.inquiry_pdfs || [];
      inquiryPdfs = (Array.isArray(rawPdfs) ? rawPdfs : JSON.parse(rawPdfs || '[]'))
        .map(f => (typeof f === 'string' ? JSON.parse(f) : f))
        .filter(Boolean);
    } catch (e) {
      console.warn("[QuotationPreviewModal] Failed to parse inquiry PDFs:", e);
    }
    try {
      const rawCads = quote.inquiry_cad_files || [];
      inquiryCadFiles = (Array.isArray(rawCads) ? rawCads : JSON.parse(rawCads || '[]'))
        .map(f => (typeof f === 'string' ? JSON.parse(f) : f))
        .filter(Boolean);
    } catch (e) {
      console.warn("[QuotationPreviewModal] Failed to parse CAD files:", e);
    }

    // 3. Parse bought-out parts from quote field
    try {
      const rawBop = quote.bought_out_items || [];
      bopItems = (Array.isArray(rawBop) ? rawBop : JSON.parse(rawBop || '[]'))
        .map(b => (typeof b === 'string' ? JSON.parse(b) : b))
        .filter(Boolean);
    } catch (e) {
      bopItems = [];
    }
  }

  const InfoField = ({ label, value, mono = false, highlight = false }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] leading-none">{label}</span>
      <span className={`text-[13px] font-semibold ${highlight ? 'text-brand-primary' : 'text-zinc-800'} ${mono ? 'font-mono' : ''} leading-snug`}>
        {value || <span className="text-zinc-300 italic">—</span>}
      </span>
    </div>
  );

  const SectionHeader = ({ icon, title, count }) => (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100">
      <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
        {icon}
      </div>
      <h4 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em]">{title}</h4>
      {count !== undefined && (
        <span className="ml-auto text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{count} item{count !== 1 ? 's' : ''}</span>
      )}
    </div>
  );

  const LedgerRow = ({ label, value, isBold = false }) => (
    <div className={`flex justify-between items-center py-1 ${isBold ? 'border-t border-zinc-800 pt-2 mt-1.5' : ''}`}>
      <span className={`text-[10.5px] ${isBold ? 'font-black text-zinc-300 uppercase tracking-wider' : 'font-bold text-zinc-500'}`}>{label}</span>
      <span className={`font-mono ${isBold ? 'text-base font-black text-white' : 'text-[12px] font-bold text-zinc-400'}`}>
        ₹{parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-[95vw] max-w-[1400px] h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header Bar */}
        <header className="shrink-0 px-8 py-4 bg-zinc-950 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
              <svg className="h-5 w-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white text-[14px] font-black uppercase tracking-[0.2em]">
                {isLoading ? 'Loading...' : quote?.quotation_no || 'Quotation Preview'}
              </h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {quote?.supplier_name || ''} • {quote?.status || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
              quote?.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
              quote?.status === 'Completed' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
              quote?.status === 'Rejected' ? 'bg-red-500/15 text-red-500 border border-red-500/30' :
              quote?.status === 'Pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
              'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              {quote?.status === 'Completed' ? 'Review' : (quote?.status || 'Draft')}
            </span>
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-red-600 transition-all active:scale-90 border border-zinc-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="h-6 w-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">Fetching Quotation Data...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-red-500">{error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 space-y-6 bg-zinc-50/50">
                
                {/* Section 1: Project Information */}
                <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <SectionHeader 
                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    title="Project Information"
                  />
                  <div className="grid grid-cols-4 gap-x-8 gap-y-5">
                    <InfoField label="Quotation ID" value={quote.quotation_no} mono highlight />
                    <InfoField label="Organization / Customer" value={quote.supplier_name} />
                    <InfoField label="Project Name" value={quote.project_name} highlight />
                    <InfoField label="Contact Person" value={quote.contact_person} />
                    <InfoField label="Contact Number" value={quote.contact_phone} mono />
                    <InfoField label="Contact Email" value={quote.contact_email} />
                    <InfoField label="Project Incharge" value={quote.quoting_engineer} />
                    <InfoField label="Quotation Version" value={quote.revision_no} mono />
                    <InfoField label="Status" value={quote.status === 'Completed' ? 'Review' : quote.status || 'Draft'} highlight />
                    <InfoField label="Date Received" value={quote.inquiry_date ? new Date(quote.inquiry_date).toLocaleDateString('en-GB') : ''} />
                    <InfoField label="Expected Delivery" value={quote.delivery_date ? new Date(quote.delivery_date).toLocaleDateString('en-GB') : ''} />
                    <InfoField label="Total Quantity" value={quote.quantity} mono />
                    <InfoField label="Production Mode" value={quote.production_mode} />
                  </div>

                  {/* Project Assets Row */}
                  {(projectImage || inquiryPdfs.length > 0 || inquiryCadFiles.length > 0) && (
                    <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-12 gap-6">
                      {/* Project Image */}
                      {projectImage && projectImage.$id && (
                        <div className="col-span-12 md:col-span-4 lg:col-span-4">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] leading-none block mb-3">Model Snapshot</span>
                          <button 
                            type="button"
                            onClick={() => setPreviewFile(projectImage)}
                            className="h-40 w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm group hover:border-brand-primary/50 transition-all"
                          >
                            <img 
                              src={projectImage.localPreview || (projectImage.$id ? assetService.getFilePreview(projectImage.$id)?.toString() : "")}
                              onError={(e) => {
                                 if (e.target.src.includes('preview')) {
                                    e.target.src = projectImage.localPreview || assetService.getFileView(projectImage.$id)?.toString();
                                 }
                              }} 
                              alt="Project Model" 
                              className="h-full w-full object-contain"
                            />
                          </button>
                        </div>
                      )}

                      {/* Inquiry PDFs */}
                      {inquiryPdfs.length > 0 && (
                        <div className="col-span-12 md:col-span-4 lg:col-span-4">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] leading-none block mb-3">Inquiry PDFs</span>
                          <div className="flex flex-wrap gap-2">
                            {inquiryPdfs.map((f, fIdx) => (
                              <button 
                                key={fIdx} 
                                onClick={() => setPreviewFile(f)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] font-semibold text-zinc-700 hover:border-brand-primary/30 hover:bg-white transition-all w-full"
                              >
                                <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                <span className="truncate">{f.name || `PDF ${fIdx + 1}`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CAD Files */}
                      {inquiryCadFiles.length > 0 && (
                        <div className="col-span-12 md:col-span-4 lg:col-span-4">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.12em] leading-none block mb-3">CAD / STP Files</span>
                          <div className="flex flex-wrap gap-2">
                            {inquiryCadFiles.map((f, fIdx) => (
                              <button 
                                key={fIdx} 
                                onClick={() => setPreviewFile(f)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] font-semibold text-zinc-700 hover:border-brand-primary/30 hover:bg-white transition-all w-full"
                              >
                                <svg className="h-4 w-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 011.06 1.888V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-6.112A2 2 0 015.06 11M19 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <span className="truncate">{f.name || `CAD ${fIdx + 1}`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Section 2: BOM / Parts List */}
                {items.length > 0 && (
                  <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    <SectionHeader 
                      icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                      title="Bill of Materials"
                      count={items.length}
                    />
                    <div className="space-y-4">
                      {items.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-zinc-100 bg-zinc-50/50 overflow-hidden">
                          {/* Item Header */}
                          <div className="px-5 py-3 bg-zinc-100/80 border-b border-zinc-200/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="h-6 w-6 rounded-md bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                              <span className="text-[12px] font-black text-zinc-700 uppercase tracking-wider">{item.part_name || `Part ${idx + 1}`}</span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 font-mono">Qty: {item.qty || 1}</span>
                          </div>
                          
                          <div className="p-5 space-y-5">
                            {/* Material */}
                            {item.material && (
                              <div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Raw Material</span>
                                <div className="grid grid-cols-4 gap-4">
                                  <InfoField label="Material" value={item.material.name || item.material.material_name} />
                                  <InfoField label="Grade" value={item.material.grade} />
                                  <InfoField label="Rate / kg" value={`₹${parseFloat(item.material.base_rate || 0).toFixed(2)}`} mono />
                                  <InfoField label="Weight (kg)" value={parseFloat(item.material_weight || 0).toFixed(3)} mono />
                                </div>
                                {item.shape && (
                                  <div className="grid grid-cols-4 gap-4 mt-3">
                                    <InfoField label="Profile" value={item.shape === 'rect' ? 'Rectangular' : item.shape === 'round' ? 'Round Bar' : item.shape === 'hex' ? 'Hexagonal' : item.shape} />
                                    {item.dimensions && (
                                      <>
                                        {item.dimensions.l && <InfoField label="Length (mm)" value={item.dimensions.l} mono />}
                                        {item.dimensions.w && <InfoField label="Width (mm)" value={item.dimensions.w} mono />}
                                        {item.dimensions.t && <InfoField label="Thickness (mm)" value={item.dimensions.t} mono />}
                                        {item.dimensions.dia && <InfoField label="Diameter (mm)" value={item.dimensions.dia} mono />}
                                        {item.dimensions.af && <InfoField label="Across Flat (mm)" value={item.dimensions.af} mono />}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Machining Processes */}
                            {item.processes && item.processes.length > 0 && (
                              <div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Machining Operations</span>
                                <div className="overflow-hidden rounded-lg border border-zinc-200">
                                  <table className="w-full text-left text-[12px]">
                                    <thead className="bg-zinc-100">
                                      <tr>
                                        <th className="px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Operation</th>
                                        <th className="px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">Setup (min)</th>
                                        <th className="px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center">Qty / Time</th>
                                        <th className="px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right">Unit Rate</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                      {item.processes.map((proc, pIdx) => (
                                        <tr key={pIdx} className="bg-white">
                                          <td className="px-4 py-2.5">
                                            <div className="font-semibold text-zinc-700">{proc.process_name || '—'}</div>
                                            {proc.dim1 && proc.dim2 && (
                                              <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                {proc.dim1} × {proc.dim2}
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-4 py-2.5 text-center font-mono text-zinc-600">{proc.unit === 'hr' ? (proc.setup_time || 0) : '—'}</td>
                                          <td className="px-4 py-2.5 text-center font-mono text-zinc-600">{proc.cycle_time || 0}</td>
                                          <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-700">₹{parseFloat(proc.rate || proc.hourly_rate || 0).toFixed(2)} / {proc.unit || 'hr'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>                            )}

                            {/* Design Files */}
                            {item.design_files && item.design_files.length > 0 && (
                              <div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Attached Design Assets</span>
                                <div className="flex flex-wrap gap-2">
                                  {item.design_files.map((f, fIdx) => (
                                    <button 
                                      key={fIdx} 
                                      onClick={() => setPreviewFile(f)}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-600 hover:border-brand-primaryTransition transition-all group/asset"
                                    >
                                      <svg className="h-4 w-4 text-zinc-400 group-hover/asset:text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                      {f.name || f.filename || `File ${fIdx + 1}`}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 2.5: Consolidated Purchased Items (BOP) */}
                {bopItems.length > 0 && (
                  <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    <SectionHeader 
                      icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                      title="Purchased Components (Project-Wide)"
                      count={bopItems.length}
                    />
                    <div className="overflow-hidden rounded-xl border border-zinc-100">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                          <tr>
                            <th className="px-6 py-3">Item Descriptor</th>
                            <th className="px-6 py-3 text-center">Unit</th>
                            <th className="px-6 py-3 text-center">Quantity</th>
                            <th className="px-6 py-3 text-right">Unit Rate</th>
                            <th className="px-6 py-3 text-right">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 bg-white">
                          {bopItems.map((b, bIdx) => (
                            <tr key={bIdx} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-zinc-800">{b.item_name || '—'}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-[10px] font-black text-zinc-400 uppercase font-mono">{b.unit || 'pcs'}</span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-zinc-600">{b.qty || 0}</td>
                              <td className="px-6 py-4 text-right font-mono text-zinc-500">₹{parseFloat(b.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-right font-mono font-black text-zinc-900">₹{(parseFloat(b.rate || 0) * (b.qty || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-zinc-50/30">
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Consolidated BOP Subtotal</td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-base font-black text-brand-primary font-mono">₹{parseFloat(breakdown.bopCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </section>
                )}

                {/* Section 3: Commercial Adjustments */}
                <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                  <SectionHeader 
                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    title="Commercial Adjustments & Logistics"
                  />
                  <div className="grid grid-cols-4 gap-x-8 gap-y-5">
                    <InfoField label="Design Cost" value={`₹${parseFloat(quote.design_cost || 0).toFixed(2)}`} mono />
                    <InfoField label="Assembly Cost" value={`₹${parseFloat(quote.assembly_cost || 0).toFixed(2)}`} mono />
                    <InfoField label="Packaging Cost" value={`₹${parseFloat(quote.packaging_cost || 0).toFixed(2)}`} mono />
                    <InfoField label="Transportation Cost" value={`₹${parseFloat(quote.transportation_cost || 0).toFixed(2)}`} mono />
                  </div>
                </section>
              </div>

              {/* Right Sidebar: Pricing Breakdown */}
              <div className="w-[310px] shrink-0 bg-zinc-950 border-l border-zinc-800 p-5 flex flex-col overflow-hidden">
                <div className="relative">
                  <div className="absolute -top-10 -right-10 opacity-[0.02] grayscale brightness-200 pointer-events-none rotate-12">
                    <img src="/KE_Logo.png" alt="" className="h-48 w-48 object-contain" />
                  </div>
                  
                  <h3 className="relative z-10 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(94,192,194,0.8)]" />
                    Valuation Ledger
                  </h3>

                  <div className="space-y-2 relative z-10">
                    <LedgerRow label="Material" value={breakdown.materialCost} />
                    <LedgerRow label="Manufacturing" value={(parseFloat(breakdown.laborCost || 0)) + (parseFloat(breakdown.treatmentCost || 0))} />
                    <LedgerRow label="Purchased Items" value={breakdown.bopCost} />
                    
                    <div className="h-px bg-zinc-800/40 my-3" />
                    
                    <div className="flex justify-between items-center group/subtotal">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Unit Manufacturing</span>
                        <span className="text-[8px] text-zinc-600 font-bold uppercase italic tracking-wider">Direct Factory Cost</span>
                      </div>
                      <span className="text-lg font-mono font-black tracking-tighter italic text-white">₹{parseFloat(breakdown.unitSubtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-zinc-900 relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Profit Margin</span>
                        <span className="text-[8px] text-zinc-700 font-bold uppercase mt-1 italic tracking-tighter">Industrial Markup</span>
                      </div>
                      <span className="text-white font-mono font-black text-base bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-800">{quote.markup || 0}%</span>
                    </div>

                    {/* Unit Final Price */}
                    <div className="flex flex-col p-3 bg-zinc-900/30 rounded-xl border border-zinc-900 shadow-inner group/unit">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">Net Unit Rate</span>
                        <div className="h-1 w-1 rounded-full bg-brand-primary/40 group-hover/unit:bg-brand-primary transition-colors" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-mono font-black tracking-tighter text-brand-primary leading-none">
                          ₹{parseFloat(breakdown.unitFinal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[8px] font-bold text-zinc-600 uppercase ml-1">/ unit</span>
                      </div>
                    </div>

                    {/* Multiplier / Volume Bridge */}
                    <div className="flex items-center justify-center my-3 relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-zinc-900 border-dashed" />
                      </div>
                      <div className="relative flex items-center gap-1.5 px-3 bg-zinc-950">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl ring-1 ring-zinc-800/50">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mr-1">Quantity</span>
                          <div className="h-3 w-3 rounded-md bg-zinc-950 flex items-center justify-center">
                            <svg className="h-2 w-2 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <span className="text-[12px] font-mono font-black text-white leading-none px-0.5">{quote.quantity || 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* Project Extras (Post-Multiplication) */}
                    {(parseFloat(breakdown.engineeringCost || 0) > 0 || parseFloat(breakdown.commercialCost || 0) > 0) && (
                      <div className="p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900/50 mb-3 space-y-1.5">
                        <div className="text-[7.5px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                          <span className="h-1 w-1 bg-zinc-700 rounded-full" />
                          Project Add-ons
                        </div>
                        {parseFloat(breakdown.engineeringCost || 0) > 0 && (
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="font-bold text-zinc-500">Design & Engineering</span>
                            <span className="font-mono text-zinc-400">₹{parseFloat(breakdown.engineeringCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {parseFloat(breakdown.commercialCost || 0) > 0 && (
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="font-bold text-zinc-500">Logistics & Service</span>
                            <span className="font-mono text-zinc-400">₹{parseFloat(breakdown.commercialCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex flex-col relative group/total pt-0">
                      <div className="absolute -inset-4 bg-brand-primary/5 blur-3xl rounded-full opacity-40 pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none">Grand Total</span>
                          <span className="text-[7.5px] font-bold text-zinc-700 uppercase tracking-widest mt-1 italic">Final Order Sum</span>
                        </div>
                      </div>
                      <div className="relative z-10 flex flex-col">
                        <span className="text-3xl font-mono font-black tracking-tighter text-white leading-none drop-shadow-2xl">
                          ₹{parseFloat(quote.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="h-1 w-full bg-zinc-900 rounded-full mt-3 overflow-hidden border border-zinc-800 p-0.5 shadow-inner">
                          <div className="h-full bg-brand-primary shadow-[0_0_10px_rgba(94,192,194,0.6)] transition-all duration-700 ease-out rounded-full" style={{ width: `${Math.min((quote.markup || 0) * 3, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="mt-auto pt-4 border-t border-zinc-900/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">Entry</span>
                      <span className="text-[9px] font-mono font-bold text-zinc-600">{quote.$createdAt ? new Date(quote.$createdAt).toLocaleDateString('en-GB') : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">Audit</span>
                      <span className="text-[9px] font-mono font-bold text-zinc-600">{quote.$updatedAt ? new Date(quote.$updatedAt).toLocaleDateString('en-GB') : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <AssetPreviewModal 
          isOpen={!!previewFile} 
          onClose={() => setPreviewFile(null)} 
          file={previewFile}
        />
      </div>
    </div>
  );
};

export default QuotationPreviewModal;
