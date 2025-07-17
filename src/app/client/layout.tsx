
'use client';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Bot, Home, PlusCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import withAuth from '@/components/with-auth';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        setIsScrolled(mainElement.scrollTop > 10);
      }
    };
    
    const mainElement = document.querySelector('main');
    mainElement?.addEventListener('scroll', handleScroll);
    
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-background">
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-foreground"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">Synapse3PL</span>
                        </Link>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {menuItems.map((item) => {
                            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <div className="flex-1 flex flex-col">
                 <header className={cn(
                    "sticky top-0 z-40 flex items-center justify-between p-4 md:justify-end transition-all duration-300",
                    isScrolled && "bg-background/80 backdrop-blur-lg border-b"
                  )}>
                    <div className="md:hidden">
                        <SidebarTrigger />
                    </div>
                    <DashboardHeader />
                </header>
                <main className="flex-1 flex flex-col overflow-y-auto">
                    <div className="p-4 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}

export default withAuth(ClientLayout);
