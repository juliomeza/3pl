import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getActiveOrders } from '@/app/actions';

export interface ActiveOrder {
  order_number: string;
  shipment_number?: string;
  customer: string;
  recipient_name?: string;
  recipient_city?: string;
  recipient_state?: string;
  display_status: string;  // New unified status field
  delivery_status?: string; // Original delivery_status (for backward compatibility)
  order_fulfillment_date?: string;
  estimated_delivery_date?: string;
  order_created_date: string;
  carrier?: string;
  service_type?: string;
  tracking_numbers?: string;
  source_table: 'portal' | 'operations';  // Which table the data comes from
}

export function useActiveOrders(ownerId: number | null) {
  const [isVisible, setIsVisible] = useState(true);

  // Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const { 
    data: activeOrders = [], 
    isLoading: loading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['activeOrders', ownerId],
    queryFn: () => getActiveOrders(ownerId!),
    enabled: ownerId !== null, // Only run query if ownerId exists
    refetchInterval: isVisible ? 30 * 1000 : false, // 30 seconds when visible, pause when hidden
    staleTime: 25 * 1000, // Consider data fresh for 25 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchIntervalInBackground: false, // Don't poll in background tabs
  });

  return { 
    activeOrders: activeOrders as ActiveOrder[], 
    loading, 
    error: error ? String(error) : null, 
    refetch 
  };
}
