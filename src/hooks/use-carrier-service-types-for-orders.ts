'use client';

import { useState, useEffect } from 'react';
import { getCarrierServiceTypesForOrders } from '@/app/actions';

interface CarrierServiceType {
  id: string;
  name: string;
}

export function useCarrierServiceTypesForOrders(carrierId: string) {
  const [serviceTypes, setServiceTypes] = useState<CarrierServiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServiceTypes() {
      if (!carrierId) {
        setServiceTypes([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const serviceTypesData = await getCarrierServiceTypesForOrders(carrierId);
        setServiceTypes(serviceTypesData);
      } catch (err) {
        console.error('Error loading carrier service types:', err);
        setError('Failed to load service types');
        setServiceTypes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchServiceTypes();
  }, [carrierId]);

  return { serviceTypes, loading, error };
}
