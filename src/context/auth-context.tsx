
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User, 
  GithubAuthProvider,
  signInWithRedirect, 
  getRedirectResult 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGithub: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthProvider] Mounted. Initializing auth check.');

    const processAuth = async () => {
      try {
        console.log('[AuthProvider] Calling getRedirectResult...');
        const result = await getRedirectResult(auth);
        console.log('[AuthProvider] getRedirectResult promise resolved.');

        if (result && result.user) {
          console.log('[AuthProvider] getRedirectResult SUCCESS. User found:', result.user.displayName);
          setUser(result.user);
          router.push('/dashboard');
        } else {
          console.log('[AuthProvider] getRedirectResult: No redirect result found.');
        }
      } catch (error) {
        console.error('[AuthProvider] Error in getRedirectResult:', error);
      }
    };
    
    processAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[AuthProvider] onAuthStateChanged triggered. User:', currentUser ? currentUser.displayName : 'null');
      if (currentUser) {
        setUser(currentUser);
      }
      // This is the key: only set loading to false after the first auth state check.
      // This gives getRedirectResult time to run.
      console.log('[AuthProvider] First auth check complete. Setting loading to false.');
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Unmounting. Cleaning up subscription.');
      unsubscribe();
    };
  }, [router]);

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    console.log('[AuthProvider] Starting GitHub sign-in with redirect...');
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    console.log('[AuthProvider] Logging out.');
    await signOut(auth);
    setUser(null); // Explicitly set user to null
    router.push('/login');
  };

  const value = {
    user,
    loading,
    signInWithGithub,
    logout,
  };

  console.log(`[AuthProvider] Rendering with state: { loading: ${loading}, user: ${user ? user.displayName : 'null'} }`);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
