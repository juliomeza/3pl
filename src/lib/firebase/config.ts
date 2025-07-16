
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBfnkjE2Iuc5GsBTDjEE6oq38BJp6asvLc",
  authDomain: "synapse3pl.firebaseapp.com",
  projectId: "synapse3pl",
  storageBucket: "synapse3pl.firebasestorage.app",
  messagingSenderId: "430419124305",
  appId: "1:430419124305:web:0bc65fd7f4a960e4431870"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
