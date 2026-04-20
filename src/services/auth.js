import { account, ID } from '@/lib/appwrite';

export const authService = {
    /**
     * Login with email + password. Creates a session cookie.
     */
    async login(email, password) {
        try {
            const session = await account.createEmailPasswordSession(email, password);
            return session;
        } catch (error) {
            // Only log system errors (not 401 invalid credentials)
            if (error?.code !== 401) {
                console.error("Auth Service Error [login]:", error);
            }
            throw error;
        }
    },

    /**
     * Logout the current user by deleting the active session.
     */
    async logout() {
        try {
            await account.deleteSession('current');
            return true;
        } catch (error) {
            console.error("Auth Service Error [logout]:", error);
            throw error;
        }
    },

    /**
     * Get the currently logged-in Appwrite auth user.
     * Returns null if no active session.
     */
    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error) {
            // Not logged in — this is expected, not an error
            return null;
        }
    },

    /**
     * Create a password recovery for a user.
     * This will send a recovery email.
     */
    async createRecovery(email) {
        try {
            // Success URL (reset password page)
            const url = `${window.location.origin}/reset-password`;
            return await account.createRecovery(email, url);
        } catch (error) {
            console.error("Auth Service Error [createRecovery]:", error);
            throw error;
        }
    },

    /**
     * Update a user password using a recovery token.
     */
    async updateRecovery(userId, secret, password) {
        try {
            return await account.updateRecovery(userId, secret, password, password);
        } catch (error) {
            console.error("Auth Service Error [updateRecovery]:", error);
            throw error;
        }
    },

    /**
     * Create a new Appwrite auth account via server-side API (admin use only).
     * Uses the server SDK so the admin stays logged in.
     */
    async createAuthAccount(email, password, name) {
        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Failed to create user.');
                error.code = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error("Auth Service Error [createAuthAccount]:", error);
            throw error;
        }
    },

    /**
     * Force-reset a user's password via server-side API (admin use only).
     */
    async resetUserPassword(userId, password) {
        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Failed to reset password.');
                error.code = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error("Auth Service Error [resetUserPassword]:", error);
            throw error;
        }
    }
};

