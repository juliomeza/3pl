
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, DocumentData, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type UserInfo = DocumentData & {
  role: 'employee' | 'client' | 'none';
  clientId?: string;
};

type ClientInfo = DocumentData & {
  name: string;
  logo_url?: string;
};

type AuthContextType = {
  user: User | null;
  userInfo: UserInfo | null;
  clientInfo: ClientInfo | null;
  loading: boolean;
  clientInfoLoading: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userInfo: null,
  clientInfo: null,
  loading: true,
  clientInfoLoading: true,
  signInWithGoogle: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientInfoLoading, setClientInfoLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (!currentUser) {
        setUser(null);
        setUserInfo(null);
        setClientInfo(null);
        setLoading(false);
        setClientInfoLoading(false);
        return;
      }

      setUser(currentUser);
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      let currentUserInfo: UserInfo;

      if (userSnap.exists()) {
        currentUserInfo = userSnap.data() as UserInfo;
      } else {
        const newUserInfoData: UserInfo = {
          role: 'none',
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newUserInfoData);
        const newUserSnap = await getDoc(userRef);
        currentUserInfo = newUserSnap.data() as UserInfo;
      }
      
      setUserInfo(currentUserInfo);
      
      // Explicitly handle different roles
      if (currentUserInfo.role === 'client' && currentUserInfo.clientId) {
        setClientInfoLoading(true);
        try {
          const clientRef = doc(db, 'clients', currentUserInfo.clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            setClientInfo(clientSnap.data() as ClientInfo);
          } else {
            console.warn(`Client document with ID ${currentUserInfo.clientId} not found.`);
            setClientInfo(null);
          }
        } catch (error) {
          console.error("Error fetching client info:", error);
          setClientInfo(null);
        } finally {
          setClientInfoLoading(false);
        }
      } else {
        // For 'employee' or 'none' roles, there's no client info to fetch.
        setClientInfo(null);
        setClientInfoLoading(false);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
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
    router.push('/login');
  };

  const value = {
    user,
    userInfo,
    clientInfo,
    loading,
    clientInfoLoading,
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
