import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import RideSearchScreen from './src/screens/RideSearchScreen';
import CreateRideScreen from './src/screens/CreateRideScreen';
import HelmetCheckScreen from './src/screens/HelmetCheckScreen';
import RideStatusScreen from './src/screens/RideStatusScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <WebSocketProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator 
              initialRouteName="Auth"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#2563eb',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Auth" 
                component={AuthScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'PILLION' }}
              />
              <Stack.Screen 
                name="RideSearch" 
                component={RideSearchScreen} 
                options={{ title: 'Find Rides' }}
              />
              <Stack.Screen 
                name="CreateRide" 
                component={CreateRideScreen} 
                options={{ title: 'Create Ride' }}
              />
              <Stack.Screen 
                name="HelmetCheck" 
                component={HelmetCheckScreen} 
                options={{ title: 'Helmet Verification' }}
              />
              <Stack.Screen 
                name="RideStatus" 
                component={RideStatusScreen} 
                options={{ title: 'Ride Status' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </WebSocketProvider>
      </LocationProvider>
    </AuthProvider>
  );
}