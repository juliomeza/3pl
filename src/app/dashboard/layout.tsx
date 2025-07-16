
'use client';

import { useAuth } from '@/context/auth-context';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-background">
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            Synapse3PL
                        </Link>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={true}>
                                <Link href="/dashboard">
                                    <Home />
                                    <span>Overview</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <main className="flex-1 flex flex-col">
                 <header className="flex items-center justify-between p-4 border-b md:justify-end">
                    <div className="md:hidden">
                        <SidebarTrigger />
                    </div>
                    <DashboardHeader />
                </header>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    </SidebarProvider>
  );
}
