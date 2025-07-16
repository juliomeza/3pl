
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading, userInfo } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) {
        return;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      if (userInfo?.role) {
        const currentPath = window.location.pathname;
        const expectedPath = `/${userInfo.role}`;
        if (!currentPath.startsWith(expectedPath)) {
          router.replace(expectedPath);
        }
      }
    }, [user, userInfo, loading, router]);

    if (loading || !user || !userInfo) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // While redirecting, show a loading state instead of the component to prevent flashes of content
    const currentPath = window.location.pathname;
    const expectedPath = `/${userInfo.role}`;
    if (!currentPath.startsWith(expectedPath)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
