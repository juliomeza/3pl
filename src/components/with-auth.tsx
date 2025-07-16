
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading, userInfo } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
      // This is fallback content, as the useEffect will redirect.
      return null
    }

    if (userInfo?.role) {
      const currentPath = window.location.pathname;
      const expectedPath = `/${userInfo.role}`;
      if (!currentPath.startsWith(expectedPath)) {
        router.push(expectedPath);
        return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
      }
    }
    
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
