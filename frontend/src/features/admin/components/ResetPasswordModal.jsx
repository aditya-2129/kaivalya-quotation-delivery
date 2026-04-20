'use client';

import React, { useState } from 'react';
import { THEME } from '@/constants/ui';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

const validate = (password, confirm) => {
  const errors = {};
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Z]/.test(password)) errors.password = 'Include at least one uppercase letter.';
  else if (!/[0-9]/.test(password)) errors.password = 'Include at least one number.';

  if (!confirm) errors.confirm = 'Please confirm the password.';
  else if (password && confirm && confirm !== password) errors.confirm = 'Passwords do not match.';

  return errors;
};

export const ResetPasswordModal = ({ user, onClose, onConfirm, isSubmitting }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const errors = validate(password, confirm);
  const isValid = Object.keys(errors).length === 0;

  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (!isValid) return;
    onConfirm(password);
  };

  const fieldClass = (field) =>
    `w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-50 border font-bold focus:ring-2 focus:bg-white outline-none transition-all placeholder:font-normal ${
      touched[field] && errors[field]
        ? 'border-red-400 focus:ring-red-200'
        : 'border-zinc-200 focus:ring-zinc-950'
    }`;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm" style={{ zIndex: THEME.Z_INDEX.MODAL }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-zinc-950 tracking-tight" style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>
              Reset Password
            </h2>
            <p className="text-zinc-500 mt-1 font-medium" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
              Setting new credentials for <span className="text-zinc-800 font-bold">{user.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${touched.password && errors.password ? 'text-red-400' : 'text-zinc-300 group-focus-within:text-brand-primary'}`}>
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className={fieldClass('password')}
                style={{ fontSize: THEME.FONT_SIZE.BASE }}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) setTouched(t => ({ ...t, password: true }));
                }}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 font-medium" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: THEME.FONT_SIZE.TINY }}>
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${touched.confirm && errors.confirm ? 'text-red-400' : 'text-zinc-300 group-focus-within:text-brand-primary'}`}>
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                className={fieldClass('confirm')}
                style={{ fontSize: THEME.FONT_SIZE.BASE }}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (touched.confirm) setTouched(t => ({ ...t, confirm: true }));
                }}
                onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.confirm && errors.confirm && (
              <p className="text-red-500 font-medium" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{errors.confirm}</p>
            )}
          </div>

          <div className="flex gap-4 pt-6 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-950 transition-colors">
              Abort
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex-[2] h-12 rounded-xl bg-zinc-950 text-white font-bold shadow-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-950"
              style={{ fontSize: THEME.FONT_SIZE.BASE }}
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
