import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositories, QUERY_KEYS } from '../repositories';
import { Order, OrderType, OrderStatus } from '../types/order';

export function useOrdersQuery(filter?: { type?: OrderType; status?: OrderStatus; warehouseId?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.orders, filter?.type, filter?.status, filter?.warehouseId],
    queryFn: () => repositories.order.getOrders(filter),
  });
}

export function useCreateSalesOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) =>
      repositories.order.createSalesOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useAllocateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => repositories.order.allocateSalesOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useFulfillOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => repositories.order.fulfillSalesOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.velocity });
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      repositories.order.cancelSalesOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useReceivePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => repositories.order.receivePurchaseOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.velocity });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}
