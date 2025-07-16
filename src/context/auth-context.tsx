
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
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
    console.log('AuthProvider Mounted. Initializing auth check.');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('onAuthStateChanged triggered. User:', currentUser ? currentUser.email : null);
      setUser(currentUser);
      // We will set loading to false only after getRedirectResult is also done.
    });

    getRedirectResult(auth)
      .then((result) => {
        console.log('getRedirectResult promise resolved.');
        if (result && result.user) {
          console.log('getRedirectResult SUCCESS. User:', result.user.email);
          // User signed in via redirect. Update state and redirect to dashboard.
          setUser(result.user);
          router.push('/dashboard');
        } else {
          console.log('getRedirectResult: No redirect result found.');
        }
      })
      .catch((error) => {
        console.error("Error during getRedirectResult:", error);
      })
      .finally(() => {
        // This runs after onAuthStateChanged and getRedirectResult have been initiated.
        // It ensures we don't stop loading until Firebase has had a chance to check the session.
        console.log('AuthProvider auth checks complete. Setting loading to false.');
        setLoading(false);
      });

    return () => {
      console.log('AuthProvider Unmounted.');
      unsubscribe();
    }
  }, [router]);

  const signInWithGoogle = async () => {
    console.log('signInWithGoogle called.');
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    console.log('logout called.');
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

  console.log('AuthProvider rendering with state:', { loading, user: user ? user.email : null });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
