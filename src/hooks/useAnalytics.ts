import { useQuery } from '@tanstack/react-query';
import { repositories, QUERY_KEYS } from '../repositories';

export function useDashboardMetricsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => repositories.analytics.getDashboardMetrics(),
  });
}

export function useVelocityTrendsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.velocity,
    queryFn: () => repositories.analytics.getVelocityTrends(),
  });
}

export function useCategoryBreakdownQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => repositories.analytics.getCategoryBreakdown(),
  });
}
