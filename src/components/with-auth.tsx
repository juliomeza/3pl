
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // This effect runs when the component mounts or when loading/user state changes.
      // It ensures that if auth state is resolved and there's no user, we redirect.
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    // While loading, show a loading indicator.
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading Auth...</div>;
    }

    // If there is a user, render the wrapped component.
    if (user) {
      return <WrappedComponent {...props} />;
    }

    // If no user and not loading, we'll be redirecting, so return null to avoid rendering anything.
    return null;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
