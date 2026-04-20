"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { THEME } from '@/constants/ui';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, Plus, UserCog, Mail, Phone, Shield, Trash2, Key, Users } from 'lucide-react';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useUsers, useDeleteUser, useResetPassword } from '@/features/admin/api/useUsers';
import { UserModal } from '@/features/admin/components/UserModal';
import { toast } from 'react-hot-toast';

export default function UserManagementPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Implement Realtime subscription
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.USERS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data, isLoading: loading, error: fetchError } = useUsers();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/quotations-draft');
    }
  }, [authLoading, isAdmin, router]);

  const users = data?.documents || [];

  const openAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const commitDelete = async () => {
    if (!deleteConfirm.row) return;
    try {
      await deleteUser.mutateAsync(deleteConfirm.row.$id);
      toast.success('User profile removed.');
      setDeleteConfirm({ open: false, row: null });
    } catch (err) {
      toast.error(err.message || 'Deletion failed.');
    }
  };

  const handleResetPassword = async (user) => {
    const newPass = prompt(`Enter new password for ${user.name}:`);
    if (!newPass) return;
    if (newPass.length < 8) {
      alert('Minimum 8 characters required.');
      return;
    }
    
    try {
      await resetPassword.mutateAsync({ authId: user.auth_id, newPassword: newPass });
      toast.success(`Password for ${user.name} updated.`);
    } catch (err) {
      toast.error(err.message || 'Password reset failed.');
    }
  };

  if (authLoading || !isAdmin) return null;

  return (
    <DashboardLayout title="User Management">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold tracking-tight text-zinc-900" style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>Team Members</h2>
            <p className="text-zinc-400 mt-0.5" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
              {users.length} active personnel registered
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95"
            style={{ fontSize: THEME.FONT_SIZE.BASE, fontWeight: 'bold' }}
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                <th className="w-[25%] px-6 py-4 text-left font-black uppercase tracking-widest text-zinc-400">Identity</th>
                <th className="w-[30%] px-6 py-4 text-left font-black uppercase tracking-widest text-zinc-400">Communication</th>
                <th className="w-[15%] px-6 py-4 text-center font-black uppercase tracking-widest text-zinc-400">Clearance</th>
                <th className="w-[30%] px-6 py-4 text-right font-black uppercase tracking-widest text-zinc-400">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                 [1,2,3].map(i => (
                   <tr key={i} className="animate-pulse">
                     <td colSpan="4" className="h-16 px-6 bg-zinc-50/20" />
                   </tr>
                 ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-zinc-400" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                    No authorized personnel found in registry.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.$id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white font-black" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                          {user.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-900" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-zinc-500" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>
                           <Mail className="h-3 w-3" /> {user.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                           <Phone className="h-3 w-3" /> {user.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`} style={{ fontSize: '9px' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-all">
                        <button
                          onClick={() => openEditModal(user)}
                          className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                          title="Edit Profile"
                        >
                          <UserCog className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-amber-600 hover:border-amber-200 transition-all"
                          title="Reset Credentials"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <div className="h-4 w-px bg-zinc-100 mx-1" />
                        <button
                          onClick={() => setDeleteConfirm({ open: true, row: user })}
                          className="h-8 w-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-200 transition-all"
                          title="Revoke Access"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <UserModal 
          user={selectedUser} 
          onClose={() => setIsModalOpen(false)} 
          onError={(msg) => toast.error(msg)}
          onSuccess={(msg) => toast.success(msg)}
        />
      )}

      <ConfirmationModal 
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, row: null })}
        onConfirm={commitDelete}
        title="Revoke Access?"
        message={`Are you sure you want to permanently remove ${deleteConfirm.row?.name}? They will lose all access to the system.`}
        confirmText="REVOKE ACCESS"
        cancelText="KEEP USER"
        type="danger"
        isLoading={deleteUser.isPending}
      />
    </DashboardLayout>
  );
}
