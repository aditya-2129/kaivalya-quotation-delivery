'use client';

import React, { useState, useEffect } from 'react';
import { THEME } from '@/constants/ui';
import { Search, UserPlus, X, ChevronDown, Calendar, Hash, Layers, Image as ImageIcon, CheckCircle2, AlertCircle, FileText, FileUp, Trash2 } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { assetService } from '@/services/assets';
import { FeaturePanel } from '@/components/ui/FeaturePanel';
import AssetPreviewModal from '@/components/modals/AssetPreviewModal';

const ScopeAndIdentity = ({ 
  formData, 
  setFormData, 
  activeQuote, 
  setActiveQuote, 
  libraries, 
  activePhase, 
  setActivePhase, 
  setIsQuickAddOpen,
  customerSearch,
  setCustomerSearch,
  isDropdownOpen,
  setIsDropdownOpen,
  panelIndex = 1
}) => {
  const { isUploading, uploadFile, uploadFiles, getPreviewUrl } = useAssets();
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [userSearch, setUserSearch] = useState(formData.quoting_engineer || "");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Sync search input with form data
  useEffect(() => {
    if (formData.quoting_engineer && userSearch !== formData.quoting_engineer) {
      setUserSearch(formData.quoting_engineer);
    }
  }, [formData.quoting_engineer]);

  const isExpanded = activePhase === 'scope';

  return (
     <FeaturePanel
      index={panelIndex}
      title="Project Information"
      isExpanded={isExpanded}
      onToggle={() => setActivePhase(isExpanded ? '' : 'scope')}
     >
       <div className="p-3 grid grid-cols-4 gap-x-4 gap-y-2.5 items-start">
          {/* Row 1: Personnel & Reach */}
          <div className="relative z-50">
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Organization / Customer
             </label>
              <div className="relative group">
                 <input 
                   type="text"
                   className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
                   style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                   placeholder="Search or Type Customer..."
                   value={customerSearch || ""}
                   onFocus={() => setIsDropdownOpen(true)}
                   onChange={(e) => {
                      const val = e.target.value;
                      setCustomerSearch(val);
                      setFormData(prev => ({ ...prev, supplier_name: val, customer: null }));
                      setIsDropdownOpen(true);
                   }}
                 />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                     {customerSearch && (
                        <button 
                          type="button"
                          onClick={() => {
                             setCustomerSearch("");
                             setFormData(prev => ({ ...prev, supplier_name: "", customer: null }));
                             setIsDropdownOpen(false);
                          }}
                          className="text-zinc-300 hover:text-zinc-500 transition-colors"
                        >
                           <X className="h-4 w-4" />
                        </button>
                     )}
                     <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
                  </div>
                {isDropdownOpen && (
                   <>
                      <div className="fixed inset-0" style={{ zIndex: THEME.Z_INDEX.DROPDOWN - 10 }} onClick={() => setIsDropdownOpen(false)} />
                      <div 
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5"
                        style={{ zIndex: THEME.Z_INDEX.DROPDOWN }}
                      >
                         <div className="sticky top-0 bg-zinc-50 p-2 px-3 border-b border-zinc-100 font-black text-zinc-400 uppercase tracking-[0.15em] flex justify-between items-center z-10" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                            <span>Available Customer Records</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                         </div>
                         <div className="divide-y divide-zinc-50">
                            {(() => {
                               const s = (customerSearch || "").toLowerCase();
                               const filtered = libraries.customers.filter(c => 
                                  (c.name || "").toLowerCase().includes(s) || 
                                  (c.contact_person || "").toLowerCase().includes(s) ||
                                  (c.email || "").toLowerCase().includes(s) ||
                                  (c.phone || "").toLowerCase().includes(s)
                               );

                               if (filtered.length === 0) {
                                  return (
                                     <div className="p-8 text-center bg-zinc-50/20">
                                        <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                           <UserPlus className="h-5 w-5 text-zinc-300" />
                                        </div>
                                        <div className="font-bold text-zinc-400 uppercase tracking-widest mb-3" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>No matching records</div>
                                        <button 
                                          onClick={() => setIsQuickAddOpen(true)}
                                          className="h-8 px-5 rounded-lg bg-brand-primary text-zinc-950 font-black uppercase transition-all shadow-lg shadow-brand-primary/25 hover:scale-105 active:scale-95"
                                          style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
                                        >
                                           + Add New Customer
                                        </button>
                                     </div>
                                  );
                               }

                               return filtered.map(c => (
                                  <button 
                                    key={c.$id}
                                    type="button"
                                    onClick={() => {
                                       setActiveQuote({...activeQuote, customer: c});
                                       setFormData(prev => ({
                                          ...prev, 
                                          supplier_name: c.name,
                                          customer: c,
                                          contact_person: c.contact_person || prev.contact_person,
                                          contact_phone: c.phone || prev.contact_phone,
                                          contact_email: c.email || prev.contact_email
                                       }));
                                       setCustomerSearch(c.name);
                                       setIsDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3.5 hover:bg-zinc-50 transition-all group/item relative overflow-hidden"
                                  >
                                     <div className="flex items-center gap-3 relative z-10">
                                        <span className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 font-black group-hover/item:bg-brand-primary group-hover/item:text-zinc-950 transition-colors shadow-sm" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{c.name.charAt(0)}</span>
                                        <div className="flex flex-col">
                                           <span className="font-bold text-zinc-900 group-hover/item:text-black transition-colors" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{c.name}</span>
                                           {c.contact_person && (
                                              <span className="font-medium text-zinc-400 group-hover/item:text-zinc-500" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Contact: {c.contact_person}</span>
                                           )}
                                        </div>
                                     </div>
                                  </button>
                               ));
                            })()}
                         </div>
                      </div>
                   </>
                )}
             </div>
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Contact Person Name
                <span className="text-red-500 font-black">*</span>
             </label>
                <input 
                  type="text"
                  required
                  className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
                  style={{ fontSize: THEME.FONT_SIZE.SMALL }}
               placeholder="Personnel Name"
               value={formData.contact_person || ""}
               onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
             />
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Contact Number
                <span className="text-red-500 font-black">*</span>
             </label>
             <input 
               type="tel"
               required
               maxLength="10"
               className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm font-mono"
               style={{ fontSize: THEME.FONT_SIZE.SMALL }}
               placeholder="10-digit number..."
               value={formData.contact_phone || ""}
               onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value.replace(/\D/g, '') }))}
             />
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Contact Email
                <span className="text-red-500 font-black">*</span>
             </label>
             <input 
               type="email"
               required
               className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
               style={{ fontSize: THEME.FONT_SIZE.SMALL }}
               placeholder="engineering@client.com"
               value={formData.contact_email || ""}
               onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
             />
          </div>

          {/* Row 2: Reference & Timeline */}
          <div>
             <label className="block font-bold text-zinc-500 uppercase tracking-[0.12em] mb-1.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>Quotation ID</label>
             <div className="h-8.5 flex items-center px-4 bg-zinc-100/30 rounded-lg text-amber-700 font-mono font-semibold border border-amber-200/50 shadow-sm-inset transition-all tracking-tight" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                {formData.quotation_no || 'GENERATING...'}
             </div>
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Quotation Version
                <span className="text-red-500 font-black">*</span>
             </label>
             <div className="h-8.5 flex items-center px-4 bg-zinc-100/50 rounded-lg text-zinc-950 font-mono font-bold border border-zinc-200/50 shadow-sm transition-all tracking-tight cursor-not-allowed" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                {formData.revision_no || 'Rev 1'}
             </div>
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Date Received
                <span className="text-red-500 font-black">*</span>
             </label>
             <input 
               type="date"
               required
               className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
               style={{ fontSize: THEME.FONT_SIZE.SMALL }}
               value={formData.inquiry_date || ""}
               onChange={(e) => setFormData(prev => ({ ...prev, inquiry_date: e.target.value }))}
             />
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Expected Delivery Date
                <span className="text-red-500 font-black">*</span>
             </label>
             <input 
               type="date"
               required
               className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
               style={{ fontSize: THEME.FONT_SIZE.SMALL }}
               value={formData.delivery_date || ""}
               onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
             />
          </div>

          {/* Row 3: Admin & Logistics */}
          <div className="relative z-40">
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Project Incharge
                <span className="text-red-500 font-black">*</span>
             </label>
             <div className="relative group">
                <input 
                   type="text"
                   required
                   placeholder="Search or Type Incharge..."
                   className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
                   style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                   value={userSearch || ""}
                   onFocus={() => setIsUserDropdownOpen(true)}
                   onChange={(e) => {
                      const val = e.target.value;
                      setUserSearch(val);
                      setFormData(prev => ({ ...prev, quoting_engineer: val }));
                      setIsUserDropdownOpen(true);
                   }}
                />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {userSearch && (
                       <button 
                         type="button"
                         onClick={() => {
                            setUserSearch("");
                            setFormData(prev => ({ ...prev, quoting_engineer: "" }));
                            setIsUserDropdownOpen(false);
                         }}
                         className="text-zinc-300 hover:text-zinc-500 transition-colors"
                       >
                          <X className="h-4 w-4" />
                       </button>
                    )}
                    <ChevronDown className="h-4 w-4 text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
                 </div>
                 {isUserDropdownOpen && (
                    <>
                       <div className="fixed inset-0" style={{ zIndex: THEME.Z_INDEX.DROPDOWN - 10 }} onClick={() => setIsUserDropdownOpen(false)} />
                       <div 
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5"
                        style={{ zIndex: THEME.Z_INDEX.DROPDOWN }}
                       >
                          <div className="sticky top-0 bg-zinc-50 p-2 px-3 border-b border-zinc-100 font-black text-zinc-400 uppercase tracking-[0.15em] flex justify-between items-center z-10" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                             <span>Authorized Personnel</span>
                             <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                          </div>
                          <div className="divide-y divide-zinc-50">
                             {(() => {
                                const s = (userSearch || "").toLowerCase();
                                const filtered = (libraries.users || []).filter(u => 
                                   (u.name || "").toLowerCase().includes(s) || 
                                   (u.role || "").toLowerCase().includes(s)
                                );

                                if (filtered.length === 0) {
                                   return (
                                      <div className="p-4 text-center bg-zinc-50/20 font-bold text-zinc-400 uppercase tracking-widest italic" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                                         No users found
                                      </div>
                                   );
                                }

                                return filtered.map(u => (
                                   <button 
                                     key={u.$id}
                                     type="button"
                                     onClick={() => {
                                        setFormData(prev => ({ 
                                           ...prev, 
                                           quoting_engineer: u.name,
                                           quoting_engineer_details: {
                                              name: u.name,
                                              email: u.email,
                                              mobile: u.mobile
                                           }
                                        }));
                                        setUserSearch(u.name);
                                        setIsUserDropdownOpen(false);
                                     }}
                                     className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-all group/user relative overflow-hidden"
                                   >
                                      <div className="flex items-center gap-3 relative z-10">
                                         <span className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 font-black group-hover/user:bg-brand-primary group-hover/user:text-zinc-950 transition-colors shadow-sm" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{u.name.charAt(0)}</span>
                                         <div className="flex flex-col">
                                            <span className="font-bold text-zinc-900 group-hover/user:text-black transition-colors" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{u.name}</span>
                                            <span className="font-medium text-zinc-400 uppercase tracking-tighter" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{u.role}</span>
                                         </div>
                                      </div>
                                   </button>
                                ));
                             })()}
                          </div>
                       </div>
                    </>
                 )}
             </div>
          </div>

          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Project Name
                <span className="text-red-500 font-black">*</span>
             </label>
             <input 
                type="text"
                required
                className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm"
                style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                placeholder="e.g. Main Conveyor Assembly"
                value={formData.project_name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
             />
          </div>

          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Quantity to Make (Total)
                <span className="text-red-500 font-black">*</span>
             </label>
             <input 
               type="number"
               required
               min="1"
               className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-mono font-semibold text-black shadow-sm"
               style={{ fontSize: THEME.FONT_SIZE.BASE }}
               value={formData.quantity ?? 1}
               onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
             />
          </div>
          <div>
             <label className="block font-bold text-zinc-950 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Type of Project
                <span className="text-red-500 font-black">*</span>
             </label>
             <div className="relative">
                <select 
                  className="w-full h-8.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all font-semibold text-black shadow-sm appearance-none cursor-pointer"
                  style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                  value={formData.production_mode || "Batch"}
                  onChange={(e) => setFormData(prev => ({ ...prev, production_mode: e.target.value }))}
                >
                   <option value="Prototype">Prototype</option>
                   <option value="Batch">Batch / Lot</option>
                   <option value="Production">Mass Production</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                   <ChevronDown className="h-3.5 w-3.5" />
                </div>
             </div>
          </div>

           {/* Combined Assets Row (Single Row for Snapshot, PDFs, and CAD) */}
           <div className="col-span-4 mt-6 pt-6 border-t border-zinc-100 grid grid-cols-12 gap-8">
              {/* Project Snapshot (image) */}
              <div className="col-span-12 lg:col-span-4">
                 <label className="block text-[9px] font-bold text-zinc-950 uppercase tracking-[0.12em] leading-none mb-3 flex items-center gap-1">
                    PROJECT MODEL / SNAPSHOT
                 </label>
                 
                 <div className="flex items-start gap-4">
                    <div className="relative group/upload h-20 w-32 flex-shrink-0">
                       {formData.project_image ? (
                          <>
                             <div className="absolute inset-0 rounded-xl border-2 border-zinc-200 bg-zinc-50 overflow-hidden shadow-sm-inset group/img">
                                <img 
                                   src={formData.project_image.localPreview || (formData.project_image.$id ? assetService.getFilePreview(formData.project_image.$id)?.toString() : "")} 
                                   alt="Project Model" 
                                   className="h-full w-full object-contain"
                                   onError={(e) => {
                                      if (e.target.src.includes('preview')) {
                                         e.target.src = formData.project_image.localPreview || assetService.getFileView(formData.project_image.$id)?.toString();
                                      }
                                   }}
                                />
                                <div className="absolute inset-0 bg-zinc-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                <button 
                                   type="button"
                                   onClick={() => setPreviewFile(formData.project_image)}
                                   className="absolute inset-0 z-20"
                                />
                             </div>
                             <button 
                               type="button"
                               onClick={() => setFormData(prev => ({ ...prev, project_image: null }))}
                               className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 shadow-lg opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-all z-30 scale-75 group-hover/upload:scale-100"
                             >
                                <Trash2 className="h-3.5 w-3.5" />
                             </button>
                          </>
                       ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2 relative rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-brand-primary/50 transition-all shadow-sm-inset">
                             {isUploadingImg && (
                                <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-xl">
                                   <div className="h-4 w-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                             )}
                             <input 
                               type="file" 
                               className="hidden" 
                               accept="image/*"
                               onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  setIsUploadingImg(true);
                                  try {
                                     const uploaded = await assetService.uploadFile(file);
                                     const localPreviewUrl = URL.createObjectURL(file);
                                     setFormData(prev => ({ ...prev, project_image: { ...uploaded, localPreview: localPreviewUrl } }));
                                  } catch (err) {
                                     alert("Image upload failed: " + err.message);
                                  } finally {
                                     setIsUploadingImg(false);
                                     if (e.target) e.target.value = null;
                                  }
                               }}
                             />
                             <div className="h-8 w-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 group-hover/upload:text-brand-primary group-hover/upload:border-brand-primary/20 transition-all shadow-sm mb-1.5">
                                <ImageIcon className="h-4 w-4" />
                             </div>
                             <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter group-hover/upload:text-brand-primary transition-colors leading-none">Snapshot</span>
                          </label>
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                       {/* <div className="flex items-center gap-2 mb-1.5">
                          <div className={`h-2 w-2 rounded-full ${formData.project_image ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-zinc-300 shadow-sm'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${formData.project_image ? 'text-emerald-600' : 'text-zinc-400'}`}>
                             {formData.project_image ? 'Registered' : 'Optional'}
                          </span>
                       </div> */}
                       <p className="text-[10px] font-semibold text-zinc-400 italic leading-snug">
                          Technical snapshot or 3D model image (if available).
                       </p>
                    </div>
                 </div>
              </div>

              {/* PDF Inquiry Files */}
              <div className="col-span-12 lg:col-span-4 lg:border-l lg:pl-6 border-zinc-100">
                 <label className="block text-[9px] font-bold text-zinc-950 uppercase tracking-[0.12em] leading-none mb-3">
                    Inquiry PDFs
                 </label>
                 <div className="flex flex-wrap gap-2.5">
                    <label className="relative group/file h-20 w-32 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 flex flex-col items-center justify-center transition-all hover:bg-white hover:border-brand-primary/50 overflow-hidden shadow-sm-inset cursor-pointer px-4 text-center shrink-0">
                       <input 
                         type="file" 
                         multiple
                         className="hidden" 
                         accept=".pdf"
                         onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            try {
                               const responses = await uploadFiles(files);
                               setFormData(prev => ({
                                  ...prev,
                                  inquiry_pdfs: [...(prev.inquiry_pdfs || []), ...responses]
                               }));
                            } catch (err) {
                               alert("PDF upload failed: " + err.message);
                            } finally {
                               if (e.target) e.target.value = null;
                            }
                         }}
                       />
                       <div className="h-6 w-6 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover/file:text-brand-primary transition-all shadow-sm mb-1">
                          <FileUp className="h-3.5 w-3.5" />
                       </div>
                       <span className="font-black text-zinc-400 uppercase tracking-tighter group-hover/file:text-brand-primary transition-colors leading-none text-[8px]">Add PDF</span>
                    </label>

                    {(formData.inquiry_pdfs || []).map((file, idx) => (
                       <div key={file.$id || idx} className="h-20 w-32 rounded-xl bg-[#F8FAFC] border border-zinc-200/60 p-3 flex flex-col items-center justify-center group relative shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all shrink-0">
                          <div className="h-9 w-9 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-red-500 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div className="w-full text-center px-1">
                             <div className="text-[9px] font-black text-zinc-900 truncate leading-none mb-0.5" title={file.name}>{file.name}</div>
                             <div className="text-[7px] font-bold text-zinc-400 uppercase tracking-tighter">{(file.sizeOriginal/ (1024 * 1024)).toFixed(2)} MB • PDF</div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                               setFormData(prev => ({
                                  ...prev,
                                  inquiry_pdfs: (prev.inquiry_pdfs || []).filter(f => f.$id !== file.$id)
                               }));
                            }}
                            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-100 shadow-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-30 scale-75 group-hover:scale-100"
                          >
                             <Trash2 className="h-3 w-3" />
                          </button>
                          <button 
                             type="button"
                             onClick={() => setPreviewFile(file)}
                             className="absolute inset-0 rounded-xl z-20"
                          />
                       </div>
                    ))}
                 </div>
              </div>

              {/* CAD / STP Files */}
              <div className="col-span-12 lg:col-span-4 lg:border-l lg:pl-6 border-zinc-100">
                 <label className="block text-[9px] font-bold text-zinc-950 uppercase tracking-[0.12em] leading-none mb-3">
                    STP / CAD Models
                 </label>
                 <div className="flex flex-wrap gap-2.5">
                    <label className="relative group/file h-20 w-32 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 flex flex-col items-center justify-center transition-all hover:bg-white hover:border-brand-primary/50 overflow-hidden shadow-sm-inset cursor-pointer px-4 text-center shrink-0">
                       <input 
                         type="file" 
                         multiple
                         className="hidden" 
                         accept=".stp,.step,.dwg,.dxf,.zip"
                         onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            try {
                               const responses = await uploadFiles(files);
                               setFormData(prev => ({
                                  ...prev,
                                  inquiry_cad_files: [...(prev.inquiry_cad_files || []), ...responses]
                               }));
                            } catch (err) {
                               alert("CAD upload failed: " + err.message);
                            } finally {
                               if (e.target) e.target.value = null;
                            }
                         }}
                       />
                       <div className="h-6 w-6 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover/file:text-brand-primary transition-all shadow-sm mb-1">
                          <FileUp className="h-3.5 w-3.5" />
                       </div>
                       <span className="font-black text-zinc-400 uppercase tracking-tighter group-hover/file:text-brand-primary transition-colors leading-none text-[8px]">Add CAD</span>
                    </label>

                    {(formData.inquiry_cad_files || []).map((file, idx) => (
                       <div key={file.$id || idx} className="h-20 w-32 rounded-xl bg-[#F8FAFC] border border-zinc-200/60 p-3 flex flex-col items-center justify-center group relative shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all shrink-0">
                          <div className="h-9 w-9 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-brand-primary shadow-sm mb-2 group-hover:scale-110 transition-transform">
                             <Layers className="h-5 w-5" />
                          </div>
                          <div className="w-full text-center px-1">
                             <div className="text-[9px] font-black text-zinc-900 truncate leading-none mb-0.5" title={file.name}>{file.name}</div>
                             <div className="text-[7px] font-bold text-zinc-400 uppercase tracking-tighter">{(file.sizeOriginal/ (1024 * 1024)).toFixed(2)} MB • CAD</div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                               setFormData(prev => ({
                                  ...prev,
                                  inquiry_cad_files: (prev.inquiry_cad_files || []).filter(f => f.$id !== file.$id)
                               }));
                            }}
                            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-100 shadow-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-30 scale-75 group-hover:scale-100"
                          >
                             <Trash2 className="h-3 w-3" />
                          </button>
                          <button 
                             type="button"
                             onClick={() => setPreviewFile(file)}
                             className="absolute inset-0 rounded-xl z-20"
                          />
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <AssetPreviewModal 
           isOpen={!!previewFile} 
           onClose={() => setPreviewFile(null)} 
           file={previewFile}
        />
     </FeaturePanel>
  );
};

export default ScopeAndIdentity;
