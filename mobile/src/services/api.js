const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'API request failed');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Auth endpoints
  async registerUser(userData, token) {
    return this.request('/users/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(token) {
    return this.request('/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Ride endpoints
  async createRide(rideData, token) {
    return this.request('/rides/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rideData),
    });
  }

  async getNearbyRides(locationData, token) {
    return this.request('/rides/nearby', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(locationData),
    });
  }

  // Helmet verification endpoints (to be implemented)
  async uploadHelmetImage(imageData, token) {
    // TODO: Implement helmet image upload
    return { success: true, data: { image_url: 'placeholder' } };
  }

  async verifyHelmet(rideId, imageUrl, token) {
    // TODO: Implement helmet verification
    return { success: true, data: { verified: true } };
  }
}

export default new ApiService();