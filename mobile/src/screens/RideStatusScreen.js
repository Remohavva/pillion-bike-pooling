import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RideStatusScreen({ navigation, route }) {
  const [rideStatus, setRideStatus] = useState('created');
  const [rideData, setRideData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const rideId = route?.params?.rideId;

  useEffect(() => {
    // Mock ride data - in real app, fetch from API
    setRideData({
      id: rideId || 1,
      title: 'Morning Commute to Tech Park',
      start_address: 'Koramangala, Bangalore',
      end_address: 'Electronic City, Bangalore',
      departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      host_name: 'Rahul Kumar',
      host_phone: '+91 98765 43210',
      status: 'confirmed',
      live_location_link: 'https://maps.google.com/share/location/mock',
    });
    setRideStatus('confirmed');
  }, [rideId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'created': return '#64748b';
      case 'requested': return '#d97706';
      case 'confirmed': return '#059669';
      case 'ongoing': return '#2563eb';
      case 'completed': return '#059669';
      case 'cancelled': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'created': return 'Ride Created';
      case 'requested': return 'Request Sent';
      case 'confirmed': return 'Ride Confirmed';
      case 'ongoing': return 'Ride in Progress';
      case 'completed': return 'Ride Completed';
      case 'cancelled': return 'Ride Cancelled';
      default: return 'Unknown Status';
    }
  };

  const handleStartRide = () => {
    Alert.alert(
      'Start Ride',
      'Have you completed your helmet verification?',
      [
        { text: 'No, Check Helmet', onPress: () => navigation.navigate('HelmetCheck', { rideId }) },
        {
          text: 'Yes, Start Ride',
          onPress: () => {
            setRideStatus('ongoing');
            Alert.alert('Ride Started', 'Have a safe journey! Live location sharing is now active.');
          },
        },
      ]
    );
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Complete Ride',
      'Mark this ride as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            setRideStatus('completed');
            Alert.alert('Ride Completed', 'Thank you for using PILLION! Please rate your experience.');
          },
        },
      ]
    );
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setRideStatus('cancelled');
            Alert.alert('Ride Cancelled', 'The ride has been cancelled. All participants have been notified.');
          },
        },
      ]
    );
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send your location to emergency contacts and local authorities.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            Alert.alert('SOS Sent', 'Emergency alert has been sent with your current location.');
          },
        },
      ]
    );
  };

  const handleCallHost = () => {
    if (rideData?.host_phone) {
      Linking.openURL(`tel:${rideData.host_phone}`);
    }
  };

  const handleShareLocation = () => {
    if (rideData?.live_location_link) {
      Alert.alert(
        'Share Live Location',
        'Share your live location link with family or friends?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: () => {
              // In real app, use sharing API
              Alert.alert('Location Shared', 'Live location link has been shared.');
            },
          },
        ]
      );
    }
  };

  if (!rideData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={[styles.statusHeader, { backgroundColor: getStatusColor(rideStatus) }]}>
        <Text style={styles.statusText}>{getStatusText(rideStatus)}</Text>
        <Text style={styles.rideTitle}>{rideData.title}</Text>
      </View>

      {/* Ride Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Ride Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 From:</Text>
          <Text style={styles.detailValue}>{rideData.start_address}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🎯 To:</Text>
          <Text style={styles.detailValue}>{rideData.end_address}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🕐 Departure:</Text>
          <Text style={styles.detailValue}>
            {new Date(rideData.departure_time).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👤 Host:</Text>
          <Text style={styles.detailValue}>{rideData.host_name}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {rideStatus === 'confirmed' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartRide}>
              <Text style={styles.primaryButtonText}>🚀 Start Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helmetButton} onPress={() => navigation.navigate('HelmetCheck', { rideId })}>
              <Text style={styles.helmetButtonText}>🪖 Verify Helmet</Text>
            </TouchableOpacity>
          </>
        )}

        {rideStatus === 'ongoing' && (
          <>
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteRide}>
              <Text style={styles.completeButtonText}>✅ Complete Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton} onPress={handleShareLocation}>
              <Text style={styles.shareButtonText}>📍 Share Live Location</Text>
            </TouchableOpacity>
          </>
        )}

        {(rideStatus === 'confirmed' || rideStatus === 'ongoing') && (
          <>
            <TouchableOpacity style={styles.callButton} onPress={handleCallHost}>
              <Text style={styles.callButtonText}>📞 Call Host</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
              <Text style={styles.cancelButtonText}>❌ Cancel Ride</Text>
            </TouchableOpacity>
          </>
        )}

        {rideStatus === 'completed' && (
          <View style={styles.completedState}>
            <Text style={styles.completedText}>✅ Ride completed successfully!</Text>
            <TouchableOpacity style={styles.rateButton}>
              <Text style={styles.rateButtonText}>⭐ Rate Experience</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Emergency Section */}
      {(rideStatus === 'ongoing' || rideStatus === 'confirmed') && (
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>🚨 Emergency</Text>
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.sosButtonText}>SOS - Send Emergency Alert</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyText}>
            Use only in case of emergency. This will alert authorities and your emergency contacts.
          </Text>
        </View>
      )}

      {/* Safety Tips */}
      <View style={styles.safetySection}>
        <Text style={styles.safetyTitle}>🛡️ Safety Tips</Text>
        <Text style={styles.safetyText}>
          • Keep your helmet on at all times{'\n'}
          • Follow traffic rules{'\n'}
          • Stay in touch with the host{'\n'}
          • Share your live location with family{'\n'}
          • Report any issues immediately
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
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 50,
  },
  statusHeader: {
    padding: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  rideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    fontWeight: '500',
  },
  actionsSection: {
    margin: 20,
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helmetButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  helmetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  callButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  completedState: {
    alignItems: 'center',
    padding: 20,
  },
  completedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 15,
  },
  rateButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#92400e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencySection: {
    backgroundColor: '#fef2f2',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
  },
  sosButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
  },
  safetySection: {
    backgroundColor: '#f0f9ff',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
});