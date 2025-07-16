
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
        router.push('/login');
        return;
      }

      if (userInfo?.role) {
        const currentPath = window.location.pathname;
        const expectedPath = `/${userInfo.role}`;
        if (!currentPath.startsWith(expectedPath)) {
          router.push(expectedPath);
        }
      }
    }, [user, userInfo, loading, router]);

    if (loading || !user || !userInfo) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // Ensure we don't render children if a redirect is imminent
    const currentPath = window.location.pathname;
    const expectedPath = `/${userInfo.role}`;
    if (!currentPath.startsWith(expectedPath)) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
