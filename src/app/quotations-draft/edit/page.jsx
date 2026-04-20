"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { quotationService } from '@/services/quotations-draft';
import { customerService } from '@/services/customers';
import { materialService } from '@/services/materials';
import { laborRateService, bopRateService } from '@/services/rates';
import { userService } from '@/services/users';
import { CustomerModal } from '@/features/customers/components/CustomerModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import ValidationModal from '@/components/modals/ValidationModal';
import { calculateQuotationTotals } from '@/features/quotations/utils/calculations';
import ScopeAndIdentity from '@/features/quotations/components/ScopeAndIdentity';
import BOMRegistry from '@/features/quotations/components/BOMRegistry';
import RawMaterial from '@/features/quotations/components/RawMaterial';
import MachiningLogic from '@/features/quotations/components/MachiningLogic';
import BroughtOutParts from '@/features/quotations/components/BroughtOutParts';
import CommercialAdjustments from '@/features/quotations/components/CommercialAdjustments';
import ValuationLedger from '@/features/quotations/components/ValuationLedger';
import SuccessModal from '@/components/modals/SuccessModal';
import RejectionModal from '@/components/modals/RejectionModal';
import { useAuth } from '@/context/AuthContext';
import { generateQuotationPDF } from '@/utils/generateQuotationPDF';
import { generateMaterialListPDF } from '@/utils/generateMaterialListPDF';
import { generateSinglePagePDF } from '@/utils/generateSinglePagePDF';
import { generateProcessSheetPDF } from '@/utils/generateProcessSheetPDF';
import { generateBOPListPDF } from '@/utils/generateBOPListPDF';
import { assetService } from '@/services/assets';
import DownloadOptionsModal from '@/components/modals/DownloadOptionsModal';
import { toast } from 'react-hot-toast';

const nextRevision = (rev) => {
  const match = (rev || "").match(/Rev (\d+)/i);
  const num = match ? parseInt(match[1]) + 1 : 1;
  return `Rev ${num}`;
};

function EditQuotationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const { isAdmin } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isDraftConfirmOpen, setIsDraftConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastQuotationRef, setLastQuotationRef] = useState('');
  const [savedQuotationData, setSavedQuotationData] = useState(null);
  const [downloadModal, setDownloadModal] = useState({ open: false, quotation: null });
  const [errorDetails, setErrorDetails] = useState({ open: false, message: '' });
  const [missingFields, setMissingFields] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePhase, setActivePhase] = useState('scope');
  const [customerSearch, setCustomerSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    quotation_no: '', 
    supplier_name: '', 
    customer: null,
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    quoting_engineer: '',
    revision_no: 'Rev 1',
    inquiry_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    status: 'Draft',
    project_name: '',
    rejection_reason: '',
    markup: 15,
    packaging_cost: 0,
    transportation_cost: 0,
    design_cost: 0,
    assembly_cost: 0,
    production_mode: 'Batch',
    quantity: 1,
    project_image: null,
    inquiry_files: [],
    bought_out_items: [],
    items: [] 
  });

  const [libraries, setLibraries] = useState({
    customers: [],
    materials: [],
    labor: [],
    bop: [],
    users: []
  });

  useEffect(() => {
    setMounted(true);
    
    const initializePage = async () => {
      if (!id) {
         router.push('/quotations-draft');
         return;
      }

      try {
        setIsLoading(true);
        
        // 1. Fetch Master Data
        const [c, m, l, b, u] = await Promise.all([
          customerService.listCustomers(100),
          materialService.listMaterials(100),
          laborRateService.listRates(100),
          bopRateService.listRates(100),
          userService.listUsers(100)
        ]);
        
        const libs = {
          customers: c.documents,
          materials: m.documents,
          labor: l.documents,
          bop: b.documents,
          users: u.documents
        };
        setLibraries(libs);

        // 2. Fetch Existing Quotation
        const quote = await quotationService.getQuotation(id);
        
        // 3. Map result to formData
        let parsedItems = [];
        try {
           parsedItems = JSON.parse(quote.items || '[]');
        } catch (e) {
           console.error("Failed to parse items:", e);
        }

        // Migration logic for BOP
        let consolidatedBOP = [];
        try {
           const breakdown = JSON.parse(quote.detailed_breakdown || '{}');
           if (breakdown.bought_out_items) {
              consolidatedBOP = breakdown.bought_out_items;
           }
        } catch (e) {
           console.warn("BOP Migration failed:", e);
        }

        const sanitizedItems = (parsedItems.length > 0 ? parsedItems : [{
           id: Date.now(),
           part_name: 'Part 01',
           qty: 1,
           processes: [],
           treatments: [],
           design_files: [],
           part_image: null,
           material: null,
           material_weight: 0
        }]).map(item => {
           if (item.part_image && item.part_image.localPreview) {
              delete item.part_image.localPreview;
           }
           return {
             ...item,
             processes: item.processes || [],
             treatments: item.treatments || [],
             bought_out_items: [], 
             design_files: item.design_files || [],
             inspection: item.inspection || { cmm: false, mtc: false, cmm_cost: 0, mtc_cost: 0 }
           };
        });
        
        const mappedCustomer = libs.customers.find(cust => cust.$id === quote.customer_id) || null;

        setFormData({
          quotation_no: quote.quotation_no || '',
          supplier_name: quote.supplier_name || '',
          customer: mappedCustomer,
          contact_person: quote.contact_person || '',
          contact_phone: quote.contact_phone || '',
          contact_email: quote.contact_email || '',
          quoting_engineer: quote.quoting_engineer || '',
          quoting_engineer_details: libs.users.find(u => u.name === quote.quoting_engineer) ? {
             name: libs.users.find(u => u.name === quote.quoting_engineer).name,
             email: libs.users.find(u => u.name === quote.quoting_engineer).email,
             mobile: libs.users.find(u => u.name === quote.quoting_engineer).mobile
          } : null,
          revision_no: quote.status === 'Completed' ? nextRevision(quote.revision_no) : (quote.revision_no || 'Rev 1'),
          inquiry_date: quote.inquiry_date || '',
          delivery_date: quote.delivery_date || '',
          status: quote.status || 'Draft',
          rejection_reason: quote.rejection_reason || '',
          markup: (quote.markup !== undefined && quote.markup !== null) ? quote.markup : 15,
          packaging_cost: quote.packaging_cost || 0,
          transportation_cost: quote.transportation_cost || 0,
          design_cost: quote.design_cost || 0,
          assembly_cost: quote.assembly_cost || 0,
          production_mode: quote.production_mode || 'Batch',
          quantity: quote.quantity || 1,
          project_name: quote.project_name || '',
          project_image: quote.project_image ? (() => {
             try {
                const parsed = JSON.parse(quote.project_image);
                delete parsed.localPreview; 
                return parsed;
             } catch (e) {
                return null;
             }
          })() : null,
          bought_out_items: consolidatedBOP,
          inquiry_pdfs: (() => {
             try {
                const breakdown = JSON.parse(quote.detailed_breakdown || '{}');
                return breakdown.inquiry_pdfs || breakdown.inquiry_files || [];
             } catch (e) { return []; }
          })(),
          inquiry_cad_files: (() => {
             try {
                const breakdown = JSON.parse(quote.detailed_breakdown || '{}');
                return breakdown.inquiry_cad_files || [];
             } catch (e) { return []; }
          })(),
          items: sanitizedItems
        });

        if (mappedCustomer) {
           setCustomerSearch(mappedCustomer.name);
        }

      } catch (err) {
        console.error("Initialization failed:", err);
        setErrorDetails({ open: true, message: "Critical failure loading valuation record. Check database connection." });
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [id]);

  useEffect(() => {
    if (!mounted) return;
    
    const delayDebounceFn = setTimeout(async () => {
      if (customerSearch.trim().length >= 2) {
        try {
          const res = await customerService.listCustomers(50, 0, customerSearch);
          setLibraries(prev => ({ ...prev, customers: res.documents }));
        } catch (err) {
          console.error("Search failed:", err);
        }
      } else if (customerSearch.trim().length === 0) {
        const res = await customerService.listCustomers(100);
        setLibraries(prev => ({ ...prev, customers: res.documents }));
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, mounted]);

  const activeQuote = formData.items[selectedItemIndex] || formData.items[0] || {
    id: Date.now(),
    part_name: 'Part 01',
    qty: 1,
    processes: [],
    design_files: [],
    part_image: null,
    treatments: [],
    material: null,
    material_weight: 0
  };

  const setActiveQuote = (update) => {
     setFormData(prev => {
        const newItems = [...prev.items];
        const currentItem = newItems[selectedItemIndex];
        const updatedItem = typeof update === 'function' ? update(currentItem) : update;
        newItems[selectedItemIndex] = { ...currentItem, ...updatedItem };
        return { ...prev, items: newItems };
     });
  };

  const totals = calculateQuotationTotals(formData);

  const validateForm = () => {
    const missingFields = [];
    if (!formData.customer && !formData.supplier_name) missingFields.push("Organization / Customer");
    if (!formData.project_name) missingFields.push("Project Name");
    if (!formData.contact_person) missingFields.push("Contact Person Name");
    if (!formData.contact_phone) missingFields.push("Contact Number");
    if (!formData.contact_email) missingFields.push("Contact Email");
    if (!formData.quoting_engineer) missingFields.push("Project Incharge");
    if (!formData.revision_no) missingFields.push("Quotation Version");
    if (!formData.inquiry_date) missingFields.push("Date Received");
    if (!formData.delivery_date) missingFields.push("Expected Delivery Date");
    if (!formData.quantity || formData.quantity <= 0) missingFields.push("Quantity to Make (Total)");

    if (formData.items.length === 0) {
       missingFields.push("At least one BOM item");
    } else {
       formData.items.forEach((item, idx) => {
          const partNum = idx + 1;
          const pName = item.part_name || `Part ${partNum}`;

          if (!item.part_name) missingFields.push(`${pName}: Component Name`);
          if (!item.qty || item.qty <= 0) missingFields.push(`${pName}: Manufacturing Qty`);
          
          if (!item.material) {
             missingFields.push(`${pName}: Material Selection`);
          } else {
             const isSpecialJob = item.jobType === 'rework' || item.jobType === 'labour';
             if (!isSpecialJob && (!item.material.base_rate || item.material.base_rate <= 0)) {
                missingFields.push(`${pName}: Material Base Rate`);
             }
             if (!item.material_weight || item.material_weight <= 0) {
                missingFields.push(`${pName}: Raw Material Weight Calculation (check dimensions)`);
             }
          }

          if (!item.shape) {
             missingFields.push(`${pName}: Raw Material Profile/Shape`);
          } else {
             const d = item.dimensions || {};
             if (!d.l || parseFloat(d.l) <= 0) missingFields.push(`${pName}: Length (L)`);
             
             if (item.shape === 'rect') {
                if (!d.w || parseFloat(d.w) <= 0) missingFields.push(`${pName}: Width (W)`);
                if (!d.t || parseFloat(d.t) <= 0) missingFields.push(`${pName}: Thickness (T)`);
             } else if (item.shape === 'round') {
                if (!d.dia || parseFloat(d.dia) <= 0) missingFields.push(`${pName}: Diameter (Dia)`);
             } else if (item.shape === 'hex') {
                if (!d.af || parseFloat(d.af) <= 0) missingFields.push(`${pName}: Across Flat (AF)`);
             }
          }

          if (item.processes && item.processes.length > 0) {
             item.processes.forEach((proc, pIdx) => {
                const pLabel = proc.process_name || `Operation ${pIdx + 1}`;
                if (!proc.process_name) missingFields.push(`${pName}: ${pLabel} Type`);
                if (!proc.cycle_time || proc.cycle_time <= 0) missingFields.push(`${pName}: ${pLabel} Cycle Time / Qty`);
                const rate = proc.rate || proc.hourly_rate;
                if (!rate || rate <= 0) missingFields.push(`${pName}: ${pLabel} Machine Rate`);
             });
          }
        });

        if (formData.bought_out_items && formData.bought_out_items.length > 0) {
           formData.bought_out_items.forEach((bop, bIdx) => {
              const bName = bop.item_name === 'CUSTOM' ? 'Custom Item' : (bop.item_name || `BOP ${bIdx + 1}`);
              if (!bop.item_name) missingFields.push(`BOP ${bIdx + 1}: Material Descriptor`);
              if (!bop.qty || bop.qty <= 0) missingFields.push(`BOP "${bName}": Project Volume/Quantity`);
              if (!bop.rate || bop.rate <= 0) missingFields.push(`BOP "${bName}": Procurement Rate`);
           });
        }
      }
    return missingFields;
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    const missing = validateForm();
    if (missing.length > 0) {
       setMissingFields(missing);
       setIsValidationOpen(true);
       return;
    }
    setIsUpdateConfirmOpen(true);
  };

  const handleApprove = async (e) => {
    if (e) e.preventDefault();
    const missing = validateForm();
    if (missing.length > 0) {
       setMissingFields(missing);
       setIsValidationOpen(true);
       return;
    }
    setIsApproveConfirmOpen(true);
  };

  const toTitleCase = (str) => {
     if (!str) return '';
     return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const commitUpdate = async () => {
    setIsProcessing(true);
    try {
       const { 
          quotation_no, supplier_name, project_name, contact_person, contact_phone, 
          contact_email, quoting_engineer, revision_no, inquiry_date, 
          delivery_date, markup, packaging_cost, 
          transportation_cost, design_cost, assembly_cost,
          production_mode, quantity, project_image 
       } = formData;

       const payload = {
          quotation_no,
          supplier_name: formData.customer?.name || toTitleCase(supplier_name) || 'Unknown',
          project_name: toTitleCase(project_name),
          contact_person: toTitleCase(contact_person),
          contact_phone,
          contact_email: (contact_email || "").toLowerCase().trim(),
          quoting_engineer: toTitleCase(quoting_engineer),
          revision_no,
          inquiry_date,
          delivery_date,
          status: 'Completed',
          markup,
          packaging_cost,
          transportation_cost,
          design_cost,
          assembly_cost,
          production_mode,
          project_image: project_image ? JSON.stringify(project_image) : '',
          quantity: parseInt(quantity) || 1,
          part_number: formData.items[0]?.part_name || 'MULTIPLE',
          items: JSON.stringify(formData.items.map(i => ({ 
             ...i, 
             design_files: (i.design_files || []).filter(f => f.$id), 
             part_image: i.part_image?.$id ? i.part_image : null
          }))),
          detailed_breakdown: JSON.stringify({ 
             ...totals, 
             quoting_engineer_details: formData.quoting_engineer_details,
             bought_out_items: formData.bought_out_items,
             inquiry_pdfs: formData.inquiry_pdfs || [],
             inquiry_cad_files: formData.inquiry_cad_files || []
          }),
          total_amount: totals.grandTotal,
          unit_price: totals.unitFinal,
          subtotal: totals.unitSubtotal,
          customer_id: formData.customer?.$id || ''
       };

       const response = await quotationService.updateQuotation(id, payload);
       if (formData.rejection_reason) {
          await quotationService.updateQuotation(id, { rejection_reason: null });
       }
        
       setLastQuotationRef(payload.quotation_no);
       setSavedQuotationData(response);
       setIsSuccessOpen(true);
     } catch (e) {
        console.error("Update Error:", e);
        setErrorDetails({ open: true, message: e.message || "Unknown persistence error" });
     } finally {
        setIsProcessing(false);
        setIsUpdateConfirmOpen(false);
     }
  };

  const handleDownloadPDFResult = () => {
    if (!savedQuotationData) return;
    setDownloadModal({ open: true, quotation: savedQuotationData });
  };

  const handleDownloadExecution = async (optionId) => {
    const quotation = downloadModal.quotation;
    if (!quotation) return;

    try {
      let projectImageUrl = null;
      if (quotation.project_image) {
        try {
          const rawImg = quotation.project_image;
          const parsedImage = typeof rawImg === 'string' ? JSON.parse(rawImg) : rawImg;
          if (parsedImage && parsedImage.$id) {
            projectImageUrl = assetService.getFilePreview(parsedImage.$id)?.toString();
          }
        } catch (e) {
          console.warn("Failed to parse project image for PDF:", e);
        }
      }

      setDownloadModal({ open: false, quotation: null });
      if (optionId === 'material') await generateMaterialListPDF(quotation);
      else if (optionId === 'single') await generateSinglePagePDF(quotation, projectImageUrl);
      else if (optionId === 'process') await generateProcessSheetPDF(quotation);
      else if (optionId === 'bop') await generateBOPListPDF(quotation);
      else await generateQuotationPDF(quotation, projectImageUrl);
    } catch (err) {
      toast.error("Export encountered an error. Please try again.");
    }
  };

  const handleUpdateDraft = () => setIsDraftConfirmOpen(true);

  const commitDraftUpdate = async () => {
     setIsProcessing(true);
     try {
        const { quotation_no, supplier_name, project_name, contact_person, contact_phone, 
            contact_email, quoting_engineer, revision_no, inquiry_date, 
            delivery_date, markup, packaging_cost, 
            transportation_cost, design_cost, assembly_cost,
            production_mode, quantity
         } = formData;

         const payload = {
            quotation_no,
            supplier_name: formData.customer?.name || toTitleCase(supplier_name) || 'Anonymous Draft',
            project_name: toTitleCase(project_name),
            contact_person: toTitleCase(contact_person),
            contact_phone,
            contact_email: (contact_email || "").toLowerCase().trim(),
            quoting_engineer: toTitleCase(quoting_engineer),
            revision_no,
            inquiry_date,
            delivery_date,
            status: 'Draft',
            markup,
            packaging_cost,
            transportation_cost,
            design_cost,
            assembly_cost,
            production_mode,
            quantity: parseInt(quantity) || 1,
            part_number: formData.items[0]?.part_name || 'DRAFT',
            items: JSON.stringify(formData.items.map(i => ({ 
               ...i, 
               design_files: (i.design_files || []).filter(f => f.$id),
               part_image: i.part_image?.$id ? i.part_image : null
            }))),
            detailed_breakdown: JSON.stringify({
               ...totals,
               bought_out_items: formData.bought_out_items,
               inquiry_pdfs: formData.inquiry_pdfs || [],
               inquiry_cad_files: formData.inquiry_cad_files || []
            }),
            total_amount: totals.grandTotal,
            unit_price: totals.unitFinal,
            subtotal: totals.unitSubtotal,
            customer_id: formData.customer?.$id || ''
         };

         await quotationService.updateQuotation(id, payload);
         router.push('/quotations-draft');
     } catch (e) {
        setErrorDetails({ open: true, message: e.message || "Failed to update draft in registry." });
     } finally {
        setIsProcessing(false);
        setIsDraftConfirmOpen(false);
     }
  };

  const handleCancel = (e) => {
     if (e) e.preventDefault();
     setIsCancelConfirmOpen(true);
  };

  const confirmCancel = () => router.push('/quotations-draft');

  const commitApprove = async () => {
     setIsProcessing(true);
     try {
        const { 
           quotation_no, supplier_name, project_name, contact_person, contact_phone, 
           contact_email, quoting_engineer, revision_no, inquiry_date, 
           delivery_date, markup, packaging_cost, 
           transportation_cost, design_cost, assembly_cost,
           production_mode, quantity, project_image 
        } = formData;

        const payload = {
           quotation_no,
           supplier_name: formData.customer?.name || toTitleCase(supplier_name) || 'Unknown',
           project_name: toTitleCase(project_name),
           contact_person: toTitleCase(contact_person),
           contact_phone,
           contact_email: (contact_email || "").toLowerCase().trim(),
           quoting_engineer: toTitleCase(quoting_engineer),
           revision_no,
           inquiry_date,
           delivery_date,
           status: 'Approved',
           markup,
           packaging_cost,
           transportation_cost,
           design_cost,
           assembly_cost,
           production_mode,
           project_image: project_image ? JSON.stringify(project_image) : '',
           quantity: parseInt(quantity) || 1,
           part_number: formData.items[0]?.part_name || 'MULTIPLE',
           items: JSON.stringify(formData.items.map(i => ({ 
              ...i, 
              design_files: (i.design_files || []).filter(f => f.$id),
              part_image: i.part_image?.$id ? i.part_image : null
           }))),
           detailed_breakdown: JSON.stringify({ 
              ...totals, 
              quoting_engineer_details: formData.quoting_engineer_details,
              bought_out_items: formData.bought_out_items,
              inquiry_pdfs: formData.inquiry_pdfs || [],
              inquiry_cad_files: formData.inquiry_cad_files || []
           }),
           total_amount: totals.grandTotal,
           unit_price: totals.unitFinal,
           subtotal: totals.unitSubtotal,
           customer_id: formData.customer?.$id || ''
        };

        const response = await quotationService.updateQuotation(id, payload);
        if (formData.rejection_reason) {
           await quotationService.updateQuotation(id, { rejection_reason: null });
        }
       
       setLastQuotationRef(payload.quotation_no);
       setSavedQuotationData(response);
       setIsSuccessOpen(true);
     } catch (e) {
        setErrorDetails({ open: true, message: e.message || "Failed to finalize approval." });
     } finally {
        setIsProcessing(false);
        setIsApproveConfirmOpen(false);
     }
  };

  const confirmReject = async (reason) => {
     setIsProcessing(true);
     try {
        await quotationService.updateQuotation(id, { status: 'Rejected', rejection_reason: reason });
        router.push('/quotations-draft');
     } catch (e) {
        setErrorDetails({ open: true, message: e.message || "Failed to reject quotation." });
     } finally {
        setIsProcessing(false);
        setIsRejectionModalOpen(false);
     }
  };

  const isApproved = formData.status === 'Approved';
  const isReadOnly = isApproved && !isAdmin;
  const showEditButtons = isAdmin || !isApproved;

  if (!mounted || isLoading) {
     return (
        <DashboardLayout title="Edit Quotation">
           <div className="flex h-64 items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 animate-pulse">Loading data...</span>
           </div>
        </DashboardLayout>
     );
  }

  return (
    <DashboardLayout 
      title={`Edit Quotation: ${formData.quotation_no}`}
      primaryAction={
        <div className="flex gap-4 items-center relative z-[999]">
            <button 
              type="button"
              onClick={handleCancel}
              className="px-4 h-10 flex items-center justify-center text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer pointer-events-auto"
            >
              {isReadOnly ? 'Back' : 'Cancel'}
            </button>
            {isAdmin && formData.status !== 'Approved' && formData.status !== 'Rejected' && (
                <>
                   <div className="h-6 w-px bg-zinc-200" />
                   <button 
                       type="button"
                       onClick={() => setIsRejectionModalOpen(true)}
                       disabled={formData.status === 'Draft'}
                       className={`px-6 h-10 flex items-center justify-center text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition-all border ${
                         formData.status === 'Draft' 
                         ? 'text-zinc-400 border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60' 
                         : 'text-red-600 border-red-200 hover:bg-red-50 cursor-pointer bg-white/50'
                       }`}
                       title={formData.status === 'Draft' ? "Quotation must be submitted for review before it can be rejected" : "Reject"}
                     >
                       Reject
                   </button>
                   <button 
                       type="button"
                       onClick={handleApprove}
                       disabled={formData.status === 'Draft'}
                       className={`px-6 h-10 flex items-center justify-center text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition-all border ${
                         formData.status === 'Draft' 
                         ? 'text-zinc-400 border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60' 
                         : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer bg-white/50'
                       }`}
                       title={formData.status === 'Draft' ? "Quotation must be submitted for review before approval" : "Approve"}
                     >
                       Approve
                   </button>
                </>
            )}
            
            {showEditButtons && (
                <>
                   <div className="h-6 w-px bg-zinc-200" />
                   <button 
                     type="button"
                     onClick={handleUpdateDraft}
                     className="px-6 h-10 flex items-center justify-center text-[11px] font-extrabold uppercase tracking-widest text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer pointer-events-auto"
                   >
                     Save Draft
                   </button>
                   <button 
                     type="button"
                     onClick={handleUpdate}
                     className="px-8 h-10 flex items-center justify-center rounded-xl bg-brand-primary text-zinc-950 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/25 hover:scale-[1.02] transition-all active:scale-95 border border-brand-primary/20 cursor-pointer pointer-events-auto"
                   >
                     Update & Submit
                   </button>
                </>
            )}
        </div>
      }
    >
      {formData.status === 'Rejected' && formData.rejection_reason && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 p-5 bg-red-50/80 border border-red-200/60 rounded-2xl flex items-start gap-4 shadow-sm shadow-red-100">
             <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <div>
                <h4 className="text-sm font-bold text-red-900 leading-tight">Quotation Rejected</h4>
                <p className="text-[13px] font-medium text-red-700 mt-1">{formData.rejection_reason}</p>
             </div>
          </div>
      )}

      {isReadOnly && (
          <div className="mb-6 animate-in fade-in p-5 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl flex items-center gap-4 shadow-sm shadow-emerald-100">
             <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
             </div>
             <div>
                <h4 className="text-sm font-bold text-emerald-900 leading-tight">Document Secured</h4>
                <p className="text-[13px] font-medium text-emerald-700 mt-1">This quotation is formally approved and locked from further edits by standard engineers.</p>
             </div>
          </div>
      )}

      <div className={`grid grid-cols-1 xl:grid-cols-4 gap-6 transition-all duration-300 ${isReadOnly ? 'pointer-events-none opacity-[0.85] saturate-[0.85]' : ''}`}>
         <div className="xl:col-span-3 space-y-3">
            <ScopeAndIdentity 
               formData={formData}
               setFormData={setFormData}
               activeQuote={activeQuote}
               setActiveQuote={setActiveQuote}
               libraries={libraries}
               activePhase={activePhase}
               setActivePhase={setActivePhase}
               setIsQuickAddOpen={setIsQuickAddOpen}
               customerSearch={customerSearch}
               setCustomerSearch={setCustomerSearch}
               isDropdownOpen={isDropdownOpen}
               setIsDropdownOpen={setIsDropdownOpen}
               panelIndex={1}
            />

            <BOMRegistry 
               formData={formData}
               setFormData={setFormData}
               activePhase={activePhase}
               setActivePhase={setActivePhase}
               panelIndex={2}
               onError={(msg) => setErrorDetails({ open: true, message: msg })}
            />

            <RawMaterial 
               activePhase={activePhase}
               setActivePhase={setActivePhase}
               formData={formData}
               setFormData={setFormData}
               libraries={libraries}
               panelIndex={3}
            />

            <MachiningLogic 
               activePhase={activePhase}
               setActivePhase={setActivePhase}
               formData={formData}
               setFormData={setFormData}
               libraries={libraries}
               panelIndex={4}
            />

            <BroughtOutParts
               activePhase={activePhase}
               setActivePhase={setActivePhase}
               formData={formData}
               setFormData={setFormData}
               libraries={libraries}
               panelIndex={5}
            />

             <CommercialAdjustments 
                activePhase={activePhase}
                setActivePhase={setActivePhase}
                formData={formData}
                setFormData={setFormData}
                panelIndex={6}
             />
         </div>

         <div className="xl:col-span-1">
            <ValuationLedger 
               totals={totals}
               activeQuote={activeQuote}
               setActiveQuote={setActiveQuote}
               formData={formData}
               setFormData={setFormData}
               activePhase={activePhase}
            />
         </div>
      </div>

     {isQuickAddOpen && (
        <CustomerModal 
           onClose={() => setIsQuickAddOpen(false)} 
           onSuccess={(newCustomer) => {
              setLibraries(prev => ({
                 ...prev,
                 customers: [newCustomer, ...prev.customers]
              }));
              setActiveQuote(prev => ({ ...prev, customer: newCustomer }));
              setFormData(prev => ({ 
                 ...prev, 
                 supplier_name: newCustomer.name,
                 customer: newCustomer,
                 contact_person: newCustomer.contact_person || prev.contact_person,
                 contact_phone: newCustomer.phone || prev.contact_phone,
                 contact_email: newCustomer.email || prev.contact_email
              }));
              setCustomerSearch(newCustomer.name);
              setIsQuickAddOpen(false);
           }} 
        />
     )}

     <ConfirmationModal 
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={confirmCancel}
        title="Discard Changes?"
        message="Unsaved progress will be lost. Return to the list?"
        confirmText="DISCARD"
        cancelText="CONTINUE EDITING"
        type="warning"
        isLoading={isProcessing}
     />

     <ConfirmationModal 
        isOpen={isDraftConfirmOpen}
        onClose={() => setIsDraftConfirmOpen(false)}
        onConfirm={commitDraftUpdate}
        title="Update Draft?"
        message="Persist these changes but keep the quotation in Draft status."
        confirmText="UPDATE DRAFT"
        cancelText="KEEP EDITING"
        type="brand"
        isLoading={isProcessing}
     />

     <ConfirmationModal 
        isOpen={isApproveConfirmOpen}
        onClose={() => setIsApproveConfirmOpen(false)}
        onConfirm={commitApprove}
        title="Approve Quotation?"
        message="This action will finalize the quotation and lock it from further modifications by standard engineers."
        confirmText="APPROVE QUOTATION"
        cancelText="WAIT"
        type="brand"
        isLoading={isProcessing}
     />

     <RejectionModal 
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={confirmReject}
        quotationNo={formData.quotation_no}
        isLoading={isProcessing}
     />

     <ConfirmationModal 
        isOpen={isUpdateConfirmOpen}
        onClose={() => setIsUpdateConfirmOpen(false)}
        onConfirm={commitUpdate}
        title="Commit Updates?"
        message="Apply these revisions to the master valuation record."
        confirmText="FINISH & UPDATE"
        cancelText="REVIEW EDITS"
        type="brand"
        isLoading={isProcessing}
     />

     <ValidationModal 
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        missingFields={missingFields}
     />

     <ConfirmationModal 
        isOpen={errorDetails.open}
        onClose={() => setErrorDetails({ open: false, message: '' })}
        onConfirm={() => setErrorDetails({ open: false, message: '' })}
        title="VALUATION ERROR"
        message={errorDetails.message}
        confirmText="CLOSE"
        type="brand"
     />

      <SuccessModal 
         isOpen={isSuccessOpen}
         onClose={() => router.push('/quotations-draft')}
         onDownload={handleDownloadPDFResult}
         onViewList={() => router.push('/quotations-draft')}
         quotationNo={lastQuotationRef}
         title={savedQuotationData?.status === 'Approved' ? "Quotation Approved" : "Sent for Review"}
         message={savedQuotationData?.status === 'Approved' 
           ? "The quotation has been formally approved and locked. You can now download the finalized PDF document."
           : "The quotation has been updated and re-submitted for administrative review. You can now download the updated PDF document."}
      />

      <DownloadOptionsModal 
         isOpen={downloadModal.open}
         onClose={() => setDownloadModal({ open: false, quotation: null })}
         onDownload={handleDownloadExecution}
         quotationNo={downloadModal.quotation?.quotation_no}
      />
    </DashboardLayout>
  );
}

export default function EditQuotationPage() {
   return (
      <Suspense fallback={<div>Loading editor...</div>}>
         <EditQuotationContent />
      </Suspense>
   );
}
