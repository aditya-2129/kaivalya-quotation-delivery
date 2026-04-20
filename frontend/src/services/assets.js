import { storage, ID } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';

const { BUCKETS } = APPWRITE_CONFIG;

export const assetService = {
    async uploadFile(file) {
        try {
            const response = await storage.createFile(
                BUCKETS.INQUIRY_FILES,
                ID.unique(),
                file
            );
            return response;
        } catch (error) {
            console.error("Appwrite Service Error [uploadFile]:", error);
            throw error;
        }
    },

    getFilePreview(fileId) {
        try {
            const result = storage.getFilePreview(BUCKETS.INQUIRY_FILES, fileId);
            return result?.href || result?.toString() || `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.INQUIRY_FILES}/files/${fileId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        } catch (error) {
            console.error("Appwrite Service Error [getFilePreview]:", error);
            // Fallback manual URL
            return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.INQUIRY_FILES}/files/${fileId}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        }
    },

    getFileView(fileId) {
        try {
            const result = storage.getFileView(BUCKETS.INQUIRY_FILES, fileId);
            return result?.href || result?.toString() || `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.INQUIRY_FILES}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        } catch (error) {
            console.error("Appwrite Service Error [getFileView]:", error);
            return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.INQUIRY_FILES}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        }
    },

    getFileDownload(fileId) {
        try {
            const result = storage.getFileDownload(BUCKETS.INQUIRY_FILES, fileId);
            return result?.href || result?.toString() || `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.INQUIRY_FILES}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        } catch (error) {
            console.error("Appwrite Service Error [getFileDownload]:", error);
            return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.INQUIRY_FILES}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        }
    },

    async deleteFile(fileId) {
        try {
            await storage.deleteFile(BUCKETS.INQUIRY_FILES, fileId);
            return true;
        } catch (error) {
            if (error?.code === 404 || error?.message?.includes('not found')) {
                return true;
            }
            console.error("Appwrite Service Error [deleteFile]:", error);
            throw error;
        }
    }
};
