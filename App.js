// App.js - Updated with scalable navigation structure
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import MainScreen from './src/screens/MainScreen';
import CreateMeetupScreen from './src/screens/CreateMeetupScreen';
import { ActivityIndicator, View } from 'react-native';
import { getUserProfile } from './src/services/profileService';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // SIMPLIFIED: Only check profile once when user loads
  useEffect(() => {
    const checkProfile = async () => {
      if (user && !loading) {
        setProfileLoading(true);
        try {
          const profile = await getUserProfile(user.uid);
          setHasProfile(profile?.isProfileComplete || false);
        } catch (error) {
          console.error('Error checking profile:', error);
          setHasProfile(false);
        } finally {
          setProfileLoading(false);
        }
      } else if (!user) {
        // Reset when no user
        setHasProfile(false);
        setProfileLoading(false);
      }
    };

    checkProfile();
  }, [user, loading]);

  // Callback for when profile is completed
  const handleProfileComplete = async () => {
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setHasProfile(profile?.isProfileComplete || false);
    } catch (error) {
      console.error('Error checking profile after completion:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Show loading only when auth is loading or we're checking profile
  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#FB923C" />
      </View>
    );
  }

  // Updated navigation logic with scalable stack structure
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !hasProfile ? (
          <Stack.Screen name="ProfileSetup">
            {(props) => (
              <ProfileSetupScreen 
                {...props} 
                onProfileComplete={handleProfileComplete} 
              />
            )}
          </Stack.Screen>
        ) : (
          // Main app stack for authenticated users with complete profiles
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen 
              name="CreateMeetup" 
              component={CreateMeetupScreen}
              options={{
                headerShown: false,
                presentation: 'modal', // Makes it feel like a modal on iOS
              }}
            />
            {/* Add more screens here as your app grows */}
            {/* <Stack.Screen name="MeetupDetails" component={MeetupDetailsScreen} /> */}
            {/* <Stack.Screen name="EditProfile" component={EditProfileScreen} /> */}
            {/* <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}