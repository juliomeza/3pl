
'use client';

import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

function ClientDashboardPage() {
  const { user, clientInfo, clientInfoLoading } = useAuth();

  return (
      <div>
          <div className="mb-8">
            {clientInfoLoading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              <h1 className="text-3xl font-bold font-headline">Welcome, {clientInfo?.name || user?.displayName || 'User'}!</h1>
            )}
            
            {clientInfoLoading ? (
               <Skeleton className="h-20 w-40 mt-4" />
            ) : clientInfo?.logo_url && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Client Logo:</p>
                <Image
                    src={clientInfo.logo_url}
                    alt={`${clientInfo.name} logo`}
                    width={160}
                    height={80}
                    className="rounded-md object-contain border p-2"
                    data-ai-hint="logo"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-2">Client Dashboard</h2>
                <p className="text-muted-foreground">This is your main dashboard.</p>
            </div>
          </div>
      </div>
  );
}

export default ClientDashboardPage;
