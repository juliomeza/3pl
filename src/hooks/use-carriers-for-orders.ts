'use client';

import { useState, useEffect } from 'react';
import { getCarriersForOrders } from '@/app/actions';

interface Carrier {
  id: string;
  name: string;
}

export function useCarriersForOrders() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCarriers() {
      try {
        setLoading(true);
        setError(null);
        
        const carriersData = await getCarriersForOrders();
        setCarriers(carriersData);
      } catch (err) {
        console.error('Error loading carriers:', err);
        setError('Failed to load carriers');
        setCarriers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCarriers();
  }, []);

  return { carriers, loading, error };
}
