import { useQuery } from '@tanstack/react-query';
import { approvedQuotationService } from '@/services/quotations-approved';

/**
 * Hook for listing approved quotations
 * @param {number} limit 
 * @param {number} offset 
 * @param {object} filters
 */
export const useApprovedQuotations = (limit = 25, offset = 0, filters = {}) => {
  return useQuery({
    queryKey: ['approved-quotations', { limit, offset, filters }],
    queryFn: () => approvedQuotationService.listApprovedQuotations(limit, offset, filters),
  });
};

/**
 * Hook for fetching summary metrics for approved quotations
 * @param {object} filters 
 */
export const useApprovedMetrics = (filters = {}) => {
  return useQuery({
    queryKey: ['approved-metrics', { filters }],
    queryFn: () => approvedQuotationService.getApprovedMetrics(filters),
  });
};
