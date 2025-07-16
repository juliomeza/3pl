
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  browserLocalPersistence, 
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  Auth
} from 'firebase/auth';
import 'cordova-plugin-browsertab';


const firebaseConfig = {
  apiKey: "AIzaSyBfnkjE2Iuc5GsBTDjEE6oq38BJp6asvLc",
  authDomain: "synapse3pl.firebaseapp.com",
  projectId: "synapse3pl",
  storageBucket: "synapse3pl.firebasestorage.app",
  messagingSenderId: "430419124305",
  appId: "1:430419124305:web:0bc65fd7f4a960e4431870"
};

// Initialize Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
// This approach is robust for different environments, especially those with third-party cookie restrictions or complex proxying.
const auth: Auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

export { app, auth };
