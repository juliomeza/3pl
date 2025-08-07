'use client';

import { getLicensePlatesForMaterial } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

export interface LicensePlate {
  license_plate_code: string;
  total_available_amount: number;
  uom: string;
}

export function useLicensePlates(ownerId: number | null, materialCode: string, projectIds: number[] | null, selectedProjectId?: string, lotCode?: string) {
  const { data, loading, error, refetch } = useDataFetcher(
    getLicensePlatesForMaterial,
    {
      ownerId,
      initialData: [] as LicensePlate[],
      dependencies: [materialCode, projectIds, selectedProjectId, lotCode],
      errorMessage: 'Failed to load license plates for material',
      enableRefetchLoading: true
    },
    materialCode,
    projectIds || [],
    selectedProjectId,
    lotCode
  );

  return { 
    licensePlates: data, 
    loading, 
    error, 
    refetch 
  };
}