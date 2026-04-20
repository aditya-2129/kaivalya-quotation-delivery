"use client";

import React, { useState } from 'react';
import { X, Upload, FileText, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { assetService } from '@/services/assets';
import { purchaseOrderService } from '@/services/purchase-orders';
import { approvedQuotationService } from '@/services/quotations-approved';
import { THEME } from '@/constants/ui';

const LogPoModal = ({ isOpen, onClose, quotation, onSuccess }) => {
  const [formData, setFormData] = useState({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    actualValuation: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when quotation changes or modal opens
  React.useEffect(() => {
    if (isOpen && quotation) {
      setFormData({
        poNumber: '',
        poDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        actualValuation: quotation.total_amount || 0
      });
      setFile(null);
    }
  }, [isOpen, quotation]);

  if (!isOpen || !quotation) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        e.target.value = ''; // Clear input
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Fallback manual validation (though browser validation should catch it first)
    if (!formData.poNumber) return;
    if (!formData.actualValuation || parseFloat(formData.actualValuation) <= 0) {
      toast.error("Please enter a valid Actual Agreed Valuation");
      return;
    }
    if (!file) {
      toast.error("Please upload the PO scan document");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading("Processing Purchase Order...");

      // 1. Upload PO Scan if provided
      let fileId = null;
      if (file) {
        const uploadResponse = await assetService.uploadFile(file);
        fileId = uploadResponse.$id;
      }

      // 2. Create Order Record
      const orderData = {
        po_number: formData.poNumber,
        po_date: formData.poDate,
        quotation_id: quotation.$id,
        quotation_no: quotation.quotation_no || "N/A",
        customer_name: quotation.supplier_name || quotation.customer_name || "Unknown Customer",
        project_name: quotation.project_name || "Unnamed Project",
        total_amount: parseFloat(quotation.total_amount || 0),
        actual_valuation: parseFloat(formData.actualValuation || 0),
        status: 'Received',
        po_file_id: fileId,
        engineer_name: quotation.quoting_engineer || "Unassigned",
        items: quotation.items ? JSON.stringify(quotation.items) : "[]",
        delivery_date: formData.deliveryDate || null
      };

      let createdOrder;
      try {
        createdOrder = await purchaseOrderService.createOrder(orderData);
      } catch (appwriteError) {
        console.error("Appwrite PO Creation Detailed Error:", appwriteError);
        throw new Error(appwriteError.message || "Appwrite rejected the document structure");
      }

      // 3. Update Quotation Status — rollback PO if this fails
      try {
        await approvedQuotationService.updateStatus(quotation.$id, 'Converted to PO');
      } catch (qUpdateError) {
        console.error("Quotation status update failed, rolling back PO:", qUpdateError);
        await purchaseOrderService.deleteOrder(createdOrder.$id).catch(() => {});
        throw new Error("Failed to update quotation status. Purchase Order has been rolled back.");
      }

      toast.dismiss();
      toast.success("Purchase Order logged successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to log Purchase Order: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <header className="px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-white text-[13px] font-black uppercase tracking-[0.2em]">Log Purchase Order</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Converting {quotation.quotation_no}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Form Fields */}
          <div className="space-y-3">
            {/* Grid for Number & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="group flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Customer PO Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="text"
                    required
                    placeholder="PO/2024/..."
                    value={formData.poNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 bg-zinc-50/30 text-[12px] font-bold focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="group flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  PO Received Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="date"
                    required
                    value={formData.poDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, poDate: e.target.value }))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 bg-zinc-50/30 text-[12px] font-bold focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-start">
              <div className="group flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Actual Agreed Valuation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-zinc-400 font-bold text-[11px]">₹</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.actualValuation}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualValuation: e.target.value }))}
                    className="w-full h-10 pl-7 pr-4 rounded-xl border border-zinc-200 bg-zinc-50/30 text-[12px] font-black focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
                <p className="px-1 text-[8px] text-zinc-400 font-medium italic">Quoted: ₹{parseFloat(quotation.total_amount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="group flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Expected Delivery (Opt)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 bg-zinc-50/30 text-[12px] font-bold focus:border-emerald-500 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                Upload PO Scan <span className="text-rose-500">*</span>
              </label>
              <div className={`relative group border-2 border-dashed rounded-2xl transition-all ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-zinc-200 bg-zinc-50/30 hover:border-zinc-300'}`}>
                <input 
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="p-4 flex flex-col items-center justify-center gap-1.5">
                  {file ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-emerald-700 truncate max-w-[180px]">{file.name}</p>
                        <p className="text-[9px] text-emerald-600/60 font-medium">Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-zinc-500">Click to upload PO</p>
                        <p className="text-[9px] text-zinc-400 font-medium">PDF, JPG (Max 10MB)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Summary Card */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-2">
             <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-400 tracking-tighter">
                <span>Quotation Details</span>
                <span className="text-zinc-300"># {quotation.$id.substring(0,8)}</span>
             </div>
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-[12px] font-black text-zinc-800">{quotation.supplier_name}</span>
                   <span className="text-[10px] font-bold text-zinc-500 truncate max-w-[150px]">{quotation.project_name}</span>
                </div>
                <div className="text-right">
                   <span className="text-[8px] font-black text-zinc-400 uppercase block mb-0.5 leading-none">Total Value</span>
                   <span className="text-[13px] font-mono font-black text-zinc-900 leading-none">₹{parseFloat(quotation.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl border border-zinc-200 text-[12px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-10 rounded-xl bg-emerald-600 text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                'Finalize Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogPoModal;
