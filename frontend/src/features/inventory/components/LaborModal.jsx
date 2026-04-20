'use client';

import React, { useState, useEffect } from 'react';
import { THEME } from '@/constants/ui';
import { X, Wrench, Clock, IndianRupee } from 'lucide-react';
import { useCreateLabor, useUpdateLabor } from '../api/useLabor';

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

export const LaborModal = ({ data, onClose, onError }) => {
  const [formData, setFormData] = useState({
    name: data?.process_name || '',
    rate: data?.rate || data?.hourly_rate || 0,
    unit: data?.unit || 'hr'
  });

  const createLabor = useCreateLabor();
  const updateLabor = useUpdateLabor();
  const isSubmitting = createLabor.isPending || updateLabor.isPending;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      process_name: formData.name,
      rate: parseFloat(formData.rate),
      unit: formData.unit
    };
    try {
      if (data) {
        await updateLabor.mutateAsync({ id: data.$id, data: payload });
      } else {
        await createLabor.mutateAsync(payload);
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
              {data ? 'Skill Rate Adjustment' : 'New Manufacturing Process'}
            </h2>
            <p className="text-zinc-500 mt-1 font-medium" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
              Define process descriptors and unit rates for costing.
            </p>
          </div>
          <button onClick={onClose} type="button" className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              Process Descriptor <span className="text-red-500">*</span>
            </label>
            <IconInput icon={Wrench}>
              <input required className={inputCls} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </IconInput>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              Rate Calculation Unit <span className="text-red-500">*</span>
            </label>
            <IconInput icon={Clock}>
              <select required className={`${inputCls} appearance-none`} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                <option value="hr">Per Hour (hr)</option>
                <option value="sq_cm">Per Sq. Centimeter (sq_cm)</option>
                <option value="per_hole">Per Hole (per_hole)</option>
                <option value="per_rim">Per Rim (per_rim)</option>
                <option value="per_tap">Per Tap (per_tap)</option>
                <option value="pcs">Per Piece (pcs)</option>
              </select>
            </IconInput>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              Unit Rate (₹) <span className="text-red-500">*</span>
            </label>
            <IconInput icon={IndianRupee}>
              <input required type="number" step="0.01" className={numCls} style={{ fontSize: THEME.FONT_SIZE.BASE }}
                value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} />
            </IconInput>
          </div>

          <div className="flex gap-4 pt-6 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-950 transition-colors">
              Abort
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ fontSize: THEME.FONT_SIZE.BASE }}>
              {isSubmitting ? 'Syncing...' : (data ? 'Commit Changes' : 'Commit Settings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
