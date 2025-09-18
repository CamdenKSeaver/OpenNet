// src/services/profileService.js - COMPLETE FIXED VERSION
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
 * Test Firebase Storage connectivity
 */
export const testStorageConnection = async () => {
  try {
    if (!storage) {
      return { success: false, error: 'Storage not initialized' };
    }
    
    // Try to get storage reference
    const testRef = ref(storage, 'test');
    console.log('🧪 Storage test - Reference created successfully');
    
    return { 
      success: true, 
      bucket: storage.app.options.storageBucket,
      message: 'Storage connection successful' 
    };
  } catch (error) {
    console.error('🧪 Storage test failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

/**
 * Create a new user profile
 */
export const createUserProfile = async (profileData) => {
  try {
    console.log('🚀 Starting profile creation for user:', profileData.uid);
    
    const userRef = doc(db, 'users', profileData.uid);
    
    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (profileData.profileImage && profileData.profileImage.startsWith('file://')) {
      console.log('📸 Profile image detected, starting upload...');
      try {
        profileImageUrl = await uploadProfileImage(profileData.uid, profileData.profileImage);
        console.log('✅ Profile image uploaded:', profileImageUrl);
      } catch (imageError) {
        console.error('⚠️ Image upload failed, continuing without image:', imageError);
        // Continue with profile creation even if image upload fails
        profileImageUrl = null;
      }
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
    
    console.log('💾 Saving profile data to Firestore...');
    await setDoc(userRef, userData);
    console.log('✅ Profile created successfully');
    return userData;
  } catch (error) {
    console.error('❌ Error creating profile:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
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
      try {
        // Delete old image if exists
        const currentProfile = await getUserProfile(uid);
        if (currentProfile?.profileImage) {
          await deleteProfileImage(uid);
        }
        
        // Upload new image
        updateData.profileImage = await uploadProfileImage(uid, updateData.profileImage);
      } catch (imageError) {
        console.error('⚠️ Image update failed:', imageError);
        // Remove the problematic image from update data
        delete updateData.profileImage;
      }
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
 * Upload profile image to Firebase Storage with comprehensive error handling
 */
export const uploadProfileImage = async (uid, imageUri) => {
  try {
    console.log('📤 Starting image upload for user:', uid);
    console.log('🖼️ Image URI:', imageUri);
    
    // Check if storage is available
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Please check your Firebase configuration.');
    }
    
    // Validate image URI
    if (!imageUri || !imageUri.startsWith('file://')) {
      throw new Error('Invalid image URI provided');
    }
    
    console.log('🔄 Fetching image from local URI...');
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status} - ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('📊 Image blob created - Size:', blob.size, 'bytes, Type:', blob.type);
    
    if (blob.size === 0) {
      throw new Error('Image file is empty');
    }
    
    if (blob.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image file is too large (max 10MB)');
    }
    
    // Create a unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = blob.type?.split('/')[1] || 'jpg';
    const fileName = `${uid}_${timestamp}.${fileExtension}`;
    const imageRef = ref(storage, `profile_images/${fileName}`);
    
    console.log('☁️ Uploading to Firebase Storage:', `profile_images/${fileName}`);
    
    const uploadTask = await uploadBytes(imageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    console.log('✅ Upload completed:', uploadTask.metadata.fullPath);
    
    const downloadURL = await getDownloadURL(imageRef);
    console.log('🔗 Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Detailed error uploading profile image:', error);
    
    // Provide more specific error messages based on error codes
    if (error.code === 'storage/unauthorized') {
      throw new Error('Storage access denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Storage service unavailable. Please check your internet connection and Firebase configuration.');
    } else if (error.code === 'storage/invalid-url') {
      throw new Error('Invalid storage URL. Please check your Firebase configuration.');
    } else if (error.code === 'storage/no-default-bucket') {
      throw new Error('No default storage bucket found. Please check your Firebase Storage setup.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support.');
    } else if (error.code === 'storage/unauthenticated') {
      throw new Error('User not authenticated. Please sign in again.');
    } else if (error.message.includes('Firebase Storage is not initialized')) {
      throw new Error('Firebase Storage is not properly configured.');
    } else if (error.message.includes('Failed to fetch image')) {
      throw new Error('Could not read the selected image. Please try selecting a different image.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete profile image from Firebase Storage
 */
export const deleteProfileImage = async (uid) => {
  try {
    // Try to find and delete any existing profile images for this user
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
          (userData.bio && userData.bio.toLowerCase().includes(searchTerm.toLowerCase()))) {
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

/**
 * Create a profile without image (for testing/fallback)
 */
export const createProfileWithoutImage = async (profileData) => {
  try {
    console.log('🚀 Creating profile without image for user:', profileData.uid);
    
    const userRef = doc(db, 'users', profileData.uid);
    
    const userData = {
      ...profileData,
      profileImage: null, // Explicitly set to null
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isProfileComplete: true,
      experienceLevel: profileData.experienceLevel || 'beginner'
    };
    
    await setDoc(userRef, userData);
    console.log('✅ Profile created successfully without image');
    return userData;
  } catch (error) {
    console.error('❌ Error creating profile without image:', error);
    throw new Error(`Failed to create profile: ${error.message}`);
  }
};