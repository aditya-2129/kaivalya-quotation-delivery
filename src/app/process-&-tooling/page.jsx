"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { laborRateService, bopRateService } from '@/services/rates';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

export default function ToolingRatePage() {
  const [laborRates, setLaborRates] = useState([]);

  const [bopRates, setBopRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, type: null, data: null });
  
  // Pagination State
  const [laborPage, setLaborPage] = useState(1);

  const [bopPage, setBopPage] = useState(1);
  
  const [laborTotal, setLaborTotal] = useState(0);

  const [bopTotal, setBopTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, row: null });
  const [errorDetails, setErrorDetails] = useState({ open: false, message: '' });
  const limit = 12;

  useEffect(() => {
    fetchData();
  }, [laborPage, bopPage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [laborRes, bopRes] = await Promise.all([
        laborRateService.listRates(limit, (laborPage - 1) * limit),
        bopRateService.listRates(limit, (bopPage - 1) * limit)
      ]);
      setLaborRates(laborRes.documents);
      setLaborTotal(laborRes.total);
      setBopRates(bopRes.documents);
      setBopTotal(bopRes.total);
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = (type) => setModalState({ open: true, type, data: null });
  const openEditModal = (type, data) => setModalState({ open: true, type, data });
  const closeModal = () => setModalState({ open: false, type: null, data: null });

   const handleDelete = (type, rate) => {
      setDeleteConfirm({ open: true, type, row: rate });
   };

   const commitDelete = async () => {
      const { type, row } = deleteConfirm;
      if (!row) return;
      try {
         if (type === 'labor') await laborRateService.deleteRate(row.$id);
         else await bopRateService.deleteRate(row.$id);
         fetchData();
      } catch (error) {
         setErrorDetails({ open: true, message: error.message || "Failed to remove engineering record." });
      } finally {
         setDeleteConfirm({ open: false, type: null, row: null });
      }
   };

  return (
    <DashboardLayout 
      title="Engineering Master Data"
      primaryAction={
        <div className="flex gap-2">
           <button 
              onClick={() => openAddModal('labor')}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-[13px] font-bold text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
           >
              Add Labor
           </button>

           <button 
              onClick={() => openAddModal('bop')}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[13px] font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
           >
              Add BOP Item
           </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full pb-8">
        {/* Labor Rates Section */}
        <section className="flex flex-col gap-4">
           <SectionHeader title="Process & Labor" count={laborTotal} color="bg-emerald-500" />
           <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Process / Skill</th>
                       <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Unit</th>
                       <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Rate (₹)</th>
                       <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {isLoading ? [1,2,3,4].map(i => <SkeletonRow key={i} />) : laborRates.length === 0 ? (
                      <tr><td colSpan="4" className="px-5 py-20 text-center text-zinc-400 italic">No processes defined.</td></tr>
                    ) : laborRates.map(rate => (
                      <tr key={rate.$id} className="group hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC] transition-all duration-200">
                        <td className="px-5 py-3.5 font-bold text-zinc-900 leading-tight">{rate.process_name}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-zinc-500 text-xs uppercase">{rate.unit || 'hr'}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap text-xs">
                           ₹{parseFloat(rate.rate || rate.hourly_rate).toFixed(2)}
                        </td>
                         <td className="px-5 py-3.5 text-right">
                            <ActionButtons onEdit={() => openEditModal('labor', rate)} onDelete={() => handleDelete('labor', rate)} />
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={laborPage} setPage={setLaborPage} total={laborTotal} limit={limit} />
           </div>
        </section>


        {/* BOP Items Section */}
        <section className="flex flex-col gap-4">
           <SectionHeader title="Brought Out Material (BOP)" count={bopTotal} color="bg-blue-600" />
           <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Descriptor</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Rate (₹)</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {isLoading ? [1,2,3,4].map(i => <SkeletonRow key={i} />) : bopRates.length === 0 ? (
                      <tr><td colSpan="3" className="px-5 py-20 text-center text-zinc-400 italic">No bought out parts defined.</td></tr>
                    ) : bopRates.map(rate => (
                      <tr key={rate.$id} className="group hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC] transition-all duration-200">
                        <td className="px-5 py-3.5 font-bold text-zinc-900 leading-tight">
                           {rate.item_name}
                           {rate.supplier && <div className="text-[10px] text-zinc-400 font-normal">{rate.supplier}</div>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap text-xs">
                           ₹{parseFloat(rate.rate).toFixed(2)}
                        </td>
                         <td className="px-5 py-3.5 text-right">
                            <ActionButtons onEdit={() => openEditModal('bop', rate)} onDelete={() => handleDelete('bop', rate)} />
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={bopPage} setPage={setBopPage} total={bopTotal} limit={limit} />
           </div>
        </section>
      </div>

       {modalState.open && (
         <RateModal 
           type={modalState.type}
           data={modalState.data}
           onClose={closeModal}
           onSuccess={() => { fetchData(); closeModal(); }}
           onError={(msg) => setErrorDetails({ open: true, message: msg })}
         />
       )}

       <ConfirmationModal 
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, type: null, row: null })}
          onConfirm={commitDelete}
          title={deleteConfirm.type === 'labor' ? "Excise Process?" : "Purge BOP Item?"}
          message={`Are you sure you want to permanently remove '${deleteConfirm.row?.process_name || deleteConfirm.row?.item_name || 'this record'}' from the engineering library?`}
          confirmText="PURGE RECORD"
          cancelText="KEEP RECORD"
          type="danger"
       />

       <ConfirmationModal 
          isOpen={errorDetails.open}
          onClose={() => setErrorDetails({ open: false, message: '' })}
          onConfirm={() => setErrorDetails({ open: false, message: '' })}
          title="REGISTRY ERROR"
          message={errorDetails.message}
          confirmText="CLOSE"
          type="danger"
       />
     </DashboardLayout>
  );
}

function SectionHeader({ title, count, color }) {
   return (
      <div className="flex items-center justify-between px-1">
         <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-none">{title}</h2>
         </div>
         <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-50 border border-zinc-100">
            {count} total
         </div>
      </div>
   );
}

function Pagination({ page, setPage, total, limit }) {
   const totalPages = Math.ceil(total / limit) || 1;
   return (
      <div className="mt-auto px-4 py-3 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
         <button 
           disabled={page === 1}
           onClick={() => setPage(p => p - 1)}
           className="h-7 px-3 rounded border border-zinc-200 bg-white text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm uppercase"
         >Prev</button>
         <div className="text-[10px] font-mono font-bold text-zinc-900">{page} / {totalPages}</div>
         <button 
           disabled={page >= totalPages}
           onClick={() => setPage(p => p + 1)}
           className="h-7 px-3 rounded border border-zinc-200 bg-white text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm uppercase"
         >Next</button>
      </div>
   );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="h-4 bg-zinc-100 rounded w-32" /></td>
      <td className="px-5 py-4 text-right"><div className="h-4 bg-zinc-100 rounded w-16 ml-auto" /></td>
      <td className="px-5 py-4 text-right"><div className="h-4 bg-zinc-100 rounded w-8 ml-auto" /></td>
    </tr>
  );
}

function RateModal({ type, data, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    name: data?.process_name || data?.item_name || '',
    rate: data?.hourly_rate || data?.rate || 0,
    unit: data?.unit || (type === 'labor' ? 'hr' : 'pcs'),
    supplier: data?.supplier || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (type === 'labor') {
        const payload = { 
          process_name: formData.name, 
          rate: parseFloat(formData.rate),
          unit: formData.unit
        };
        if (data) await laborRateService.updateRate(data.$id, payload);
        else await laborRateService.createRate(payload);

      } else {
        const payload = { item_name: formData.name, rate: parseFloat(formData.rate), supplier: formData.supplier, unit: formData.unit };
        if (data) await bopRateService.updateRate(data.$id, payload);
        else await bopRateService.createRate(payload);
      }
       onSuccess();
     } catch (error) {
       console.error("Registry Sync Error:", error);
       onError(error.message || "Failed to commit engineering entry.");
       setIsSubmitting(false);
     }
   };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">
        <header className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
           <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
              {data ? `Modify Entity` : `New Engineering Entry`}
           </h2>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="space-y-4">
              <div>
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Descriptor Name *</label>
                 <input 
                    required
                    className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-bold outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Market Rate (₹) *</label>
                    <input 
                       required
                       type="number"
                       step="0.01"
                       className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                       value={formData.rate}
                       onChange={(e) => setFormData({...formData, rate: e.target.value})}
                    />
                 </div>
                  <div>
                     <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Unit</label>
                     {type === 'labor' ? (
                        <select
                           className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white text-xs font-bold"
                           value={formData.unit}
                           onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        >
                           <option value="hr">Hour (hr)</option>
                           <option value="sq_cm">Sq. Cm</option>
                           <option value="per_hole">Per Hole</option>
                           <option value="per_rim">Per Rim</option>
                           <option value="per_tap">Per Tap</option>
                           <option value="pcs">Pieces (pcs)</option>
                        </select>
                     ) : (
                        <input 
                           placeholder="e.g. pcs"
                           className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                           value={formData.unit}
                           onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        />
                     )}
                  </div>
              </div>
              {type === 'bop' && (
                <div>
                   <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Preferred Supplier</label>
                   <input 
                      placeholder="e.g. SKF, NSK..."
                      className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                      value={formData.supplier}
                   onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                   />
                </div>
              )}
           </div>

           <div className="flex gap-4 pt-6 border-t border-zinc-100">
              <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-950">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 disabled:opacity-50">
                 {isSubmitting ? 'Syncing...' : 'Save Settings'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
