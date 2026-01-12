class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.messageHandlers = new Map();
    this.subscriptions = new Set();
  }

  async connect(token) {
    if (this.isConnected) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/api/ws/${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Re-subscribe to previous subscriptions
        this.subscriptions.forEach(rideId => {
          this.subscribeToRide(rideId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect(token);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.subscriptions.clear();
    }
  }

  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  handleMessage(message) {
    console.log('📨 WebSocket message received:', message);

    const { type } = message;
    
    // Call registered handlers for this message type
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${type}:`, error);
        }
      });
    }

    // Handle specific message types
    switch (type) {
      case 'ride_status_update':
        this.handleRideStatusUpdate(message);
        break;
      case 'new_ride_request':
        this.handleNewRideRequest(message);
        break;
      case 'ride_confirmed':
        this.handleRideConfirmed(message);
        break;
      case 'location_update':
        this.handleLocationUpdate(message);
        break;
      case 'emergency_alert':
        this.handleEmergencyAlert(message);
        break;
      default:
        console.log('Unhandled message type:', type);
    }
  }

  // Message type handlers
  handleRideStatusUpdate(message) {
    const { ride_id, new_status, ride_data } = message;
    console.log(`🚗 Ride ${ride_id} status updated to: ${new_status}`);
    
    // Show notification to user
    this.showNotification(
      'Ride Update',
      `Your ride status changed to: ${new_status.toUpperCase()}`
    );
  }

  handleNewRideRequest(message) {
    const { ride_id, requester } = message;
    console.log(`👋 New ride request for ride ${ride_id} from ${requester.full_name}`);
    
    this.showNotification(
      'New Ride Request',
      `${requester.full_name} wants to join your ride`
    );
  }

  handleRideConfirmed(message) {
    const { ride_id, confirmed_riders } = message;
    console.log(`✅ Ride ${ride_id} confirmed with ${confirmed_riders.length} riders`);
    
    this.showNotification(
      'Ride Confirmed!',
      'Your ride has been confirmed. Get ready!'
    );
  }

  handleLocationUpdate(message) {
    const { ride_id, user_id, location } = message;
    console.log(`📍 Location update for ride ${ride_id} from user ${user_id}`);
    
    // Update location on map if available
    if (this.messageHandlers.has('location_update')) {
      // Handlers will process this
    }
  }

  handleEmergencyAlert(message) {
    const { ride_id, user_id, location } = message;
    console.log(`🚨 EMERGENCY ALERT in ride ${ride_id}`);
    
    this.showNotification(
      '🚨 EMERGENCY ALERT',
      'An emergency has been reported in your ride!',
      true // high priority
    );
  }

  // Public methods
  subscribeToRide(rideId) {
    if (!this.isConnected) {
      this.subscriptions.add(rideId);
      return;
    }

    this.sendMessage({
      type: 'subscribe_ride',
      ride_id: rideId
    });

    this.subscriptions.add(rideId);
  }

  unsubscribeFromRide(rideId) {
    if (this.isConnected) {
      this.sendMessage({
        type: 'unsubscribe_ride',
        ride_id: rideId
      });
    }

    this.subscriptions.delete(rideId);
  }

  sendLocationUpdate(rideId, location) {
    if (!this.isConnected) return;

    this.sendMessage({
      type: 'location_update',
      ride_id: rideId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      }
    });
  }

  sendEmergencyAlert(rideId, location) {
    if (!this.isConnected) return;

    this.sendMessage({
      type: 'emergency_alert',
      ride_id: rideId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      }
    });
  }

  sendMessage(message) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  // Event handler registration
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  showNotification(title, body, highPriority = false) {
    // In React Native, you'd use a notification library
    // For now, we'll just log it
    console.log(`📱 ${highPriority ? '🚨 ' : ''}${title}: ${body}`);
    
    // In production, integrate with:
    // - React Native Push Notifications
    // - Expo Notifications
    // - React Native Toast/Alert
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

// Export singleton instance
export default new WebSocketService();