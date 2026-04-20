'use client';

import React, { useState } from 'react';
import { THEME } from '@/constants/ui';
import { X, User, Mail, Phone, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useCreateUser, useUpdateUser, useUsers } from '../api/useUsers';

const VALIDATORS = {
  name: (v) => {
    if (!v.trim()) return 'Full name is required.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    return null;
  },
  email: (v) => {
    if (!v.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return null;
  },
  password: (v) => {
    if (!v) return 'Password is required.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter.';
    if (!/[0-9]/.test(v)) return 'Include at least one number.';
    return null;
  },
  mobile: (v) => {
    if (!v.trim()) return 'Mobile number is required.';
    if (v.replace(/\D/g, '').length !== 10) return 'Mobile number must be exactly 10 digits.';
    return null;
  },
};

const InputField = ({ label, icon: Icon, type = "text", placeholder, required = false, disabled = false, value, onChange, error, onBlur, suffix }) => (
  <div className="space-y-1.5">
    <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-zinc-300 group-focus-within:text-brand-primary'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <input
        required={required}
        disabled={disabled}
        type={type}
        className={`w-full h-11 pl-10 ${suffix ? 'pr-10' : 'pr-4'} rounded-xl bg-zinc-50 border font-bold focus:ring-2 focus:bg-white outline-none transition-all placeholder:font-normal disabled:opacity-50 ${
          error ? 'border-red-400 focus:ring-red-200' : 'border-zinc-200 focus:ring-zinc-950'
        }`}
        style={{ fontSize: THEME.FONT_SIZE.BASE }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      {suffix && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {suffix}
        </div>
      )}
    </div>
    {error && (
      <p className="text-red-500 font-medium" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
        {error}
      </p>
    )}
  </div>
);

export const UserModal = ({ user, onClose, onError, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    mobile: user?.mobile || '',
    role: user?.role || 'user'
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: existingUsers } = useUsers();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const validateField = (field, value) => {
    if (field === 'password' && user) return null;
    if (field === 'email' && !user) {
      const baseError = VALIDATORS.email(value);
      if (baseError) return baseError;
      const taken = existingUsers?.documents?.some(u => u.email.toLowerCase() === value.trim().toLowerCase());
      if (taken) return 'This email is already registered.';
      return null;
    }
    return VALIDATORS[field]?.(value) ?? null;
  };

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'mobile') {
      value = value.replace(/\D/g, '');
      if (value.replace(/\D/g, '').length > 10) return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const requiredFields = user ? ['name', 'mobile'] : ['name', 'email', 'password', 'mobile'];

  const isFormValid = requiredFields.every(field => !validateField(field, formData[field]));

  const validateAll = () => {
    const newErrors = {};
    requiredFields.forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    setTouched(Object.fromEntries(requiredFields.map(f => [f, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
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

  const PasswordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      className="text-zinc-400 hover:text-zinc-700 transition-colors"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
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
          <InputField
            label="Full Name" icon={User} value={formData.name}
            onChange={handleChange('name')} onBlur={handleBlur('name')}
            placeholder="John Doe" required error={errors.name}
          />
          <InputField
            label="Email Address" type="email" icon={Mail} value={formData.email}
            onChange={handleChange('email')} onBlur={handleBlur('email')}
            placeholder="user@kaivalyaengineering.com" required disabled={!!user} error={errors.email}
          />

          {!user && (
            <InputField
              label="Initial Password" type={showPassword ? 'text' : 'password'} icon={Lock}
              value={formData.password} onChange={handleChange('password')} onBlur={handleBlur('password')}
              placeholder="Min. 8 characters" required error={errors.password}
              suffix={PasswordToggle}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Mobile Number" type="tel" icon={Phone} value={formData.mobile}
              onChange={handleChange('mobile')} onBlur={handleBlur('mobile')}
              placeholder="+91..." required error={errors.mobile}
            />
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
                  onChange={handleChange('role')}
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
              disabled={isSubmitting || !isFormValid}
              className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-950"
            >
              {isSubmitting ? 'Syncing...' : (user ? 'Update Profile' : 'Activate Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
