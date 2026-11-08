import { useQuery } from '@tanstack/react-query';
import { repositories, QUERY_KEYS } from '../repositories';

export function useWarehousesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.warehouses,
    queryFn: () => repositories.warehouse.getWarehouses(),
  });
}

export function useWarehouseDetailQuery(id?: string) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => (id ? repositories.warehouse.getWarehouseById(id) : null),
    enabled: !!id,
  });
}
