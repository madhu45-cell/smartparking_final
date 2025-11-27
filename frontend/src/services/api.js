// services/api.js
// Use environment variable or hardcode your actual backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://2b08404f-ce68-495f-a692-2ad356bf37fd-dev.e1-us-east-azure.choreoapis.dev/smartparking/smartparkingbackend/v1.0';

class ApiService {
  constructor() {
    // Use the choreo backend URL directly
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.isRefreshing = false;
    this.failedQueue = [];
    
    console.log('🚀 API Service initialized with URL:', this.baseURL);
  }

  // Authentication methods
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  setRefreshToken(refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getCurrentUser() {
    return this.user;
  }

  // Clear all auth data
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Redirect to login
  redirectToLogin() {
    this.clearAuth();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Token refresh method
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setToken(data.access);
      return data.access;
    } catch (error) {
      this.redirectToLogin();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Process queue of failed requests
  processQueue(error, token = null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // Enhanced API request helper with token refresh
  async request(endpoint, options = {}) {
    // Ensure endpoint starts with /
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}/api${formattedEndpoint}`;
    
    console.log(`🌐 Making API call to: ${url}`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Handle request body
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration (401)
      if (response.status === 401 && this.token) {
        // If we're already refreshing, queue the request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            config.headers.Authorization = `Bearer ${token}`;
            return this.request(endpoint, config);
          }).catch(err => {
            throw err;
          });
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          this.isRefreshing = false;
          
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${newToken}`;
          this.processQueue(null, newToken);
          
          return await this.request(endpoint, config);
        } catch (refreshError) {
          this.isRefreshing = false;
          this.processQueue(refreshError, null);
          this.redirectToLogin();
          throw refreshError;
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Handle specific status codes
        if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API Request failed for ${endpoint}:`, error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error. Cannot connect to backend at ${this.baseURL}`);
      }
      
      throw error;
    }
  }

  // =====================
  // AUTHENTICATION ENDPOINTS
  // =====================

  async login(credentials) {
    const response = await this.request('/auth/login/', {
      method: 'POST',
      body: credentials
    });
    
    if (response.access) {
      this.setToken(response.access);
    }
    if (response.refresh) {
      this.setRefreshToken(response.refresh);
    }
    if (response.user) {
      this.setUser(response.user);
    }
    
    return response;
  }

  async register(userData) {
    return await this.request('/auth/register/', {
      method: 'POST',
      body: userData
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout/', {
        method: 'POST'
      });
    } catch (error) {
      console.warn('Logout API call failed, clearing local data anyway:', error);
    } finally {
      this.clearAuth();
    }
  }

  async refreshAuthToken() {
    return await this.request('/auth/token/refresh/', {
      method: 'POST',
      body: { refresh: this.getRefreshToken() }
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Test backend connection
  async testBackendConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/health/`);
      return {
        connected: response.ok,
        backendUrl: this.baseURL,
        status: response.status
      };
    } catch (error) {
      return {
        connected: false,
        backendUrl: this.baseURL,
        error: error.message
      };
    }
  }

  // ... rest of your methods remain the same
  // =====================
  // PARKING SLOTS ENDPOINTS - REAL DATA
  // =====================

  async getSlots() {
    return await this.request('/slots/');
  }

  async getAvailableSlots() {
    return await this.request('/slots/available/');
  }

  async getSlotDetail(slotId) {
    return await this.request(`/slots/${slotId}/`);
  }

  // =====================
  // ADMIN SLOTS MANAGEMENT - REAL DATA
  // =====================

  async getAdminSlots() {
    return await this.request('/admin/slots/');
  }

  async createParkingSlot(slotData) {
    return await this.request('/admin/slots/create/', {
      method: 'POST',
      body: slotData
    });
  }

  async updateParkingSlot(slotId, slotData) {
    return await this.request(`/admin/slots/${slotId}/update/`, {
      method: 'PUT',
      body: slotData
    });
  }

  async deleteParkingSlot(slotId) {
    return await this.request(`/admin/slots/${slotId}/delete/`, {
      method: 'DELETE'
    });
  }

  async changeSlotStatus(slotId, status, durationHours = 24) {
    return await this.request(`/admin/slots/${slotId}/status/`, {
      method: 'POST',
      body: { status, duration_hours: durationHours }
    });
  }

  // =====================
  // BOOKING ENDPOINTS - REAL DATA
  // =====================

  async createBooking(bookingData) {
    return await this.request('/bookings/', {
      method: 'POST',
      body: bookingData
    });
  }

  async getUserBookings() {
    return await this.request('/bookings/user/');
  }

  async getActiveBookings() {
    return await this.request('/bookings/active/');
  }

  async getBookingHistory() {
    return await this.request('/bookings/history/');
  }

  async getBookingDetail(bookingId) {
    return await this.request(`/bookings/${bookingId}/`);
  }

  async cancelBooking(bookingId, reason = '') {
    return await this.request(`/bookings/${bookingId}/cancel/`, {
      method: 'POST',
      body: { reason }
    });
  }

  async checkInBooking(bookingId) {
    return await this.request(`/bookings/${bookingId}/check-in/`, {
      method: 'POST'
    });
  }

  async checkOutBooking(bookingId) {
    return await this.request(`/bookings/${bookingId}/check-out/`, {
      method: 'POST'
    });
  }

  // =====================
  // PAYMENT ENDPOINTS
  // =====================

  async processPayment(bookingId, paymentData) {
    return await this.request(`/bookings/${bookingId}/payment/`, {
      method: 'POST',
      body: paymentData
    });
  }

  // =====================
  // USER PROFILE ENDPOINTS
  // =====================

  async getUserProfile() {
    return await this.request('/user/profile/');
  }

  async updateUserProfile(profileData) {
    return await this.request('/user/profile/', {
      method: 'PUT',
      body: profileData
    });
  }

  // =====================
  // ADMIN DASHBOARD ENDPOINTS
  // =====================

  async getDashboardData() {
    return await this.request('/admin/dashboard/');
  }

  async getAdminBookings() {
    return await this.request('/admin/bookings/');
  }

  async getAdminUsers() {
    return await this.request('/admin/users/');
  }

  async getAdminReports() {
    return await this.request('/admin/reports/');
  }

  async updateBookingStatus(bookingId, status) {
    return await this.request(`/admin/bookings/${bookingId}/`, {
      method: 'PATCH',
      body: { status }
    });
  }

  // =====================
  // PUBLIC ENDPOINTS
  // =====================

  async getParkingInfo() {
    return await this.request('/parking/info/');
  }

  async healthCheck() {
    return await this.request('/health/');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;