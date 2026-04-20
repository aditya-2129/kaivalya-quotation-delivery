"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AuthGuard from './AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import SessionExpiryWarning from '@/components/modals/SessionExpiryWarning';

const DashboardLayout = ({ children, title, primaryAction }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const showFull = !isCollapsed || isHovered;
  const { userProfile, isAdmin, logout } = useAuth();
  const { showWarning, expiresAt, dismiss } = useSessionExpiry();

  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-zinc-50 font-sans tracking-tight text-zinc-950 antialiased selection:bg-brand-primary selection:text-white">
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isHovered={isHovered}
          setIsHovered={setIsHovered}
          isAdmin={isAdmin}
        />
        <div className={`flex flex-col transition-all duration-300 ${showFull ? 'pl-64' : 'pl-20'}`}>
          <Header 
            isCollapsed={!showFull} 
            title={title} 
            primaryAction={primaryAction} 
            userProfile={userProfile}
            onLogout={logout}
          />
          <main className="mt-16 h-[calc(100vh-64px)] overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
      <SessionExpiryWarning
        isOpen={showWarning}
        expiresAt={expiresAt}
        onDismiss={dismiss}
      />
    </AuthGuard>
  );
};

export default DashboardLayout;
