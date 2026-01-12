import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import ApiService from '../services/api';

export default function CreateRideScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [maxPassengers, setMaxPassengers] = useState('1');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const { getAccessToken } = useAuth();
  const { getCurrentLocation, reverseGeocode } = useLocation();

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
      const address = await reverseGeocode(location.latitude, location.longitude);
      setStartAddress(address);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateTime = new Date(departureTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setDepartureTime(newDateTime);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(departureTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setDepartureTime(newDateTime);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a ride title');
      return false;
    }
    if (!startAddress.trim()) {
      Alert.alert('Error', 'Please enter a start address');
      return false;
    }
    if (!endAddress.trim()) {
      Alert.alert('Error', 'Please enter a destination address');
      return false;
    }
    if (departureTime <= new Date()) {
      Alert.alert('Error', 'Departure time must be in the future');
      return false;
    }
    const passengers = parseInt(maxPassengers);
    if (isNaN(passengers) || passengers < 1 || passengers > 3) {
      Alert.alert('Error', 'Maximum passengers must be between 1 and 3');
      return false;
    }
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available. Please enable location services.');
      return false;
    }
    return true;
  };

  const handleCreateRide = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      
      // For demo purposes, using current location as start and a mock end location
      // In a real app, you'd implement proper address geocoding
      const rideData = {
        title: title.trim(),
        description: description.trim(),
        start_address: startAddress.trim(),
        end_address: endAddress.trim(),
        start_lat: currentLocation.latitude,
        start_lng: currentLocation.longitude,
        end_lat: currentLocation.latitude + 0.01, // Mock end location
        end_lng: currentLocation.longitude + 0.01,
        departure_time: departureTime.toISOString(),
        max_passengers: parseInt(maxPassengers),
      };

      const result = await ApiService.createRide(rideData, token);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Ride created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create ride');
    }
    setLoading(false);
  };

  const useCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      const address = await reverseGeocode(location.latitude, location.longitude);
      setStartAddress(address);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create New Ride</Text>

        {/* Ride Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ride Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Morning commute to Tech Park"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Additional details about the ride..."
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Start Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Location *</Text>
          <View style={styles.addressRow}>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={startAddress}
              onChangeText={setStartAddress}
              placeholder="Enter start address"
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={useCurrentLocation}
            >
              <Text style={styles.locationButtonText}>📍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Destination *</Text>
          <TextInput
            style={styles.input}
            value={endAddress}
            onChangeText={setEndAddress}
            placeholder="Enter destination address"
          />
        </View>

        {/* Departure Date & Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Departure Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                📅 {departureTime.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                🕐 {departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Max Passengers */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maximum Passengers *</Text>
          <TextInput
            style={[styles.input, styles.numberInput]}
            value={maxPassengers}
            onChangeText={setMaxPassengers}
            keyboardType="numeric"
            placeholder="1"
            maxLength={1}
          />
          <Text style={styles.helperText}>
            Recommended: 1 passenger for safety
          </Text>
        </View>

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyTitle}>🛡️ Safety Requirements</Text>
          <Text style={styles.safetyText}>
            • Both rider and passengers must wear helmets{'\n'}
            • Helmet verification required before ride starts{'\n'}
            • Follow traffic rules and ride safely{'\n'}
            • Share live location during the ride
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreateRide}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating Ride...' : '🚀 Create Ride'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={departureTime}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    marginRight: 8,
  },
  locationButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  locationButtonText: {
    fontSize: 18,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1e293b',
  },
  numberInput: {
    width: 80,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  safetyNotice: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});