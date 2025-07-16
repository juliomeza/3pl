
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // If loading is finished and there's no user, redirect to login.
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    // While loading, show a loading indicator.
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If there is a user, render the wrapped component.
    if (user) {
      return <WrappedComponent {...props} />;
    }

    // If no user and not loading, this will be null briefly before redirection.
    return null;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
