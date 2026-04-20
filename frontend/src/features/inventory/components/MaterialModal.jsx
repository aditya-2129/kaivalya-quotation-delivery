'use client';

import React, { useState, useEffect } from 'react';
import { THEME } from '@/constants/ui';
import { Search, Info, X } from 'lucide-react';
import { useCreateMaterial, useUpdateMaterial } from '../api/useMaterials';

const SHAPES = [
  { id: 'round_bar', label: 'Round Bar' },
  { id: 'square_bar', label: 'Square Bar' },
  { id: 'rectangular_bar', label: 'Rectangular Bar' },
  { id: 'plate_sheet', label: 'Plate / Sheet' },
  { id: 'hollow_tube', label: 'Hollow Tube' },
  { id: 'hex_bar', label: 'Hex Bar' },
  { id: 'forged_block', label: 'Forged Block' },
  { id: 'casting', label: 'Casting' },
  { id: 'extruded_section', label: 'Extruded Section' }
];

const DENSITY_MAP = {
  'STEEL': 7.850, 'MS': 7.850, 'MILD STEEL': 7.850, 'ALLOY STEEL': 7.850, 'EN8': 7.850, 'EN9': 7.850, 'EN19': 7.850, 'EN24': 7.850,
  'STAINLESS STEEL': 8.000, 'SS': 8.000, 'SS304': 8.000, 'SS316': 8.000,
  'ALUMINIUM': 2.700, 'AL': 2.700,
  'COPPER': 8.960, 'BRASS': 8.500, 'TITANIUM': 4.500,
  'PLASTIC': 1.050, 'ABS': 1.050, 'ACRYLIC': 1.180, 'NYLON': 1.150,
  'CAST IRON': 7.200, 'CI': 7.200
};

export const MaterialModal = ({ material, onClose, onError }) => {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    grade: material?.grade || '',
    density: material?.density || 0,
    base_rate: material?.base_rate || 0,
    shape: material?.shape || 'round_bar'
  });

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const isSubmitting = createMaterial.isPending || updateMaterial.isPending;

  useEffect(() => {
    if (parseFloat(formData.density) > 0 && ![0, 7.85, 2.7].includes(parseFloat(formData.density))) return; 

    const searchStr = (formData.name + ' ' + formData.grade).toUpperCase();
    for (const key in DENSITY_MAP) {
      if (searchStr.includes(key)) {
        setFormData(prev => ({ ...prev, density: DENSITY_MAP[key] }));
        break;
      }
    }
  }, [formData.name, formData.grade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      density: parseFloat(formData.density),
      base_rate: parseFloat(formData.base_rate)
    };

    try {
      if (material) {
        await updateMaterial.mutateAsync({ id: material.$id, data: payload });
      } else {
        await createMaterial.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      onError(err.message || "Operation failed.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm" style={{ zIndex: THEME.Z_INDEX.MODAL }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
           <h2 className="font-bold text-zinc-950 tracking-tight" style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>
              {material ? 'Material Specification Update' : 'New Material Inventory Entry'}
           </h2>
           <p className="text-zinc-500 mt-1.5 font-medium leading-relaxed" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
              Configure precise physical properties and market rates for the global registry.
           </p>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                 <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Material Grade / Specification *</label>
                 <input 
                    required
                    placeholder="e.g. 6061-T6, EN8, SS304"
                    className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-black focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all placeholder:font-normal"
                    style={{ fontSize: THEME.FONT_SIZE.BASE }}
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                 />
              </div>
              <div className="col-span-2">
                 <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Category Name *</label>
                 <input 
                    required
                    placeholder="e.g. Aluminium, Alloy Steel"
                    className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-bold text-zinc-500 italic focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all placeholder:font-normal"
                    style={{ fontSize: THEME.FONT_SIZE.BASE }}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                 />
              </div>
              <div>
                 <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Form Factor *</label>
                 <select 
                    required
                    className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all"
                    style={{ fontSize: THEME.FONT_SIZE.BASE }}
                    value={formData.shape}
                    onChange={(e) => setFormData({...formData, shape: e.target.value})}
                 >
                    {SHAPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                 </select>
              </div>
              <div>
                 <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Density (g/cm³) *</label>
                 </div>
                 <input 
                    required
                    type="number"
                    step="0.001"
                    className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all"
                    style={{ fontSize: THEME.FONT_SIZE.BASE }}
                    value={formData.density}
                    onChange={(e) => setFormData({...formData, density: e.target.value})}
                 />
              </div>
              <div>
                 <label className="block font-bold text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Base Rate (₹/kg) *</label>
                 <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full h-11 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all"
                    style={{ fontSize: THEME.FONT_SIZE.BASE }}
                    value={formData.base_rate}
                    onChange={(e) => setFormData({...formData, base_rate: e.target.value})}
                 />
              </div>
           </div>

           <div className="flex gap-4 pt-6 border-t border-zinc-100">
              <button 
                 type="button" 
                 onClick={onClose}
                 className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-950 transition-colors"
                 style={{ fontSize: THEME.FONT_SIZE.BASE }}
              >
                 Abort
              </button>
              <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                 style={{ fontSize: THEME.FONT_SIZE.BASE }}
              >
                 {isSubmitting ? 'Syncing...' : (material ? 'Commit Changes' : 'Update Registry')}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
