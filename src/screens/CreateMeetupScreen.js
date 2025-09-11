// src/screens/CreateMeetupScreen.js - COMPLETE FINAL VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { createMeetup } from '../services/meetupService';

const COURT_TYPES = [
  { id: 'beach', name: 'Beach', icon: 'beach-access', color: '#FFB800' },
  { id: 'indoor', name: 'Indoor', icon: 'home', color: '#FB923C' },
  { id: 'grass', name: 'Grass', icon: 'grass', color: '#10B981' }
];

const CreateMeetupScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxPlayers: '8',
    courtType: '',
    location: null,
    address: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // UI state - native iOS pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCourtTypeModal, setShowCourtTypeModal] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    
    // Set smart defaults
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Default to 6 PM today
    const defaultStart = new Date(today);
    defaultStart.setHours(18, 0, 0, 0);
    
    // Default to 8 PM today  
    const defaultEnd = new Date(today);
    defaultEnd.setHours(20, 0, 0, 0);
    
    setFormData(prev => ({
      ...prev,
      date: today,
      startTime: defaultStart,
      endTime: defaultEnd
    }));
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to set meetup location automatically.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        setLocationLoading(false);
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(currentLoc);
      
      // Reverse geocode to get address
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });
      
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const formattedAddress = formatAddress(addr);
        setFormData(prev => ({
          ...prev,
          address: formattedAddress,
          location: {
            latitude: currentLoc.coords.latitude,
            longitude: currentLoc.coords.longitude
          }
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const formatAddress = (addr) => {
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.region) parts.push(addr.region);
    return parts.join(', ');
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'title':
        return !value.trim() ? 'Title is required' : value.trim().length < 3 ? 'Title must be at least 3 characters' : '';
      case 'maxPlayers':
        const num = parseInt(value);
        return !value.trim() ? 'Max players is required' : 
               isNaN(num) ? 'Must be a number' :
               num < 2 ? 'Minimum 2 players' :
               num > 50 ? 'Maximum 50 players' : '';
      case 'courtType':
        return !value ? 'Court type is required' : '';
      case 'location':
        return !value ? 'Location is required' : '';
      case 'address':
        return !value.trim() ? 'Address is required' : '';
      case 'date':
        return !value ? 'Date is required' : '';
      case 'startTime':
        return !value ? 'Start time is required' : '';
      case 'endTime':
        return !value ? 'End time is required' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const newErrors = {};
    const fieldsToValidate = ['title', 'maxPlayers', 'courtType', 'location', 'address'];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.date < today) {
      newErrors.date = 'Date cannot be in the past';
    }

    // Time validation - combine date and time for proper comparison
    const startDateTime = new Date(formData.date);
    startDateTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);
    
    const endDateTime = new Date(formData.date);
    endDateTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes(), 0, 0);

    if (endDateTime <= startDateTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateMeetup = async () => {
    Keyboard.dismiss();
    
    if (!validateAllFields()) {
      Alert.alert('Validation Error', 'Please fix the errors before creating the meetup.');
      return;
    }

    setLoading(true);
    try {
      // Create proper datetime objects
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);
      
      const endDateTime = new Date(formData.date);
      endDateTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes(), 0, 0);

      const meetupData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        maxPlayers: parseInt(formData.maxPlayers),
        courtType: formData.courtType,
        location: formData.location,
        locationDetails: {
          address: formData.address,
          coordinates: {
            latitude: formData.location.latitude,
            longitude: formData.location.longitude
          }
        },
        dateTime: {
          date: formData.date,
          startTime: startDateTime,
          endTime: endDateTime,
          dateString: formData.date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          startTimeString: formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTimeString: formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        hostId: user.uid,
        hostName: user.displayName || user.email.split('@')[0]
      };

      await createMeetup(meetupData);
      
      Alert.alert(
        'Success! 🏐',
        'Your meetup has been created and is now visible to other players.',
        [
          {
            text: 'View on Map',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating meetup:', error);
      Alert.alert('Error', 'Failed to create meetup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (field, placeholder, options = {}) => {
    const hasError = errors[field] && touched[field];
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            hasError && styles.inputError,
            options.multiline && styles.textArea
          ]}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          editable={!loading && !options.disabled}
          {...options}
        />
        {hasError && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{errors[field]}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={loading}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Meetup</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Meetup Details</Text>
            
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            {renderInput('title', 'e.g., Evening Beach Volleyball', { maxLength: 50 })}

            <Text style={styles.label}>Description</Text>
            {renderInput('description', 'Tell players what to expect...', { 
              multiline: true, 
              numberOfLines: 3, 
              maxLength: 200 
            })}
            <Text style={styles.charCount}>{formData.description.length}/200</Text>

            {/* Game Settings */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Game Settings</Text>
            
            <Text style={styles.label}>
              Max Players <Text style={styles.required}>*</Text>
            </Text>
            {renderInput('maxPlayers', '8', { 
              keyboardType: 'numeric', 
              maxLength: 2 
            })}

            <Text style={styles.label}>
              Court Type <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.selectButton,
                errors.courtType && touched.courtType && styles.selectButtonError
              ]}
              onPress={() => setShowCourtTypeModal(true)}
              disabled={loading}
            >
              <View style={styles.selectButtonContent}>
                {formData.courtType && (
                  <MaterialIcons 
                    name={COURT_TYPES.find(c => c.id === formData.courtType)?.icon} 
                    size={20} 
                    color={COURT_TYPES.find(c => c.id === formData.courtType)?.color}
                    style={styles.selectIcon}
                  />
                )}
                <Text style={[
                  styles.selectButtonText,
                  formData.courtType && styles.selectButtonTextSelected
                ]}>
                  {formData.courtType ? COURT_TYPES.find(c => c.id === formData.courtType)?.name : 'Select Court Type'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
            </TouchableOpacity>

            {/* Location */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Location</Text>
            
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.locationContainer}>
              {renderInput('address', 'Enter meetup location', { 
                multiline: true,
                numberOfLines: 2,
                maxLength: 150
              })}
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loading || locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#FB923C" />
                ) : (
                  <MaterialIcons name="my-location" size={20} color="#FB923C" />
                )}
                <Text style={styles.locationButtonText}>
                  {locationLoading ? 'Getting...' : 'Use Current'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date & Time - NATIVE iOS PICKERS */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Schedule</Text>
            
            <Text style={styles.label}>
              Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                errors.date && styles.selectButtonError
              ]}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <MaterialIcons name="event" size={24} color="#FB923C" />
              <Text style={styles.dateTimeText}>
                {formData.date.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>
                  Start Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    errors.startTime && styles.selectButtonError
                  ]}
                  onPress={() => setShowStartTimePicker(true)}
                  disabled={loading}
                >
                  <MaterialIcons name="schedule" size={20} color="#FB923C" />
                  <Text style={styles.timeButtonText}>
                    {formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>
                  End Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    errors.endTime && styles.selectButtonError
                  ]}
                  onPress={() => setShowEndTimePicker(true)}
                  disabled={loading}
                >
                  <MaterialIcons name="schedule" size={20} color="#FB923C" />
                  <Text style={styles.timeButtonText}>
                    {formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {errors.endTime && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errors.endTime}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateMeetup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Meetup</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal with Cancel/Save */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.pickerCancelButton}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(false);
                    // The value is already updated via onChange
                  }}
                  style={styles.pickerSaveButton}
                >
                  <Text style={styles.pickerSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    handleInputChange('date', selectedDate);
                  }
                }}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>

        {/* Start Time Picker Modal with Cancel/Save */}
        <Modal
          visible={showStartTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStartTimePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowStartTimePicker(false)}
                  style={styles.pickerCancelButton}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Start Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowStartTimePicker(false);
                    // Auto-adjust end time to be 2 hours later
                    const newEndTime = new Date(formData.startTime.getTime() + 2 * 60 * 60 * 1000);
                    handleInputChange('endTime', newEndTime);
                  }}
                  style={styles.pickerSaveButton}
                >
                  <Text style={styles.pickerSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.startTime}
                mode="time"
                display="spinner"
                themeVariant="light"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    handleInputChange('startTime', selectedTime);
                  }
                }}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>

        {/* End Time Picker Modal with Cancel/Save */}
        <Modal
          visible={showEndTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEndTimePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowEndTimePicker(false)}
                  style={styles.pickerCancelButton}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>End Time</Text>
                <TouchableOpacity
                  onPress={() => setShowEndTimePicker(false)}
                  style={styles.pickerSaveButton}
                >
                  <Text style={styles.pickerSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.endTime}
                mode="time"
                display="spinner"
                themeVariant="light"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    handleInputChange('endTime', selectedTime);
                  }
                }}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>

        {/* Court Type Modal */}
        <Modal
          visible={showCourtTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCourtTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Court Type</Text>
                <TouchableOpacity
                  onPress={() => setShowCourtTypeModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {COURT_TYPES.map((court) => (
                  <TouchableOpacity
                    key={court.id}
                    style={[
                      styles.optionItem,
                      formData.courtType === court.id && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      handleInputChange('courtType', court.id);
                      setShowCourtTypeModal(false);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <MaterialIcons name={court.icon} size={24} color={court.color} />
                      <Text style={styles.optionText}>{court.name}</Text>
                    </View>
                    {formData.courtType === court.id && (
                      <MaterialIcons name="check" size={24} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionSpacing: {
    marginTop: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    minHeight: 50,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  selectButtonError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
    flex: 1,
  },
  selectButtonTextSelected: {
    color: '#111827',
  },
  locationContainer: {
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FB923C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#FB923C',
    fontWeight: '600',
    marginLeft: 6,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  optionItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
  // Date/Time Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  pickerCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  pickerSaveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FB923C',
  },
  pickerSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  datePicker: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
  },
  // iOS Keyboard Accessory Styles
  keyboardAccessory: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  keyboardDoneButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  keyboardDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateMeetupScreen;