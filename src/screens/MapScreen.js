// src/screens/MapScreen.js - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [meetups, setMeetups] = useState([]);
  const mapRef = useRef(null);

  // Mock meetup data - we'll replace this with Firestore data later
  const mockMeetups = [
    {
      id: '1',
      title: 'Beach Volleyball Fun',
      location: {
        latitude: 37.78825,
        longitude: -122.4324,
      },
      courtType: 'beach',
      currentPlayers: 4,
      maxPlayers: 8,
      date: '2025-09-10',
      time: '6:00 PM',
    },
    {
      id: '2', 
      title: 'Indoor Tournament Prep',
      location: {
        latitude: 37.7849,
        longitude: -122.4094,
      },
      courtType: 'indoor',
      currentPlayers: 6,
      maxPlayers: 12,
      date: '2025-09-11',
      time: '7:30 PM',
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      // Get current location
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation);
      setMeetups(mockMeetups); // Set mock data for now
      setLoading(false);

    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Error getting your location');
      setLoading(false);
    }
  };

  const handleMyLocationPress = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getMarkerColor = (courtType) => {
    switch (courtType) {
      case 'beach':
        return '#FFB800'; // Yellow for beach
      case 'indoor':
        return '#FB923C'; // Orange for indoor  
      case 'grass':
        return '#10B981'; // Green for grass
      default:
        return '#6366F1'; // Blue default
    }
  };

  const handleMarkerPress = (meetup) => {
    // For now, just show an alert - we'll implement proper meetup details later
    Alert.alert(
      meetup.title,
      `${meetup.currentPlayers}/${meetup.maxPlayers} players\n${meetup.date} at ${meetup.time}\nCourt: ${meetup.courtType}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View Details', onPress: () => console.log('View details:', meetup.id) },
      ]
    );
  };

  const handleCreateMeetup = () => {
    navigation.navigate('CreateMeetup');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="location-off" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Location Error</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.coords.latitude || 37.78825,
          longitude: location?.coords.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        loadingEnabled={true}
      >
        {/* Render meetup markers */}
        {meetups.map((meetup) => (
          <Marker
            key={meetup.id}
            coordinate={meetup.location}
            onPress={() => handleMarkerPress(meetup)}
            pinColor={getMarkerColor(meetup.courtType)}
          >
            {/* Custom marker callout can be added here later */}
          </Marker>
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity 
        style={styles.myLocationButton}
        onPress={handleMyLocationPress}
      >
        <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Meetup Button - FIXED */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateMeetup}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Meetup</Text>
      </TouchableOpacity>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB800' }]} />
          <Text style={styles.legendText}>Beach</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FB923C' }]} />
          <Text style={styles.legendText}>Indoor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Grass</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  myLocationButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FB923C',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButton: {
    position: 'absolute',
    bottom: 10, 
    left: 16,
    right: 16,
    backgroundColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  legend: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default MapScreen;