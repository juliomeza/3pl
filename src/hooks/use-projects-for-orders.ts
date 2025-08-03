'use client';

import { useState, useEffect } from 'react';
import { getProjectsForOrders } from '@/app/actions';
import { useAuth } from '@/context/auth-context';

interface Project {
  id: string;
  name: string;
}

export function useProjectsForOrders() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clientInfo } = useAuth();

  useEffect(() => {
    async function fetchProjects() {
      if (!clientInfo?.owner_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const projectsData = await getProjectsForOrders(clientInfo.owner_id);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [clientInfo?.owner_id]);

  return { projects, loading, error };
}
