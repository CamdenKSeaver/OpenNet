// src/services/meetupService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  arrayUnion,
  arrayRemove,
  Timestamp,
  GeoPoint
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Create a new meetup
 */
export const createMeetup = async (meetupData) => {
  try {
    const meetup = {
      ...meetupData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      currentPlayers: 1, // Host counts as first player
      waitlist: [],
      approvedPlayers: [meetupData.hostId], // Host is auto-approved
      status: 'active',
      // Convert location to GeoPoint for efficient geographic queries
      location: new GeoPoint(meetupData.location.latitude, meetupData.location.longitude),
      locationDetails: meetupData.locationDetails || {},
    };

    const docRef = await addDoc(collection(db, 'meetups'), meetup);
    console.log('Meetup created with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...meetup,
      // Convert GeoPoint back for frontend use
      location: {
        latitude: meetup.location.latitude,
        longitude: meetup.location.longitude
      }
    };
  } catch (error) {
    console.error('Error creating meetup:', error);
    throw new Error('Failed to create meetup');
  }
};

/**
 * Get meetups in a geographic area
 */
export const getMeetupsInArea = async (center, radiusKm = 50) => {
  try {
    // For now, get all active meetups (we'll add geo-filtering later)
    const meetupsRef = collection(db, 'meetups');
    const q = query(
      meetupsRef, 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const meetups = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      meetups.push({
        id: doc.id,
        ...data,
        // Convert GeoPoint back to regular coordinates
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude
        },
        // Convert Firestore timestamps
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dateTime: {
          ...data.dateTime,
          date: data.dateTime?.date?.toDate ? data.dateTime.date.toDate() : data.dateTime?.date
        }
      });
    });
    
    // TODO: Add actual geographic filtering based on center and radius
    return meetups;
  } catch (error) {
    console.error('Error fetching meetups:', error);
    throw new Error('Failed to fetch meetups');
  }
};

/**
 * Get a specific meetup by ID
 */
export const getMeetup = async (meetupId) => {
  try {
    const docRef = doc(db, 'meetups', meetupId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Meetup not found');
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude
      },
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      dateTime: {
        ...data.dateTime,
        date: data.dateTime?.date?.toDate ? data.dateTime.date.toDate() : data.dateTime?.date
      }
    };
  } catch (error) {
    console.error('Error fetching meetup:', error);
    throw new Error('Failed to fetch meetup');
  }
};

/**
 * Join meetup waitlist
 */
export const joinMeetupWaitlist = async (meetupId, userId) => {
  try {
    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      waitlist: arrayUnion(userId),
      updatedAt: Timestamp.now()
    });
    
    console.log('User added to waitlist');
    return true;
  } catch (error) {
    console.error('Error joining waitlist:', error);
    throw new Error('Failed to join waitlist');
  }
};

/**
 * Approve player from waitlist
 */
export const approvePlayer = async (meetupId, userId) => {
  try {
    const meetupRef = doc(db, 'meetups', meetupId);
    const meetupDoc = await getDoc(meetupRef);
    
    if (!meetupDoc.exists()) {
      throw new Error('Meetup not found');
    }
    
    const meetupData = meetupDoc.data();
    const newPlayerCount = meetupData.currentPlayers + 1;
    
    // Check if meetup is full
    if (newPlayerCount > meetupData.maxPlayers) {
      throw new Error('Meetup is full');
    }
    
    await updateDoc(meetupRef, {
      waitlist: arrayRemove(userId),
      approvedPlayers: arrayUnion(userId),
      currentPlayers: newPlayerCount,
      updatedAt: Timestamp.now()
    });
    
    console.log('Player approved');
    return true;
  } catch (error) {
    console.error('Error approving player:', error);
    throw error;
  }
};

/**
 * Remove player from meetup
 */
export const removePlayer = async (meetupId, userId) => {
  try {
    const meetupRef = doc(db, 'meetups', meetupId);
    const meetupDoc = await getDoc(meetupRef);
    
    if (!meetupDoc.exists()) {
      throw new Error('Meetup not found');
    }
    
    const meetupData = meetupDoc.data();
    const isApproved = meetupData.approvedPlayers.includes(userId);
    const newPlayerCount = isApproved ? meetupData.currentPlayers - 1 : meetupData.currentPlayers;
    
    const updateData = {
      waitlist: arrayRemove(userId),
      updatedAt: Timestamp.now()
    };
    
    if (isApproved) {
      updateData.approvedPlayers = arrayRemove(userId);
      updateData.currentPlayers = newPlayerCount;
    }
    
    await updateDoc(meetupRef, updateData);
    
    console.log('Player removed from meetup');
    return true;
  } catch (error) {
    console.error('Error removing player:', error);
    throw new Error('Failed to remove player');
  }
};

/**
 * Cancel meetup
 */
export const cancelMeetup = async (meetupId, reason = '') => {
  try {
    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: Timestamp.now()
    });
    
    console.log('Meetup cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling meetup:', error);
    throw new Error('Failed to cancel meetup');
  }
};

/**
 * Get user's meetups (hosted and joined)
 */
export const getUserMeetups = async (userId) => {
  try {
    const meetupsRef = collection(db, 'meetups');
    
    // Get hosted meetups
    const hostedQuery = query(
      meetupsRef, 
      where('hostId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    // Get joined meetups
    const joinedQuery = query(
      meetupsRef, 
      where('approvedPlayers', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const [hostedSnapshot, joinedSnapshot] = await Promise.all([
      getDocs(hostedQuery),
      getDocs(joinedQuery)
    ]);
    
    const hostedMeetups = [];
    const joinedMeetups = [];
    
    hostedSnapshot.forEach((doc) => {
      const data = doc.data();
      hostedMeetups.push({
        id: doc.id,
        ...data,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude
        },
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });
    
    joinedSnapshot.forEach((doc) => {
      const data = doc.data();
      // Don't duplicate if user is both host and participant
      if (data.hostId !== userId) {
        joinedMeetups.push({
          id: doc.id,
          ...data,
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude
          },
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      }
    });
    
    return {
      hosted: hostedMeetups,
      joined: joinedMeetups
    };
  } catch (error) {
    console.error('Error fetching user meetups:', error);
    throw new Error('Failed to fetch user meetups');
  }
};