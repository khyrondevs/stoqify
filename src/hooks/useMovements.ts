import { useQuery } from '@tanstack/react-query';
import { repositories, QUERY_KEYS } from '../repositories';
import { MovementFilter } from '../types/movement';

export function useMovementsQuery(filter?: MovementFilter) {
  return useQuery({
    queryKey: [...QUERY_KEYS.movements, filter?.type, filter?.warehouseId, filter?.sku],
    queryFn: () => repositories.movement.getMovements(filter),
  });
}
