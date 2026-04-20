import { databases, Query, ID } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const purchaseOrderService = {
    /**
     * List purchase orders with filters
     */
    async listOrders(limit = 25, offset = 0, filters = {}) {
        try {
            const queries = [
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
                Query.offset(offset)
            ];

            const searchTerm = (filters.search || '').trim();
            if (searchTerm) {
                queries.push(Query.or([
                    Query.contains('po_number', searchTerm),
                    Query.contains('customer_name', searchTerm)
                ]));
            }

            if (filters.engineer && filters.engineer !== 'All') {
                queries.push(Query.equal('engineer_name', filters.engineer));
            }

            if (filters.status && filters.status !== 'All') {
                queries.push(Query.equal('status', filters.status));
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
                COLLECTIONS.PURCHASE_ORDERS,
                queries
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [listOrders]:", error);
            throw error;
        }
    },

    /**
     * Get summary metrics for purchase orders
     */
    async getOrderMetrics(filters = {}) {
        try {
            const selectFields = Query.select(['total_amount', 'actual_valuation', 'status', '$createdAt']);
            const baseLimit = Query.limit(5000);

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const activeStatuses = ['Received', 'In Production', 'Shipped'];

            const periodQueries = [baseLimit, selectFields];
            if (filters.dateRange?.start && filters.dateRange?.end) {
                const startDate = new Date(filters.dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(filters.dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                periodQueries.push(Query.greaterThanEqual('$createdAt', startDate.toISOString()));
                periodQueries.push(Query.lessThanEqual('$createdAt', endDate.toISOString()));
            }

            const [allRes, currentMonthRes, activeRes, periodRes] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, [baseLimit, Query.select(['$id'])]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, [
                    baseLimit, selectFields,
                    Query.greaterThanEqual('$createdAt', monthStart),
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, [
                    baseLimit, selectFields,
                    Query.or(activeStatuses.map(s => Query.equal('status', s))),
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, periodQueries),
            ]);

            const sumValue = (docs) => docs.reduce((sum, doc) => sum + (parseFloat(doc.actual_valuation || doc.total_amount) || 0), 0);

            return {
                count: allRes.total,
                currentMonthValue: sumValue(currentMonthRes.documents),
                activeValue: sumValue(activeRes.documents),
                selectedPeriodValue: sumValue(periodRes.documents),
            };
        } catch (error) {
            console.error("Appwrite Service Error [getOrderMetrics]:", error);
            return { count: 0, currentMonthValue: 0, activeValue: 0, selectedPeriodValue: 0 };
        }
    },

    /**
     * Get a specific order
     */
    async getOrder(id) {
        try {
            return await databases.getDocument(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, id);
        } catch (error) {
            console.error("Appwrite Service Error [getOrder]:", error);
            throw error;
        }
    },

    /**
     * Create a PO from a quotation (Internal use mainly)
     */
    async createOrder(data) {
        try {
            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PURCHASE_ORDERS,
                ID.unique(),
                data
            );
        } catch (error) {
            console.error("Appwrite Service Error [createOrder]:", error);
            throw error;
        }
    },
    /**
     * Update order status
     */
    async updateStatus(id, status) {
        try {
            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PURCHASE_ORDERS,
                id,
                { status }
            );
        } catch (error) {
            console.error("Appwrite Service Error [updateOrderStatus]:", error);
            throw error;
        }
    },

    async deleteOrder(id) {
        try {
            return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PURCHASE_ORDERS, id);
        } catch (error) {
            console.error("Appwrite Service Error [deleteOrder]:", error);
            throw error;
        }
    }
};
