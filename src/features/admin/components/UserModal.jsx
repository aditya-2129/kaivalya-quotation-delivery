'use client';

import React, { useState } from 'react';
import { THEME } from '@/constants/ui';
import { X, User, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';
import { useCreateUser, useUpdateUser } from '../api/useUsers';

export const UserModal = ({ user, onClose, onError, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    mobile: user?.mobile || '',
    role: user?.role || 'user'
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user) {
        await updateUser.mutateAsync({ 
          id: user.$id, 
          data: { name: formData.name, mobile: formData.mobile, role: formData.role } 
        });
        onSuccess?.('User profile updated.');
      } else {
        await createUser.mutateAsync(formData);
        onSuccess?.(`User ${formData.name} created.`);
      }
      onClose();
    } catch (err) {
      onError(err.message || "Failed to process user request.");
    }
  };

  const InputField = ({ label, icon: Icon, type = "text", field, placeholder, required = false, disabled = false }) => (
    <div className="space-y-1.5">
      <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand-primary transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        <input
          required={required}
          disabled={disabled}
          type={type}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 font-bold focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all placeholder:font-normal disabled:opacity-50"
          style={{ fontSize: THEME.FONT_SIZE.BASE }}
          placeholder={placeholder}
          value={formData[field]}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm" style={{ zIndex: THEME.Z_INDEX.MODAL }}>
      <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-zinc-950 tracking-tight" style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>
              {user ? 'Modify Team Member' : 'Onboard New User'}
            </h2>
            <p className="text-zinc-500 mt-1 font-medium" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
              Manage access control and personnel credentials.
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <InputField label="Full Name" icon={User} field="name" placeholder="John Doe" required />
          <InputField label="Email Address" type="email" icon={Mail} field="email" placeholder="user@kaivalyaengineering.com" required disabled={!!user} />
          
          {!user && (
            <InputField label="Initial Password" type="password" icon={Lock} field="password" placeholder="Min. 8 characters" required />
          )}

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Mobile Number" type="tel" icon={Phone} field="mobile" placeholder="+91..." required />
            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
                Security Role <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand-primary transition-colors">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <select
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 font-bold focus:ring-2 focus:ring-zinc-950 focus:bg-white outline-none transition-all"
                  style={{ fontSize: THEME.FONT_SIZE.BASE }}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User (Standard)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-950 transition-colors">
              Abort
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Syncing...' : (user ? 'Update Profile' : 'Activate Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
