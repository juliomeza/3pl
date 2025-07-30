
import { useState, useEffect } from 'react';
import { getShipmentTrends, getDeliveryPerformance, getTopDestinations } from '@/app/actions';

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

export function useTopDestinations(ownerId: number | null, period: 'last90days' = 'last90days') {
  const [data, setData] = useState<DestinationDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopDestinations() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const destinationsData = await getTopDestinations(ownerId, period);
        setData(destinationsData);
      } catch (err) {
        console.error('Error loading top destinations:', err);
        setError('Failed to load top destinations');
      } finally {
        setLoading(false);
      }
    }

    fetchTopDestinations();
  }, [ownerId, period]);

  const refetch = async () => {
    if (ownerId) {
      try {
        setError(null);
        const destinationsData = await getTopDestinations(ownerId, period);
        setData(destinationsData);
      } catch (err) {
        console.error('Error refetching top destinations:', err);
        setError('Failed to refetch top destinations');
      }
    }
  };

  return { data, loading, error, refetch };
}
