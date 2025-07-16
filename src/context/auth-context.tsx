
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Define a type for our mock user to satisfy the User type from Firebase
type MockUser = Pick<User, 'uid' | 'displayName' | 'email' | 'photoURL'>;

type AuthContextType = {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  // Set loading to false initially as we are not waiting for Firebase
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  // FAKE SIGN-IN FUNCTION
  const signInWithGoogle = async () => {
    console.log('[AuthProvider-FAKE] Faking Google Sign-In...');
    setLoading(true);
    // Simulate a network delay
    setTimeout(() => {
      const mockUser: MockUser = {
        uid: 'fake-user-123',
        displayName: 'Fake User',
        email: 'fake.user@example.com',
        photoURL: 'https://i.pravatar.cc/40?u=fakeuser',
      };
      setUser(mockUser);
      setLoading(false);
      console.log('[AuthProvider-FAKE] Fake user set. Redirecting to /dashboard.');
      router.push('/dashboard');
    }, 500);
  };

  // FAKE LOGOUT FUNCTION
  const logout = () => {
    console.log('[AuthProvider-FAKE] Faking Logout...');
    setUser(null);
    router.push('/login');
  };

  console.log(`[AuthProvider-FAKE] Rendering with state: { loading: ${loading}, user: ${!!user} }`);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  // No longer show a loading screen here, as we control it manually
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
