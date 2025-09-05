// firebaseConfig.js - Place in root directory
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8ETsF6t_zloooH2F6uw2A2_tCVZQPEzM",
  authDomain: "opennet-8ed17.firebaseapp.com",
  projectId: "opennet-8ed17",
  storageBucket: "opennet-8ed17.firebasestorage.app",
  messagingSenderId: "185512008357",
  appId: "1:185512008357:web:0d3d6a0a30695859014b4c",
  measurementId: "G-RYFFX249DC",
  webClientId: "185512008357-6i8f0hk9kobm2gkmam98ut8qdjuh1gfe.apps.googleusercontent.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;