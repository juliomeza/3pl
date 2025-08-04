
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { getTimeBasedGreeting } from '@/lib/date-utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function DashboardHeader({ leftContent, rightContent }: DashboardHeaderProps) {
  const { user, userInfo, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getSettingsPath = () => {
    if (!userInfo) return '#';
    return `/${userInfo.role}/settings`;
  }

  const getFirstName = (displayName: string | null | undefined): string => {
    if (!displayName) return 'User';
    return displayName.split(' ')[0];
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left content and welcome message */}
      <div className="flex items-center gap-4">
        {leftContent}
        {user && (
          <h1 className="text-xl font-bold font-headline text-gray-900 dark:text-gray-100">
            {getTimeBasedGreeting()}, {getFirstName(user.displayName)}!
          </h1>
        )}
      </div>
      
      {/* Right content and avatar */}
      <div className="flex items-center gap-3">
        {rightContent}
        
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
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
  );
}
