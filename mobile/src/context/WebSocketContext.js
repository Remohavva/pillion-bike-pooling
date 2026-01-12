import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/websocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext({});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { user, getAccessToken } = useAuth();

  useEffect(() => {
    if (user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  const connectWebSocket = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setConnectionStatus('connecting');
        await WebSocketService.connect(token);
        
        // Listen for connection status changes
        WebSocketService.onMessage('connection_established', () => {
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        WebSocketService.onMessage('error', (message) => {
          console.error('WebSocket error:', message);
          setConnectionStatus('error');
        });
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectWebSocket = () => {
    WebSocketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const subscribeToRide = (rideId) => {
    WebSocketService.subscribeToRide(rideId);
  };

  const unsubscribeFromRide = (rideId) => {
    WebSocketService.unsubscribeFromRide(rideId);
  };

  const sendLocationUpdate = (rideId, location) => {
    WebSocketService.sendLocationUpdate(rideId, location);
  };

  const sendEmergencyAlert = (rideId, location) => {
    WebSocketService.sendEmergencyAlert(rideId, location);
  };

  const onRideStatusUpdate = (handler) => {
    WebSocketService.onMessage('ride_status_update', handler);
  };

  const onNewRideRequest = (handler) => {
    WebSocketService.onMessage('new_ride_request', handler);
  };

  const onRideConfirmed = (handler) => {
    WebSocketService.onMessage('ride_confirmed', handler);
  };

  const onLocationUpdate = (handler) => {
    WebSocketService.onMessage('location_update', handler);
  };

  const onEmergencyAlert = (handler) => {
    WebSocketService.onMessage('emergency_alert', handler);
  };

  const value = {
    isConnected,
    connectionStatus,
    subscribeToRide,
    unsubscribeFromRide,
    sendLocationUpdate,
    sendEmergencyAlert,
    onRideStatusUpdate,
    onNewRideRequest,
    onRideConfirmed,
    onLocationUpdate,
    onEmergencyAlert,
    reconnect: connectWebSocket,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};