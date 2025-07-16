
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

export function DashboardHeader() {
  const { user, loading, logout } = useAuth();

  return (
    <div>
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
              <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
      ) : (
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      )}
    </div>
  );
}
