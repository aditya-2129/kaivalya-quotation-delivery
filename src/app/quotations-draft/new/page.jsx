"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { quotationService } from '@/services/quotations-draft';
import { customerService } from '@/services/customers';
import { materialService } from '@/services/materials';
import { laborRateService, bopRateService } from '@/services/rates';
import { userService } from '@/services/users';
import { useRouter } from 'next/navigation';
import { CustomerModal } from '@/features/customers/components/CustomerModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import ValidationModal from '@/components/modals/ValidationModal';
import ScopeAndIdentity from '@/features/quotations/components/ScopeAndIdentity';
import BOMRegistry from '@/features/quotations/components/BOMRegistry';
import RawMaterial from '@/features/quotations/components/RawMaterial';
import MachiningLogic from '@/features/quotations/components/MachiningLogic';
import BroughtOutParts from '@/features/quotations/components/BroughtOutParts';
import CommercialAdjustments from '@/features/quotations/components/CommercialAdjustments';
import ValuationLedger from '@/features/quotations/components/ValuationLedger';
import SuccessModal from '@/components/modals/SuccessModal';
import { generateQuotationPDF } from '@/utils/generateQuotationPDF';
import { generateMaterialListPDF } from '@/utils/generateMaterialListPDF';
import { generateSinglePagePDF } from '@/utils/generateSinglePagePDF';
import { generateProcessSheetPDF } from '@/utils/generateProcessSheetPDF';
import { generateBOPListPDF } from '@/utils/generateBOPListPDF';
import { assetService } from '@/services/assets';
import DownloadOptionsModal from '@/components/modals/DownloadOptionsModal';
import { toast } from 'react-hot-toast';
import { calculateQuotationTotals } from '@/features/quotations/utils/calculations';

export default function NewQuotationPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isDraftConfirmOpen, setIsDraftConfirmOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastQuotationRef, setLastQuotationRef] = useState('');
  const [savedQuotationData, setSavedQuotationData] = useState(null);
  const [downloadModal, setDownloadModal] = useState({ open: false, quotation: null });
  const [errorDetails, setErrorDetails] = useState({ open: false, message: '' });
  const [missingFields, setMissingFields] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    quotation_no: '', 
    supplier_name: '', 
    customer: null, // Project-wide customer
    project_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    quoting_engineer: '',
    revision_no: 'Rev 1',
    inquiry_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    status: 'Draft',
    markup: 15,
    packaging_cost: 0,
    transportation_cost: 0,
    design_cost: 0,
    assembly_cost: 0,
    production_mode: 'Batch',
    quantity: 1,
    bought_out_items: [],
    project_image: null,
    inquiry_pdfs: [],
    inquiry_cad_files: [],
    items: [
      {
        id: Date.now(),
        part_name: 'Part 01',
        qty: 1,
        processes: [],
        design_files: [],
        part_image: null,
        treatments: [],
        material: null,
        material_weight: 0
      }
    ] 
  });

  // Master Data for Selects
  const [libraries, setLibraries] = useState({
    customers: [],
    materials: [],
    labor: [],
    bop: [],
    users: []
  });

  const [activePhase, setActivePhase] = useState('scope'); // scope, material, machining

  const [customerSearch, setCustomerSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Persistence Layer: Load Draft
  useEffect(() => {
    setMounted(true);
    const savedFormData = localStorage.getItem('draft_formData');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // Persistence Layer: Save changes
  useEffect(() => {
     if (!isLoading) {
        localStorage.setItem('draft_formData', JSON.stringify({
           ...formData,
            items: formData.items.map(item => ({ 
               ...item, 
               design_files: (item.design_files || []).filter(f => f.$id), // Only persist uploaded assets
               part_image: item.part_image?.$id ? item.part_image : null
            })) 
         }));
     }
  }, [formData, isLoading]);

  // Derived Active Item
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

  useEffect(() => {
    // Generate sequential ID only if not restored from draft
    const initSequence = async () => {
      const savedFormData = localStorage.getItem('draft_formData');
      if (savedFormData) {
         const parsed = JSON.parse(savedFormData);
         if (parsed.quotation_no) return; // Already have an ID
      }
      try {
        const nextId = await quotationService.generateNextQuotationID();
        setFormData(prev => ({ ...prev, quotation_no: nextId }));
      } catch (err) {
        console.error("ID Generation failed:", err);
      }
    };
    initSequence();

    const fetchMasterData = async () => {
      try {
        setIsLoading(true);
        const [c, m, l, b, u] = await Promise.all([
          customerService.listCustomers(100),
          materialService.listMaterials(100),
          laborRateService.listRates(100),
          bopRateService.listRates(100),
          userService.listUsers(100)
        ]);
        setLibraries({
          customers: c.documents,
          materials: m.documents,
          labor: l.documents,
          bop: b.documents,
          users: u.documents
        });
      } catch (err) {
        console.error("Master data fetch failed:", err);
        setErrorDetails({ open: true, message: "Network instability detected. Master data failed to load." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  // Server-side Customer Search (handles large datasets)
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
        // Restore initial list
        const res = await customerService.listCustomers(100);
        setLibraries(prev => ({ ...prev, customers: res.documents }));
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, mounted]);

  // Calculation Logic (Consolidated Ledger)
  if (!mounted) {
     return (
        <DashboardLayout title="Create Your Quotation">
           <div className="flex h-64 items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 animate-pulse">Setting up your workspace...</span>
           </div>
        </DashboardLayout>
     );
  }

  const totals = calculateQuotationTotals(formData);


  const handleSave = async (e) => {
      if (e) e.preventDefault();
      // Validation Logic
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
            
            // Raw Material Validation
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
               // Dimension Validation based on shape
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

            // Machining Validation
            if (item.processes && item.processes.length > 0) {
               item.processes.forEach((proc, pIdx) => {
                  const pLabel = proc.process_name || `Operation ${pIdx + 1}`;
                  if (!proc.process_name) missingFields.push(`${pName}: ${pLabel} Type`);
                  if (!proc.cycle_time || proc.cycle_time <= 0) missingFields.push(`${pName}: ${pLabel} Cycle Time / Qty`);
                  const rate = proc.rate;
                  if (!rate || rate <= 0) missingFields.push(`${pName}: ${pLabel} Machine Rate`);
               });
            }
         });

         // BOP Validation (Consolidated Version)
         if (formData.bought_out_items && formData.bought_out_items.length > 0) {
            formData.bought_out_items.forEach((bop, bIdx) => {
               const bName = bop.item_name === 'CUSTOM' ? 'Custom Item' : (bop.item_name || `BOP ${bIdx + 1}`);
               if (!bop.item_name) missingFields.push(`BOP ${bIdx + 1}: Material Descriptor`);
               if (!bop.qty || bop.qty <= 0) missingFields.push(`BOP "${bName}": Project Volume/Quantity`);
               if (!bop.rate || bop.rate <= 0) missingFields.push(`BOP "${bName}": Procurement Rate`);
            });
         }
      }

      if (missingFields.length > 0) {
         setMissingFields(missingFields);
         setIsValidationOpen(true);
         return;
      }

      setIsSaveConfirmOpen(true);
   };

   const toTitleCase = (str) => {
      if (!str) return '';
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
   };

   const commitSave = async () => {
      setIsProcessing(true);
      try {
         // Destructure only valid schema fields from formData
         const { 
            quotation_no, supplier_name, project_name, contact_person, contact_phone, 
            contact_email, quoting_engineer, revision_no, inquiry_date, 
            delivery_date, status, markup, packaging_cost, 
            transportation_cost, design_cost, assembly_cost,
            production_mode, quantity 
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
            quantity: parseInt(quantity) || 1,
            project_image: formData.project_image ? JSON.stringify(formData.project_image) : '',
            // Required part_number for schema compatibility, mapping to first item
            part_number: formData.items[0]?.part_name || 'MULTIPLE',
            items: JSON.stringify(formData.items.map(i => ({ 
               ...i, 
               design_files: (i.design_files || []).filter(f => f.$id), // Persist only uploaded assets
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


         const response = await quotationService.createQuotation(payload);
         localStorage.removeItem('draft_formData');
         
         // Set data for success modal and PDF download
         setLastQuotationRef(payload.quotation_no);
         setSavedQuotationData(response);
         setIsSuccessOpen(true);
       } catch (e) {
          console.error("Save Error:", e);
          const isConflict = e.code === 409 || (e.message && e.message.includes("already exists"));
          
          if (isConflict) {
            // Try to auto-resolve by suggesting the next one
            try {
              const freshId = await quotationService.generateNextQuotationID();
              setErrorDetails({ 
                open: true, 
                message: `Quotation ID "${payload.quotation_no}" was just taken by another user. \n\nSuggested available ID: ${freshId}\n\nPlease update your ID and try again.` 
              });
              // We don't auto-set it to avoid confusion, but we provide the fresh one
            } catch (idErr) {
              setErrorDetails({ 
                open: true, 
                message: `Quotation ID "${payload.quotation_no}" already exists. Please manually increment it and try again.` 
              });
            }
          } else {
            setErrorDetails({ 
              open: true, 
              message: e.message || "Unknown persistence error" 
            });
          }
       } finally {
         setIsProcessing(false);
         setIsSaveConfirmOpen(false);
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
                  projectImageUrl = assetService.getFileView(parsedImage.$id)?.toString();
               }
            } catch (e) {
               console.warn("Failed to parse project image for PDF in NewPage:", e);
            }
         }
         
         setDownloadModal({ open: false, quotation: null });
         if (optionId === 'material') {
            await generateMaterialListPDF(quotation);
         } else if (optionId === 'single') {
            await generateSinglePagePDF(quotation, projectImageUrl);
         } else if (optionId === 'process') {
            await generateProcessSheetPDF(quotation);
         } else if (optionId === 'bop') {
            await generateBOPListPDF(quotation);
         } else {
            await generateQuotationPDF(quotation, projectImageUrl);
         }
      } catch (err) {
         toast.error("Export encountered an error. Please try again.");
      }
   };

   const handleSaveDraft = () => {
      // Minimal validation for draft
      if (!formData.quotation_no) {
         setErrorDetails({ open: true, message: "A Quotation Reference ID is required to save a draft." });
         return;
      }
      setIsDraftConfirmOpen(true);
   };

   const commitDraft = async () => {
      setIsProcessing(true);
      try {
         const { 
            quotation_no, supplier_name, project_name, contact_person, contact_phone, 
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
               inquiry_files: formData.inquiry_files || []
            }),
            total_amount: totals.grandTotal,
            unit_price: totals.unitFinal,
            subtotal: totals.unitSubtotal,
            customer_id: formData.customer?.$id || ''
         };

         await quotationService.createQuotation(payload);
         localStorage.removeItem('draft_formData');
         router.push('/quotations-draft');
       } catch (e) {
          console.error("Draft Error:", e);
          const isConflict = e.code === 409 || (e.message && e.message.includes("already exists"));
          setErrorDetails({ 
             open: true, 
             message: isConflict 
                ? `Quotation ID "${payload.quotation_no}" already exists. This usually happens if a draft was already saved with this ID. Try editing the existing record instead.` 
                : (e.message || "Failed to sync local draft with repository.") 
          });
       } finally {
         setIsProcessing(false);
         setIsDraftConfirmOpen(false);
      }
   };

  const handleDiscard = (e) => {
     if (e) e.preventDefault();
     setIsDiscardConfirmOpen(true);
  };

  const confirmDiscard = () => {
     localStorage.removeItem('draft_formData');
     router.push('/quotations-draft');
  };

  return (
    <DashboardLayout 
      title="Create Your Quotation"
      primaryAction={
        <div className="flex gap-4 items-center relative z-[999]">
            <button 
              type="button"
              onClick={handleDiscard}
              className="px-4 h-10 flex items-center justify-center text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer pointer-events-auto"
            >
              Cancel
            </button>
            <div className="h-6 w-px bg-zinc-200" />
            <button 
              type="button"
              onClick={handleSaveDraft}
              className="px-6 h-10 flex items-center justify-center text-[11px] font-extrabold uppercase tracking-widest text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer pointer-events-auto"
            >
              Save Draft
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="px-8 h-10 flex items-center justify-center rounded-xl bg-brand-primary text-zinc-950 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/25 hover:scale-[1.02] transition-all active:scale-95 border border-brand-primary/20 cursor-pointer pointer-events-auto"
            >
              Save & Submit
            </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
         {/* Left: Engineering Ledger */}
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

         {/* Right: Valuation Sidebar */}
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
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={confirmDiscard}
        title="Abandon Valuation?"
        message="Restore will not be possible. Unsaved data will be purged."
        confirmText="ABANDON"
        cancelText="KEEP EDITING"
        type="danger"
        isLoading={isProcessing}
     />

     <ConfirmationModal 
        isOpen={isDraftConfirmOpen}
        onClose={() => setIsDraftConfirmOpen(false)}
        onConfirm={commitDraft}
        title="Save as Draft?"
        message="This will persist your current progress to the registry as an incomplete valuation."
        confirmText="SAVE DRAFT"
        cancelText="KEEP EDITING"
        type="warning"
        isLoading={isProcessing}
     />

     <ConfirmationModal 
        isOpen={isSaveConfirmOpen}
        onClose={() => setIsSaveConfirmOpen(false)}
        onConfirm={commitSave}
        title="Commit Valuation?"
        message="Finalize and save this quotation to the master registry."
        confirmText="FINISH & SAVE"
        cancelText="REVIEW DATA"
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
        type="danger"
     />

      <SuccessModal 
        isOpen={isSuccessOpen}
        onClose={() => router.push('/quotations-draft')}
        onDownload={handleDownloadPDFResult}
        onViewList={() => router.push('/quotations-draft')}
        quotationNo={lastQuotationRef}
        title="Sent for Review"
        message="Your quotation has been successfully submitted and is now awaiting administrative approval. You can now download the PDF document."
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
