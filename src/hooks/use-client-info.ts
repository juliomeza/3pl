'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { app } from '@/lib/firebase/config';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export interface ClientInfo {
  clientId: string | null;
  ownerId: number | null; // Backward compatibility
  projectIds: number[] | null; // New multi-project support
  loading: boolean;
  error: string | null;
}

export function useClientInfo(): ClientInfo {
  const { user } = useAuth();
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientId: null,
    ownerId: null,
    projectIds: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchClientInfo() {
      if (!user?.uid) {
        setClientInfo({
          clientId: null,
          ownerId: null,
          projectIds: null,
          loading: false,
          error: 'User not authenticated'
        });
        return;
      }

      try {
        const firestoreDb = getFirestore(app);
        
        // Get user document to find clientId
        const userDocRef = doc(firestoreDb, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('User document not found');
        }

        const userData = userDoc.data();
        const clientId = userData?.clientId;

        if (!clientId) {
          throw new Error('Client ID not found in user profile');
        }

        // Get client document to find owner_id
        const clientDocRef = doc(firestoreDb, 'clients', clientId);
        const clientDoc = await getDoc(clientDocRef);

        if (!clientDoc.exists()) {
          throw new Error('Client document not found');
        }

        const clientData = clientDoc.data();
        
        // Support both old (owner_id) and new (project_id/project_ids) schema
        const ownerId = clientData?.owner_id;
        let projectIds = clientData?.project_ids || clientData?.project_id || (ownerId ? [ownerId] : null);

        // Ensure projectIds are numbers (Firebase might return strings)
        if (projectIds && Array.isArray(projectIds)) {
          projectIds = projectIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
        }


        if (!projectIds || projectIds.length === 0) {
          throw new Error('Project IDs not found in client profile');
        }

        setClientInfo({
          clientId,
          ownerId, // Keep for backward compatibility
          projectIds,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching client info:', error);
        setClientInfo({
          clientId: null,
          ownerId: null,
          projectIds: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    fetchClientInfo();
  }, [user?.uid]);

  return clientInfo;
}
