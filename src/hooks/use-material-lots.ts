'use client';

import { getLotsForMaterial } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface MaterialLot {
  lot_code: string;
  total_available_amount: number;
  uom: string;
}

export function useMaterialLots(ownerId: number | null, materialCode?: string, projectId?: string) {
  const { data, loading, error, refetch } = useDataFetcher(
    getLotsForMaterial,
    {
      ownerId,
      initialData: [] as MaterialLot[],
      dependencies: [materialCode, projectId],
      errorMessage: 'Failed to load lots for material',
      enableRefetchLoading: true
    },
    materialCode || '',
    projectId
  );

  return { 
    lots: data, 
    loading, 
    error, 
    refetch 
  };
}