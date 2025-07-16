
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      console.log(`withAuth: useEffect triggered. Loading: ${loading}, User: ${!!user}`);
      // If loading is finished and there's no user, redirect to login.
      if (!loading && !user) {
        console.log('withAuth: No user found after loading, redirecting to /login.');
        router.push('/login');
      }
    }, [user, loading, router]);

    // While loading, show a loading indicator.
    if (loading) {
      console.log('withAuth: Render loading state.');
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If there is a user, render the wrapped component.
    if (user) {
      console.log('withAuth: User exists, rendering wrapped component.');
      return <WrappedComponent {...props} />;
    }

    // If no user and not loading, this will be null briefly before redirection.
    console.log('withAuth: Render null (pre-redirect).');
    return null;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
