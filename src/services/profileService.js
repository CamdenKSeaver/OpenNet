// src/services/profileService.js
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Create or update user profile
export const createUserProfile = async (userData) => {
  try {
    const userRef = doc(db, 'users', userData.uid);
    
    const profileData = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, profileData, { merge: true });
    console.log('User profile created/updated:', userData.uid);
  } catch (error) {
    console.error('Create user profile error:', error);
    throw error;
  }
};

// Get user profile by UID
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.log('No user profile found for UID:', uid);
      return null;
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, updateData, { merge: true });
    console.log('User profile updated:', uid);
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};