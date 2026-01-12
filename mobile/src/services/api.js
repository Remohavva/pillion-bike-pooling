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

  // Helmet verification endpoints
  async uploadHelmetImage(imageUri, token) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'helmet.jpg',
      });

      const response = await fetch(`${this.baseURL}/helmet/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyHelmet(rideId, imageUrl, token) {
    return this.request('/helmet/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ride_id: rideId,
        image_url: imageUrl,
      }),
    });
  }

  async getHelmetCheck(rideId, token) {
    return this.request(`/helmet/check/${rideId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default new ApiService();