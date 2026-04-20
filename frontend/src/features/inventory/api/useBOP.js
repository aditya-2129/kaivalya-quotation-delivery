import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bopRateService } from '@/services/rates';

/**
 * Hook for listing BOP items with search and pagination
 */
export const useBOPList = (limit = 25, offset = 0, search = '') => {
  return useQuery({
    queryKey: ['bop-list', { limit, offset, search }],
    queryFn: () => bopRateService.listRates(limit, offset, search),
  });
};

/**
 * Hook for creating a BOP item
 */
export const useCreateBOP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => bopRateService.createRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bop-list'] });
    },
  });
};

/**
 * Hook for updating a BOP item
 */
export const useUpdateBOP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bopRateService.updateRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bop-list'] });
    },
  });
};

/**
 * Hook for deleting a BOP item
 */
export const useDeleteBOP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => bopRateService.deleteRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bop-list'] });
    },
  });
};
