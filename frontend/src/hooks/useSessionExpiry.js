'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
const LS_KEY = 'session_login_at';

export function useSessionExpiry() {
    const { logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);

    const doLogout = useCallback(async () => {
        setShowWarning(false);
        await logout();
        router.replace('/login?reason=expired');
    }, [logout, router]);

    const checkExpiry = useCallback(() => {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;

        const loginAt = parseInt(raw, 10);
        const expiry = loginAt + SESSION_EXPIRY_MS;
        const msRemaining = expiry - Date.now();

        setExpiresAt(expiry);

        if (msRemaining <= 0) {
            doLogout();
        } else if (msRemaining <= WARNING_THRESHOLD_MS) {
            setShowWarning(true);
        }
    }, [doLogout]);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Run once immediately, then every 60 seconds
        checkExpiry();
        const interval = setInterval(checkExpiry, 60_000);

        // Cross-tab: if another tab removes session_login_at, log out here too
        function onStorage(event) {
            if (event.key === LS_KEY && event.newValue === null) {
                doLogout();
            }
        }
        window.addEventListener('storage', onStorage);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', onStorage);
        };
    }, [isAuthenticated, checkExpiry, doLogout]);

    const dismiss = useCallback(() => setShowWarning(false), []);

    return { showWarning, expiresAt, dismiss };
}
