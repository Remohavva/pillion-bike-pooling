import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import ApiService from '../services/api';

export default function HomeScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user, signOut, getAccessToken } = useAuth();
  const { location, getCurrentLocation } = useLocation();

  useEffect(() => {
    loadUserProfile();
    loadNearbyRides();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await getAccessToken();
      const result = await ApiService.getUserProfile(token);
      
      if (result.success) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadNearbyRides = async () => {
    setLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        const token = await getAccessToken();
        const locationQuery = {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          radius_km: 5.0,
        };
        
        const result = await ApiService.getNearbyRides(locationQuery, token);
        if (result.success) {
          setNearbyRides(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load nearby rides:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadNearbyRides()]);
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              navigation.replace('Auth');
            }
          },
        },
      ]
    );
  };

  const canCreateRides = userProfile?.role === 'bike_host' || userProfile?.role === 'admin';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <Text style={styles.welcomeText}>
          Welcome, {userProfile?.full_name || 'User'}!
        </Text>
        <Text style={styles.roleText}>
          Role: {userProfile?.role?.replace('_', ' ').toUpperCase() || 'RIDER'}
        </Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RideSearch')}
        >
          <Text style={styles.actionButtonText}>🔍 Find Rides</Text>
        </TouchableOpacity>

        {canCreateRides && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('CreateRide')}
          >
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              ➕ Create Ride
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('HelmetCheck')}
        >
          <Text style={styles.actionButtonText}>🪖 Helmet Check</Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Rides Section */}
      <View style={styles.ridesSection}>
        <Text style={styles.sectionTitle}>Nearby Rides</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading rides...</Text>
        ) : nearbyRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No rides found nearby</Text>
            <Text style={styles.emptyStateSubtext}>
              Try expanding your search radius or create a new ride
            </Text>
          </View>
        ) : (
          nearbyRides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              onPress={() => navigation.navigate('RideStatus', { rideId: ride.id })}
            >
              <Text style={styles.rideTitle}>{ride.title}</Text>
              <Text style={styles.rideRoute}>
                {ride.start_address} → {ride.end_address}
              </Text>
              <Text style={styles.rideTime}>
                Departure: {new Date(ride.departure_time).toLocaleString()}
              </Text>
              <Text style={styles.rideStatus}>
                Status: {ride.status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Safety Notice */}
      <View style={styles.safetySection}>
        <Text style={styles.safetyTitle}>🛡️ Safety First</Text>
        <Text style={styles.safetyText}>
          Always wear a helmet and verify your safety gear before starting any ride.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileSection: {
    backgroundColor: '#2563eb',
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 15,
  },
  signOutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  ridesSection: {
    padding: 20,
    marginBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  rideRoute: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  rideTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  rideStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  safetySection: {
    backgroundColor: '#fef3c7',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
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
  },
});