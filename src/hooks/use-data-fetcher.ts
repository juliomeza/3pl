import { useState, useEffect } from 'react';

interface UseDataFetcherOptions<T> {
  ownerId: number | null;
  initialData: T;
  dependencies?: any[];
  errorMessage?: string;
  enableRefetchLoading?: boolean;
}

interface UseDataFetcherResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDataFetcher<T, P extends any[]>(
  fetchFn: (ownerId: number, ...params: P) => Promise<T>,
  options: UseDataFetcherOptions<T>,
  ...params: P
): UseDataFetcherResult<T> {
  const { 
    ownerId, 
    initialData, 
    dependencies = [], 
    errorMessage = 'Failed to load data',
    enableRefetchLoading = true 
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn(ownerId, ...params);
        setData(result);
      } catch (err) {
        console.error(`Error loading data:`, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [ownerId, ...dependencies]);

  const refetch = async () => {
    if (ownerId) {
      try {
        if (enableRefetchLoading) {
          setLoading(true);
        }
        setError(null);
        const result = await fetchFn(ownerId, ...params);
        setData(result);
      } catch (err) {
        console.error(`Error refetching data:`, err);
        setError(errorMessage);
      } finally {
        if (enableRefetchLoading) {
          setLoading(false);
        }
      }
    }
  };

  return { data, loading, error, refetch };
}