
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    console.log('withAuth HOC rendering. State:', { loading, user: user ? user.email : null });

    useEffect(() => {
      console.log('withAuth HOC useEffect triggered. State:', { loading, user: user ? user.email : null });
      // If loading is finished and there's no user, redirect to login.
      if (!loading && !user) {
        console.log('withAuth HOC: NOT LOADING and NO USER. Redirecting to /login.');
        router.push('/login');
      }
    }, [user, loading, router]);

    // While loading, show a loading indicator.
    if (loading) {
      console.log('withAuth HOC: LOADING. Showing loading screen.');
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If there is a user, render the wrapped component.
    if (user) {
      console.log('withAuth HOC: USER FOUND. Rendering component.');
      return <WrappedComponent {...props} />;
    }

    // If no user and not loading, this will be null briefly before redirection.
    console.log('withAuth HOC: NO USER and NOT LOADING. Rendering null while redirecting.');
    return null;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
