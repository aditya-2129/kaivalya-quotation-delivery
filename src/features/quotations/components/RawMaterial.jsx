'use client';

import React, { useState, useEffect } from 'react';
import { THEME } from '@/constants/ui';
import { Search, Plus, Trash2, ChevronDown, Check, Info, Box, Square, Circle, Hexagon, Image as ImageIcon, FileText } from 'lucide-react';
import { assetService } from '@/services/assets';
import { FeaturePanel } from '@/components/ui/FeaturePanel';
import AssetPreviewModal from '@/components/modals/AssetPreviewModal';

const SHAPES = [
  { id: 'rect', name: 'Rect Bar / Plate', icon: Square },
  { id: 'round', name: 'Round Bar', icon: Circle },
  { id: 'hex', name: 'Hexagonal Bar', icon: Hexagon },
];

const DimensionInput = ({ label, field, value, allowance, onChange }) => (
  <div className="flex-1 min-w-[145px]">
     <label className="font-black text-zinc-400 uppercase block mb-1 flex justify-between items-center" style={{ fontSize: '7.5px' }}>
        <span className="flex items-center gap-1">{label} <span className="text-red-500 font-extrabold">*</span></span>
        <span className="text-brand-primary font-bold">+ Allowance</span>
     </label>
     <div className="flex gap-1">
        <input 
          type="number" 
          step="0.01"
          required
          placeholder="Size"
          className={`w-[60%] h-8 border rounded-l-lg px-2 font-bold outline-none transition-all font-mono ${!value && value !== 0 ? 'bg-zinc-100 text-zinc-300 border-zinc-200' : 'bg-white border-zinc-200 focus:ring-1 focus:ring-zinc-950'}`}
          style={{ fontSize: THEME.FONT_SIZE.SMALL }}
          value={value ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
        />
        <input 
          type="number" 
          step="0.01"
          placeholder="+ mm"
          className="w-[40%] h-8 bg-brand-primary/5 border border-brand-primary/20 border-l-0 rounded-r-lg px-2 font-black text-brand-primary outline-none focus:ring-1 focus:ring-brand-primary transition-all font-mono placeholder:text-brand-primary/40"
          style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
          value={allowance ?? ""}
          onChange={(e) => onChange(field, e.target.value, true)}
        />
     </div>
  </div>
);

const MaterialConfigurationRow = ({ item, idx, libraries, onUpdate, onPreviewFile }) => {
  const [step, setStep] = useState(1); // 1: Material, 2: Shape, 3: Dimensions/Result
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [serverMaterials, setServerMaterials] = useState([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
       if (search.trim().length >= 2) {
          try {
             const { materialService } = await import('@/services/materials');
             const res = await materialService.listMaterials(30, 0, search);
             setServerMaterials(res.documents);
          } catch (err) {
             console.error("Material search failed:", err);
          }
       } else {
          setServerMaterials([]);
       }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    if (item.material && !item.shape) setStep(2);
    else if (item.material && item.shape) setStep(3);
    else setStep(1);
  }, [item.material, item.shape]);

  const getDensity = () => {
    if (!item.material) return 7.85;
    if (item.material.density) return parseFloat(item.material.density);
    const grade = item.material.grade.toLowerCase();
    if (grade.includes('al') || grade.includes('6061')) return 2.70;
    if (grade.includes('ms') || grade.includes('en') || grade.includes('ss')) return 7.85;
    if (grade.includes('brass') || grade.includes('copper')) return 8.50;
    return 7.85;
  };

  const calculateWeight = (updatedDims, updatedAllowances) => {
    const d = updatedDims || item.dimensions || {};
    const a = updatedAllowances || item.allowances || {};
    const density = getDensity();
    let vol = 0;

    const parse = (v) => parseFloat(v) || 0;

    const L = parse(d.l) + parse(a.l);
    const W = parse(d.w) + parse(a.w);
    const T = parse(d.t) + parse(a.t);
    const Dia = parse(d.dia) + parse(a.dia);
    const AF = parse(d.af) + parse(a.af);

    if (item.shape === 'rect') {
      vol = (L * W * T) / 1000;
    } else if (item.shape === 'round') {
      const r = Dia / 2;
      vol = (Math.PI * Math.pow(r, 2) * L) / 1000;
    } else if (item.shape === 'hex') {
      vol = (2.598 * Math.pow(AF, 2) * L) / 1000;
    }

    const weight = (vol * density) / 1000;
    onUpdate({ material_weight: weight });
  };

  const handleDimUpdate = (field, val, isAllowance = false) => {
    const parentKey = isAllowance ? 'allowances' : 'dimensions';
    const newSubData = { ...(item[parentKey] || {}), [field]: val };
    
    onUpdate({ [parentKey]: newSubData });
    
    if (isAllowance) {
       calculateWeight(item.dimensions, newSubData);
    } else {
       calculateWeight(newSubData, item.allowances);
    }
  };

  const displayMaterials = serverMaterials.length > 0 ? serverMaterials : (libraries.materials || []).filter(m => 
     (m.grade || "").toLowerCase().includes(search.toLowerCase()) || 
     (m.name && m.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div 
      className={`bg-white border border-zinc-200 rounded-xl overflow-visible mb-2.5 transition-all hover:border-zinc-300 relative ${isOpen ? 'z-[50]' : 'z-0'} ${item.jobType === 'rework' ? 'ring-1 ring-amber-500/20 bg-amber-50/5' : item.jobType === 'labour' ? 'ring-1 ring-blue-500/20 bg-blue-50/5' : ''}`}
    >
      <div className="flex items-stretch min-h-[50px]">
        {/* Step Indicator Sidebar */}
        <div className="w-12 bg-zinc-50 border-r border-zinc-100 flex flex-col items-center justify-center gap-1 py-2">
           <span className="font-black text-zinc-400 uppercase tracking-tighter italic" style={{ fontSize: '8px' }}>Part</span>
           <div 
            className={`h-6 w-6 rounded-full flex items-center justify-center font-black transition-all duration-500 ${step === 3 ? 'bg-brand-primary text-zinc-950 shadow-lg shadow-brand-primary/20' : 'bg-zinc-950 text-white shadow-md'}`}
            style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
           >
              {String(idx + 1).padStart(2, '0')}
           </div>
           {step === 3 && (
              <Check className="h-3 w-3 text-brand-primary animate-bounce" />
           )}
        </div>

        {/* Dynamic Workspace */}
        <div className="flex-1 p-2 flex flex-wrap items-center gap-4">
            {/* Section 0: Part Profile */}
            <div className="w-48 border-r border-zinc-100 pr-4 flex flex-col gap-2">
               <div className="flex items-center gap-3">
                  {item.part_image ? (
                     <div className="h-10 w-10 rounded-lg border border-zinc-200 overflow-hidden bg-white shadow-sm flex-shrink-0">
                        <img 
                           src={item.part_image.localPreview || (item.part_image.$id ? assetService.getFileView(item.part_image.$id)?.toString() : "")}
                           alt="Component"
                           className="h-full w-full object-cover"
                        />
                     </div>
                  ) : (
                     <div className="h-10 w-10 rounded-lg border-2 border-dashed border-zinc-100 bg-zinc-50 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-zinc-200" />
                     </div>
                  )}
                  <div className="min-w-0">
                     <span className="font-black text-zinc-300 uppercase tracking-widest block mb-0.5" style={{ fontSize: '9px' }}>Part Name</span>
                     <h4 className="font-black text-zinc-950 truncate leading-tight" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{item.part_name}</h4>
                  </div>
               </div>
               <div className="flex gap-1">
                  <button
                    onClick={() => {
                       const newType = item.jobType === 'rework' ? 'standard' : 'rework';
                       onUpdate({ jobType: newType });
                    }}
                    className={`flex-1 px-1.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-tight border transition-all text-center ${item.jobType === 'rework' ? 'bg-amber-500 border-amber-600 text-white shadow-sm shadow-amber-500/20' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'}`}
                  >
                     Rework
                  </button>
                  <button
                    onClick={() => {
                       const newType = item.jobType === 'labour' ? 'standard' : 'labour';
                       onUpdate({ jobType: newType });
                    }}
                    className={`flex-1 px-1.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-tight border transition-all text-center ${item.jobType === 'labour' ? 'bg-blue-600 border-blue-700 text-white shadow-sm shadow-blue-500/20' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                     Labour
                  </button>
               </div>
               {item.design_files?.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-1.5">
                   {item.design_files.map((file, fIdx) => {
                     const isCAD = ['.stp', '.step', '.dwg', '.dxf'].some(ext => file.name?.toLowerCase().endsWith(ext));
                     const baseName = file.name?.replace(/\.[^/.]+$/, '') ?? '';
                     const ext = file.name?.split('.').pop()?.toUpperCase() ?? '';
                     return (
                       <button
                         key={fIdx}
                         type="button"
                         onClick={() => onPreviewFile(file)}
                         className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all hover:scale-105 active:scale-95 ${isCAD ? 'bg-cyan-50 border-cyan-200 hover:border-cyan-400' : 'bg-red-50 border-red-200 hover:border-red-400'}`}
                       >
                         {isCAD ? (
                           <svg className="h-2.5 w-2.5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                           </svg>
                         ) : (
                           <FileText className="h-2.5 w-2.5 text-red-500 flex-shrink-0" />
                         )}
                         <span className={`font-bold uppercase tracking-tight truncate max-w-[80px] ${isCAD ? 'text-cyan-800' : 'text-red-800'}`} style={{ fontSize: '8px' }}>{baseName}</span>
                         <span className={`font-black uppercase opacity-50 flex-shrink-0 ${isCAD ? 'text-cyan-700' : 'text-red-700'}`} style={{ fontSize: '7px' }}>.{ext}</span>
                       </button>
                     );
                   })}
                 </div>
               )}
            </div>

            {/* Step 1: Material Selection */}
            <div className={`flex-[1.5] min-w-[280px] transition-all duration-500 ${step > 1 && !isOpen ? 'opacity-80 scale-[0.99]' : ''}`}>
               <div className={`relative group ${isOpen ? 'z-[100]' : 'z-0'}`}>
                 <div className="flex items-center mb-1.5">
                    <span className="font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1" style={{ fontSize: '9px' }}>01. Pick Material Grade <span className="text-red-500 font-extrabold">*</span></span>
                 </div>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <input 
                        type="text"
                        className={`w-full h-9 pl-4 pr-10 rounded-xl bg-zinc-50 border focus:ring-1 focus:ring-brand-primary focus:bg-white outline-none transition-all font-bold text-black placeholder:font-normal ${isOpen ? 'border-brand-primary ring-1 ring-brand-primary bg-white' : 'border-zinc-200'}`}
                        style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                        placeholder="e.g. Aluminum 6061, EN24..."
                        value={isOpen ? search : (item.material ? item.material.grade : "")}
                        onFocus={() => {
                           setSearch(item.material ? item.material.grade : "");
                           setIsOpen(true);
                        }}
                        onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
                      />
                      <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-primary transition-colors"
                      >
                         <Search className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {item.material && (
                       <div className="w-24 animate-in slide-in-from-left-2 duration-300">
                          <div className="relative">
                             <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-primary font-black" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>₹</span>
                             <input 
                               type="number"
                               step="0.01"
                               className="w-full h-9 pl-6 pr-2 rounded-xl bg-brand-primary/5 border border-brand-primary/20 focus:ring-1 focus:ring-brand-primary focus:bg-white outline-none transition-all font-black font-mono text-brand-primary placeholder:text-brand-primary/40"
                               style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                               placeholder="Rate"
                               value={(item.material.base_rate ?? "").toString()}
                               onChange={(e) => onUpdate({ material: { ...item.material, base_rate: parseFloat(e.target.value) || 0 } })}
                             />
                             <span className="absolute -top-3.5 right-0 font-black text-brand-primary uppercase tracking-tighter" style={{ fontSize: '7px' }}>Buying Price / kg</span>
                          </div>
                       </div>
                    )}
                 </div>
                 {isOpen && (
                   <>
                     <div className="fixed inset-0" style={{ zIndex: THEME.Z_INDEX.DROPDOWN - 10 }} onClick={() => setIsOpen(false)} />
                     <div 
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-300 ring-1 ring-black/5"
                      style={{ zIndex: THEME.Z_INDEX.DROPDOWN }}
                     >
                        <div className="p-2 border-b border-zinc-50 bg-zinc-50/50">
                           <button 
                             onClick={() => { onUpdate({material: { grade: search || "Custom Grade", base_rate: 0, density: 7.85, isManual: true }}); setSearch(""); setIsOpen(false); }}
                             className="w-full py-2 px-3 flex items-center justify-between gap-2 bg-white border border-dashed border-zinc-300 rounded-lg hover:border-zinc-950 hover:bg-zinc-50 transition-all group/manual"
                           >
                              <div className="flex items-center gap-2">
                                 <div className="h-6 w-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover/manual:bg-zinc-950 group-hover/manual:text-white transition-colors">
                                    <Plus className="h-3.5 w-3.5" />
                                 </div>
                                 <span className="font-black uppercase text-zinc-400 group-hover/manual:text-zinc-950 transition-colors" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>Create Manual Entry</span>
                              </div>
                              {search && <span className="font-bold text-zinc-900 truncate max-w-[120px]" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>"{search}"</span>}
                           </button>
                        </div>
                        
                        {displayMaterials.length === 0 ? (
                           <div className="px-4 py-8 text-center">
                              <span className="font-bold text-zinc-300 uppercase italic" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>No library matches found</span>
                           </div>
                        ) : displayMaterials.map(m => (
                           <button 
                             key={m.$id}
                             onClick={() => { 
                               const updates = { material: m };
                               const shapeValue = (m.shape || m.form || '').toLowerCase();
                               if (shapeValue.includes('round')) updates.shape = 'round';
                               else if (shapeValue.includes('hex')) updates.shape = 'hex';
                               else if (shapeValue.includes('plate') || shapeValue.includes('rect') || shapeValue.includes('sheet')) updates.shape = 'rect';
                               
                               onUpdate(updates); 
                               setSearch(""); 
                               setIsOpen(false); 
                             }}
                             className="w-full text-left px-4 py-3 font-bold hover:bg-zinc-50 border-b border-zinc-100 last:border-0 flex justify-between items-center transition-colors group/item"
                             style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                           >
                               <div className="w-1/3 flex flex-col">
                                  <span className="text-zinc-950 truncate">{m.grade}</span>
                                  <span className="text-zinc-400 font-normal opacity-70 italic tracking-tight truncate" style={{ fontSize: '9px' }}>{m.name}</span>
                               </div>

                               <div className="w-1/3 flex justify-center">
                                  {(m.shape || m.form) && (
                                     <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-black uppercase tracking-wider border border-zinc-200 shadow-sm-inset" style={{ fontSize: '8px' }}>
                                        {m.shape || m.form}
                                     </span>
                                  )}
                               </div>

                               <div className="w-1/3 flex items-center justify-end gap-3">
                                  <span className="text-brand-primary font-black italic whitespace-nowrap">₹{m.base_rate} <span className="font-normal text-zinc-400 not-italic" style={{ fontSize: '8px' }}>/ kg</span></span>
                                  <div className="h-5 w-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                                     <Check className="h-3 w-3" />
                                  </div>
                               </div>    
                           </button>
                        ))}
                     </div>
                   </>
                 )}

                 {item.material?.isManual && item.jobType === 'standard' && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-50/50 border border-amber-100/50 animate-in fade-in slide-in-from-top-2 duration-500">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                             <Plus className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                          </div>
                          <span className="font-black text-amber-700 uppercase tracking-widest" style={{ fontSize: '9px' }}>Manual Material Setup</span>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          <div className="flex-1 min-w-[200px]">
                             <label className="font-black text-amber-600 uppercase mb-1 block" style={{ fontSize: '8px' }}>Material Grade</label>
                             <input 
                                type="text"
                                className="w-full h-9 px-3 rounded-lg border border-amber-200 bg-white font-bold outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                                style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                                placeholder="e.g. CUSTOM GRADE X"
                                value={item.material.grade}
                                onChange={(e) => onUpdate({ material: { ...item.material, grade: e.target.value } })}
                             />
                          </div>
                          <div className="w-36">
                             <label className="font-black text-amber-600 uppercase mb-1 block" style={{ fontSize: '8px' }}>Category</label>
                             <select 
                                className="w-full h-9 px-3 rounded-lg border border-amber-200 bg-white font-bold outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                                style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
                                value={item.material.category || ""}
                                onChange={(e) => {
                                    const cat = e.target.value;
                                    let density = 7.85; 
                                    if (cat === 'SS') density = 8.00;
                                    if (cat === 'AL') density = 2.70;
                                    if (cat === 'CU') density = 8.96;
                                    if (cat === 'BR') density = 8.50;
                                    if (cat === 'PL') density = 1.40;
                                    if (cat === 'TI') density = 4.50;
                                    onUpdate({ material: { ...item.material, category: cat, density } });
                                    calculateWeight(item.dimensions, item.allowances);
                                }}
                             >
                                <option value="ST">Mild / Alloy Steel</option>
                                <option value="SS">Stainless Steel</option>
                                <option value="AL">Aluminum</option>
                                <option value="CU">Copper</option>
                                <option value="BR">Brass / Bronze</option>
                                <option value="TI">Titanium</option>
                                <option value="PL">Engineering Plastics</option>
                             </select>
                          </div>
                          <div className="w-24">
                             <label className="font-black text-amber-600 uppercase mb-1 block" style={{ fontSize: '8px' }}>Density</label>
                             <input 
                                type="number"
                                step="0.01"
                                className="w-full h-9 px-3 rounded-lg border border-amber-200 bg-white font-black outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                                style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                                value={item.material.density}
                                onChange={(e) => {
                                    const density = parseFloat(e.target.value) || 0;
                                    onUpdate({ material: { ...item.material, density } });
                                    calculateWeight(item.dimensions, item.allowances);
                                }}
                             />
                          </div>
                       </div>
                    </div>
                 )}
               </div>
            </div>
            {/* Step 2: Shape Selection */}
           {(item.material || step >= 2) && (
              <div className={`transition-all duration-500 animate-in fade-in slide-in-from-left-4 ${step > 2 ? 'opacity-80 scale-[0.99]' : ''}`}>
                 <span className="font-black text-zinc-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1" style={{ fontSize: '9px' }}>02. Select Shape <span className="text-red-500 font-extrabold">*</span></span>
                 <div className="flex gap-1.5">
                    {SHAPES.map(s => {
                       const Icon = s.icon;
                       return (
                          <button 
                            key={s.id}
                            disabled={!item.material}
                            onClick={() => onUpdate({ shape: s.id })}
                            className={`flex flex-col items-center justify-center h-14 w-18 rounded-xl border-2 transition-all ${item.shape === s.id ? 'border-brand-primary bg-brand-primary text-zinc-950 shadow-lg shadow-brand-primary/20 scale-105' : (!item.material ? 'border-zinc-100 bg-zinc-50 text-zinc-200 cursor-not-allowed opacity-50' : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-brand-primary/30 hover:bg-brand-primary/5')}`}
                          >
                             <Icon className="h-4 w-4 mb-1" />
                             <span className="font-black uppercase text-center leading-tight" style={{ fontSize: '7.5px' }}>{s.name}</span>
                          </button>
                       );
                    })}
                 </div>
              </div>
           )}
           {/* Step 3: Dimensions & Allowance */}
           {item.shape && (
              <div className={`flex-1 flex gap-4 items-center animate-in fade-in slide-in-from-left-4 ${!item.material ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="flex-1 flex flex-wrap gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                    <DimensionInput 
                      label="Length" 
                      field="l" 
                      value={item.dimensions?.l} 
                      allowance={item.allowances?.l} 
                      onChange={handleDimUpdate} 
                    />
                    
                    {item.shape === 'rect' && (
                       <>
                          <DimensionInput 
                            label="Width" 
                            field="w" 
                            value={item.dimensions?.w} 
                            allowance={item.allowances?.w} 
                            onChange={handleDimUpdate} 
                          />
                          <DimensionInput 
                            label="Thickness / Height" 
                            field="t" 
                            value={item.dimensions?.t} 
                            allowance={item.allowances?.t} 
                            onChange={handleDimUpdate} 
                          />
                       </>
                    )}
                    {item.shape === 'round' && (
                       <DimensionInput 
                         label="Diameter" 
                         field="dia" 
                         value={item.dimensions?.dia} 
                         allowance={item.allowances?.dia} 
                         onChange={handleDimUpdate} 
                       />
                    )}
                    {item.shape === 'hex' && (
                       <DimensionInput 
                         label="Across Flat" 
                         field="af" 
                         value={item.dimensions?.af} 
                         allowance={item.allowances?.af} 
                         onChange={handleDimUpdate} 
                       />
                    )}
                 </div>

                 <div className="text-right border-l border-zinc-100 pl-4 pr-2 py-1 flex flex-col justify-center min-w-[120px]">
                    <span className="font-black text-zinc-400 uppercase tracking-widest block mb-0.5" style={{ fontSize: '9px' }}>Sub-Total Cost</span>
                    <div className="font-black text-zinc-950 leading-tight" style={{ fontSize: THEME.FONT_SIZE.LARGE }}>
                       ₹{((item.material_weight || 0) * (item.material?.base_rate || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex flex-col gap-0">
                       <span className="font-bold text-zinc-500 font-mono" style={{ fontSize: '9px' }}>{(item.material_weight || 0).toFixed(2)}kg @ ₹{(item.material?.base_rate || 0).toFixed(2)}</span>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

const RawMaterial = ({
  activePhase,
  setActivePhase,
  formData,
  setFormData,
  libraries,
  panelIndex = 3
}) => {
  const [previewFile, setPreviewFile] = useState(null);
  const isExpanded = activePhase === 'material';
  const updateItem = (idx, updates) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const isComplete = formData.items.every(item => {
    return item.material && item.shape && item.material_weight > 0;
  });

  return (
    <FeaturePanel
      index={panelIndex}
      title="Material & Weight Selection"
      isExpanded={isExpanded}
      onToggle={() => setActivePhase(isExpanded ? '' : 'material')}
      countLabel={isComplete ? 'MATERIAL SETUP COMPLETE' : 'MATERIAL SETUP PENDING'}
    >
       <div className="p-2.5 bg-zinc-50/10">
          {formData.items.map((item, idx) => (
             <MaterialConfigurationRow
                key={item.id}
                item={item}
                idx={idx}
                libraries={libraries}
                onUpdate={(updates) => updateItem(idx, updates)}
                onPreviewFile={setPreviewFile}
             />
          ))}
       </div>
      <AssetPreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </FeaturePanel>
  );
};

export default RawMaterial;
