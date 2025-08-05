'use client';

import { getOutboundInventory } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface OutboundInventoryItem {
  owner_id: number;
  project_id: number;
  material_name: string;
  material_description: string;
  material_code: string;
  total_available_amount: number;
  uom: string;
}

export function useOutboundInventory(ownerId: number | null, projectId?: string) {
  const { data, loading, error, refetch } = useDataFetcher(
    getOutboundInventory,
    {
      ownerId,
      initialData: [] as OutboundInventoryItem[],
      dependencies: [projectId],
      errorMessage: 'Failed to load available inventory',
      enableRefetchLoading: true
    },
    projectId
  );

  return { 
    inventory: data, 
    loading, 
    error, 
    refetch 
  };
}