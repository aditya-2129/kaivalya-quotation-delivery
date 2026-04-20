"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth';
import { userService } from '@/services/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);           // Appwrite auth user
    const [userProfile, setUserProfile] = useState(null); // Custom users collection doc
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = userProfile?.role === 'admin';

    /**
     * Check for existing session on mount.
     */
    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        // Pre-flight: if a login timestamp exists and 24h have elapsed, log out immediately
        const raw = localStorage.getItem('session_login_at');
        if (raw) {
            const loginAt = parseInt(raw, 10);
            if (Date.now() - loginAt >= 24 * 60 * 60 * 1000) {
                localStorage.removeItem('session_login_at');
                setUser(null);
                setUserProfile(null);
                setIsLoading(false);
                return;
            }
        }

        try {
            setIsLoading(true);
            const authUser = await authService.getCurrentUser();
            if (authUser) {
                setUser(authUser);
                // Fetch the profile from our custom users collection
                const profile = await userService.getUserByAuthId(authUser.$id);
                setUserProfile(profile);
            } else {
                setUser(null);
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Session check failed:", error);
            setUser(null);
            setUserProfile(null);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Login and fetch profile.
     */
    async function login(email, password) {
        const session = await authService.login(email, password);
        const authUser = await authService.getCurrentUser();
        setUser(authUser);

        const profile = await userService.getUserByAuthId(authUser.$id);
        setUserProfile(profile);

        localStorage.setItem('session_login_at', String(Date.now()));

        return { authUser, profile };
    }

    /**
     * Logout and clear state.
     */
    async function logout() {
        localStorage.removeItem('session_login_at');
        await authService.logout();
        setUser(null);
        setUserProfile(null);
    }

    const value = {
        user,
        userProfile,
        isAdmin,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshProfile: checkSession
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth context.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
