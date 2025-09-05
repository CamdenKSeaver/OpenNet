// src/screens/ProfileSetupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { createUserProfile } from '../services/profileService';

const ProfileSetupScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    profileImage: null,
    name: '',
    age: '',
    bio: '',
    primaryPosition: '',
    secondaryPosition: '',
    experienceLevel: '',
    location: '',
    preferredCourts: []
  });

  const { user } = useAuth();

  const positions = [
    'Outside Hitter',
    'Middle Blocker', 
    'Setter',
    'Libero',
    'Opposite Hitter',
    'Defensive Specialist'
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', desc: 'New to volleyball', stars: 1 },
    { value: 'intermediate', label: 'Intermediate', desc: '1-3 years experience', stars: 2 },
    { value: 'advanced', label: 'Advanced', desc: '3+ years, competitive play', stars: 3 },
    { value: 'expert', label: 'Expert', desc: 'Professional/collegiate level', stars: 4 }
  ];

  const courtTypes = [
    { type: 'beach', label: 'Beach', emoji: '🏖️' },
    { type: 'indoor', label: 'Indoor', emoji: '🏢' },
    { type: 'grass', label: 'Grass', emoji: '🌱' }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCourtToggle = (courtType) => {
    setProfileData(prev => ({
      ...prev,
      preferredCourts: prev.preferredCourts.includes(courtType)
        ? prev.preferredCourts.filter(c => c !== courtType)
        : [...prev.preferredCourts, courtType]
    }));
  };

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileData(prev => ({
        ...prev,
        profileImage: result.assets[0].uri
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!profileData.name.trim()) {
          Alert.alert('Required Field', 'Please enter your name');
          return false;
        }
        if (!profileData.age || profileData.age < 13 || profileData.age > 100) {
          Alert.alert('Invalid Age', 'Please enter a valid age between 13 and 100');
          return false;
        }
        return true;
        
      case 2:
        if (!profileData.primaryPosition) {
          Alert.alert('Required Field', 'Please select your primary position');
          return false;
        }
        if (!profileData.experienceLevel) {
          Alert.alert('Required Field', 'Please select your experience level');
          return false;
        }
        return true;
        
      case 3:
        if (!profileData.location.trim()) {
          Alert.alert('Required Field', 'Please enter your location');
          return false;
        }
        if (profileData.preferredCourts.length === 0) {
          Alert.alert('Required Field', 'Please select at least one preferred court type');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const userProfile = {
        uid: user.uid,
        name: profileData.name.trim(),
        age: parseInt(profileData.age),
        bio: profileData.bio.trim(),
        profileImage: profileData.profileImage,
        primaryPosition: profileData.primaryPosition,
        secondaryPosition: profileData.secondaryPosition || null,
        experienceLevel: profileData.experienceLevel,
        location: profileData.location.trim(),
        preferredCourts: profileData.preferredCourts,
        isProfileComplete: true
      };

      await createUserProfile(userProfile);
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Setup Error', 'Failed to create your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.progressStepContainer}>
          <View style={[
            styles.progressStep,
            step <= currentStep && styles.progressStepActive
          ]}>
            <Text style={[
              styles.progressStepText,
              step <= currentStep && styles.progressStepTextActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[
              styles.progressLine,
              step < currentStep && styles.progressLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const StarRating = ({ count }) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4].map(star => (
        <MaterialIcons
          key={star}
          name="star"
          size={16}
          color={star <= count ? '#FCD34D' : '#E5E7EB'}
        />
      ))}
    </View>
  );

  const StepOne = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's set up your profile</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself so others can get to know you</Text>

      {/* Profile Image Upload */}
      <TouchableOpacity style={styles.imageUploadContainer} onPress={handleImageUpload}>
        <View style={styles.imageContainer}>
          {profileData.profileImage ? (
            <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
          ) : (
            <MaterialIcons name="person" size={48} color="#9CA3AF" />
          )}
        </View>
        <View style={styles.cameraIconContainer}>
          <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.imageUploadText}>Add a profile photo</Text>
      </TouchableOpacity>

      {/* Basic Info */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholder="Your full name"
          autoCapitalize="words"
        />

        <Text style={styles.inputLabel}>Age *</Text>
        <TextInput
          style={styles.input}
          value={profileData.age}
          onChangeText={(value) => handleInputChange('age', value)}
          placeholder="Your age"
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Bio (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.bio}
          onChangeText={(value) => handleInputChange('bio', value)}
          placeholder="Tell others about yourself, your volleyball journey..."
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={styles.characterCount}>{profileData.bio.length}/200 characters</Text>
      </View>
    </View>
  );

  const StepTwo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your volleyball info</Text>
      <Text style={styles.stepSubtitle}>Help others understand your playing style and experience</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Primary Position *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.positionScroll}>
          {positions.map(position => (
            <TouchableOpacity
              key={position}
              style={[
                styles.positionChip,
                profileData.primaryPosition === position && styles.positionChipSelected
              ]}
              onPress={() => handleInputChange('primaryPosition', position)}
            >
              <Text style={[
                styles.positionChipText,
                profileData.primaryPosition === position && styles.positionChipTextSelected
              ]}>
                {position}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Secondary Position (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.positionScroll}>
          {positions
            .filter(p => p !== profileData.primaryPosition)
            .map(position => (
            <TouchableOpacity
              key={position}
              style={[
                styles.positionChip,
                profileData.secondaryPosition === position && styles.positionChipSelected
              ]}
              onPress={() => handleInputChange('secondaryPosition', position)}
            >
              <Text style={[
                styles.positionChipText,
                profileData.secondaryPosition === position && styles.positionChipTextSelected
              ]}>
                {position}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Experience Level *</Text>
        <View style={styles.experienceContainer}>
          {experienceLevels.map(level => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.experienceCard,
                profileData.experienceLevel === level.value && styles.experienceCardSelected
              ]}
              onPress={() => handleInputChange('experienceLevel', level.value)}
            >
              <View style={styles.experienceHeader}>
                <StarRating count={level.stars} />
                <Text style={[
                  styles.experienceLabel,
                  profileData.experienceLevel === level.value && styles.experienceLabelSelected
                ]}>
                  {level.label}
                </Text>
              </View>
              <Text style={[
                styles.experienceDesc,
                profileData.experienceLevel === level.value && styles.experienceDescSelected
              ]}>
                {level.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const StepThree = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Preferences & Location</Text>
      <Text style={styles.stepSubtitle}>Help us show you the most relevant meetups</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Location *</Text>
        <View style={styles.locationInputContainer}>
          <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={styles.locationIcon} />
          <TextInput
            style={[styles.input, styles.locationInput]}
            value={profileData.location}
            onChangeText={(value) => handleInputChange('location', value)}
            placeholder="City, State or Zip Code"
          />
        </View>
        <Text style={styles.inputHint}>This helps us show you nearby meetups</Text>

        <Text style={styles.inputLabel}>Preferred Court Types *</Text>
        <Text style={styles.inputHint}>Select all that apply</Text>
        <View style={styles.courtTypesContainer}>
          {courtTypes.map(court => (
            <TouchableOpacity
              key={court.type}
              style={[
                styles.courtTypeCard,
                profileData.preferredCourts.includes(court.type) && styles.courtTypeCardSelected
              ]}
              onPress={() => handleCourtToggle(court.type)}
            >
              <Text style={styles.courtTypeEmoji}>{court.emoji}</Text>
              <Text style={[
                styles.courtTypeText,
                profileData.preferredCourts.includes(court.type) && styles.courtTypeTextSelected
              ]}>
                {court.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Setup</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <ProgressBar />
        
        <View style={styles.formContainer}>
          {currentStep === 1 && <StepOne />}
          {currentStep === 2 && <StepTwo />}
          {currentStep === 3 && <StepThree />}
        </View>
      </ScrollView>

      <View style={styles.navigationContainer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep} disabled={loading}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.continueButton,
              currentStep === 1 && styles.continueButtonFull,
              loading && styles.continueButtonDisabled
            ]}
            onPress={currentStep === 3 ? completeSetup : nextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>
                {currentStep === 3 ? 'Complete Setup' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.stepIndicatorText}>Step {currentStep} of 3</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: '#FB923C',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  progressStepTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  progressLineActive: {
    backgroundColor: '#FB923C',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FED7AA',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
  },
  inputContainer: {
    gap: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: -15,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -15,
  },
  locationInputContainer: {
    position: 'relative',
  },
  locationInput: {
    paddingLeft: 44,
  },
  locationIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  positionScroll: {
    marginTop: 8,
  },
  positionChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  positionChipSelected: {
    backgroundColor: '#FED7AA',
    borderColor: '#FB923C',
  },
  positionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  positionChipTextSelected: {
    color: '#EA580C',
  },
  experienceContainer: {
    gap: 12,
    marginTop: 8,
  },
  experienceCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  experienceCardSelected: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FB923C',
  },
  experienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  experienceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  experienceLabelSelected: {
    color: '#EA580C',
  },
  experienceDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  experienceDescSelected: {
    color: '#9A3412',
  },
  courtTypesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  courtTypeCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  courtTypeCardSelected: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FB923C',
  },
  courtTypeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  courtTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  courtTypeTextSelected: {
    color: '#EA580C',
  },
  navigationContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FB923C',
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonFull: {
    flex: 2,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepIndicatorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ProfileSetupScreen;