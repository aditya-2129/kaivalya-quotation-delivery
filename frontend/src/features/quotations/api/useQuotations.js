import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotations-draft';

/**
 * Hook for listing quotations from the database
 * @param {number} limit 
 * @param {number} offset 
 */
export const useQuotations = (limit = 25, offset = 0, filters = {}) => {
  return useQuery({
    queryKey: ['quotations', { limit, offset, filters }],
    queryFn: () => quotationService.listQuotations(limit, offset, filters),
  });
};

/**
 * Hook for fetching a single quotation by ID
 * @param {string} id 
 */
export const useQuotation = (id) => {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getQuotation(id),
    enabled: !!id,
  });
};

/**
 * Hook for creating a new quotation
 */
export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => quotationService.createQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};

/**
 * Hook for updating an existing quotation
 */
export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => quotationService.updateQuotation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    },
  });
};

/**
 * Hook for soft-deleting a quotation
 */
export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => quotationService.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};
