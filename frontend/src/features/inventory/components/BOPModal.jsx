'use client';

import React, { useState, useEffect } from 'react';
import { THEME } from '@/constants/ui';
import { X, Package, IndianRupee, Ruler, Factory } from 'lucide-react';
import { useCreateBOP, useUpdateBOP } from '../api/useBOP';

const IconInput = ({ icon: Icon, children }) => (
  <div className="relative group">
    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand-primary transition-colors">
      <Icon className="h-4 w-4" />
    </div>
    {children}
  </div>
);

const inputCls = "w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 font-bold focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all placeholder:font-normal";
const numCls = "w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 font-mono focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all";

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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
      <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-zinc-950 tracking-tight" style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>
              {data ? 'Registry Sync' : 'New Procurement Catalog Entry'}
            </h2>
            <p className="text-zinc-500 mt-1 font-medium" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
              Register purchased parts and components in the catalog.
            </p>
          </div>
          <button onClick={onClose} type="button" className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              Item Descriptor Name <span className="text-red-500">*</span>
            </label>
            <IconInput icon={Package}>
              <input required className={inputCls} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </IconInput>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Acquisition Rate (₹) <span className="text-red-500">*</span>
              </label>
              <IconInput icon={IndianRupee}>
                <input required type="number" step="0.01" className={numCls} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                  value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} />
              </IconInput>
            </div>
            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Unit
              </label>
              <IconInput icon={Ruler}>
                <input placeholder="e.g. pcs, mm" className={inputCls} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                  value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
              </IconInput>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              OEM / Certified Supplier
            </label>
            <IconInput icon={Factory}>
              <input placeholder="Manufacturer Name" className={inputCls} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
            </IconInput>
          </div>

          <div className="flex gap-4 pt-6 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-950 transition-colors">
              Abort
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ fontSize: THEME.FONT_SIZE.BASE }}>
              {isSubmitting ? 'Syncing...' : (data ? 'Registry Sync' : 'Catalog Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
