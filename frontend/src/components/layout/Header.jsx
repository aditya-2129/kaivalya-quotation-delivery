"use client";

import React, { useState } from 'react';
import { THEME, LAYOUT } from '@/constants/ui';
import { LogOut, ChevronDown } from 'lucide-react';

const Header = ({ isCollapsed, title, primaryAction, userProfile, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get initials from user profile name
  const getInitials = () => {
    if (!userProfile?.name) return '??';
    const parts = userProfile.name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header 
      className="fixed top-0 right-0 flex items-center justify-between border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm px-8 transition-all duration-300"
      style={{ 
        zIndex: THEME.Z_INDEX.HEADER, 
        height: LAYOUT.HEADER_HEIGHT,
        left: isCollapsed ? '80px' : LAYOUT.SIDEBAR_WIDTH 
      }}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h1 
          className="font-extrabold tracking-tight text-zinc-900"
          style={{ fontSize: THEME.FONT_SIZE.LARGE }}
        >
          {title || 'Command Center'}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {primaryAction && (
          <div className="relative z-[999]">{primaryAction}</div>
        )}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200 py-1.5 pl-1.5 pr-3 transition-all hover:border-zinc-300 hover:shadow-sm"
          >
            <div 
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-zinc-950 font-black"
              style={{ fontSize: THEME.FONT_SIZE.XSMALL }}
            >
              {getInitials()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-zinc-900 leading-none" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{userProfile?.name || 'User'}</p>
              <p className="text-zinc-400 font-medium capitalize leading-tight mt-0.5" style={{ fontSize: THEME.FONT_SIZE.TINY }}>{userProfile?.role || 'user'}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0" style={{ zIndex: THEME.Z_INDEX.DROPDOWN - 10 }} onClick={() => setShowUserMenu(false)} />
              <div 
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-xl shadow-zinc-200/50"
                style={{ zIndex: THEME.Z_INDEX.DROPDOWN }}
              >
                <div className="px-4 py-2.5 border-b border-zinc-100">
                  <p className="font-bold text-zinc-900" style={{ fontSize: THEME.FONT_SIZE.BASE }}>{userProfile?.name}</p>
                  <p className="text-zinc-400 mt-0.5" style={{ fontSize: THEME.FONT_SIZE.XSMALL }}>{userProfile?.email}</p>
                  <span 
                    className="mt-1.5 inline-block rounded-full bg-brand-primary/15 px-2 py-0.5 font-bold uppercase tracking-wider text-brand-primary"
                    style={{ fontSize: THEME.FONT_SIZE.TINY }}
                  >
                    {userProfile?.role}
                  </span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors"
                    style={{ fontSize: THEME.FONT_SIZE.BASE }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
