// src/services/profileService.js
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';

/**
 * Create a new user profile
 */
export const createUserProfile = async (profileData) => {
  try {
    const userRef = doc(db, 'users', profileData.uid);
    
    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (profileData.profileImage && profileData.profileImage.startsWith('file://')) {
      profileImageUrl = await uploadProfileImage(profileData.uid, profileData.profileImage);
    }
    
    const userData = {
      ...profileData,
      profileImage: profileImageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isProfileComplete: true,
      // Default experience level if not provided
      experienceLevel: profileData.experienceLevel || 'beginner'
    };
    
    await setDoc(userRef, userData);
    console.log('Profile created successfully');
    return userData;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw new Error(`Failed to create profile: ${error.message}`);
  }
};

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log('No profile found for user:', uid);
      return null;
    }
  } catch (error) {
    console.error('Error getting profile:', error);
    throw new Error(`Failed to get profile: ${error.message}`);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid, updateData) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Handle profile image upload if new image provided
    if (updateData.profileImage && updateData.profileImage.startsWith('file://')) {
      // Delete old image if exists
      const currentProfile = await getUserProfile(uid);
      if (currentProfile?.profileImage) {
        await deleteProfileImage(uid);
      }
      
      // Upload new image
      updateData.profileImage = await uploadProfileImage(uid, updateData.profileImage);
    }
    
    const updatedData = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updatedData);
    console.log('Profile updated successfully');
    return updatedData;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

/**
 * Upload profile image to Firebase Storage
 */
export const uploadProfileImage = async (uid, imageUri) => {
  try {
    console.log('Starting image upload for user:', uid);
    console.log('Image URI:', imageUri);
    
    // Check if storage is available
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Please check your Firebase configuration.');
    }
    
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Image blob size:', blob.size);
    
    // Create a unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const imageRef = ref(storage, `profile_images/${uid}_${timestamp}.jpg`);
    
    console.log('Uploading to path:', `profile_images/${uid}_${timestamp}.jpg`);
    
    const uploadTask = await uploadBytes(imageRef, blob);
    console.log('Upload completed:', uploadTask.metadata.fullPath);
    
    const downloadURL = await getDownloadURL(imageRef);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Detailed error uploading profile image:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Storage access denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Storage service unavailable. Please check your internet connection and Firebase configuration.');
    } else if (error.message.includes('Firebase Storage is not initialized')) {
      throw new Error('Firebase Storage is not properly configured.');
    }
    
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete profile image from Firebase Storage
 */
export const deleteProfileImage = async (uid) => {
  try {
    const imageRef = ref(storage, `profile_images/${uid}.jpg`);
    await deleteObject(imageRef);
    console.log('Profile image deleted successfully');
  } catch (error) {
    console.error('Error deleting profile image:', error);
    // Don't throw error for image deletion as profile update should continue
  }
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = async (uid) => {
  try {
    const profile = await getUserProfile(uid);
    return profile?.isProfileComplete || false;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
};

/**
 * Search users by location or name (for future meetup features)
 */
export const searchUsers = async (searchTerm, filters = {}) => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('isProfileComplete', '==', true));
    
    // Add filters if provided
    if (filters.location) {
      q = query(q, where('location', '==', filters.location));
    }
    
    if (filters.preferredCourts && filters.preferredCourts.length > 0) {
      q = query(q, where('preferredCourts', 'array-contains-any', filters.preferredCourts));
    }
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Filter by name/bio if search term provided
      if (!searchTerm || 
          userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userData.bio.toLowerCase().includes(searchTerm.toLowerCase())) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error(`Failed to search users: ${error.message}`);
  }
};

/**
 * Get users by positions (for team formation)
 */
export const getUsersByPosition = async (position, location = null) => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(
      usersRef, 
      where('isProfileComplete', '==', true),
      where('primaryPosition', '==', position)
    );
    
    if (location) {
      q = query(q, where('location', '==', location));
    }
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by position:', error);
    throw new Error(`Failed to get users by position: ${error.message}`);
  }
};

/**
 * Validate profile data
 */
export const validateProfileData = (profileData) => {
  const errors = [];
  
  // Required fields validation
  if (!profileData.name || profileData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!profileData.age || profileData.age < 13 || profileData.age > 100) {
    errors.push('Age must be between 13 and 100');
  }
  
  if (!profileData.phoneNumber || profileData.phoneNumber.length < 10) {
    errors.push('Valid phone number is required');
  }
  
  if (!profileData.primaryPosition) {
    errors.push('Primary position is required');
  }
  
  if (!profileData.location || profileData.location.trim().length < 2) {
    errors.push('Location is required');
  }
  
  if (!profileData.preferredCourts || profileData.preferredCourts.length === 0) {
    errors.push('At least one preferred court type is required');
  }
  
  // Validate court types
  const validCourtTypes = ['beach', 'indoor', 'grass'];
  if (profileData.preferredCourts) {
    const invalidCourts = profileData.preferredCourts.filter(
      court => !validCourtTypes.includes(court)
    );
    if (invalidCourts.length > 0) {
      errors.push(`Invalid court types: ${invalidCourts.join(', ')}`);
    }
  }
  
  // Validate positions
  const validPositions = [
    'Outside Hitter',
    'Middle Blocker', 
    'Opposite Hitter',
    'Setter',
    'Libero',
    'Defensive Specialist'
  ];
  
  if (profileData.primaryPosition && !validPositions.includes(profileData.primaryPosition)) {
    errors.push('Invalid primary position');
  }
  
  if (profileData.secondaryPosition && !validPositions.includes(profileData.secondaryPosition)) {
    errors.push('Invalid secondary position');
  }
  
  // Bio length check
  if (profileData.bio && profileData.bio.length > 200) {
    errors.push('Bio must be 200 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumber;
};

/**
 * Get experience level display text
 */
export const getExperienceLevelText = (level) => {
  const levels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate', 
    advanced: 'Advanced',
    expert: 'Expert'
  };
  return levels[level] || 'Beginner';
};

/**
 * Get court type display text with emoji
 */
export const getCourtTypeDisplay = (courtType) => {
  const courtTypes = {
    beach: { label: 'Beach', emoji: '🏖️' },
    indoor: { label: 'Indoor', emoji: '🏟️' },
    grass: { label: 'Grass', emoji: '🌱' }
  };
  return courtTypes[courtType] || { label: courtType, emoji: '🏐' };
};