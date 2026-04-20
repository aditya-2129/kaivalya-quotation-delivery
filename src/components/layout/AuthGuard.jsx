"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Routes that regular (non-admin) users CAN access
const USER_ALLOWED_ROUTES = [
    '/quotations-draft',
    '/quotations-approved',
    '/customers',
    '/materials',
    '/labor-rates',
    '/bop-library',
    '/confirmed-orders',
];

/**
 * Checks if a pathname is allowed for a regular user.
 * Handles exact matches and sub-routes (e.g. /quotations-draft/new, /quotations-draft/edit/[id]).
 */
function isRouteAllowed(pathname, isAdmin) {
    if (isAdmin) return true;
    return USER_ALLOWED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export default function AuthGuard({ children }) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return; // Still checking session

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        // Authenticated but not allowed on this route
        if (!isRouteAllowed(pathname, isAdmin)) {
            router.replace('/quotations-draft');
        }
    }, [isAuthenticated, isAdmin, isLoading, pathname, router]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-3 border-zinc-200 border-t-brand-primary animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">
                        Authenticating...
                    </span>
                </div>
            </div>
        );
    }

    // Not authenticated — will redirect via useEffect
    if (!isAuthenticated) return null;

    // Authenticated but wrong route — will redirect via useEffect
    if (!isRouteAllowed(pathname, isAdmin)) return null;

    return children;
}
