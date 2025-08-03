
'use client';

import { Bot, Home, PlusCircle, BarChart3 } from 'lucide-react';
import DashboardLayout, { useHeaderControls } from '@/components/dashboard/dashboard-layout';
import withAuth from '@/components/with-auth';
import { useAuth } from '@/context/auth-context';

export { useHeaderControls };

const menuItems = [
  { href: '/client', label: 'Dashboard', icon: Home, exact: true },
  { href: '/client/orders', label: 'Create Order', icon: PlusCircle },
  { href: '/client/reports', label: 'Reports', icon: BarChart3 },
  { href: '/client/assistant', label: 'AI Assistant', icon: Bot },
];

function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clientInfo, clientInfoLoading } = useAuth();
  
  const logoConfig = {
    type: 'client' as const,
    clientInfo,
    clientInfoLoading,
  };
  
  return (
    <DashboardLayout 
      menuItems={menuItems} 
      logoConfig={logoConfig} 
      role="client"
    >
      {children}
    </DashboardLayout>
  );
}

export default withAuth(ClientLayout);
