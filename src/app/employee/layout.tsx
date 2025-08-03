
'use client';

import { Bot, Home, Building2, BarChart3 } from 'lucide-react';
import DashboardLayout, { useHeaderControls } from '@/components/dashboard/dashboard-layout';
import withAuth from '@/components/with-auth';

export { useHeaderControls };

const menuItems = [
  { href: '/employee', label: 'Dashboard', icon: Home, exact: true },
  { href: '/employee/management', label: 'Management', icon: Building2 },
  { href: '/employee/reports', label: 'Reports', icon: BarChart3 },
  { href: '/employee/assistant', label: 'AI Assistant', icon: Bot },
];

function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoConfig = {
    type: 'company' as const,
    companyName: 'Reliable 3PL',
  };
  
  return (
    <DashboardLayout 
      menuItems={menuItems} 
      logoConfig={logoConfig} 
      role="employee"
    >
      {children}
    </DashboardLayout>
  );
}

export default withAuth(EmployeeLayout);
