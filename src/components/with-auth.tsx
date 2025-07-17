
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, userInfo, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      // Don't do anything while loading.
      if (loading) {
        return;
      }

      // If loading is finished and there's no user, redirect to login.
      if (!user) {
        router.replace('/login');
        return;
      }

      // If user info is available, handle role-based redirection.
      if (userInfo) {
        const { role } = userInfo;
        
        if (role === 'none') {
            // If role is 'none', redirect to pending access page.
            if (pathname !== '/pending-access') {
                router.replace('/pending-access');
            }
            return;
        }

        const expectedPath = `/${role}`;

        // If user is on a protected route but it doesn't match their role, redirect them.
        if (pathname !== expectedPath) {
          router.replace(expectedPath);
        }
      }
    }, [user, userInfo, loading, router, pathname]);

    // While loading or if user/userInfo is not yet available, show a loading screen.
    // Also, show loading if the user is not on the correct path yet, to prevent content flashing.
    if (loading || !userInfo || (userInfo && pathname !== `/${userInfo.role}` && userInfo.role !== 'none')) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // If a user with 'none' role somehow lands here, show loading to prevent flashing.
    if (userInfo.role === 'none' && pathname !== '/pending-access') {
       return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If everything is correct, render the actual component.
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
