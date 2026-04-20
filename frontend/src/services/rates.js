import { databases, ID, Query } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const laborRateService = {
  async listRates(limit = 100, offset = 0, search = '') {
    try {
      const queries = [
        Query.orderAsc("process_name"),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (search) {
        queries.push(Query.contains("process_name", [search]));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.LABOR_RATES,
        queries
      );
      return response;
    } catch (error) {
      console.error("Labor Rate Service Error:", error);
      throw error;
    }
  },
  async createRate(data) {
    return await databases.createDocument(DATABASE_ID, COLLECTIONS.LABOR_RATES, ID.unique(), data);
  },
  async updateRate(id, data) {
    return await databases.updateDocument(DATABASE_ID, COLLECTIONS.LABOR_RATES, id, data);
  },
  async deleteRate(id) {
    return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.LABOR_RATES, id);
  }
};



export const bopRateService = {
  async listRates(limit = 100, offset = 0, search = '') {
    try {
      const queries = [
        Query.orderAsc("item_name"),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (search) {
        queries.push(Query.or([
          Query.contains("item_name", [search]),
          Query.contains("supplier", [search])
        ]));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BOP_LIBRARY,
        queries
      );
      return response;
    } catch (error) {
      console.error("BOP Rate Service Error:", error);
      throw error;
    }
  },
  async createRate(data) {
    return await databases.createDocument(DATABASE_ID, COLLECTIONS.BOP_LIBRARY, ID.unique(), data);
  },
  async updateRate(id, data) {
    return await databases.updateDocument(DATABASE_ID, COLLECTIONS.BOP_LIBRARY, id, data);
  },
  async deleteRate(id) {
    return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.BOP_LIBRARY, id);
  }
};
