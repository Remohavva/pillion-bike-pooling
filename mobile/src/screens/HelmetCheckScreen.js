import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';

export default function HelmetCheckScreen({ navigation, route }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verified, setVerified] = useState(false);

  const { getAccessToken } = useAuth();
  const rideId = route?.params?.rideId;

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        setCapturedImage(photo);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Error', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0]);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setVerified(false);
  };

  const uploadAndVerify = async () => {
    if (!capturedImage) {
      Alert.alert('Error', 'Please take a helmet selfie first');
      return;
    }

    setUploading(true);
    try {
      const token = await getAccessToken();
      
      // Upload image (mock implementation)
      const uploadResult = await ApiService.uploadHelmetImage(capturedImage, token);
      
      if (uploadResult.success) {
        // Verify helmet (mock implementation)
        const verifyResult = await ApiService.verifyHelmet(
          rideId || 1,
          uploadResult.data.image_url,
          token
        );
        
        if (verifyResult.success) {
          setVerified(true);
          Alert.alert(
            'Helmet Verified! ✅',
            'Your helmet has been verified. You can now start your ride safely.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  if (rideId) {
                    navigation.navigate('RideStatus', { rideId });
                  } else {
                    navigation.goBack();
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Verification Failed ❌',
            'Helmet not detected or unclear image. Please retake the photo ensuring your helmet is clearly visible.'
          );
        }
      } else {
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    }
    setUploading(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required for helmet verification</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Helmet Verification</Text>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
          {verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✅ VERIFIED</Text>
            </View>
          )}
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Review Your Photo</Text>
          <Text style={styles.instructionText}>
            Make sure your helmet is clearly visible and properly worn before submitting for verification.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={retakePicture}>
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryButton, (uploading || verified) && styles.buttonDisabled]}
            onPress={uploadAndVerify}
            disabled={uploading || verified}
          >
            <Text style={styles.primaryButtonText}>
              {uploading ? 'Verifying...' : verified ? 'Verified ✅' : 'Verify Helmet'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Helmet Safety Check</Text>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>📸 Take a Helmet Selfie</Text>
        <Text style={styles.instructionText}>
          • Wear your helmet properly{'\n'}
          • Face the camera directly{'\n'}
          • Ensure good lighting{'\n'}
          • Make sure helmet is clearly visible
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.front}
          ref={setCameraRef}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.helmetGuide}>
              <Text style={styles.guideText}>Position your head here</Text>
            </View>
          </View>
        </Camera>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImageFromGallery}>
          <Text style={styles.secondaryButtonText}>📷 Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={takePicture}>
          <Text style={styles.primaryButtonText}>📸 Take Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.safetyNotice}>
        <Text style={styles.safetyTitle}>🛡️ Why Helmet Verification?</Text>
        <Text style={styles.safetyText}>
          Helmet verification ensures all riders follow safety protocols. 
          This protects everyone and may be required by local regulations.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructions: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helmetGuide: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  guideText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  capturedImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    flex: 0.6,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    flex: 0.35,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  safetyNotice: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 8,
    padding: 16,
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
    lineHeight: 18,
  },
});