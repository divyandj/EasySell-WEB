// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual config from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyANxQ7336Pa_sNu1qO5HI12TUWrFg_SIn8",
  authDomain: "easysell-hashu.firebaseapp.com",
  projectId: "easysell-hashu",
  storageBucket: "easysell-hashu.firebasestorage.app",
  messagingSenderId: "661744584495",
  appId: "1:661744584495:web:5165c79afb82d98696c3da",
  measurementId: "G-Z8YB507WEM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();