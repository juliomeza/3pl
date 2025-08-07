import { useState, useEffect } from 'react';
import { getProjectsForOrders } from '@/app/actions';

interface Project {
  id: string;
  name: string;
}

export function useProjectsForOrders(projectIds: number[] | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      if (!projectIds || projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getProjectsForOrders(projectIds);
        setProjects(result);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [projectIds]);

  const refetch = async () => {
    if (!projectIds || projectIds.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await getProjectsForOrders(projectIds);
      setProjects(result);
    } catch (err) {
      console.error('Error refetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, error, refetch };
}
