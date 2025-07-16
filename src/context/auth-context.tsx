
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    // No need to redirect here, onAuthStateChanged will handle it
    // which prevents race conditions with protected routes.
  };
  
  useEffect(() => {
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in or linked.
          setUser(result.user);
          router.push('/dashboard');
        }
      } catch (error: any) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Auth redirect error:", errorCode, errorMessage);
        toast({
          title: "Authentication Failed",
          description: "Could not sign in after redirect. Please try again.",
          variant: "destructive",
        });
      }
    };
    processRedirect();
  }, [router, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
       if (!currentUser) {
        // If the user logs out, they should be taken to the login page
        // But only if they are not already there.
        if (window.location.pathname !== '/login') {
            router.push('/login');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
