import { useDataFetcher } from '@/hooks/use-data-fetcher';
import { getOrderDetails } from '@/app/actions';

export function useOrderDetails(ownerId: number | null, orderNumber?: string | null) {
  const { data, loading, error, refetch } = useDataFetcher(
    async (oid: number, on?: string) => {
      if (!on) return null as any;
      return await getOrderDetails(oid, on);
    },
    {
      ownerId,
      initialData: null as any,
      dependencies: [orderNumber],
      errorMessage: 'Failed to load order details',
    },
    orderNumber || undefined
  );

  return { details: data as any, loading, error, refetch };
}
