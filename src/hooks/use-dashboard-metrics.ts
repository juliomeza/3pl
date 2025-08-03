import { getDashboardMetrics } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface DashboardMetrics {
  activeShipments: number;
  pendingOrders: number;
  thisMonthVolume: number;
  averageDeliveryTime: number;
}

export function useDashboardMetrics(ownerId: number | null) {
  const { data: metrics, loading, error, refetch } = useDataFetcher(
    getDashboardMetrics,
    {
      ownerId,
      initialData: {
        activeShipments: 0,
        pendingOrders: 0,
        thisMonthVolume: 0,
        averageDeliveryTime: 0
      } as DashboardMetrics,
      errorMessage: 'Failed to load dashboard metrics',
      enableRefetchLoading: false
    }
  );

  return { metrics, loading, error, refetch };
}
