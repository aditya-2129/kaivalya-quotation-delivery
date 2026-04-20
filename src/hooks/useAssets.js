import { useState } from 'react';
import { assetService } from '@/services/assets';

/**
 * Custom Hook for managing asset uploads and deletions
 */
export const useAssets = () => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload a single file to Appwrite
   * @param {File} file 
   */
  const uploadFile = async (file) => {
    setIsUploading(true);
    try {
      const response = await assetService.uploadFile(file);
      return {
        $id: response.$id,
        name: response.name,
        sizeOriginal: response.sizeOriginal,
        mimeType: response.mimeType,
      };
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Upload multiple files
   * @param {File[]} files 
   */
  const uploadFiles = async (files) => {
    setIsUploading(true);
    try {
      const responses = await Promise.all(files.map(file => assetService.uploadFile(file)));
      return responses.map(response => ({
        $id: response.$id,
        name: response.name,
        sizeOriginal: response.sizeOriginal,
        mimeType: response.mimeType,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Delete a file from Appwrite
   * @param {string} fileId 
   */
  const deleteFile = async (fileId) => {
    if (!fileId) return;
    try {
      await assetService.deleteFile(fileId);
    } catch (error) {
      console.error("Asset deletion failed:", error);
    }
  };

  /**
   * Generate a preview URL for an Appwrite asset
   * @param {string} fileId 
   */
  const getPreviewUrl = (fileId) => {
    if (!fileId) return null;
    return assetService.getFilePreview(fileId)?.toString();
  };

  return {
    isUploading,
    uploadFile,
    uploadFiles,
    deleteFile,
    getPreviewUrl,
  };
};
