'use client';

import React, { useState } from 'react';
import { THEME } from '@/constants/ui';
import { useCreateBOP, useUpdateBOP } from '../api/useBOP';

export const BOPModal = ({ data, onClose, onError }) => {
  const [formData, setFormData] = useState({
    name: data?.item_name || '',
    rate: data?.rate || 0,
    unit: data?.unit || 'pcs',
    supplier: data?.supplier || ''
  });

  const createBOP = useCreateBOP();
  const updateBOP = useUpdateBOP();
  const isSubmitting = createBOP.isPending || updateBOP.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      item_name: formData.name,
      rate: parseFloat(formData.rate),
      unit: formData.unit,
      supplier: formData.supplier
    };

    try {
      if (data) {
        await updateBOP.mutateAsync({ id: data.$id, data: payload });
      } else {
        await createBOP.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      onError(err.message || "Operation failed.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm" style={{ zIndex: THEME.Z_INDEX.MODAL }}>
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
           <h2 className="font-bold text-zinc-950 tracking-tight" style={{ fontSize: THEME.FONT_SIZE.LARGE }}>
              {data ? 'Registry Sync' : 'New Procurement Catalog Entry'}
           </h2>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Item Descriptor Name *</label>
              <input 
                required 
                className="w-full h-10 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-bold outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white" 
                style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Acquisition Rate (₹) *</label>
                 <input 
                  required 
                  type="number" 
                  step="0.01" 
                  className="w-full h-10 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono font-bold outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white" 
                  style={{ fontSize: THEME.FONT_SIZE.BASE }}
                  value={formData.rate} 
                  onChange={(e) => setFormData({...formData, rate: e.target.value})} 
                />
              </div>
              <div>
                 <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Unit</label>
                 <input 
                  placeholder="e.g. pc, mm" 
                  className="w-full h-10 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-bold outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white" 
                  style={{ fontSize: THEME.FONT_SIZE.BASE }}
                  value={formData.unit} 
                  onChange={(e) => setFormData({...formData, unit: e.target.value})} 
                />
              </div>
           </div>
           <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>OEM / Certified Supplier</label>
              <input 
                placeholder="Manufacturer Name" 
                className="w-full h-10 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-bold outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white" 
                style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.supplier} 
                onChange={(e) => setFormData({...formData, supplier: e.target.value})} 
              />
           </div>
           <div className="flex gap-3 pt-4 border-t border-zinc-100">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 h-10 rounded-lg font-bold text-zinc-400 hover:text-zinc-950 transition-colors uppercase italic"
                style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
              >Abort</button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-[2] h-10 rounded-lg bg-zinc-950 text-white font-bold shadow-lg disabled:opacity-50 transition-all uppercase italic"
                style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
              >
                 {isSubmitting ? 'Syncing...' : 'Catalog Entry'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
