import { useState, useEffect } from 'react';
import { getShipmentTrends, getDeliveryPerformance } from '@/app/actions';

export interface TrendDataPoint {
  month_name: string;
  shipment_count: number;
}

export interface PerformanceDataPoint {
  status: string;
  count: number;
}

export function useShipmentTrends(ownerId: number | null, period: 'last30days' | 'thisMonth' | 'thisYear' | 'last6months' = 'last6months') {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const trendsData = await getShipmentTrends(ownerId, period);
        setData(trendsData);
      } catch (err) {
        console.error('Error loading shipment trends:', err);
        setError('Failed to load shipment trends');
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [ownerId, period]);

  const refetch = async () => {
    if (ownerId) {
      try {
        setError(null);
        const trendsData = await getShipmentTrends(ownerId, period);
        setData(trendsData);
      } catch (err) {
        console.error('Error refetching shipment trends:', err);
        setError('Failed to refetch shipment trends');
      }
    }
  };

  return { data, loading, error, refetch };
}

export function useDeliveryPerformance(ownerId: number | null) {
  const [data, setData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerformance() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const performanceData = await getDeliveryPerformance(ownerId);
        setData(performanceData);
      } catch (err) {
        console.error('Error loading delivery performance:', err);
        setError('Failed to load delivery performance');
      } finally {
        setLoading(false);
      }
    }

    fetchPerformance();
  }, [ownerId]);

  const refetch = async () => {
    if (ownerId) {
      try {
        setError(null);
        const performanceData = await getDeliveryPerformance(ownerId);
        setData(performanceData);
      } catch (err) {
        console.error('Error refetching delivery performance:', err);
        setError('Failed to refetch delivery performance');
      }
    }
  };

  return { data, loading, error, refetch };
}
