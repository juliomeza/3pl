
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, userInfo, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Don't do anything while loading
      if (loading) {
        return;
      }

      // If loading is finished and there's no user, redirect to login
      if (!user) {
        router.replace('/login');
        return;
      }

      // If user and userInfo are loaded, we can check for correct role path
      if (user && userInfo) {
        const currentPath = window.location.pathname;
        const expectedPath = `/${userInfo.role}`;
        
        // If user is on the wrong dashboard, redirect them to the correct one.
        if (!currentPath.startsWith(expectedPath)) {
          router.replace(expectedPath);
        }
      }
    }, [user, userInfo, loading, router]);

    // While loading or if user/userInfo is not yet available, show a loading screen.
    if (loading || !user || !userInfo) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // Security check: If userInfo is loaded, but the user is on the wrong path,
    // continue showing loading to prevent flashing incorrect content during redirection.
    const currentPath = window.location.pathname;
    const expectedPath = `/${userInfo.role}`;
    if (!currentPath.startsWith(expectedPath)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If everything is correct, render the actual component.
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
