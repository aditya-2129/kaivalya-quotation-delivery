'use client';

import React from 'react';
import { THEME } from '@/constants/ui';
import { Truck, Package, PencilRuler, ShieldCheck, ChevronDown } from 'lucide-react';
import { FeaturePanel } from '@/components/ui/FeaturePanel';

const CommercialAdjustments = ({
  activePhase,
  setActivePhase,
  formData,
  setFormData,
  panelIndex = 6
}) => {
  const isExpanded = activePhase === 'commercial';

  const updateProject = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const costItems = [
    {
      id: 'packaging',
      label: 'Stuffing & Packing Cost',
      phase: 'Phase 1: Logistics',
      field: 'packaging_cost',
      notes: 'Cost for boxes, pallets, and packing materials.',
      icon: Package
    },
    {
      id: 'transportation',
      label: 'Shipping / Delivery Cost',
      phase: 'Phase 2: Logistics',
      field: 'transportation_cost',
      notes: 'Cost for truck, courier, or delivery.',
      icon: Truck
    },
    {
      id: 'design',
      label: 'Design & Engineering Fee',
      phase: 'One-Time Setup',
      field: 'design_cost',
      notes: '3D modeling, technical drawings, and planning.',
      icon: PencilRuler
    },
    {
      id: 'assembly',
      label: 'Final Assembly & Testing',
      phase: 'Quality Check',
      field: 'assembly_cost',
      notes: 'Fitting all parts and ensuring final functionality.',
      icon: ShieldCheck
    }
  ];

  const totalExtra = (
    (parseFloat(formData.packaging_cost) || 0) + 
    (parseFloat(formData.transportation_cost) || 0) + 
    (parseFloat(formData.design_cost) || 0) + 
    (parseFloat(formData.assembly_cost) || 0)
  );

  return (
    <FeaturePanel
      index={panelIndex}
      title="Extra Costs & Shipping"
      isExpanded={isExpanded}
      onToggle={() => setActivePhase(isExpanded ? '' : 'commercial')}
    >
       <div className="p-3">
          <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
               <thead className="bg-zinc-50/50 font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 italic" style={{ fontSize: '9px' }}>
                  <tr>
                     <th className="px-3 py-2 w-12 text-center">Ref</th>
                     <th className="px-3 py-2">Cost Category / Phase</th>
                     <th className="px-3 py-2">Description / Remarks</th>
                     <th className="px-3 py-2 text-right">Amount (₹)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {costItems.map((item) => {
                     const Icon = item.icon;
                     return (
                        <tr key={item.id} className="group hover:bg-zinc-50/30 transition-colors">
                           <td className="px-3 py-2.5 text-center">
                              <div className="h-7 w-7 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-brand-primary group-hover:text-zinc-950 group-hover:border-brand-primary transition-all shadow-sm">
                                 <Icon className="h-4 w-4" />
                              </div>
                           </td>
                           <td className="px-3 py-2.5">
                              <div className="flex flex-col">
                                 <span className="font-black text-brand-primary uppercase tracking-tighter leading-none mb-1 italic opacity-70" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{item.phase}</span>
                                 <span className="font-extrabold text-zinc-950 uppercase tracking-tight" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{item.label}</span>
                              </div>
                           </td>
                           <td className="px-3 py-2.5">
                              <span className="font-semibold text-zinc-500 italic leading-relaxed" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{item.notes}</span>
                           </td>
                           <td className="px-3 py-2.5 text-right">
                              <div className="relative group/input inline-block min-w-[140px]">
                                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-black" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>₹</span>
                                 <input 
                                   type="number" 
                                   step="0.01"
                                   className="w-full h-8.5 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-right font-black font-mono outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary transition-all shadow-sm group-hover/input:border-brand-primary"
                                   style={{ fontSize: THEME.FONT_SIZE.BASE }}
                                   placeholder="0.00"
                                   value={formData[item.field] || ''}
                                   onChange={(e) => updateProject({ [item.field]: parseFloat(e.target.value) || 0 })}
                                 />
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
               <tfoot className="bg-zinc-50/20 border-t border-zinc-100">
                  <tr>
                     <td colSpan="3" className="px-4 py-3.5 text-right">
                        <span className="font-black text-zinc-400 uppercase tracking-widest italic" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>Total Extra Costs</span>
                     </td>
                     <td className="px-4 py-3.5 text-right">
                        <span className="font-black text-zinc-950 font-mono tracking-tighter" style={{ fontSize: THEME.FONT_SIZE.LARGE }}>
                           ₹{totalExtra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                     </td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
    </FeaturePanel>
  );
};

export default CommercialAdjustments;
