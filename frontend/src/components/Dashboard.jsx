// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar, FaParking, FaHistory, FaClock, FaExclamationTriangle, FaSync, FaUser, FaMapMarkerAlt, FaQrcode, FaShieldAlt, FaSignOutAlt, FaEnvelope, FaPhone, FaIdCard } from 'react-icons/fa';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    parkingInfo: {
      total_slots: 50,
      available_slots: 35,
      booked_slots: 15,
      availability_rate: 70
    },
    activeBookings: [],
    userDetails: null,
    loading: true,
    error: null
  });
  const navigate = useNavigate();

  // API Base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Authentication helper functions
  const getAuthToken = () => {
    const tokens = localStorage.getItem('authTokens');
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        return parsedTokens.access;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const isAuthenticated = () => {
    const token = getAuthToken();
    const user = getCurrentUser();
    return !!(token && user);
  };

  // API request helper with better error handling
  const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Clear invalid tokens
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user');
        throw new Error('SESSION_EXPIRED');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Safe API request that doesn't throw errors for non-critical endpoints
  const safeApiRequest = async (endpoint, options = {}) => {
    try {
      return await apiRequest(endpoint, options);
    } catch (error) {
      console.log(`Safe API request failed for ${endpoint}:`, error.message);
      return null;
    }
  };

  // Fetch dashboard data with improved error handling
  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      const currentUser = getCurrentUser();
      
      // Check authentication first
      if (!isAuthenticated()) {
        throw new Error('NOT_AUTHENTICATED');
      }

      // Get parking slots (public endpoint - doesn't require auth)
      let slots = [];
      try {
        const slotsResponse = await fetch(`${API_BASE_URL}/slots/available/`);
        if (slotsResponse.ok) {
          slots = await slotsResponse.json();
        } else {
          // Use fallback data if slots endpoint fails
          slots = Array.from({ length: 50 }, (_, i) => ({ 
            id: i + 1, 
            status: i < 35 ? 'available' : 'occupied',
            is_available: i < 35
          }));
        }
      } catch (error) {
        console.log('Using fallback slots data:', error.message);
        slots = Array.from({ length: 50 }, (_, i) => ({ 
          id: i + 1, 
          status: i < 35 ? 'available' : 'occupied',
          is_available: i < 35
        }));
      }
      
      // Get user profile data (protected endpoint) - use safe request
      let userDetails = currentUser;
      const profileData = await safeApiRequest('/user/profile/');
      if (profileData && profileData.user) {
        userDetails = { ...currentUser, ...profileData.user };
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(userDetails));
      }

      // Get active bookings if authenticated (protected endpoint) - use safe request
      let activeBookings = [];
      const bookingsData = await safeApiRequest('/bookings/active/');
      if (bookingsData) {
        activeBookings = bookingsData;
      }

      // Calculate parking info from slots
      const totalSlots = slots?.length || 50;
      const availableSlots = slots?.filter(slot => 
        slot?.status === 'available' || slot?.is_available === true
      ).length || 35;
      const bookedSlots = totalSlots - availableSlots;
      
      const parkingInfo = {
        total_slots: totalSlots,
        available_slots: availableSlots,
        booked_slots: bookedSlots,
        availability_rate: totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 70
      };

      setDashboardData({
        parkingInfo,
        activeBookings: activeBookings || [],
        userDetails: userDetails || currentUser,
        loading: false,
        error: null
      });
      
      console.log('✅ Dashboard data fetched successfully');
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      let errorMessage = 'Failed to load dashboard data';
      let shouldRedirect = false;

      if (error.message === 'SESSION_EXPIRED' || error.message === 'NOT_AUTHENTICATED') {
        errorMessage = 'Your session has expired. Please log in again.';
        shouldRedirect = true;
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Using demo data.';
      } else if (error.message.includes('404')) {
        errorMessage = 'API endpoints not found. Using demo data.';
      }
      
      // Always set demo data on error
      const currentUser = getCurrentUser();
      setDashboardData({
        parkingInfo: {
          total_slots: 50,
          available_slots: 35,
          booked_slots: 15,
          availability_rate: 70
        },
        activeBookings: [],
        userDetails: currentUser,
        loading: false,
        error: shouldRedirect ? null : errorMessage // Don't show error if redirecting
      });

      // Redirect to login if session expired
      if (shouldRedirect) {
        setTimeout(() => {
          handleLogout();
        }, 1500);
      }
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Please log in to view dashboard.'
      }));
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleLogout = () => {
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Show loading state
  if (dashboardData.loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.backgroundAnimation}>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
        </div>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Safe data access with default values
  const currentUser = dashboardData.userDetails || getCurrentUser();
  const parkingInfo = dashboardData.parkingInfo;
  const activeBookings = dashboardData.activeBookings || [];

  // If not authenticated, show login prompt
  if (!isAuthenticated()) {
    return (
      <div style={styles.dashboard}>
        <div style={styles.backgroundAnimation}>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
        </div>
        <div style={styles.content}>
          <div style={styles.container}>
            <div style={styles.errorContainer}>
              <div style={styles.errorCard}>
                <FaExclamationTriangle size={64} style={{ color: '#f59e0b', marginBottom: '2rem' }} />
                <h2 style={styles.errorTitle}>Authentication Required</h2>
                <p style={styles.errorText}>
                  {dashboardData.error || 'Please log in to access the dashboard.'}
                </p>
                <div style={styles.errorActions}>
                  <button 
                    onClick={() => navigate('/login')}
                    style={styles.primaryButton}
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.backgroundAnimation}>
        <div style={styles.floatingShape1}></div>
        <div style={styles.floatingShape2}></div>
        <div style={styles.floatingShape3}></div>
      </div>
      
      <div style={styles.content}>
        <div style={styles.container}>
          {/* Header Section */}
          <div style={styles.headerSection}>
            <div style={styles.headerCard}>
              <div style={styles.headerContent}>
                <div style={styles.welcomeText}>
                  <h1 style={styles.welcomeTitle}>
                    Welcome back, {currentUser?.username || 'User'}! 👋
                  </h1>
                  <p style={styles.welcomeSubtitle}>
                    Manage your parking bookings and view real-time availability
                  </p>
                </div>
                <div style={styles.headerActions}>
                  <button 
                    style={styles.refreshButton}
                    onClick={handleRefresh}
                  >
                    <FaSync style={{ marginRight: '0.5rem' }} />
                    Refresh
                  </button>
                  <button 
                    style={styles.logoutButton}
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt style={{ marginRight: '0.5rem' }} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={styles.mainGrid}>
            {/* Left Column - User Info and Stats */}
            <div style={styles.leftColumn}>
              {/* User Profile Card */}
              <div style={styles.userCard}>
                <div style={styles.userCardHeader}>
                  <FaUser style={styles.userCardIcon} />
                  <h3 style={styles.userCardTitle}>User Profile</h3>
                </div>
                <div style={styles.userCardBody}>
                  <div style={styles.userAvatar}>
                    <FaUser size={40} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={styles.userInfo}>
                    <h4 style={styles.userName}>{currentUser?.username || 'N/A'}</h4>
                    <p style={styles.userEmail}>
                      <FaEnvelope style={{ marginRight: '0.5rem', color: '#64748b' }} />
                      {currentUser?.email || 'No email provided'}
                    </p>
                    <p style={styles.userRole}>
                      <FaIdCard style={{ marginRight: '0.5rem', color: '#64748b' }} />
                      {currentUser?.is_staff ? 'Administrator' : 'Regular User'}
                    </p>
                    <p style={styles.userSince}>
                      Member since: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div style={styles.statsSection}>
                <h3 style={styles.sectionTitle}>Parking Overview</h3>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      <FaParking size={24} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={styles.statContent}>
                      <div style={styles.statNumber}>{parkingInfo.total_slots}</div>
                      <div style={styles.statLabel}>Total Slots</div>
                    </div>
                  </div>
                  
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      <FaCar size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div style={styles.statContent}>
                      <div style={styles.statNumber}>{parkingInfo.available_slots}</div>
                      <div style={styles.statLabel}>Available</div>
                    </div>
                  </div>
                  
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      <FaClock size={24} style={{ color: '#f59e0b' }} />
                    </div>
                    <div style={styles.statContent}>
                      <div style={styles.statNumber}>{activeBookings.length}</div>
                      <div style={styles.statLabel}>Active Bookings</div>
                    </div>
                  </div>
                  
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                      <FaHistory size={24} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div style={styles.statContent}>
                      <div style={styles.statNumber}>{parkingInfo.availability_rate}%</div>
                      <div style={styles.statLabel}>Availability</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions and Bookings */}
            <div style={styles.rightColumn}>
              {/* Quick Actions */}
              <div style={styles.actionsSection}>
                <h3 style={styles.sectionTitle}>Quick Actions</h3>
                <div style={styles.actionsGrid}>
                  <Link to="/slot-availability" style={styles.actionCard}>
                    <div style={styles.actionIcon}>
                      <FaMapMarkerAlt size={28} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={styles.actionContent}>
                      <h5 style={styles.actionTitle}>Live Map</h5>
                      <p style={styles.actionDescription}>Real-time parking tracking</p>
                    </div>
                  </Link>
                  
                  <Link to="/booking" style={styles.actionCard}>
                    <div style={styles.actionIcon}>
                      <FaCar size={28} style={{ color: '#10b981' }} />
                    </div>
                    <div style={styles.actionContent}>
                      <h5 style={styles.actionTitle}>Book Slot</h5>
                      <p style={styles.actionDescription}>Reserve your spot</p>
                    </div>
                  </Link>
                  
                  <Link to="/booking-history" style={styles.actionCard}>
                    <div style={styles.actionIcon}>
                      <FaHistory size={28} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div style={styles.actionContent}>
                      <h5 style={styles.actionTitle}>History</h5>
                      <p style={styles.actionDescription}>Past bookings</p>
                    </div>
                  </Link>
                  
                  <div style={styles.actionCard}>
                    <div style={styles.actionIcon}>
                      <FaQrcode size={28} style={{ color: '#f59e0b' }} />
                    </div>
                    <div style={styles.actionContent}>
                      <h5 style={styles.actionTitle}>QR Code</h5>
                      <p style={styles.actionDescription}>Digital access</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Bookings */}
              <div style={styles.bookingsSection}>
                <div style={styles.bookingsHeader}>
                  <h3 style={styles.sectionTitle}>
                    Active Bookings ({activeBookings.length})
                  </h3>
                </div>
                
                {activeBookings.length > 0 ? (
                  <div style={styles.bookingsList}>
                    {activeBookings.map(booking => (
                      <div key={booking.id} style={styles.bookingCard}>
                        <div style={styles.bookingHeader}>
                          <span style={styles.bookingRef}>
                            #{booking.booking_reference || booking.id}
                          </span>
                          <span style={styles.bookingStatus}>
                            {booking.status}
                          </span>
                        </div>
                        <div style={styles.bookingDetails}>
                          <p style={styles.bookingDetail}>
                            <strong>Slot:</strong> {booking.parking_slot?.slot_number || `Slot ${booking.parking_slot_id}`}
                          </p>
                          <p style={styles.bookingDetail}>
                            <strong>Vehicle:</strong> {booking.vehicle_number} ({booking.vehicle_type})
                          </p>
                          <p style={styles.bookingDetail}>
                            <strong>Start:</strong> {new Date(booking.start_time).toLocaleString()}
                          </p>
                          {booking.expected_end_time && (
                            <p style={styles.bookingDetail}>
                              <strong>End:</strong> {new Date(booking.expected_end_time).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.noBookings}>
                    <FaCar size={48} style={{ color: '#64748b', marginBottom: '1rem' }} />
                    <h4 style={styles.noBookingsTitle}>No Active Bookings</h4>
                    <p style={styles.noBookingsText}>
                      You don't have any active parking bookings at the moment.
                    </p>
                    <Link to="/slot-availability" style={styles.primaryButton}>
                      <FaParking style={{ marginRight: '0.5rem' }} />
                      Book a Slot
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {dashboardData.error && (
            <div style={styles.errorBanner}>
              <FaExclamationTriangle style={{ marginRight: '0.5rem', color: '#f59e0b' }} />
              <span>{dashboardData.error}</span>
              <button 
                onClick={handleRefresh}
                style={styles.errorRefreshButton}
              >
                <FaSync style={{ marginRight: '0.5rem' }} />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboard: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none'
  },
  floatingShape1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'float 6s ease-in-out infinite'
  },
  floatingShape2: {
    position: 'absolute',
    top: '60%',
    right: '10%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'float 8s ease-in-out infinite 2s'
  },
  floatingShape3: {
    position: 'absolute',
    bottom: '20%',
    left: '20%',
    width: '100px',
    height: '100px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'float 7s ease-in-out infinite 1s'
  },
  content: {
    position: 'relative',
    zIndex: 1
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  loadingContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(59, 130, 246, 0.3)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '25px'
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '1.2rem',
    fontWeight: '500'
  },
  headerSection: {
    marginBottom: '2rem'
  },
  headerCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  welcomeText: {
    flex: 1
  },
  welcomeTitle: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: '800',
    fontSize: '2.2rem',
    marginBottom: '0.5rem'
  },
  welcomeSubtitle: {
    color: '#94a3b8',
    fontSize: '1.1rem',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  refreshButton: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '2px solid #3b82f6',
    color: '#3b82f6',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  },
  logoutButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '2px solid #ef4444',
    color: '#ef4444',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem',
    alignItems: 'start'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  userCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
  },
  userCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(100, 116, 139, 0.3)'
  },
  userCardIcon: {
    color: '#3b82f6',
    fontSize: '1.2rem'
  },
  userCardTitle: {
    color: '#f8fafc',
    fontSize: '1.3rem',
    fontWeight: '700',
    margin: 0
  },
  userCardBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  userAvatar: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '1.5rem',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    color: '#f8fafc',
    fontSize: '1.4rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0'
  },
  userEmail: {
    color: '#cbd5e1',
    fontSize: '0.95rem',
    margin: '0.25rem 0',
    display: 'flex',
    alignItems: 'center'
  },
  userRole: {
    color: '#cbd5e1',
    fontSize: '0.95rem',
    margin: '0.25rem 0',
    display: 'flex',
    alignItems: 'center'
  },
  userSince: {
    color: '#64748b',
    fontSize: '0.85rem',
    margin: '0.5rem 0 0 0'
  },
  statsSection: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: '1.4rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  statCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(100, 116, 139, 0.2)',
    borderRadius: '15px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    background: 'rgba(30, 41, 59, 0.8)',
    padding: '0.75rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    color: '#f8fafc',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    lineHeight: 1
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: '0.25rem'
  },
  actionsSection: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  actionCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(100, 116, 139, 0.2)',
    borderRadius: '15px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    color: 'inherit'
  },
  actionIcon: {
    background: 'rgba(30, 41, 59, 0.8)',
    padding: '0.75rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionContent: {
    flex: 1
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: '0 0 0.25rem 0'
  },
  actionDescription: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    margin: 0
  },
  bookingsSection: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
    flex: 1
  },
  bookingsHeader: {
    marginBottom: '1.5rem'
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  bookingCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(100, 116, 139, 0.2)',
    borderRadius: '15px',
    padding: '1.25rem',
    transition: 'all 0.3s ease'
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  bookingRef: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: '1rem'
  },
  bookingStatus: {
    background: '#10b981',
    color: 'white',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  bookingDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem'
  },
  bookingDetail: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    margin: '0.25rem 0'
  },
  noBookings: {
    textAlign: 'center',
    padding: '3rem 2rem'
  },
  noBookingsTitle: {
    color: '#f8fafc',
    fontSize: '1.3rem',
    fontWeight: '600',
    marginBottom: '0.5rem'
  },
  noBookingsText: {
    color: '#94a3b8',
    marginBottom: '1.5rem'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '0.85rem 1.75rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  },
  errorBanner: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    marginTop: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  errorRefreshButton: {
    background: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid #f59e0b',
    color: '#f59e0b',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem'
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '2rem'
  },
  errorCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '20px',
    padding: '3rem',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%'
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  errorText: {
    color: '#cbd5e1',
    fontSize: '1.1rem',
    marginBottom: '2rem',
    lineHeight: 1.6
  },
  errorActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  }
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
const animations = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }

  .stat-card:hover {
    transform: translateY(-5px);
    border-color: #3b82f6 !important;
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2) !important;
  }
  
  .action-card:hover {
    transform: translateY(-5px);
    border-color: #3b82f6 !important;
    text-decoration: none;
    color: #f8fafc;
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2) !important;
  }

  .booking-card:hover {
    border-color: #3b82f6 !important;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
  }

  .refresh-button:hover {
    background: rgba(59, 130, 246, 0.2) !important;
  }

  .logout-button:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }

  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = animations;
  document.head.appendChild(style);
}

export default Dashboard;