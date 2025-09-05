// App.js - Replace the root App.js file
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import MainScreen from './src/screens/MainScreen';
import { ActivityIndicator, View } from 'react-native';
import { getUserProfile } from './src/services/profileService';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setHasProfile(profile?.isProfileComplete || false);
        } catch (error) {
          console.error('Error checking profile:', error);
          setHasProfile(false);
        }
      }
      setProfileLoading(false);
    };

    if (!loading) {
      checkProfile();
    }
  }, [user, loading]);

  if (loading || (user && profileLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FB923C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          hasProfile ? (
            <Stack.Screen name="Main" component={MainScreen} />
          ) : (
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
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