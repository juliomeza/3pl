
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './config';

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return null;
  }
}

// You can add signInWithMicrosoft here later
