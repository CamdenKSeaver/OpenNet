// firebaseConfig.js - FIXED VERSION
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8ETsF6t_zloooH2F6uw2A2_tCVZQPEzM",
  authDomain: "opennet-8ed17.firebaseapp.com",
  projectId: "opennet-8ed17",
  storageBucket: "opennet-8ed17.firebasestorage.app",
  messagingSenderId: "185512008357",
  appId: "1:185512008357:web:0d3d6a0a30695859014b4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;