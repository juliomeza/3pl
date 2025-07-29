
'use client';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Bot, Home, PlusCircle, BarChart3, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import withAuth from '@/components/with-auth';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

const menuItems = [
  { href: '/client', label: 'Dashboard', icon: Home, exact: true },
  { href: '/client/orders', label: 'Create Order', icon: PlusCircle },
  { href: '/client/reports', label: 'Reports', icon: BarChart3 },
  { href: '/client/assistant', label: 'AI Assistant', icon: Bot },
];

function ClientSidebarContent() {
  const { state } = useSidebar();
  const { clientInfo, clientInfoLoading } = useAuth();
  const pathname = usePathname();
  const isCollapsed = state === 'collapsed';

  return (
    <>
      <SidebarHeader className="p-4">
        {/* Logo y nombre cuando está expandido */}
        {!isCollapsed && (
          <div className="relative flex items-center justify-between">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {clientInfoLoading ? (
                <>
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-24 h-4" />
                </>
              ) : clientInfo && (
                <>
                  {clientInfo.logo_url && (
                    <Image
                      src={clientInfo.logo_url}
                      alt={`${clientInfo.name} logo`}
                      width={32}
                      height={32}
                      style={{ width: '32px', height: 'auto' }}
                      className="rounded-full object-contain"
                      data-ai-hint="logo"
                    />
                  )}
                  <span className="font-semibold text-md pr-10">{clientInfo.name}</span>
                </>
              )}
            </div>
            {/* Fixed position collapse button - positioned at the very edge */}
            <button 
              onClick={() => {
                const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
                trigger?.click();
              }}
              className="absolute -right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 hover:bg-gray-100 rounded-md z-10 flex items-center justify-center"
            >
              <PanelLeftClose className="w-6 h-6 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        )}
        
        {/* Solo logo cuando está colapsado */}
        {isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {clientInfoLoading ? (
              <Skeleton className="w-8 h-8 rounded-full" />
            ) : clientInfo && clientInfo.logo_url ? (
              <div className="relative group cursor-pointer">
                <Image
                  src={clientInfo.logo_url}
                  alt={`${clientInfo.name} logo`}
                  width={32}
                  height={32}
                  style={{ width: '32px', height: 'auto' }}
                  className="rounded-full object-contain transition-opacity duration-200 group-hover:opacity-20"
                  onClick={() => {
                    // Trigger sidebar expand
                    const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
                    trigger?.click();
                  }}
                />
                {/* Icono de expand que aparece en hover sobre el logo */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                >
                  <path d="M3 12H21M21 12L17 8M21 12L17 16"/>
                </svg>
              </div>
            ) : (
              <SidebarTrigger className="h-8 w-8 hover:bg-gray-100">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4"
                >
                  <path d="M3 12H21M21 12L17 8M21 12L17 16"/>
                </svg>
              </SidebarTrigger>
            )}
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link href={item.href} className={isCollapsed ? "justify-center" : ""}>
                    <item.icon className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className={`flex items-center h-14 p-2 ${isCollapsed ? 'justify-center' : 'justify-start gap-2'}`}>
          <Link href="/" className={`flex items-center font-headline text-md font-semibold text-foreground ${isCollapsed ? 'gap-0' : 'gap-2'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-foreground ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            {!isCollapsed && <span>Reliable 3PL</span>}
          </Link>
        </div>
      </SidebarFooter>
    </>
  );
}

function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { clientInfo, clientInfoLoading } = useAuth();

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
        <div className="flex min-h-screen bg-background w-full">
            <Sidebar>
                <ClientSidebarContent />
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
