import { databases, Query } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const approvedQuotationService = {
    /**
     * List only quotations with status 'Approved'
     */
    async listApprovedQuotations(limit = 25, offset = 0, filters = {}) {
        try {
            const queries = [
                Query.equal('status', 'Approved'),
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

            if (filters.engineer && filters.engineer !== 'All') {
                queries.push(Query.equal('quoting_engineer', filters.engineer));
            }

            if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
                const startDate = new Date(filters.dateRange.start);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(filters.dateRange.end);
                endDate.setHours(23, 59, 59, 999);

                queries.push(Query.greaterThanEqual('$createdAt', startDate.toISOString()));
                queries.push(Query.lessThanEqual('$createdAt', endDate.toISOString()));
            } else if (filters.timePeriod && filters.timePeriod !== 'All Time') {
                const now = new Date();
                let pastDate = new Date();
                
                if (filters.timePeriod === 'Last 30 Days') pastDate.setDate(now.getDate() - 30);
                else if (filters.timePeriod === 'Last 90 Days') pastDate.setDate(now.getDate() - 90);
                else if (filters.timePeriod === 'This Year') pastDate = new Date(now.getFullYear(), 0, 1);
                else if (filters.timePeriod === 'Last Year') pastDate = new Date(now.getFullYear() - 1, 0, 1);

                queries.push(Query.greaterThanEqual('$createdAt', pastDate.toISOString()));
            }

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                queries
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [listApprovedQuotations]:", error);
            throw error;
        }
    },

    /**
     * Get summary metrics for approved quotations based on current filters.
     * Fetches up to 5000 small document signatures to calculate total valuation.
     */
    async getApprovedMetrics(filters = {}) {
        try {
            const baseFilterQueries = [];
            const searchTerm = (filters.search || '').trim();
            if (searchTerm) {
                baseFilterQueries.push(Query.or([
                    Query.contains('quotation_no', searchTerm),
                    Query.contains('part_number', searchTerm),
                    Query.contains('supplier_name', searchTerm)
                ]));
            }
            if (filters.engineer && filters.engineer !== 'All') {
                baseFilterQueries.push(Query.equal('quoting_engineer', filters.engineer));
            }

            const dateQueries = [];
            if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
                dateQueries.push(Query.greaterThanEqual('$createdAt', new Date(filters.dateRange.start).toISOString()));
                dateQueries.push(Query.lessThanEqual('$createdAt', new Date(filters.dateRange.end).toISOString()));
            } else if (filters.timePeriod && filters.timePeriod !== 'All Time') {
                const now = new Date();
                let pastDate = new Date();
                if (filters.timePeriod === 'Last 30 Days') pastDate.setDate(now.getDate() - 30);
                else if (filters.timePeriod === 'Last 90 Days') pastDate.setDate(now.getDate() - 90);
                else if (filters.timePeriod === 'This Year') pastDate = new Date(now.getFullYear(), 0, 1);
                dateQueries.push(Query.greaterThanEqual('$createdAt', pastDate.toISOString()));
            }

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

            const [scopeResponse, thisMonthResponse, pendingResponse] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTIONS.QUOTATIONS, [
                    Query.equal('status', 'Approved'),
                    Query.limit(5000),
                    Query.select(['total_amount']),
                    ...baseFilterQueries,
                    ...dateQueries,
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.QUOTATIONS, [
                    Query.equal('status', 'Approved'),
                    Query.limit(5000),
                    Query.select(['total_amount']),
                    Query.greaterThanEqual('$createdAt', monthStart),
                    Query.lessThanEqual('$createdAt', monthEnd),
                    ...baseFilterQueries,
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.QUOTATIONS, [
                    Query.equal('status', 'Approved'),
                    Query.limit(1),
                    Query.select(['$id']),
                ]),
            ]);

            const totalValue = scopeResponse.documents.reduce((sum, doc) => sum + (parseFloat(doc.total_amount) || 0), 0);
            const thisMonthValue = thisMonthResponse.documents.reduce((sum, doc) => sum + (parseFloat(doc.total_amount) || 0), 0);

            return {
                count: scopeResponse.total,
                totalValue,
                thisMonthValue,
                pendingConversionCount: pendingResponse.total,
            };
        } catch (error) {
            console.error("Appwrite Service Error [getApprovedMetrics]:", error);
            return { count: 0, totalValue: 0, thisMonthValue: 0, pendingConversionCount: 0 };
        }
    },

    /**
     * Get a specific quotation by ID (for preview/download)
     */
    async getQuotation(id) {
        try {
            const response = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                id
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [getApprovedQuotation]:", error);
            throw error;
        }
    },

    /**
     * Update quotation status (e.g., to 'Converted to PO')
     */
    async updateStatus(id, status) {
        try {
            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.QUOTATIONS,
                id,
                { status }
            );
        } catch (error) {
            console.error("Appwrite Service Error [updateQuotationStatus]:", error);
            throw error;
        }
    }
};
