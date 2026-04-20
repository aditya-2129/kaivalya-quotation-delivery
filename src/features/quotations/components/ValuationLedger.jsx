'use client';

import React from 'react';
import { THEME } from '@/constants/ui';
import { X } from 'lucide-react';

const ValuationLedger = ({
  totals,
  formData,
  setFormData,
  activePhase,
}) => {
  const isHighlight = (label) => {
    const PHASE_NAMES = {
      scope: "Project Information",
      bom: "Parts List",
      material: "Material",
      machining: "Manufacturing",
      bop: "Purchased Items",
      commercial: ["Design & Engineering", "Logistics & Service"],
    };

    const target = PHASE_NAMES[activePhase];
    if (!target) return false;
    if (Array.isArray(target)) return target.includes(label);
    return target === label;
  };

  const LineItem = ({
    label,
    value,
    colorClass = "text-zinc-500",
    highlightColor = "text-brand-primary",
  }) => {
    const active = isHighlight(label);
    return (
      <div
        className={`flex justify-between items-center transition-all duration-300 ${active ? `${highlightColor} scale-[1.02] translate-x-1` : colorClass}`}
        style={{ fontSize: THEME.FONT_SIZE.BASE }}
      >
        <span
          className={`transition-colors font-bold ${active ? highlightColor : "text-zinc-500"}`}
        >
          {label}
        </span>
        <span
          className={`font-mono transition-all ${active ? `font-black border-b border-brand-primary` : "text-zinc-300"}`}
        >
          ₹{value.toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <div className="sticky top-24 space-y-3">
      <section className="bg-zinc-950 rounded-xl p-3.5 text-white shadow-2xl shadow-zinc-200 relative overflow-hidden border border-zinc-900">
        <div className="absolute -top-4 -right-4 opacity-5 grayscale brightness-150 pointer-events-none rotate-12">
          <img src="/KE_Logo.png" alt="" className="h-40 w-40 object-contain" />
        </div>

        <h3 className="relative z-10 font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse shadow-[0_0_8px_rgba(94,192,194,0.8)]" />
          Price Breakdown
        </h3>

        <div className="space-y-2.5 relative z-10">
          <LineItem label="Material" value={totals.materialCost} />
          <LineItem
            label="Manufacturing"
            value={totals.laborCost + (totals.treatmentCost || 0)}
          />
          <LineItem label="Purchased Items" value={totals.bopCost} />

          <div className="h-px bg-zinc-800 my-3" />

          <div className="flex justify-between items-center group/subtotal">
            <div className="flex flex-col">
              <span className="font-black text-zinc-500 uppercase tracking-widest group-hover/subtotal:text-zinc-300 transition-colors block mb-0.5" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                Unit Manufacturing Cost
              </span>
              <span className="font-bold uppercase italic text-zinc-600" style={{ fontSize: '8px' }}>
                Direct Factory Cost / Unit
              </span>
            </div>
            <span className="font-mono font-black tracking-tighter italic" style={{ fontSize: THEME.FONT_SIZE.LARGE }}>
              ₹
              {(totals.unitSubtotal || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-900 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <label className="font-black text-zinc-400 uppercase tracking-widest leading-none" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                Profit Margin %
              </label>
              <span className="font-bold uppercase mt-1 italic text-zinc-600" style={{ fontSize: '8px' }}>
                Industrial Markup
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              className="w-16 h-8.5 bg-zinc-900 border border-zinc-800 rounded-xl text-center font-black focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none text-white shadow-inner"
              style={{ fontSize: THEME.FONT_SIZE.BASE }}
              value={formData.markup ?? 0}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  markup: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div className="flex flex-col mb-6 p-3 bg-zinc-900/50 rounded-xl border border-zinc-900 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-zinc-500 uppercase tracking-[0.2em] leading-none" style={{ fontSize: '9px' }}>
                Final Unit Rate
              </span>
              <span className="font-bold text-zinc-700 uppercase tracking-widest italic" style={{ fontSize: '8px' }}>
                Per Item
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black tracking-tighter text-brand-primary leading-none" style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>
                ₹
                {(totals.unitFinal || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center my-6 relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-zinc-900 border-dashed" />
            </div>
            <div className="relative flex items-center gap-2 px-4 bg-zinc-950">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl ring-1 ring-zinc-800/50 group/qty">
                <span className="font-black text-zinc-500 uppercase tracking-widest mr-1" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                  Quantity
                </span>
                <div className="h-4 w-4 rounded-md bg-zinc-950 flex items-center justify-center">
                   <X className="h-2.5 w-2.5 text-brand-primary" strokeWidth={4} />
                </div>
                <span className="font-mono font-black text-white px-2 leading-none" style={{ fontSize: THEME.FONT_SIZE.BASE }}>
                  {formData.quantity || 1}
                </span>
                <span className="font-bold text-zinc-500 uppercase tracking-tighter" style={{ fontSize: '9px' }}>
                  Units
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-900/50">
            <div className="font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2 italic" style={{ fontSize: '9px' }}>
              <span className="h-1 w-1 bg-zinc-600 rounded-full" />
              Project Add-ons (Consolidated)
            </div>
            <LineItem
              label="Design & Engineering"
              value={totals.engineeringCost}
            />
            <LineItem
              label="Logistics & Service"
              value={totals.commercialCost}
            />
          </div>

          <div className="flex flex-col relative group/total pb-2">
            <div className="absolute -inset-4 bg-brand-primary/5 blur-3xl rounded-full opacity-0 group-hover/total:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex flex-col">
                <span className="font-black text-white uppercase tracking-[0.2em] leading-none" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                  Grand Total Price
                </span>
                <span className="font-bold uppercase mt-1.5 italic text-zinc-600" style={{ fontSize: '8px' }}>
                  Consolidated Order Value
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-mono font-black tracking-tighter text-white leading-none drop-shadow-2xl" style={{ fontSize: '36px' }}>
                ₹
                {(totals.grandTotal || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ValuationLedger;
