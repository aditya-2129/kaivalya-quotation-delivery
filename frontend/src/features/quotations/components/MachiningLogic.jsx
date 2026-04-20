'use client';

import React, { useState } from 'react';
import { THEME } from '@/constants/ui';
import { Plus, Trash2, ChevronDown, RefreshCw, Layers, FileText } from 'lucide-react';
import { assetService } from '@/services/assets';
import { FeaturePanel } from '@/components/ui/FeaturePanel';
import AssetPreviewModal from '@/components/modals/AssetPreviewModal';

const INTEGER_UNITS = ['per_hole', 'per_rim', 'per_tap', 'pcs'];

const MachiningProcessRow = ({ process, quantity, libraries, onUpdate, onRemove, item }) => {
  const rate = process.rate || process.hourly_rate || 0;
  const unit = process.unit || 'hr';
  
  let batchValue = 0;
  if (unit === 'hr') {
    const totalMinutes = parseFloat(process.setup_time || 0) + (parseFloat(process.cycle_time || 0) * quantity);
    batchValue = (totalMinutes / 60) * rate;
  } else {
    batchValue = (process.cycle_time || 0) * quantity * rate;
  }

  const isWireCut = process.process_name?.toLowerCase().includes('wire') && process.process_name?.toLowerCase().includes('cut') && unit === 'sq_cm';
  const isGrinding = process.process_name?.toLowerCase().includes('grind') && unit === 'sq_cm';

  return (
    <tr className="group hover:bg-zinc-50/50 transition-colors border-b border-zinc-100 last:border-0">
      <td className="px-3 pt-3 pb-6 align-top">
        <div className="flex items-center gap-1">
          <select 
            className="h-8 flex-1 px-4 rounded-lg bg-zinc-50 border border-zinc-200 font-black outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary transition-all"
            style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
            value={process.process_name || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onUpdate({ 
                  process_name: "", 
                  rate: 0,
                  unit: 'hr',
                  cycle_time: 0,
                  setup_time: 0,
                  dim1: 0,
                  dim2: 0
                });
                return;
              }
              const ref = libraries.labor.find(l => l.process_name === val);
              onUpdate({ 
                process_name: val, 
                rate: ref?.rate || ref?.hourly_rate || 0,
                unit: ref?.unit || 'hr'
              });
            }}
          >
            <option value="">Select Machine/Step...</option>
            {libraries.labor.map(l => <option key={l.$id} value={l.process_name}>{l.process_name} ({l.unit || 'hr'})</option>)}
          </select>
          {(isWireCut || isGrinding) && (
            <button 
              title={!process.process_name ? "Select machine first" : "Sync dimensions from Raw Material"}
              disabled={!process.process_name}
              onClick={() => {
                const shape = item?.shape;
                const d = item?.dimensions || {};
                let d1 = 0;
                let d2 = 0;
                let area = 0;

                if (isWireCut) {
                  d2 = parseFloat(d.t || d.l || 0); 
                  if (shape === 'rect') d1 = 2 * (parseFloat(d.l || 0) + parseFloat(d.w || 0));
                  else if (shape === 'round') d1 = Math.PI * parseFloat(d.dia || 0);
                  else if (shape === 'hex') d1 = 6 * (parseFloat(d.af || 0) / Math.sqrt(3));
                  area = (d1 * d2) / 100;
                } else if (isGrinding) {
                  if (shape === 'rect') {
                    d1 = parseFloat(d.l || 0);
                    d2 = parseFloat(d.w || 0);
                    area = (d1 * d2) / 100;
                  } else if (shape === 'round') {
                    d1 = parseFloat(d.dia || 0);
                    d2 = parseFloat(d.l || 0);
                    area = (Math.PI * d1 * d2) / 100;
                  }
                }
                
                onUpdate({ 
                  dim1: d1.toFixed(2), 
                  dim2: d2.toFixed(2), 
                  cycle_time: area 
                });
              }}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors ${!process.process_name ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-3 pt-3 pb-6 text-center align-top">
        {(isWireCut || isGrinding) ? (
          <div className="flex items-center gap-1 justify-center">
            <div className="relative group/dim1">
              <input 
                type="number" 
                step="1"
                min="0"
                disabled={!process.process_name}
                placeholder={isWireCut ? "P" : (item?.shape === 'round' ? "D" : "L")}
                className={`h-8 w-20 px-3 rounded-lg border text-center outline-none font-mono font-black placeholder:text-zinc-300 transition-all ${!process.process_name ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed' : 'bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-1 focus:ring-brand-primary'}`}
                style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
                value={process.dim1 ?? ""}
                onChange={(e) => {
                  const d1 = Math.max(0, Math.round(parseFloat(e.target.value) || 0));
                  const d2 = parseFloat(process.dim2) || 0;
                  const area = isWireCut ? (d1 * d2) / 100 : (item?.shape === 'round' ? (Math.PI * d1 * d2) / 100 : (d1 * d2) / 100);
                  onUpdate({ dim1: d1, cycle_time: area });
                }}
              />
              <span className="absolute -bottom-4 left-0 right-0 font-bold uppercase tracking-tighter transition-opacity whitespace-nowrap text-zinc-500" style={{ fontSize: '9px' }}>
                {isWireCut ? 'PERIM' : (item?.shape === 'round' ? 'DIA' : 'LENGTH')}
              </span>
            </div>
            <span className="text-zinc-300 font-black" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>×</span>
            <div className="relative group/dim2">
              <input 
                type="number" 
                step="1"
                min="0"
                disabled={!process.process_name}
                placeholder={isWireCut ? "H" : (item?.shape === 'round' ? "L" : "W")}
                className={`h-8 w-20 px-3 rounded-lg border text-center outline-none font-mono font-black placeholder:text-zinc-300 transition-all ${!process.process_name ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed' : 'bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-1 focus:ring-brand-primary'}`}
                style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
                value={process.dim2 ?? ""}
                onChange={(e) => {
                  const d2 = Math.max(0, Math.round(parseFloat(e.target.value) || 0));
                  const d1 = parseFloat(process.dim1) || 0;
                  const area = isWireCut ? (d1 * d2) / 100 : (item?.shape === 'round' ? (Math.PI * d1 * d2) / 100 : (d1 * d2) / 100);
                  onUpdate({ dim2: d2, cycle_time: area });
                }}
              />
              <span className="absolute -bottom-4 left-0 right-0 font-bold uppercase tracking-tighter transition-opacity whitespace-nowrap text-zinc-500" style={{ fontSize: '9px' }}>
                {isWireCut ? 'HEIGHT' : (item?.shape === 'round' ? 'LENGTH' : 'WIDTH')}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative group/input">
            <input 
              type="number" 
              step="1"
              min="0"
              disabled={!process.process_name}
              className={`h-8 w-24 px-3 rounded-lg border text-center outline-none font-mono font-black transition-all ${!process.process_name ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed' : 'bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-1 focus:ring-brand-primary'}`}
              style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
              value={process.cycle_time ?? 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdate({ cycle_time: Math.max(0, Math.round(val)) });
              }}
            />
            <span className="absolute -bottom-4 left-0 right-0 font-bold uppercase tracking-tighter transition-opacity whitespace-nowrap text-zinc-500" style={{ fontSize: '9px' }}>
              {unit === 'hr' ? 'MINS/PART' : unit.toUpperCase()}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 pt-3 pb-6 text-center align-top">
        {unit === 'hr' ? (
          <div className="relative group/setup">
            <input 
              type="number" 
              step="1"
              min="0"
              disabled={!process.process_name}
              className={`h-8 w-22 px-3 rounded-lg border text-center outline-none font-mono font-black transition-all ${!process.process_name ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed' : 'bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-1 focus:ring-brand-primary'}`}
              style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
              value={process.setup_time ?? 0}
              onChange={(e) => onUpdate({ setup_time: Math.max(0, Math.round(parseFloat(e.target.value) || 0)) })}
            />
            <span className="absolute -bottom-4 left-0 right-0 font-bold uppercase tracking-tighter text-zinc-500" style={{ fontSize: '9px' }}>SETUP MINS</span>
          </div>
        ) : (
          <span className="font-bold italic text-zinc-300" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>N/A</span>
        )}
      </td>
      <td className="px-3 pt-3 pb-6 text-center align-top">
        <div className="relative group/rate inline-block">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>₹</span>
          <input 
            type="number" 
            step="1"
            min="0"
            disabled={!process.process_name}
            className={`h-8 w-26 pl-5 pr-2 rounded-lg border text-center outline-none font-mono font-black transition-all ${!process.process_name ? 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed' : 'bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-1 focus:ring-brand-primary'}`}
            style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
            value={rate}
            onChange={(e) => onUpdate({ rate: Math.max(0, Math.round(parseFloat(e.target.value) || 0)) })}
          />
          <span className="absolute -bottom-4 right-0 font-bold uppercase tracking-tighter transition-opacity whitespace-nowrap text-zinc-500" style={{ fontSize: '9px' }}>
            RATE / {unit.toUpperCase()}
          </span>
        </div>
      </td>
      <td className="px-4 pt-3 pb-6 text-right align-top">
        <div className="font-black text-zinc-950 font-mono italic leading-tight" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
          ₹{batchValue.toFixed(2)}
        </div>
        {quantity > 1 && (
          <div className="font-bold uppercase tracking-tighter text-zinc-400" style={{ fontSize: '9px' }}>
            ₹{(batchValue / quantity).toFixed(2)} / UNIT
          </div>
        )}
      </td>
      <td className="px-2 pt-3 pb-6 text-center align-top">
        <button onClick={onRemove} className="h-7 w-7 text-zinc-200 hover:text-red-500 transition-colors rounded hover:bg-red-50 flex items-center justify-center mx-auto">
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

const PartMachiningBlock = ({ item, idx, libraries, onUpdate, onPreviewFile }) => {
  const addProcess = () => {
    const newProcesses = [...(item.processes || []), { id: Date.now(), process_name: '', hourly_rate: 0, cycle_time: 0, setup_time: 0 }];
    onUpdate({ processes: newProcesses });
  };

  const removeProcess = (id) => {
    const newProcesses = item.processes.filter(p => p.id !== id);
    onUpdate({ processes: newProcesses });
  };

  const updateProcess = (id, updates) => {
    const newProcesses = item.processes.map(p => p.id === id ? { ...p, ...updates } : p);
    onUpdate({ processes: newProcesses });
  };

  return (
    <div className="mb-4 last:mb-0 border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {item.part_image ? (
            <div className="h-9 w-9 rounded border border-zinc-200 overflow-hidden bg-white shadow-sm flex-shrink-0">
               <img 
                  src={item.part_image.localPreview || (item.part_image.$id ? assetService.getFileView(item.part_image.$id)?.toString() : "")}
                  alt="Part"
                  className="h-full w-full object-cover"
               />
            </div>
          ) : (
            <div 
              className="h-9 w-9 rounded-lg bg-brand-primary text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-brand-primary/20"
              style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
            >
              {String(idx + 1).padStart(2, '0')}
            </div>
          )}
          <div>
            <h4 className="font-black text-brand-primary uppercase tracking-tight" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{item.part_name}</h4>
            {item.design_files?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
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
                      <span className={`font-bold uppercase tracking-tight truncate max-w-[100px] leading-none ${isCAD ? 'text-cyan-800' : 'text-red-800'}`} style={{ fontSize: '8px' }}>{baseName}</span>
                      <span className={`font-black uppercase opacity-50 flex-shrink-0 leading-none ${isCAD ? 'text-cyan-700' : 'text-red-700'}`} style={{ fontSize: '8px' }}>.{ext}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '9px' }}>Production Batch</span>
              <span className="font-black text-zinc-950 font-mono tracking-tighter" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{item.qty || 1} Units</span>
           </div>
           <button 
             onClick={addProcess}
             className="h-8 px-4 rounded-lg bg-brand-primary text-zinc-950 font-black uppercase tracking-tight hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/25 border border-brand-primary/20"
             style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
           >
              <Plus className="h-4 w-4" />
              ADD STEP +
           </button>
        </div>
      </div>
      
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50/30 font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 italic" style={{ fontSize: '9px' }}>
            <tr>
               <th className="px-3 py-2 whitespace-nowrap">Machine / Step Name <span className="text-red-500 font-extrabold">*</span></th>
               <th className="px-3 py-2 text-center whitespace-nowrap">Qty / Time <span className="text-red-500 font-extrabold">*</span></th>
               <th className="px-3 py-2 text-center whitespace-nowrap">Setup (if Hr)</th>
               <th className="px-3 py-2 text-center whitespace-nowrap">Unit Rate (₹) <span className="text-red-500 font-extrabold">*</span></th>
               <th className="px-3 py-2 text-right">Step Cost</th>
              <th className="px-3 py-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 font-mono">
            {(item.processes || []).length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center">
                  <span className="font-bold text-zinc-300 uppercase tracking-[0.2em] italic" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>No manufacturing steps defined</span>
                </td>
              </tr>
            ) : item.processes?.map(p => (
              <MachiningProcessRow 
                key={p.id} 
                process={p} 
                quantity={parseFloat(item.qty || 1)} 
                libraries={libraries}
                onUpdate={(updates) => updateProcess(p.id, updates)}
                onRemove={() => removeProcess(p.id)}
                item={item}
              />
            ))}
          </tbody>
          {(item.processes || []).length > 0 && (
             <tfoot>
                <tr className="bg-zinc-50/20 border-t border-zinc-100">
                    <td colSpan="4" className="px-4 py-3 font-black text-zinc-400 uppercase tracking-widest text-right" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>Manufacturing Subtotal</td>
                   <td className="px-4 py-3 text-right">
                      <span className="font-black text-zinc-950 font-mono italic" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                         ₹{(item.processes || []).reduce((acc, p) => {
                            const rate = p.rate || p.hourly_rate || 0;
                            const unit = p.unit || 'hr';
                            if (unit === 'hr') {
                              const totalMinutes = parseFloat(p.setup_time || 0) + (parseFloat(p.cycle_time || 0) * (item.qty || 1));
                              return acc + ((totalMinutes / 60) * rate);
                            }
                            return acc + ((p.cycle_time || 0) * (item.qty || 1) * rate);
                         }, 0).toFixed(2)}
                      </span>
                   </td>
                   <td></td>
                </tr>
             </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const MachiningLogic = ({
  activePhase,
  setActivePhase,
  formData,
  setFormData,
  libraries,
  panelIndex = 4
}) => {
  const [previewFile, setPreviewFile] = useState(null);
  const isExpanded = activePhase === 'machining';

  const updateItem = (idx, updates) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const isComplete = formData.items.every(item => 
    (item.processes || []).length > 0 && 
    item.processes.every(p => 
       p.process_name && 
       p.process_name.trim() !== '' && 
       (parseFloat(p.cycle_time) > 0) &&
       (parseFloat(p.rate || p.hourly_rate) > 0)
    )
  );

  return (
    <FeaturePanel
      index={panelIndex}
      title="Manufacturing Steps"
      isExpanded={isExpanded}
      onToggle={() => setActivePhase(isExpanded ? '' : 'machining')}
      countLabel={isComplete ? 'MACHINING CONFIG COMPLETE' : 'MACHINING STEPS PENDING'}
    >
       <div className="p-2.5 bg-zinc-50/10">
          {formData.items.map((item, idx) => (
             <PartMachiningBlock
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

export default MachiningLogic;
