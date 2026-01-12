import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import ApiService from '../services/api';

export default function RideSearchScreen({ navigation }) {
  const [searchRadius, setSearchRadius] = useState('5');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState(null);

  const { getAccessToken } = useAuth();
  const { getCurrentLocation, reverseGeocode } = useLocation();

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setSearchLocation(location);
      searchRides(location, parseFloat(searchRadius));
    }
  };

  const searchRides = async (location, radius) => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const locationQuery = {
        lat: location.latitude,
        lng: location.longitude,
        radius_km: radius,
      };
      
      const result = await ApiService.getNearbyRides(locationQuery, token);
      if (result.success) {
        setRides(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search rides');
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (searchLocation) {
      const radius = parseFloat(searchRadius);
      if (radius > 0 && radius <= 50) {
        searchRides(searchLocation, radius);
      } else {
        Alert.alert('Error', 'Please enter a valid radius (1-50 km)');
      }
    } else {
      Alert.alert('Error', 'Location not available. Please enable location services.');
    }
  };

  const handleJoinRide = (rideId) => {
    Alert.alert(
      'Join Ride',
      'Do you want to request to join this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            // TODO: Implement join ride functionality
            Alert.alert('Success', 'Ride request sent! The host will be notified.');
          },
        },
      ]
    );
  };

  const formatDistance = (ride) => {
    if (!searchLocation) return '';
    
    // Simple distance calculation (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = (ride.start_lat - searchLocation.latitude) * Math.PI / 180;
    const dLng = (ride.start_lng - searchLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(searchLocation.latitude * Math.PI / 180) * 
              Math.cos(ride.start_lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return `${distance.toFixed(1)} km away`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Search Controls */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Search Nearby Rides</Text>
        
        {searchLocation && (
          <Text style={styles.locationText}>
            📍 Searching from your current location
          </Text>
        )}

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Search Radius (km):</Text>
          <TextInput
            style={styles.radiusInput}
            value={searchRadius}
            onChangeText={setSearchRadius}
            keyboardType="numeric"
            placeholder="5"
          />
        </View>

        <TouchableOpacity
          style={[styles.searchButton, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : '🔍 Search Rides'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Section */}
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>
          Found {rides.length} ride{rides.length !== 1 ? 's' : ''}
        </Text>

        {rides.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No rides found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try increasing your search radius or check back later
            </Text>
          </View>
        )}

        {rides.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <Text style={styles.rideTitle}>{ride.title}</Text>
              <Text style={styles.rideDistance}>{formatDistance(ride)}</Text>
            </View>

            <Text style={styles.rideRoute}>
              📍 From: {ride.start_address}
            </Text>
            <Text style={styles.rideRoute}>
              🎯 To: {ride.end_address}
            </Text>

            <View style={styles.rideDetails}>
              <Text style={styles.rideTime}>
                🕐 {new Date(ride.departure_time).toLocaleString()}
              </Text>
              <Text style={styles.ridePassengers}>
                👥 Max {ride.max_passengers} passenger{ride.max_passengers !== 1 ? 's' : ''}
              </Text>
            </View>

            {ride.description && (
              <Text style={styles.rideDescription}>{ride.description}</Text>
            )}

            <View style={styles.rideActions}>
              <Text style={[styles.rideStatus, getStatusStyle(ride.status)]}>
                {ride.status.toUpperCase()}
              </Text>
              
              {ride.status === 'created' && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoinRide(ride.id)}
                >
                  <Text style={styles.joinButtonText}>Request to Join</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Search Tips</Text>
        <Text style={styles.tipsText}>
          • Increase radius to find more rides{'\n'}
          • Check back regularly for new rides{'\n'}
          • Contact the host for specific pickup points{'\n'}
          • Always verify helmet requirements
        </Text>
      </View>
    </ScrollView>
  );
}

const getStatusStyle = (status) => {
  switch (status) {
    case 'created':
      return { color: '#059669' };
    case 'requested':
      return { color: '#d97706' };
    case 'confirmed':
      return { color: '#2563eb' };
    default:
      return { color: '#64748b' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#374151',
    marginRight: 10,
    flex: 1,
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  rideDistance: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  rideRoute: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  rideTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  ridePassengers: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rideDescription: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  rideStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#f1f5f9',
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});