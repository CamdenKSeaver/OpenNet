// firebaseConfig.js - FIXED VERSION with better error handling
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8ETsF6t_zloooH2F6uw2A2_tCVZQPEzM",
  authDomain: "opennet-8ed17.firebaseapp.com",
  projectId: "opennet-8ed17",
  storageBucket: "opennet-8ed17.firebasestorage.app",
  messagingSenderId: "185512008357",
  appId: "1:185512008357:web:0d3d6a0a30695859014b4c"
};

// Initialize Firebase app (check if already initialized)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage with error handling
export let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');
  console.log('📁 Storage bucket:', storage.app.options.storageBucket);
} catch (error) {
  console.error('❌ Firebase Storage initialization failed:', error);
  storage = null;
}

// Export the app instance
export default app;

// Helper function to check if storage is available
export const isStorageAvailable = () => {
  return storage !== null;
};

// Helper function to get storage URL
export const getStorageUrl = () => {
  return storage?.app?.options?.storageBucket;
};