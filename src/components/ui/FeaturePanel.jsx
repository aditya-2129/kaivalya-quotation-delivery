'use client';

import React from 'react';
import { THEME } from '@/constants/ui';

/**
 * Reusable Panel for feature sections in the Quotation Form
 * Uses centralized theme constants for font sizes and colors.
 */
export const FeaturePanel = ({
  index,
  title,
  countLabel,
  isExpanded,
  onToggle,
  children,
  actionButton,
  className = "",
}) => {
  return (
    <section
      className={`bg-white rounded-xl border transition-all duration-300 shadow-sm ${
        isExpanded ? 'border-zinc-300 shadow-md ring-1 ring-zinc-200 overflow-visible' : 'border-zinc-200 overflow-hidden'
      } ${className}`}
    >
      <header
        onClick={onToggle}
        className={`h-[52px] px-5 border-b cursor-pointer flex justify-between items-center group transition-colors ${
          isExpanded ? 'bg-zinc-50 border-zinc-200' : 'bg-white border-zinc-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full font-black border transition-all duration-300 ${
              isExpanded
                ? 'bg-brand-primary border-brand-primary text-zinc-950 shadow-lg shadow-brand-primary/20'
                : 'bg-white border-zinc-200 text-zinc-400'
            }`}
            style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
          >
            {index}
          </span>
          <h3
            className={`font-black uppercase tracking-[0.2em] transition-colors ${
              isExpanded ? 'text-brand-primary' : 'text-zinc-500 group-hover:text-brand-primary'
            }`}
            style={{ fontSize: THEME.FONT_SIZE.SMALL }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {countLabel && (
            <span 
              className="font-black text-zinc-400 uppercase tracking-widest bg-zinc-100/50 px-2.5 py-1 rounded border border-zinc-200/50 italic animate-in slide-in-from-right-2 duration-300"
              style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
            >
              {countLabel}
            </span>
          )}
          {actionButton}
          <svg
            className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180 text-brand-primary' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </header>

      <div
        className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {children}
      </div>
    </section>
  );
};
