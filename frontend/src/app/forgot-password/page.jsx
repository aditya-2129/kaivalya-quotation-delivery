"use client";

import React, { useState } from 'react';
import { authService } from '@/services/auth';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.createRecovery(email.trim());
      setSuccess(true);
    } catch (err) {
      console.error("Recovery request failed:", err);
      setError(err?.message || 'Failed to send recovery email. Please check your email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-brand-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo + Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 mb-4">
            <img
              src="/KE_Logo.png"
              alt="Kaivalya Engineering"
              className="h-full w-auto object-contain"
            />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 text-center">
            Password Recovery
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-medium text-center">
            {success 
              ? 'Check your inbox for further instructions' 
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/40 p-8">
          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 mb-2">Instructions Sent</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  If an account exists with <strong>{email}</strong>, you will receive a reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full rounded-xl bg-zinc-900 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Banner */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] font-medium text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="recovery-email" className="block text-[11px] font-bold uppercase tracking-widest text-zinc-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@kaivalyaengineering.com"
                    autoComplete="email"
                    autoFocus
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-300 transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-brand-primary py-3 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-brand-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="pt-2 text-center">
                <Link 
                  href="/login" 
                  className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-zinc-300 font-medium uppercase tracking-widest">
          Kaivalya Engineering · Support System
        </p>
      </div>
    </div>
  );
}
