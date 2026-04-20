"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { THEME } from '@/constants/ui';
import { Search, Plus, User, MapPin, Mail, Phone, Users, Database } from 'lucide-react';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { useCustomers, useDeleteCustomer } from '@/features/customers/api/useCustomers';
import { CustomerModal } from '@/features/customers/components/CustomerModal';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.CUSTOMERS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data, isLoading, isError } = useCustomers(limit, (page - 1) * limit, searchQuery);
  const deleteCustomer = useDeleteCustomer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });
  const [errorDetails, setErrorDetails] = useState({ open: false, message: '' });

  const customers = data?.documents || [];
  const total = data?.total || 0;

  const openEditModal = (customer) => {
     setSelectedCustomer(customer);
     setIsModalOpen(true);
  };

  const commitDelete = async () => {
     if (!deleteConfirm.row) return;
     try {
        await deleteCustomer.mutateAsync(deleteConfirm.row.$id);
        setDeleteConfirm({ open: false, row: null });
     } catch (e) {
        setErrorDetails({ open: true, message: e.message || "Failed to remove customer record." });
     }
  };

  return (
    <DashboardLayout 
      title="Customer Base" 
      primaryAction={
        <button 
          onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95"
          style={{ fontSize: THEME.FONT_SIZE.BASE, fontWeight: 'bold' }}
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
           <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Search by name, location or email..." 
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 bg-zinc-50 transition-all focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                style={{ fontSize: THEME.FONT_SIZE.SMALL }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-zinc-400" />
           </div>
           <div className="font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              <Database className="h-4 w-4 text-zinc-400" />
              Total Records: {total}
           </div>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest">Organization</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest">Contact Person</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-40 bg-zinc-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-zinc-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-zinc-100 rounded" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-zinc-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-zinc-400 italic font-medium" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                       No customer records found matching the current search query.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.$id} className="group hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC] transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 min-w-[32px] rounded-md bg-zinc-950 flex items-center justify-center text-white font-bold" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                              {customer.name?.substring(0, 1) || 'C'}
                           </div>
                           <span className="font-bold text-zinc-900 tracking-tight" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{customer.contact_person || "—"}</td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1.5 text-zinc-500" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{customer.location || "N/A"}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-mono" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{customer.email || "—"}</td>
                      <td className="px-6 py-4 text-zinc-600 font-mono" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{customer.phone || "—"}</td>
                      <td className="px-6 py-4 text-right">
                         <ActionButtons 
                           onEdit={() => openEditModal(customer)} 
                           onDelete={() => setDeleteConfirm({ open: true, row: customer })} 
                         />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} label="Showing" />
        </section>
      </div>

      {isModalOpen && (
         <CustomerModal 
            customer={selectedCustomer} 
            onClose={() => setIsModalOpen(false)} 
            onError={(msg) => setErrorDetails({ open: true, message: msg })}
         />
      )}

      <ConfirmationModal 
         isOpen={deleteConfirm.open}
         onClose={() => setDeleteConfirm({ open: false, row: null })}
         onConfirm={commitDelete}
         title="Delete Customer?"
         message={`Are you sure you want to permanently remove ${deleteConfirm.row?.name || 'this customer record'}? This action is irreversible.`}
         confirmText="DELETE RECORD"
         cancelText="CANCEL"
         type="danger"
         isLoading={deleteCustomer.isPending}
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
