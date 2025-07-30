import { useState, useEffect } from 'react';
import { getDashboardMetrics } from '@/app/actions';

export interface DashboardMetrics {
  activeShipments: number;
  pendingOrders: number;
  thisMonthVolume: number;
  averageDeliveryTime: number;
}

export function useDashboardMetrics(ownerId: number | null) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeShipments: 0,
    pendingOrders: 0,
    thisMonthVolume: 0,
    averageDeliveryTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const metricsData = await getDashboardMetrics(ownerId);
        setMetrics(metricsData);
      } catch (err) {
        console.error('Error loading dashboard metrics:', err);
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [ownerId]);

  const refetch = async () => {
    if (ownerId) {
      try {
        setError(null);
        const metricsData = await getDashboardMetrics(ownerId);
        setMetrics(metricsData);
      } catch (err) {
        console.error('Error refetching dashboard metrics:', err);
        setError('Failed to refetch dashboard metrics');
      }
    }
  };

  return { metrics, loading, error, refetch };
}
