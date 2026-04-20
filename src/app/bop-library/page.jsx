"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { THEME } from '@/constants/ui';
import { Search, Plus, Trash2, Edit3, Package, Database } from 'lucide-react';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useBOPList, useDeleteBOP } from '@/features/inventory/api/useBOP';
import { BOPModal } from '@/features/inventory/components/BOPModal';

export default function BOPLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;
  const queryClient = useQueryClient();

  // Implement Realtime subscription
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.BOP_LIBRARY}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['bop-list'] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data, isLoading, isError } = useBOPList(limit, (page - 1) * limit, searchQuery);
  const deleteBOP = useDeleteBOP();

  const [modalState, setModalState] = useState({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });
  const [errorDetails, setErrorDetails] = useState({ open: false, message: '' });

  const items = data?.documents || [];
  const total = data?.total || 0;

  const openModal = (data = null) => setModalState({ open: true, data });
  const closeModal = () => setModalState({ open: false, data: null });

  const commitDelete = async () => {
    if (!deleteConfirm.row) return;
    try {
      await deleteBOP.mutateAsync(deleteConfirm.row.$id);
      setDeleteConfirm({ open: false, row: null });
    } catch (error) {
      setErrorDetails({ open: true, message: error.message || "Failed to remove item." });
    }
  };

  return (
    <DashboardLayout 
      title="BOP Registry"
      primaryAction={
        <button 
          onClick={() => openModal()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95"
          style={{ fontSize: THEME.FONT_SIZE.BASE, fontWeight: 'bold' }}
        >
          <Plus className="h-4 w-4" />
          Add Catalog Item
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
           <div className="relative w-full max-w-md">
              <input 
                 type="text" 
                 placeholder="Search registry (Item, Supplier...)" 
                 className="w-full h-11 pl-11 pr-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all"
                 style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="h-5 w-5 absolute left-3.5 top-3 text-zinc-400" />
           </div>
           <div className="font-bold text-zinc-400 uppercase tracking-widest px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50 flex items-center gap-2" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              <Database className="h-4 w-4 text-zinc-400" />
              Procurement Entities: {total}
           </div>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                 <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                       <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest">Part Descriptor</th>
                       <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-center">Unit</th>
                       <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-center">OEM / Supplier</th>
                       <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-right">Acquisition Rate (₹)</th>
                       <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-200">
                    {isLoading ? [1,2,3,4,5].map(i => (
                       <tr key={i} className="animate-pulse">
                          <td className="px-6 py-2.5"><div className="h-4 w-48 bg-zinc-100 rounded" /></td>
                          <td className="px-6 py-2.5"><div className="h-4 w-12 bg-zinc-100 rounded mx-auto" /></td>
                          <td className="px-6 py-2.5"><div className="h-4 w-20 bg-zinc-100 rounded mx-auto" /></td>
                          <td className="px-6 py-2.5 text-right"><div className="h-4 w-24 bg-zinc-100 rounded ml-auto" /></td>
                          <td className="px-6 py-2.5 text-right"><div className="h-8 w-8 bg-zinc-100 rounded ml-auto" /></td>
                       </tr>
                    )) : items.length === 0 ? (
                       <tr><td colSpan="5" className="px-6 py-20 text-center text-zinc-400 italic font-medium uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>No catalog items registered in this procurement path.</td></tr>
                    ) : items.map(item => (
                       <tr key={item.$id} className="group hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC] transition-all duration-200">
                          <td className="px-6 py-2.5">
                             <span className="text-zinc-950 font-bold italic" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{item.item_name}</span>
                          </td>
                          <td className="px-6 py-2.5 text-center">
                             <span className="font-mono text-zinc-500 uppercase tracking-wider" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{item.unit || 'pcs'}</span>
                          </td>
                          <td className="px-6 py-2.5 text-center">
                             <span className="inline-flex px-2 py-0.5 rounded border border-zinc-200 bg-white font-bold text-zinc-600 uppercase tracking-tight" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                                {item.supplier || 'General Market'}
                             </span>
                          </td>
                          <td className="px-6 py-2.5 text-right">
                             <span className="font-mono font-bold text-emerald-700 italic" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>₹{parseFloat(item.rate).toFixed(2)}</span>
                          </td>
                           <td className="px-6 py-2.5 text-right">
                              <ActionButtons onEdit={() => openModal(item)} onDelete={() => setDeleteConfirm({ open: true, row: item })} />
                           </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between mt-auto">
              <div className="font-bold text-zinc-400 uppercase tracking-widest leading-none" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                 Index {Math.min(total, (page - 1) * limit + 1)} - {Math.min(total, page * limit)} of {total}
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   disabled={page === 1}
                   onClick={() => setPage(p => p - 1)}
                   className="h-8 px-3 rounded-md border border-zinc-200 bg-white font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm uppercase tracking-tighter"
                   style={{ fontSize: THEME.FONT_SIZE.TINY }}
                 >Prev</button>
                 <div className="px-2 font-mono font-bold text-zinc-900" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{page} / {Math.ceil(total / limit) || 1}</div>
                 <button 
                   disabled={page >= Math.ceil(total / limit)}
                   onClick={() => setPage(p => p + 1)}
                   className="h-8 px-3 rounded-md border border-zinc-200 bg-white font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm uppercase tracking-tighter"
                   style={{ fontSize: THEME.FONT_SIZE.TINY }}
                 >Next</button>
              </div>
           </div>
        </section>
      </div>

       {modalState.open && (
         <BOPModal 
           data={modalState.data}
           onClose={closeModal}
           onError={(msg) => setErrorDetails({ open: true, message: msg })}
         />
       )}

       <ConfirmationModal 
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, row: null })}
          onConfirm={commitDelete}
          title="Purge Catalog Item?"
          message={`Are you sure you want to permanently remove '${deleteConfirm.row?.item_name || 'this item'}' from the procurement registry?`}
          confirmText="PURGE ITEM"
          cancelText="KEEP ITEM"
          type="danger"
          isLoading={deleteBOP.isPending}
       />

       <ConfirmationModal 
          isOpen={errorDetails.open}
          onClose={() => setErrorDetails({ open: false, message: '' })}
          onConfirm={() => setErrorDetails({ open: false, message: '' })}
          title="REGISTRY ERROR"
          message={errorDetails.message}
          confirmText="CLOSE"
          type="danger"
       />
     </DashboardLayout>
  );
}
