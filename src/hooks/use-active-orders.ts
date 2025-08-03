import { getActiveOrders } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface ActiveOrder {
  order_number: string;
  shipment_number?: string;
  customer: string;
  recipient_name?: string;
  recipient_city?: string;
  recipient_state?: string;
  delivery_status: string;
  order_fulfillment_date?: string;
  estimated_delivery_date?: string;
  order_created_date: string;
  carrier?: string;
  service_type?: string;
  tracking_numbers?: string;
}

export function useActiveOrders(ownerId: number | null) {
  const { data: activeOrders, loading, error, refetch } = useDataFetcher(
    getActiveOrders,
    {
      ownerId,
      initialData: [] as ActiveOrder[],
      errorMessage: 'Failed to load active orders',
      enableRefetchLoading: true
    }
  );

  return { activeOrders, loading, error, refetch };
}
