
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './config';

// The signInWithGoogle logic has been moved to AuthProvider to use signInWithRedirect.
// This file can be used for other auth methods in the future.
