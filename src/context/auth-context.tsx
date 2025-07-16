
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
    console.log('AuthProvider: useEffect started. Initializing auth state check.');

    const processRedirectResult = async () => {
      try {
        console.log('AuthProvider: Calling getRedirectResult...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('AuthProvider: getRedirectResult SUCCESS. User found:', result.user.email);
          setUser(result.user);
          router.push('/dashboard');
        } else {
          console.log('AuthProvider: getRedirectResult returned null (no redirect session).');
        }
      } catch (error) {
        console.error('AuthProvider: Error in getRedirectResult:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('AuthProvider: onAuthStateChanged triggered. User:', currentUser?.email || 'null');
      setUser(currentUser);
      console.log('AuthProvider: Setting loading to false.');
      setLoading(false);
    });

    processRedirectResult();

    return () => {
      console.log('AuthProvider: Cleanup useEffect.');
      unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('AuthProvider: Attempting signInWithRedirect...');
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('AuthProvider: Error signing in with Google:', error);
    }
  };

  const logout = async () => {
    await signOut(auth);
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
