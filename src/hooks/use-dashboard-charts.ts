
import { getShipmentTrends, getDeliveryPerformance, getTopDestinations } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface TrendDataPoint {
  month_name: string;
  shipment_count: number;
}

export interface PerformanceDataPoint {
  status: string;
  count: number;
}

export interface DestinationDataPoint {
  destination: string;
  shipment_count: number;
  percentage: number;
}

export function useShipmentTrends(ownerId: number | null, period: 'last30days' | 'thisMonth' | 'thisYear' | 'last6months' = 'last6months') {
  const { data, loading, error, refetch } = useDataFetcher(
    getShipmentTrends,
    {
      ownerId,
      initialData: [] as TrendDataPoint[],
      dependencies: [period],
      errorMessage: 'Failed to load shipment trends',
      enableRefetchLoading: false
    },
    period
  );

  return { data, loading, error, refetch };
}

export function useDeliveryPerformance(ownerId: number | null) {
  const { data, loading, error, refetch } = useDataFetcher(
    getDeliveryPerformance,
    {
      ownerId,
      initialData: [] as PerformanceDataPoint[],
      errorMessage: 'Failed to load delivery performance',
      enableRefetchLoading: false
    }
  );

  return { data, loading, error, refetch };
}

export function useTopDestinations(ownerId: number | null, period: 'last90days' = 'last90days') {
  const { data, loading, error, refetch } = useDataFetcher(
    getTopDestinations,
    {
      ownerId,
      initialData: [] as DestinationDataPoint[],
      dependencies: [period],
      errorMessage: 'Failed to load top destinations',
      enableRefetchLoading: false
    },
    period
  );

  return { data, loading, error, refetch };
}
