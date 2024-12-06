import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA3f6jkiItO1jKvm33VA7KgyNKfDCH9fug",
  authDomain: "nextmanager-65aef.firebaseapp.com",
  projectId: "nextmanager-65aef",
  storageBucket: "nextmanager-65aef.firebasestorage.app",
  messagingSenderId: "994850411959",
  appId: "1:994850411959:web:2654a58dc739e26f9d8432",
  measurementId: "G-S9KSKJ4YFK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
