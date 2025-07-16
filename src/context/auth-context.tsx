
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, getAuth, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const router = useRouter();
  const auth = getAuth(app);

  const logout = async () => {
    console.log('[AuthProvider] Logging out...');
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    console.log('[AuthProvider] useEffect started. Subscribing to onAuthStateChanged.');

    // This handles the redirect result from Google
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('[AuthProvider] getRedirectResult found a user.', result.user);
          // The onAuthStateChanged listener below will handle setting the user state
        } else {
          console.log('[AuthProvider] getRedirectResult found no user.');
        }
      })
      .catch((error) => {
        console.error('[AuthProvider] Error in getRedirectResult:', error);
      })
      .finally(() => {
         // The real "loading" state is determined by onAuthStateChanged firing once.
         // This is just for information.
         console.log("[AuthProvider] getRedirectResult finished.")
      });
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[AuthProvider] onAuthStateChanged triggered. User:', currentUser ? currentUser.displayName : 'null');
      setUser(currentUser);
      console.log('[AuthProvider] Auth state determined. Setting loading to false.');
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthProvider] useEffect cleanup. Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    }
  }, [auth]);


  const value = {
    user,
    loading,
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
