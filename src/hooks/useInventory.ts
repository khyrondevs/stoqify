import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositories, QUERY_KEYS } from '../repositories';
import { StockAdjustmentInput, StockTransferInput } from '../repositories/interfaces';

export function useInventoryQuery(filter?: { category?: string; warehouseId?: string; search?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inventory, filter?.category, filter?.warehouseId, filter?.search],
    queryFn: () => repositories.inventory.getItems(filter),
  });
}

export function useProductDetailQuery(sku?: string) {
  return useQuery({
    queryKey: sku ? QUERY_KEYS.inventoryDetail(sku) : ['inventory', 'none'],
    queryFn: () => (sku ? repositories.inventory.getItemBySku(sku) : null),
    enabled: !!sku,
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => repositories.inventory.adjustStock(input),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryDetail(updatedProduct.sku) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useTransferStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StockTransferInput) => repositories.inventory.transferStock(input),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryDetail(updatedProduct.sku) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}
