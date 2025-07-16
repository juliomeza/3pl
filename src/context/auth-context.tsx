
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
  browserLocalPersistence // Using the most robust persistence
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
    console.log('[AuthProvider] useEffect started. Initializing auth state check.');
    
    const checkAuth = async () => {
      try {
        console.log('[AuthProvider] Calling getRedirectResult...');
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('[AuthProvider] getRedirectResult SUCCESS. User found:', result.user.email);
          setUser(result.user);
          router.push('/dashboard');
        } else {
            console.log('[AuthProvider] getRedirectResult returned null (no redirect session).');
        }
      } catch (error) {
        console.error('[AuthProvider] Error in getRedirectResult:', error);
      }

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('[AuthProvider] onAuthStateChanged triggered. User:', currentUser?.email || null);
        setUser(currentUser);
        if (loading) {
            console.log('[AuthProvider] First auth state determined. Setting loading to false.');
            setLoading(false);
        }
      });
      
      return () => unsubscribe();
    };

    checkAuth();
  }, [router]);

  const signInWithGoogle = async () => {
    console.log('[AuthProvider] signInWithGoogle called.');
    try {
      // Set persistence BEFORE calling signInWithRedirect
      await setPersistence(auth, browserLocalPersistence);
      console.log('[AuthProvider] Persistence set to browserLocalPersistence.');
      const provider = new GoogleAuthProvider();
      console.log('[AuthProvider] Initiating signInWithRedirect...');
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("[AuthProvider] Error during Google sign-in:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };
  
  console.log(`[AuthProvider] Rendering with state: { loading: ${loading}, user: ${!!user} }`);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading ? children : <div className="flex items-center justify-center min-h-screen">Loading...</div>}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
