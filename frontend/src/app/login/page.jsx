"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const { login, isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Detect ?reason=expired, show banner, then clear the param
  useEffect(() => {
    if (searchParams.get('reason') === 'expired') {
      setSessionExpiredNotice(true);
      router.replace('/login');
    }
  }, [searchParams, router]);

  // If already logged in, redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? '/' : '/quotations-draft');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { profile } = await login(email.trim(), password);
      const isAdminUser = profile?.role === 'admin';
      router.replace(isAdminUser ? '/' : '/quotations-draft');
    } catch (err) {
      if (err?.code !== 401 && err?.type !== 'user_invalid_credentials') {
        console.error("Login failed:", err);
      }

      if (err?.code === 401 || err?.type === 'user_invalid_credentials') {
        setAttempts(prev => prev + 1);
        if (attempts >= 2) {
          setError('Incorrect details. Use "Forgot Password?" below if you cannot remember it.');
        } else {
          setError('Invalid email or password. Please try again.');
        }
      } else if (err?.code === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError(err?.message || 'Authentication failed. Check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-10 w-10 rounded-full border-3 border-zinc-200 border-t-brand-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

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
          <h1 className="text-lg font-extrabold tracking-tight text-zinc-900">
            Engineering Command Center
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            Sign in to access the quotation management system
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/40 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Session Expired Banner */}
            {sessionExpiredNotice && (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[13px] font-medium text-amber-700 animate-in fade-in slide-in-from-top-1 duration-200">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Your session has expired. Please log in again.
              </div>
            )}

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
              <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-widest text-zinc-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="login-email"
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

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-widest text-zinc-900 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-11 text-sm text-zinc-900 placeholder:text-zinc-300 transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <a 
                  href="/forgot-password" 
                  className="text-[11px] font-bold uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  Forgot Password?
                </a>
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
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-zinc-300 font-medium uppercase tracking-widest">
          Kaivalya Engineering · Precision Tools & Components
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-10 w-10 rounded-full border-3 border-zinc-200 border-t-brand-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
