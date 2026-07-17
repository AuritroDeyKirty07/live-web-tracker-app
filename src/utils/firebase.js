import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBO3EWhHylTroe4JnEAcobC1zaHKUscdA0",
  authDomain: "live-tracker-9a347.firebaseapp.com",
  projectId: "live-tracker-9a347",
  storageBucket: "live-tracker-9a347.firebasestorage.app",
  messagingSenderId: "826816248356",
  appId: "1:826816248356:web:54770ecc652890146676b1",
  measurementId: "G-NH7GGDN1SN",
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


export { auth, db, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, doc, setDoc, getDoc, onSnapshot, deleteDoc, collection, getDocs };