
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    console.log('[withAuth] Rendering. State:', { loading, user: !!user });

    if (loading) {
      console.log('[withAuth] Still loading auth state. Rendering loading indicator.');
      return <div className="flex items-center justify-center min-h-screen">Authenticating...</div>;
    }

    if (!user) {
      console.log('[withAuth] Not loading and no user. Rendering auth failed message.');
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Authentication Failed</h1>
            <p className="text-muted-foreground mb-8">You are not logged in. Please go to the login page to sign in.</p>
            <button onClick={() => router.push('/login')} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Go to Login
            </button>
        </div>
      );
    }
    
    console.log('[withAuth] Auth check passed. Rendering wrapped component.');
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
