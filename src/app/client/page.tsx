
'use client';

import { useAuth } from '@/context/auth-context';

function ClientPage() {
  const { user } = useAuth();

  return (
      <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-headline">Welcome to the Client Section, {user?.displayName || 'User'}!</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-2">Client Dashboard</h2>
                <p className="text-muted-foreground">This is your protected client page.</p>
            </div>
          </div>
      </div>
  );
}

export default ClientPage;
