
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
        return; // Wait until loading is false
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      // Once user and userInfo are loaded, check for correct role path
      if (userInfo?.role) {
        const currentPath = window.location.pathname;
        const expectedPath = `/${userInfo.role}`;
        
        // If user is on the wrong dashboard, redirect them to the correct one.
        if (!currentPath.startsWith(expectedPath)) {
          router.replace(expectedPath);
        }
      }
    }, [user, userInfo, loading, router]);

    // Render a loading state while auth state is being determined or redirection is happening.
    if (loading || !user || !userInfo) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // While redirecting, show a loading state instead of the component to prevent flashes of incorrect content.
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
