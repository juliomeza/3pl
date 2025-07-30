import { useState, useEffect } from 'react';
import { getActiveOrders } from '@/app/actions';

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
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveOrders() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const orders = await getActiveOrders(ownerId);
        setActiveOrders(orders);
      } catch (err) {
        console.error('Error loading active orders:', err);
        setError('Failed to load active orders');
      } finally {
        setLoading(false);
      }
    }

    fetchActiveOrders();
  }, [ownerId]);

  const refetch = async () => {
    if (ownerId) {
      try {
        setLoading(true);
        setError(null);
        const orders = await getActiveOrders(ownerId);
        setActiveOrders(orders);
      } catch (err) {
        console.error('Error refetching active orders:', err);
        setError('Failed to load active orders');
      } finally {
        setLoading(false);
      }
    }
  };

  return { activeOrders, loading, error, refetch };
}
