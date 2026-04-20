import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { laborRateService } from '@/services/rates';

/**
 * Hook for listing labor rates with search and pagination
 */
export const useLaborList = (limit = 25, offset = 0, search = '') => {
  return useQuery({
    queryKey: ['labor-list', { limit, offset, search }],
    queryFn: () => laborRateService.listRates(limit, offset, search),
  });
};

/**
 * Hook for creating a labor rate
 */
export const useCreateLabor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => laborRateService.createRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-list'] });
    },
  });
};

/**
 * Hook for updating a labor rate
 */
export const useUpdateLabor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => laborRateService.updateRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-list'] });
    },
  });
};

/**
 * Hook for deleting a labor rate
 */
export const useDeleteLabor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => laborRateService.deleteRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-list'] });
    },
  });
};
