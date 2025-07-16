
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    // This function runs on mount and handles all auth logic.
    const handleAuth = async () => {
      // First, check if we are returning from a redirect login
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in via redirect.
          setUser(result.user);
          router.push('/dashboard');
          // We can stop loading now as we have a definitive user state.
          setLoading(false);
          return; // Exit early
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }

      // If not a redirect, set up the normal auth state listener.
      // This handles existing sessions and logout/login events.
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
        // Only set loading to false after the initial check is complete.
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    };

    handleAuth();

  }, [router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true); // Set loading to true before redirect
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false); // Reset loading on error
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
