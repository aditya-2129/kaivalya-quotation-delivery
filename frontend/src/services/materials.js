import { databases, ID, Query } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

export const materialService = {
  // List all materials
  async listMaterials(limit = 100, offset = 0, search = '') {
    try {
      const queries = [
        Query.orderAsc("name"),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (search) {
        queries.push(Query.or([
          Query.contains("name", [search]),
          Query.contains("grade", [search])
        ]));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MATERIALS,
        queries
      );
      return response;
    } catch (error) {
      console.error("Appwrite Service Error [listMaterials]:", error);
      throw error;
    }
  },

  // Create document
  async createMaterial(data) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MATERIALS,
        ID.unique(),
        data
      );
    } catch (error) {
      console.error("Appwrite Service Error [createMaterial]:", error);
      throw error;
    }
  },
  
  // Generic CRUD
  async getMaterial(id) {
    return await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
  },
  async updateMaterial(id, data) {
    return await databases.updateDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id, data);
  },
  async deleteMaterial(id) {
    return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
  }
};
