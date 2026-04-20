import { databases, ID, Query } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const quotationService = {
    // List all quotations
    async listQuotations(limit = 25, offset = 0, filters = {}) {
        try {
            const queries = [
                Query.notEqual('status', 'Cancelled'),
                Query.notEqual('status', 'Approved'),
                Query.notEqual('status', 'Converted to PO'),
                Query.orderDesc("quotation_no"),
                Query.limit(limit),
                Query.offset(offset)
            ];

            const searchTerm = (filters.search || '').trim();
            if (searchTerm) {
                queries.push(Query.or([
                    Query.contains('quotation_no', searchTerm),
                    Query.contains('part_number', searchTerm),
                    Query.contains('supplier_name', searchTerm)
                ]));
            }

            if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
                const startDate = new Date(filters.dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                
                const endDate = new Date(filters.dateRange.end);
                endDate.setHours(23, 59, 59, 999);

                queries.push(Query.greaterThanEqual('$createdAt', startDate.toISOString()));
                queries.push(Query.lessThanEqual('$createdAt', endDate.toISOString()));
            }

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                queries
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [listQuotations]:", error);
            throw error;
        }
    },

    async generateNextQuotationID() {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                [
                    Query.orderDesc("quotation_no"),
                    Query.limit(1)
                ]
            );
            
            if (response.total === 0) return 'QTN-00001';
            
            const lastId = response.documents[0].quotation_no;
            const lastNum = parseInt(lastId.split('-')[1]) || 0;
            const nextNum = (lastNum + 1).toString().padStart(5, '0');
            return `QTN-${nextNum}`;
        } catch (error) {
            console.error("Failed to generate ID:", error);
            // Return a clear indicator if fetch fails rather than random noise
            return `QTN-00001 (Offline)`;
        }
    },

    // Create a new quotation
    async createQuotation(data) {
        try {
            const response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                data.quotation_no || ID.unique(),
                data
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [createQuotation]:", error);
            throw error;
        }
    },

    // Get a specific quotation
    async getQuotation(id) {
        try {
            const response = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                id
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [getQuotation]:", error);
            throw error;
        }
    },

    // Update an existing quotation
    async updateQuotation(id, data) {
        try {
            const response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                id,
                data
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [updateQuotation]:", error);
            throw error;
        }
    },

    // Delete a quotation
    async deleteQuotation(id) {
        try {
            // Soft delete: Update status to 'Cancelled' instead of purging
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                id,
                { status: 'Cancelled' }
            );
            return true;
        } catch (error) {
            console.error("Appwrite Service Error [deleteQuotation]:", error);
            throw error;
        }
    }
};
