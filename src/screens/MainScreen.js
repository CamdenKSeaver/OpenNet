// src/screens/MainScreen.js - FIXED VERSION
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import MapScreen from './MapScreen';

const Tab = createBottomTabNavigator();

const MainScreen = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Map':
              iconName = 'map';
              break;
            case 'MyMeetups':
              iconName = 'event';
              break;
            case 'Search':
              iconName = 'search';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FB923C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="MyMeetups" 
        component={MyMeetupsScreen}
        options={{
          tabBarLabel: 'My Meetups',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Fixed placeholder screens with proper imports
const MyMeetupsScreen = () => {
  return (
    <SafeAreaView style={styles.placeholderContainer}>
      <MaterialIcons name="event" size={64} color="#FB923C" />
      <Text style={styles.placeholderTitle}>My Meetups</Text>
      <Text style={styles.placeholderText}>Your hosted and joined meetups will appear here</Text>
    </SafeAreaView>
  );
};

const SearchScreen = () => {
  return (
    <SafeAreaView style={styles.placeholderContainer}>
      <MaterialIcons name="search" size={64} color="#FB923C" />
      <Text style={styles.placeholderTitle}>Search Meetups</Text>
      <Text style={styles.placeholderText}>Search for volleyball meetups in your area</Text>
    </SafeAreaView>
  );
};

const ProfileScreen = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.profileContainer}>
      <Text style={styles.profileTitle}>Profile</Text>
      <Text style={styles.profileSubtitle}>Hello, {user?.displayName || user?.email}</Text>
      
      <View style={styles.profileContent}>
        <MaterialIcons name="sports-volleyball" size={80} color="#FB923C" />
        <Text style={styles.profileMessage}>Profile management coming soon!</Text>
        <Text style={styles.profileDescription}>
          Edit your volleyball profile, preferences, and settings.
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <MaterialIcons name="logout" size={20} color="#FFFFFF" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'space-between',
  },
  profileTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 40,
  },
  profileSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  profileContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  profileMessage: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  profileDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MainScreen;