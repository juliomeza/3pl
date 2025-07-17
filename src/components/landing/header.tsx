
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';


const navLinks = [
  { href: '/pricing', label: 'Pricing' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, userInfo, loading, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!userInfo) return '/login';
    if (userInfo.role === 'none') return '/pending-access';
    return `/${userInfo.role}`;
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-lg border-b' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            Synapse3PL
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Button key={`${link.href}-${link.label}`} variant="ghost" asChild className={cn(pathname === link.href && 'bg-accent')}>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
             <div className="hidden md:block">
              {loading ? (
                <div className="w-20 h-10 bg-muted rounded-md animate-pulse" />
              ) : user ? (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                       <Avatar>
                         <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                         <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                       </Avatar>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href={getDashboardPath()}>Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 p-4">
                  <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    Synapse3PL
                  </Link>
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Button key={`${link.href}-${link.label}-mobile`} variant="ghost" asChild className={cn("justify-start", pathname === link.href && 'bg-accent')}>
                        <Link href={link.href}>{link.label}</Link>
                      </Button>
                    ))}
                  </nav>
                   {loading ? (
                     <div className="w-full h-10 bg-muted rounded-md animate-pulse mt-4" />
                    ) : user ? (
                      <div className="flex flex-col gap-2 mt-4">
                        <Button asChild className="justify-start">
                          <Link href={getDashboardPath()}>Dashboard</Link>
                        </Button>
                        <Button onClick={logout} variant="outline" className="justify-start">Sign Out</Button>
                      </div>
                    ) : (
                      <Button asChild className="mt-4">
                        <Link href="/login">Sign In</Link>
                      </Button>
                    )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
