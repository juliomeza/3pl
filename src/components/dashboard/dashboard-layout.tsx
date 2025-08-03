'use client';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { PanelLeftClose, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Skeleton } from '@/components/ui/skeleton';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface HeaderControlsContextType {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  setLeftContent: (content: ReactNode) => void;
  setRightContent: (content: ReactNode) => void;
}

const HeaderControlsContext = createContext<HeaderControlsContextType | null>(null);

export const useHeaderControls = () => {
  const context = useContext(HeaderControlsContext);
  if (!context) {
    throw new Error('useHeaderControls must be used within HeaderControlsProvider');
  }
  return context;
};

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface LogoConfig {
  type: 'client' | 'company';
  clientInfo?: {
    name?: string;
    logo_url?: string;
  } | null;
  clientInfoLoading?: boolean;
  companyName?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  logoConfig: LogoConfig;
  role: 'client' | 'employee';
}

function DashboardSidebarContent({ menuItems, logoConfig }: { menuItems: MenuItem[]; logoConfig: LogoConfig }) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === 'collapsed';

  const renderExpandedLogo = () => {
    if (logoConfig.type === 'client') {
      return (
        <div className="relative flex items-center justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {logoConfig.clientInfoLoading ? (
              <>
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-24 h-4" />
              </>
            ) : logoConfig.clientInfo && (
              <>
                {logoConfig.clientInfo.logo_url && (
                  <Image
                    src={logoConfig.clientInfo.logo_url}
                    alt={`${logoConfig.clientInfo.name} logo`}
                    width={32}
                    height={32}
                    style={{ width: '32px', height: 'auto' }}
                    className="rounded-full object-contain"
                    data-ai-hint="logo"
                  />
                )}
                <span className="font-semibold text-md pr-10">{logoConfig.clientInfo.name}</span>
              </>
            )}
          </div>
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
      );
    }

    return (
      <div className="relative flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground flex-1 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-foreground flex-shrink-0">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="truncate pr-10">{logoConfig.companyName || 'Reliable 3PL'}</span>
        </Link>
        <button 
          onClick={() => {
            const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
            trigger?.click();
          }}
          className="absolute -right-12 top-1/2 transform -translate-y-1/2 h-12 w-12 hover:bg-gray-100 rounded-md z-10 flex items-center justify-center"
        >
          <PanelLeftClose className="w-6 h-6 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    );
  };

  const renderCollapsedLogo = () => {
    if (logoConfig.type === 'client') {
      return (
        <div className="flex flex-col items-center w-full">
          {logoConfig.clientInfoLoading ? (
            <Skeleton className="w-8 h-8 rounded-full" />
          ) : logoConfig.clientInfo && logoConfig.clientInfo.logo_url ? (
            <div className="relative group cursor-pointer">
              <Image
                src={logoConfig.clientInfo.logo_url}
                alt={`${logoConfig.clientInfo.name} logo`}
                width={32}
                height={32}
                style={{ width: '32px', height: 'auto' }}
                className="rounded-full object-contain transition-opacity duration-200 group-hover:opacity-20"
                onClick={() => {
                  const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
                  trigger?.click();
                }}
              />
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
      );
    }

    return (
      <div className="flex flex-col items-center w-full">
        <div className="relative group cursor-pointer">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-8 h-8 text-foreground transition-opacity duration-200 group-hover:opacity-20"
            onClick={() => {
              const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
              trigger?.click();
            }}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
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
      </div>
    );
  };

  return (
    <>
      <SidebarHeader className="p-4">
        {!isCollapsed && renderExpandedLogo()}
        {isCollapsed && renderCollapsedLogo()}
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
      
      {logoConfig.type === 'client' && (
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
      )}
    </>
  );
}

export default function DashboardLayout({ children, menuItems, logoConfig, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [leftContent, setLeftContent] = useState<ReactNode>(null);
  const [rightContent, setRightContent] = useState<ReactNode>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (role === 'employee') {
      const handleScroll = () => {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          setIsScrolled(mainElement.scrollTop > 10);
        }
      };
      
      const mainElement = document.querySelector('main');
      mainElement?.addEventListener('scroll', handleScroll);
      
      return () => mainElement?.removeEventListener('scroll', handleScroll);
    }
  }, [role]);

  const isAssistantPage = pathname.endsWith('/assistant');
  
  return (
    <HeaderControlsContext.Provider value={{ leftContent, rightContent, setLeftContent, setRightContent }}>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background w-full">
          <Sidebar>
            <DashboardSidebarContent menuItems={menuItems} logoConfig={logoConfig} />
          </Sidebar>
          <div className="flex-1 flex flex-col h-screen">
            <header className={cn(
              "flex-shrink-0 flex items-center justify-between p-4 md:justify-end bg-background",
              role === 'employee' && "sticky top-0 z-40 transition-all duration-300",
              role === 'employee' && isScrolled && "bg-background/80 backdrop-blur-lg border-b"
            )}>
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <DashboardHeader leftContent={leftContent} rightContent={rightContent} />
            </header>
            <main className={cn(
              "flex-1",
              isAssistantPage ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar',
              role === 'employee' && !isAssistantPage && 'flex flex-col'
            )}>
              <div className={isAssistantPage ? 'h-full p-4 md:p-8' : 'p-4 md:p-8'}>
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </HeaderControlsContext.Provider>
  );
}