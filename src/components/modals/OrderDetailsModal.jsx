"use client";

import React, { useState } from 'react';
import { X, Package, AlertCircle, Calendar, Hash, User, IndianRupee, FileText, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { storage } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import QuotationPreviewModal from '@/components/modals/QuotationPreviewModal';

const COLOR_MAP = {
  zinc:    { wrap: 'bg-zinc-50/50 border-zinc-100',              icon: 'bg-zinc-100 text-zinc-600' },
  blue:    { wrap: 'bg-blue-50/50 border-blue-100',              icon: 'bg-blue-100 text-blue-600' },
  purple:  { wrap: 'bg-purple-50/50 border-purple-100',          icon: 'bg-purple-100 text-purple-600' },
  emerald: { wrap: 'bg-emerald-50/50 border-emerald-100',        icon: 'bg-emerald-100 text-emerald-600' },
  primary: { wrap: 'bg-brand-primary/5 border-brand-primary/20', icon: 'bg-brand-primary/10 text-brand-primary' },
};

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const [showQuotation, setShowQuotation] = useState(false);
  if (!isOpen || !order) return null;

  // Defensive parsing of items snapshot
  let items = [];
  try {
    if (order.items) {
      const parsed = JSON.parse(order.items);
      items = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Failed to parse items snapshot:", e);
    items = [];
  }

  // Generate URL for PO Scanned File if it exists
  const getPoFileUrl = () => {
    if (!order.po_file_id) return null;
    return storage.getFileView(
      APPWRITE_CONFIG.BUCKETS.INQUIRY_FILES,
      order.po_file_id
    );
  };

  const poScanUrl = getPoFileUrl();

  const InfoCard = ({ icon: Icon, label, value, subValue, color = "zinc" }) => {
    const c = COLOR_MAP[color] || COLOR_MAP.zinc;
    return (
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${c.wrap}`}>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">{label}</p>
          <p className="mt-1 text-[13px] font-bold text-zinc-900 leading-none">{value}</p>
          {subValue && <p className="mt-1 text-[10px] font-medium text-zinc-500 leading-none">{subValue}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-zinc-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[14px] font-black uppercase tracking-tight text-zinc-950 leading-none">Purchase Order Details</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{order.po_number}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{order.customer_name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {order.quotation_id && (
              <button
                onClick={() => setShowQuotation(true)}
                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-brand-primary hover:border-brand-primary/30 transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm group"
              >
                <Eye className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary" />
                View Quotation
              </button>
            )}
            {poScanUrl && (
              <a
                href={poScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-brand-primary hover:border-brand-primary/30 transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm group"
              >
                <FileText className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary" />
                View PO
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            )}
            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InfoCard icon={Hash} label="PO Reference" value={order.po_number} subValue={`QTN: ${order.quotation_no}`} color="primary" />
            <InfoCard icon={Calendar} label="Issue Date" value={order.po_date ? format(new Date(order.po_date), 'dd MMM yyyy') : '—'} color="blue" />
            <InfoCard icon={User} label="Lead Engineer" value={order.engineer_name || 'Unassigned'} color="purple" />
            <InfoCard 
              icon={IndianRupee} 
              label="Agreed Valuation" 
              value={`₹${parseFloat(order.actual_valuation || order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
              subValue={order.actual_valuation && Math.abs(order.actual_valuation - order.total_amount) > 0.01 ? `Quoted: ₹${parseFloat(order.total_amount || 0).toLocaleString('en-IN')}` : null}
              color="emerald" 
            />
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(94,192,194,0.6)]" />
                Items Snapshot
              </h4>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{items.length} Position{items.length !== 1 ? 's' : ''}</span>
            </div>
            
            {items.length > 0 ? (
              <div className="rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-widest">Description / Part Name</th>
                      <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-widest text-center">Qty</th>
                      <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-widest text-right">Unit Rate</th>
                      <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-widest text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 bg-white">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-zinc-800">
                          <div className="flex flex-col">
                            <span>{item.part_name || `Item ${idx+1}`}</span>
                            {item.material && <span className="text-[10px] text-zinc-400 font-medium italic">{item.material.name}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-zinc-500">{item.qty || 1}</td>
                        <td className="px-6 py-4 text-right font-mono text-zinc-500">₹{parseFloat(item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-mono font-black text-zinc-900">₹{(parseFloat(item.unit_price || 0) * (item.qty || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50/50">
                    <tr>
                      <td className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {order.actual_valuation && Math.abs(order.actual_valuation - order.total_amount) > 0.01 ? 'Final Agreed Sum' : 'Total Order Sum'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 text-[14px]">
                        ₹{parseFloat(order.actual_valuation || order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 bg-zinc-50/50 rounded-3xl border border-zinc-100 border-dashed text-zinc-400">
                <AlertCircle className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-[11px] font-black uppercase tracking-widest italic">No item data captured for this record</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-zinc-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-8 h-12 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-zinc-200"
          >
            Close Viewer
          </button>
        </div>
      </div>

      <QuotationPreviewModal
        isOpen={showQuotation}
        onClose={() => setShowQuotation(false)}
        quotationId={order.quotation_id}
      />
    </div>
  );
};

export default OrderDetailsModal;
