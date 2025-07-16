
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User, 
  GoogleAuthProvider,
  signInWithRedirect, 
  getRedirectResult,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
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

  useEffect(() => {
    const processAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setUser(result.user);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error in getRedirectResult:', error);
      }
    };
    
    processAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
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
