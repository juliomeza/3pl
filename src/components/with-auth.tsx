
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
      if (loading) {
        return;
      }

      if (!user) {
        router.replace('/');
        return;
      }

      if (userInfo) {
        const { role } = userInfo;
        
        if (role === 'none') {
            if (pathname !== '/pending-access') {
                router.replace('/pending-access');
            }
            return;
        }

        const expectedBasePath = `/${role}`;

        if (!pathname.startsWith(expectedBasePath)) {
          router.replace(expectedBasePath);
        }
      }
    }, [user, userInfo, loading, router, pathname]);

    if (loading || !userInfo) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (userInfo && !pathname.startsWith(`/${userInfo.role}`) && userInfo.role !== 'none') {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (userInfo.role === 'none' && pathname !== '/pending-access') {
       return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
