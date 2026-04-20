import { databases, ID, Query } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const customerService = {
  // List all customers
  async listCustomers(limit = 25, offset = 0, searchQuery = "") {
    try {
      const queries = [
        Query.orderAsc("name"),
        Query.limit(limit),
        Query.offset(offset)
      ];

      // Note: search in appwrite requires an existing search index on the attribute
      if (searchQuery) {
        queries.push(Query.or([
          Query.contains("name", [searchQuery]),
          Query.contains("contact_person", [searchQuery]),
          Query.contains("email", [searchQuery]),
          Query.contains("phone", [searchQuery])
        ]));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOMERS,
        queries
      );
      return response;
    } catch (error) {
      console.error("Appwrite Service Error [listCustomers]:", error);
      throw error;
    }
  },

  // Create document
  async createCustomer(data) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CUSTOMERS,
        ID.unique(),
        data
      );
    } catch (error) {
      console.error("Appwrite Service Error [createCustomer]:", error);
      throw error;
    }
  },
  
  // Generic CRUD
  async getCustomer(id) {
    return await databases.getDocument(DATABASE_ID, COLLECTIONS.CUSTOMERS, id);
  },
  async updateCustomer(id, data) {
    return await databases.updateDocument(DATABASE_ID, COLLECTIONS.CUSTOMERS, id, data);
  },
  async deleteCustomer(id) {
    return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CUSTOMERS, id);
  }
};
