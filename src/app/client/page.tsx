
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
          </div>
          {clientInfoLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-32 w-32" />
            </div>
          ) : (
            clientInfo && clientInfo.logo_url && (
              <div className="mb-8">
                <p className="text-muted-foreground mb-2">Client Logo:</p>
                <Image
                  src={`${clientInfo.logo_url}&t=${new Date().getTime()}`}
                  alt={`${clientInfo.name} logo`}
                  width={128}
                  height={128}
                  className="rounded-md object-contain border p-2"
                  data-ai-hint="logo"
                />
              </div>
            )
          )}
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
