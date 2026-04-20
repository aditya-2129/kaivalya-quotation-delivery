import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customers';

/**
 * Hook for listing customers with search and pagination
 */
export const useCustomers = (limit = 25, offset = 0, search = '') => {
  return useQuery({
    queryKey: ['customers', { limit, offset, search }],
    queryFn: () => customerService.listCustomers(limit, offset, search),
  });
};

/**
 * Hook for creating a customer
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

/**
 * Hook for updating a customer
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

/**
 * Hook for deleting a customer
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
