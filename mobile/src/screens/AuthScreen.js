import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'verify', 'register'
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [loading, setLoading] = useState(false);

  const { signInWithOTP, signInWithPhoneOTP, verifyOTP, user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigation.replace('Home');
    }
  }, [user]);

  const handleSendOTP = async () => {
    if (authMethod === 'email' && !email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (authMethod === 'phone' && !phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    let result;

    if (authMethod === 'email') {
      result = await signInWithOTP(email);
    } else {
      result = await signInWithPhoneOTP(phone);
    }

    setLoading(false);

    if (result.success) {
      setStep('verify');
      Alert.alert('Success', 'OTP sent successfully!');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(
      authMethod === 'email' ? email : null,
      authMethod === 'phone' ? phone : null,
      otp
    );
    setLoading(false);

    if (result.success) {
      // Check if user needs to complete registration
      const token = result.data.session.access_token;
      const profileResult = await ApiService.getUserProfile(token);
      
      if (!profileResult.success) {
        // User needs to register
        setStep('register');
      } else {
        // User exists, go to home
        navigation.replace('Home');
      }
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleRegister = async () => {
    if (!fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    const token = await useAuth().getAccessToken();
    
    const userData = {
      supabase_id: user.id,
      email: user.email || email,
      phone: user.phone || phone,
      full_name: fullName,
      role: 'rider', // Default role
    };

    const result = await ApiService.registerUser(userData, token);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Registration completed!');
      navigation.replace('Home');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const renderInputStep = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to PILLION</Text>
      <Text style={styles.subtitle}>Safe bike pooling for students & professionals</Text>

      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[styles.methodButton, authMethod === 'email' && styles.methodButtonActive]}
          onPress={() => setAuthMethod('email')}
        >
          <Text style={[styles.methodText, authMethod === 'email' && styles.methodTextActive]}>
            Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, authMethod === 'phone' && styles.methodButtonActive]}
          onPress={() => setAuthMethod('phone')}
        >
          <Text style={[styles.methodText, authMethod === 'phone' && styles.methodTextActive]}>
            Phone
          </Text>
        </TouchableOpacity>
      </View>

      {authMethod === 'email' ? (
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the code sent to {authMethod === 'email' ? email : phone}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => setStep('input')}
      >
        <Text style={styles.linkText}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterStep = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Registration</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Registering...' : 'Complete Registration'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === 'input' && renderInputStep()}
      {step === 'verify' && renderVerifyStep()}
      {step === 'register' && renderRegisterStep()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#64748b',
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  methodButtonActive: {
    backgroundColor: '#2563eb',
  },
  methodText: {
    color: '#64748b',
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
  },
});