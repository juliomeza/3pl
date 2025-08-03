import { getProjectsForOrders } from '@/app/actions';
import { useDataFetcher } from './use-data-fetcher';

interface Project {
  id: string;
  name: string;
}

export function useProjectsForOrders(ownerId: number | null) {
  const { data: projects, loading, error, refetch } = useDataFetcher(
    getProjectsForOrders,
    {
      ownerId,
      initialData: [] as Project[],
      errorMessage: 'Failed to load projects',
      enableRefetchLoading: true
    }
  );

  return { projects, loading, error, refetch };
}
