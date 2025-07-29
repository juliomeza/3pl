
'use client';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Bot, Home, Building2, BarChart3, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import withAuth from '@/components/with-auth';

const menuItems = [
  { href: '/employee', label: 'Dashboard', icon: Home, exact: true },
  { href: '/employee/management', label: 'Management', icon: Building2 },
  { href: '/employee/reports', label: 'Reports', icon: BarChart3 },
  { href: '/employee/assistant', label: 'AI Assistant', icon: Bot },
];

function EmployeeSidebarContent() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === 'collapsed';

  return (
    <>
      <SidebarHeader className="p-4">
        {/* Logo y nombre cuando está expandido */}
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-foreground">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span>Reliable 3PL</span>
            </Link>
            <SidebarTrigger className="h-8 w-8 hover:bg-gray-100" />
          </div>
        )}
        
        {/* Solo logo cuando está colapsado */}
        {isCollapsed && (
          <div className="flex flex-col items-center w-full">
            <SidebarTrigger className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group h-auto w-auto relative">
              {/* Logo de Reliable 3PL visible por defecto */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-8 h-8 text-foreground group-hover:opacity-0 transition-opacity duration-200"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              {/* Icono de expand que aparece en hover */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-8 h-8 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <path d="M21 12H3M3 12L7 8M3 12L7 16"/>
              </svg>
            </SidebarTrigger>
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
    </>
  );
}

function EmployeeLayout({
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
        <div className="flex min-h-screen bg-background w-full">
            <Sidebar>
                <EmployeeSidebarContent />
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
                <main className={cn(
                    "flex-1 flex flex-col",
                    pathname === '/employee/assistant' ? 'overflow-hidden' : 'overflow-y-auto'
                )}>
                    <div className={cn(
                        pathname === '/employee/assistant' ? 'h-full p-4 md:p-8' : 'p-4 md:p-8'
                    )}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}

export default withAuth(EmployeeLayout);
