'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#', label: 'Updates' },
  { href: '#', label: 'Story' },
  { href: '#', label: 'Download' },
  { href: '#', label: 'Developers' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-lg border-b' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground">
            <Sun className="w-6 h-6 text-accent" />
            LogiFlow
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Button key={`${link.href}-${link.label}`} variant="ghost" asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
            <div className="hidden md:block">
                <Button>Sign In</Button>
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
                <div className="flex flex-col gap-4 p-4">
                  <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-foreground mb-4">
                    <Sun className="w-6 h-6 text-accent" />
                    LogiFlow
                  </Link>
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Button key={`${link.href}-${link.label}-mobile`} variant="ghost" asChild className="justify-start">
                        <Link href={link.href}>{link.label}</Link>
                      </Button>
                    ))}
                  </nav>
                  <Button className="mt-4">Sign In</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
