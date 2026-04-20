import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService } from '@/services/materials';

/**
 * Hook for listing materials with search and pagination
 */
export const useMaterials = (limit = 25, offset = 0, search = '') => {
  return useQuery({
    queryKey: ['materials', { limit, offset, search }],
    queryFn: () => materialService.listMaterials(limit, offset, search),
  });
};

/**
 * Hook for creating a material
 */
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => materialService.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

/**
 * Hook for updating a material
 */
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => materialService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

/**
 * Hook for deleting a material
 */
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => materialService.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};
