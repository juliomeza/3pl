
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';
import { app } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type UserInfo = DocumentData & {
  role: 'employee' | 'client';
};

type AuthContextType = {
  user: User | null;
  userInfo: UserInfo | null;
  loading: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userInfo: null,
  loading: true,
  signInWithGoogle: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRedirect = (role: 'client' | 'employee' | undefined) => {
    if (role === 'employee') {
      router.push('/employee');
    } else {
      router.push('/client');
    }
  };

  const fetchUserInfo = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    let currentUserInfo: UserInfo;

    if (userSnap.exists()) {
      currentUserInfo = userSnap.data() as UserInfo;
    } else {
      currentUserInfo = {
        role: 'client',
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        createdAt: new Date(),
      };
      await setDoc(userRef, currentUserInfo);
    }
    setUserInfo(currentUserInfo);
    return currentUserInfo;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      const fetchedUserInfo = await fetchUserInfo(result.user);
      handleRedirect(fetchedUserInfo.role);
    } catch (error: any) {
      console.error("Authentication failed", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: "Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserInfo(null);
    router.push('/login');
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        await fetchUserInfo(currentUser);
      } else {
        setUser(null);
        setUserInfo(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  const value = {
    user,
    userInfo,
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
