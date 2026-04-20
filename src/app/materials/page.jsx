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
import Pagination from '@/components/ui/Pagination';
import { useMaterials, useDeleteMaterial } from '@/features/inventory/api/useMaterials';
import { MaterialModal } from '@/features/inventory/components/MaterialModal';

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;
  const queryClient = useQueryClient();

  // Implement Realtime subscription
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.MATERIALS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['materials'] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data, isLoading, isError, refetch } = useMaterials(limit, (page - 1) * limit, searchQuery);
  const deleteMaterial = useDeleteMaterial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });
  const [errorDetails, setErrorDetails] = useState({ open: false, message: '' });

  const materials = data?.documents || [];
  const total = data?.total || 0;

  const openAddModal = () => {
    setSelectedMaterial(null);
    setIsModalOpen(true);
  };

  const openEditModal = (material) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
  };

  const commitDelete = async () => {
    if (!deleteConfirm.row) return;
    try {
      await deleteMaterial.mutateAsync(deleteConfirm.row.$id);
      setDeleteConfirm({ open: false, row: null });
    } catch (error) {
      setErrorDetails({ open: true, message: error.message || "Failed to remove material." });
    }
  };

  return (
    <DashboardLayout 
      title="Materials Inventory"
      primaryAction={
        <button 
           onClick={openAddModal}
           className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95"
           style={{ fontSize: THEME.FONT_SIZE.BASE, fontWeight: 'bold' }}
        >
          <Plus className="h-4 w-4" />
          Add Material
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
           <div className="relative w-full max-w-md">
              <input 
                 type="text" 
                 placeholder="Search registry (Name, Grade, Shape...)" 
                 className="w-full h-11 pl-11 pr-4 rounded-lg bg-zinc-50 border border-zinc-200 focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all"
                 style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="h-5 w-5 absolute left-3.5 top-3 text-zinc-400" />
           </div>
           <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 h-11 rounded-lg border border-zinc-200 bg-zinc-50 font-bold text-zinc-500 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                 <Database className="h-4 w-4 text-zinc-400" />
                 Total Records: {total}
              </div>
           </div>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest leading-none">Material Grade</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest leading-none">Category Name</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-center">Form Factor</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-center">Density</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-right">Base Rate (per kg)</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-2.5"><div className="h-4 w-48 bg-zinc-100 rounded" /></td>
                      <td className="px-6 py-2.5"><div className="h-4 w-20 bg-zinc-100 rounded mx-auto" /></td>
                      <td className="px-6 py-2.5"><div className="h-4 w-16 bg-zinc-100 rounded mx-auto" /></td>
                      <td className="px-6 py-2.5"><div className="h-4 w-24 bg-zinc-100 rounded ml-auto" /></td>
                      <td className="px-6 py-2.5"><div className="h-4 w-16 bg-zinc-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : materials.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                             <Package className="h-6 w-6" />
                          </div>
                          <span className="text-zinc-500 font-medium" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>No materials matching your trajectory.</span>
                       </div>
                    </td>
                  </tr>
                ) : (
                  materials.map((m) => (
                    <tr key={m.$id} className="group hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC] transition-all duration-200">
                      <td className="px-6 py-2.5 font-black text-zinc-950 uppercase tracking-tight" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{m.grade || '—'}</td>
                      <td className="px-6 py-2.5 font-bold text-zinc-500 uppercase italic tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{m.name}</td>
                      <td className="px-6 py-2.5 text-center">
                         <span className="inline-flex px-2 py-0.5 rounded border border-zinc-200 bg-white font-bold text-zinc-600 uppercase tracking-tight" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                            {m.shape?.replace('_', ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-2.5 text-center">
                        <span className="font-mono font-medium text-zinc-600" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{parseFloat(m.density).toFixed(3)} <span className="text-zinc-400 font-sans uppercase" style={{ fontSize: THEME.FONT_SIZE.TINY }}>g/cm³</span></span>
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <span className="font-mono font-bold text-emerald-700" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>₹{parseFloat(m.base_rate).toFixed(2)}</span>
                      </td>
                       <td className="px-6 py-2.5 text-right">
                         <ActionButtons onEdit={() => openEditModal(m)} onDelete={() => setDeleteConfirm({ open: true, row: m })} />
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} label="Index" />
        </section>
      </div>

       {isModalOpen && (
         <MaterialModal 
           material={selectedMaterial} 
           onClose={() => setIsModalOpen(false)} 
           onError={(msg) => setErrorDetails({ open: true, message: msg })}
         />
       )}

       <ConfirmationModal 
          isOpen={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, row: null })}
          onConfirm={commitDelete}
          title="Excise Material?"
          message={`Are you sure you want to permanently remove '${deleteConfirm.row?.name || 'this material'}' from the master library?`}
          confirmText="DELETE MATERIAL"
          cancelText="KEEP MATERIAL"
          type="danger"
          isLoading={deleteMaterial.isPending}
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
