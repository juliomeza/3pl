
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithRedirect, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const router = useRouter();

  const signInWithGoogle = async () => {
    console.log('[AuthProvider] Attempting to sign in with Google...');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('[AuthProvider] signInWithRedirect failed.', error);
    }
  };

  const logout = async () => {
    console.log('[AuthProvider] Logging out...');
    await signOut(auth);
    // After signing out, onAuthStateChanged will set user to null
    // and the protected route logic will handle redirection.
    router.push('/login');
  };

  useEffect(() => {
    console.log('[AuthProvider] useEffect started. Subscribing to onAuthStateChanged.');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[AuthProvider] onAuthStateChanged triggered. User:', currentUser);
      setUser(currentUser);
      console.log('[AuthProvider] Auth state determined. Setting loading to false.');
      setLoading(false);

      if (currentUser) {
        // If user is determined, redirect to dashboard if not already there.
        if(window.location.pathname.startsWith('/login')) {
           console.log('[AuthProvider] User is logged in, redirecting from /login to /dashboard.');
           router.push('/dashboard');
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthProvider] useEffect cleanup. Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    }
  }, [router]);


  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  console.log('[AuthProvider] Rendering with state:', { loading: value.loading, user: !!value.user });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
