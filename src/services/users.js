import { databases, ID, Query } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const userService = {
    /**
     * Get user profile from the custom 'users' collection by Appwrite auth ID.
     */
    async getUserByAuthId(authId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal("auth_id", authId), Query.limit(1)]
            );
            return response.documents.length > 0 ? response.documents[0] : null;
        } catch (error) {
            console.error("User Service Error [getUserByAuthId]:", error);
            throw error;
        }
    },

    /**
     * List all users.
     */
    async listUsers(limit = 100, offset = 0) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [
                    Query.orderAsc("name"),
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
            return response;
        } catch (error) {
            console.error("User Service Error [listUsers]:", error);
            throw error;
        }
    },

    /**
     * Create a user profile document in the 'users' collection.
     */
    async createUser(data) {
        try {
            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                data
            );
        } catch (error) {
            console.error("User Service Error [createUser]:", error);
            throw error;
        }
    },

    /**
     * Update a user profile document.
     */
    async updateUser(documentId, data) {
        try {
            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                documentId,
                data
            );
        } catch (error) {
            console.error("User Service Error [updateUser]:", error);
            throw error;
        }
    },

    /**
     * Delete a user profile document.
     */
    async deleteUser(documentId) {
        try {
            return await databases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                documentId
            );
        } catch (error) {
            console.error("User Service Error [deleteUser]:", error);
            throw error;
        }
    }
};
