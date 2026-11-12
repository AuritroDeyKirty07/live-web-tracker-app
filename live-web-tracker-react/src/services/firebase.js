
import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBO3EWhHylTroe4JnEAcobC1zaHKUscdA0",
  authDomain: "live-tracker-9a347.firebaseapp.com",
  projectId: "live-tracker-9a347",
  storageBucket: "live-tracker-9a347.firebasestorage.app",
  messagingSenderId: "826816248356",
  appId: "1:826816248356:web:54770ecc652890146676b1",
  measurementId: "G-NH7GGDN1SN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Set session persistence
export const authReady = setPersistence(
  auth,
  browserLocalPersistence
);

// Initialize Firestore
export const db = getFirestore(app);

// Export Firebase functions
export {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  collection,
  getDocs,
};
