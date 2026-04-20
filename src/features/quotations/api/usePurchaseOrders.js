import { useQuery } from '@tanstack/react-query';
import { purchaseOrderService } from '@/services/purchase-orders';

/**
 * Hook for listing purchase orders
 */
export const usePurchaseOrders = (limit = 25, offset = 0, filters = {}) => {
  return useQuery({
    queryKey: ['purchase-orders', { limit, offset, filters }],
    queryFn: () => purchaseOrderService.listOrders(limit, offset, filters),
  });
};

/**
 * Hook for fetching order metrics
 */
export const useOrderMetrics = (filters = {}) => {
  return useQuery({
    queryKey: ['order-metrics', { filters }],
    queryFn: () => purchaseOrderService.getOrderMetrics(filters),
  });
};
