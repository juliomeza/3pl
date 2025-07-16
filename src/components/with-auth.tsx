
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    console.log(`[withAuth] Rendering. Loading: ${loading}, User: ${!!user}`);

    useEffect(() => {
        // This effect only triggers after the initial loading is complete.
        if (!loading && !user) {
            console.log('[withAuth] Not loading and no user found. Redirecting to /login.');
            router.push('/login');
        }
    }, [user, loading, router]);


    // While loading, we show a loading indicator.
    // The AuthProvider itself also shows one, but this is a fallback.
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If loading is finished and there IS a user, we can render the component.
    if (user) {
      return <WrappedComponent {...props} />;
    }
    
    // If loading is finished and there is NO user, we render nothing,
    // allowing the useEffect to handle the redirect.
    return null;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
