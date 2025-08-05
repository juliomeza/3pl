'use client';

import { getLicensePlatesForMaterial } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface LicensePlate {
  license_plate_code: string;
  total_available_amount: number;
  uom: string;
}

export function useLicensePlates(ownerId: number | null, materialCode?: string, lotCode?: string, projectId?: string) {
  const { data, loading, error, refetch } = useDataFetcher(
    getLicensePlatesForMaterial,
    {
      ownerId,
      initialData: [] as LicensePlate[],
      dependencies: [materialCode, lotCode, projectId],
      errorMessage: 'Failed to load license plates for material',
      enableRefetchLoading: true
    },
    materialCode || '',
    lotCode,
    projectId
  );

  return { 
    licensePlates: data, 
    loading, 
    error, 
    refetch 
  };
}