// components/BookingHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHistory, 
  FaCar, 
  FaParking, 
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSync,
  FaArrowLeft,
  FaReceipt
} from 'react-icons/fa';
import apiService from '../services/api';

function BookingHistory({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    console.log('🔍 useEffect triggered, location state:', location.state);
    
    // Check for success messages first
    if (location.state?.message) {
      console.log('📝 Setting success message from location state');
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
      // Clear the state to prevent showing again
      window.history.replaceState({}, document.title);
    }
    
    if (location.state?.bookingSuccess) {
      console.log('🎉 Setting booking success message');
      setSuccessMessage('🎉 Booking created successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
      window.history.replaceState({}, document.title);
    }
    
    // Load booking history
    loadBookingHistory();
  }, [location]); // Only depend on location, not loadBookingHistory

  const loadBookingHistory = async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('⏳ Loading already in progress, skipping...');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('📖 Loading booking history...');
      console.log('🔐 Authentication check:', {
        hasToken: !!apiService.token,
        hasUser: !!apiService.user,
        isAuthenticated: apiService.isAuthenticated()
      });
      
      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        console.log('❌ User not authenticated, showing login prompt');
        setError('Please login to view your booking history');
        setLoading(false);
        return;
      }
      
      console.log('✅ User is authenticated, fetching bookings...');
      const bookingData = await apiService.getUserBookings();
      console.log('✅ Bookings API response:', bookingData);
      
      // Handle different response formats
      let bookingsArray = [];
      if (Array.isArray(bookingData)) {
        bookingsArray = bookingData;
      } else if (bookingData && Array.isArray(bookingData.bookings)) {
        bookingsArray = bookingData.bookings;
      } else if (bookingData && bookingData.results) {
        bookingsArray = bookingData.results;
      } else if (bookingData) {
        console.warn('Unexpected booking data format:', bookingData);
        bookingsArray = [];
      }
      
      console.log(`📊 Setting ${bookingsArray.length} bookings`);
      setBookings(bookingsArray);
      
    } catch (error) {
      console.error('❌ Error loading booking history:', error);
      
      // Handle specific error cases
      if (error.message.includes('Session expired') || error.message.includes('Unauthorized')) {
        setError('Your session has expired. Please login again.');
      } else if (error.message.includes('Network error')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(error.message || 'Failed to load booking history. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    console.log('🔗 Redirecting to login page');
    navigate('/login', { 
      state: { 
        from: '/booking-history',
        message: 'Please login to view your booking history'
      }
    });
  };

  // ... (keep all your existing helper functions: getStatusBadge, getPaymentStatusBadge, getStatusIcon, formatDateTime, calculateDuration, etc.)

  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    };

    switch (status?.toLowerCase()) {
      case 'confirmed':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        };
      case 'active':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        };
      case 'completed':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          color: '#8b5cf6',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        };
      case 'cancelled':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(100, 116, 139, 0.2)',
          color: '#64748b',
          border: '1px solid rgba(100, 116, 139, 0.3)'
        };
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };

    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        };
      case 'pending':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        };
      case 'failed':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(100, 116, 139, 0.2)',
          color: '#64748b',
          border: '1px solid rgba(100, 116, 139, 0.3)'
        };
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <FaCheckCircle style={{ color: '#3b82f6', fontSize: '12px' }} />;
      case 'active':
        return <FaClock style={{ color: '#10b981', fontSize: '12px' }} />;
      case 'completed':
        return <FaCheckCircle style={{ color: '#8b5cf6', fontSize: '12px' }} />;
      case 'cancelled':
        return <FaTimesCircle style={{ color: '#ef4444', fontSize: '12px' }} />;
      default:
        return <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: '12px' }} />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
      
      const diffMs = end - start;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'N/A';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status?.toLowerCase() === filter.toLowerCase();
  });

  const handleCancelBooking = async (bookingId) => {
    if (!apiService.isAuthenticated()) {
      setError('Please login to perform this action');
      return;
    }

    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await apiService.cancelBooking(bookingId, 'User requested cancellation');
        setSuccessMessage('✅ Booking cancelled successfully!');
        loadBookingHistory();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        setError('Failed to cancel booking. Please try again.');
      }
    }
  };

  const handleCheckIn = async (bookingId) => {
    if (!apiService.isAuthenticated()) {
      setError('Please login to perform this action');
      return;
    }

    try {
      await apiService.checkInBooking(bookingId);
      setSuccessMessage('✅ Checked in successfully!');
      loadBookingHistory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (!apiService.isAuthenticated()) {
      setError('Please login to perform this action');
      return;
    }

    try {
      await apiService.checkOutBooking(bookingId);
      setSuccessMessage('✅ Checked out successfully!');
      loadBookingHistory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Failed to check out. Please try again.');
    }
  };

  const handleProcessPayment = async (bookingId) => {
    if (!apiService.isAuthenticated()) {
      setError('Please login to perform this action');
      return;
    }

    try {
      await apiService.processPayment(bookingId, { payment_method: 'card' });
      setSuccessMessage('✅ Payment processed successfully!');
      loadBookingHistory();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Failed to process payment. Please try again.');
    }
  };

  // Handle navigation to different pages
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleFindParkingSlots = () => {
    navigate('/slot-availability');
  };

  const getSlotDisplayName = (booking) => {
    if (booking.parking_slot?.slot_number) {
      return `Slot ${booking.parking_slot.slot_number}`;
    } else if (booking.parking_slot_id) {
      return `Slot ${booking.parking_slot_id}`;
    } else if (booking.slot_number) {
      return `Slot ${booking.slot_number}`;
    }
    return 'Unknown Slot';
  };

  const getVehicleDisplay = (booking) => {
    const vehicleNumber = booking.vehicle_number || 'N/A';
    const vehicleType = booking.vehicle_type || 'Car';
    return `${vehicleNumber} (${vehicleType})`;
  };

  // Debug: Log current state
  console.log('🔄 Component render state:', {
    loading,
    authenticated: apiService.isAuthenticated(),
    bookingsCount: bookings.length,
    error,
    successMessage
  });

  // Show login prompt if not authenticated
  if (!apiService.isAuthenticated()) {
    console.log('👤 Rendering login prompt (user not authenticated)');
    return (
      <div style={styles.container}>
        <div style={styles.backgroundAnimation}>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
        </div>
        
        <div style={styles.content}>
          <div style={styles.header}>
            <button 
              onClick={() => navigate('/')}
              style={styles.backButton}
              className="back-button"
            >
              <FaArrowLeft style={styles.backIcon} />
              Back to Home
            </button>
            <h1 style={styles.title}>
              <FaHistory style={styles.titleIcon} />
              Booking History
            </h1>
          </div>

          <div style={styles.loginPrompt}>
            <div style={styles.loginIcon}>
              <FaExclamationTriangle />
            </div>
            <h2 style={styles.loginTitle}>Authentication Required</h2>
            <p style={styles.loginText}>
              Please login to view your booking history and manage your parking bookings.
            </p>
            <button 
              onClick={handleLoginRedirect}
              style={styles.loginButton}
              className="cta-button"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.backgroundAnimation}>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
        </div>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your booking history...</p>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering main booking history with', bookings.length, 'bookings');
  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}>
        <div style={styles.floatingShape1}></div>
        <div style={styles.floatingShape2}></div>
        <div style={styles.floatingShape3}></div>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <button 
            onClick={handleBackToDashboard}
            style={styles.backButton}
            className="back-button"
          >
            <FaArrowLeft style={styles.backIcon} />
            Back to Dashboard
          </button>
          <h1 style={styles.title}>
            <FaHistory style={styles.titleIcon} />
            Booking History
          </h1>
          <button 
            onClick={loadBookingHistory}
            style={styles.refreshButton}
            className="refresh-button"
            disabled={loading}
          >
            <FaSync style={styles.refreshIcon} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={styles.successAlert}>
            <FaCheckCircle style={styles.successIcon} />
            <div style={styles.successText}>{successMessage}</div>
            <button 
              onClick={() => setSuccessMessage('')}
              style={styles.closeButton}
            >
              ×
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={styles.errorAlert}>
            <FaExclamationTriangle style={styles.errorIcon} />
            <div style={styles.errorText}>{error}</div>
            <button 
              onClick={() => setError('')}
              style={styles.closeButton}
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Summary */}
        <div style={styles.statsSection}>
          <div style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <FaReceipt style={{ color: '#3b82f6' }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statNumber}>{bookings.length}</h3>
              <p style={styles.statLabel}>Total Bookings</p>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <FaClock style={{ color: '#10b981' }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statNumber}>
                {bookings.filter(b => b.status?.toLowerCase() === 'active').length}
              </h3>
              <p style={styles.statLabel}>Active Now</p>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <FaCheckCircle style={{ color: '#8b5cf6' }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statNumber}>
                {bookings.filter(b => b.status?.toLowerCase() === 'completed').length}
              </h3>
              <p style={styles.statLabel}>Completed</p>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <FaDollarSign style={{ color: '#f59e0b' }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statNumber}>
                ₹{bookings
                  .filter(b => b.status?.toLowerCase() === 'completed')
                  .reduce((sum, booking) => sum + parseFloat(booking.total_amount || booking.amount || 0), 0)
                  .toFixed(2)}
              </h3>
              <p style={styles.statLabel}>Total Spent</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filtersSection}>
          <h3 style={styles.filtersTitle}>Filter by Status:</h3>
          <div style={styles.filterButtons}>
            {['all', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  ...styles.filterButton,
                  ...(filter === status ? styles.filterButtonActive : {})
                }}
                className="filter-button"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div style={styles.bookingsSection}>
          {filteredBookings.length === 0 ? (
            <div style={styles.emptyState}>
              <FaHistory style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>
                {bookings.length === 0 ? 'No Bookings Yet' : 'No Matching Bookings'}
              </h3>
              <p style={styles.emptyText}>
                {bookings.length === 0 
                  ? "You haven't made any bookings yet. Start by exploring available parking slots!"
                  : `No bookings found with status: ${filter}`
                }
              </p>
              {bookings.length === 0 && (
                <button 
                  onClick={handleFindParkingSlots}
                  style={styles.ctaButton}
                  className="cta-button"
                >
                  <FaParking style={{ marginRight: '0.5rem' }} />
                  Find Parking Slots
                </button>
              )}
            </div>
          ) : (
            <div style={styles.bookingsGrid}>
              {filteredBookings.map(booking => (
                <div key={booking.id} style={styles.bookingCard} className="booking-card">
                  <div style={styles.bookingHeader}>
                    <div style={styles.bookingInfo}>
                      <h3 style={styles.bookingReference}>
                        #{booking.booking_reference || booking.reference || `BK${booking.id}`.padStart(8, '0')}
                      </h3>
                      <div style={styles.statusSection}>
                        <span style={getStatusBadge(booking.status)}>
                          {getStatusIcon(booking.status)} {booking.status || 'unknown'}
                        </span>
                        <span style={getPaymentStatusBadge(booking.payment_status)}>
                          {booking.payment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div style={styles.bookingAmount}>
                      <FaDollarSign style={styles.amountIcon} />
                      <span style={styles.amountText}>
                        ₹{parseFloat(booking.total_amount || booking.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={styles.bookingDetails}>
                    <div style={styles.detailRow}>
                      <div style={styles.detailItem}>
                        <FaParking style={styles.detailIcon} />
                        <span>
                          <strong>Slot:</strong> {getSlotDisplayName(booking)}
                        </span>
                      </div>
                      <div style={styles.detailItem}>
                        <FaCar style={styles.detailIcon} />
                        <span>
                          <strong>Vehicle:</strong> {getVehicleDisplay(booking)}
                        </span>
                      </div>
                    </div>

                    <div style={styles.detailRow}>
                      <div style={styles.detailItem}>
                        <FaCalendarAlt style={styles.detailIcon} />
                        <span>
                          <strong>Start:</strong> {formatDateTime(booking.start_time)}
                        </span>
                      </div>
                      <div style={styles.detailItem}>
                        <FaClock style={styles.detailIcon} />
                        <span>
                          <strong>End:</strong> {formatDateTime(booking.expected_end_time || booking.end_time)}
                        </span>
                      </div>
                    </div>

                    {booking.actual_end_time && (
                      <div style={styles.detailRow}>
                        <div style={styles.detailItem}>
                          <FaCheckCircle style={styles.detailIcon} />
                          <span>
                            <strong>Actual End:</strong> {formatDateTime(booking.actual_end_time)}
                          </span>
                        </div>
                        <div style={styles.detailItem}>
                          <FaClock style={styles.detailIcon} />
                          <span>
                            <strong>Duration:</strong> {calculateDuration(booking.start_time, booking.actual_end_time)}
                          </span>
                        </div>
                      </div>
                    )}

                    {booking.special_requirements && (
                      <div style={styles.requirements}>
                        <strong>Special Requirements:</strong> {booking.special_requirements}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={styles.bookingActions}>
                    {booking.status?.toLowerCase() === 'confirmed' && (
                      <>
                        <button 
                          onClick={() => handleCheckIn(booking.id)}
                          style={styles.actionButton}
                          className="action-button"
                        >
                          Check In
                        </button>
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          style={{...styles.actionButton, ...styles.cancelButton}}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {booking.status?.toLowerCase() === 'active' && (
                      <button 
                        onClick={() => handleCheckOut(booking.id)}
                        style={styles.actionButton}
                        className="action-button"
                      >
                        Check Out
                      </button>
                    )}
                    
                    {(booking.payment_status?.toLowerCase() === 'pending' || !booking.payment_status) && 
                     booking.status?.toLowerCase() !== 'cancelled' && (
                      <button 
                        onClick={() => handleProcessPayment(booking.id)}
                        style={{...styles.actionButton, ...styles.paymentButton}}
                        className="payment-button"
                      >
                        Pay Now
                      </button>
                    )}

                    {booking.cancellation_reason && (
                      <div style={styles.cancellationReason}>
                        <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                      </div>
                    )}
                  </div>

                  <div style={styles.bookingFooter}>
                    <span style={styles.createdDate}>
                      Booked on {formatDateTime(booking.created_at || booking.created_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
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
    zIndex: 1,
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(59, 130, 246, 0.3)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '1.1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  backButton: {
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  backIcon: {
    fontSize: '0.8rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    margin: 0,
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  titleIcon: {
    color: '#8b5cf6',
    fontSize: '2.2rem'
  },
  refreshButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  refreshIcon: {
    fontSize: '0.8rem'
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    marginBottom: '25px',
    backdropFilter: 'blur(10px)',
    position: 'relative'
  },
  successIcon: {
    color: '#10b981',
    fontSize: '1.2rem',
    marginRight: '12px'
  },
  successText: {
    color: '#10b981',
    fontSize: '0.95rem',
    fontWeight: '500',
    flex: 1
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    marginBottom: '25px',
    backdropFilter: 'blur(10px)',
    position: 'relative'
  },
  errorIcon: {
    color: '#fca5a5',
    fontSize: '1.2rem',
    marginRight: '12px'
  },
  errorText: {
    color: '#fca5a5',
    fontSize: '0.95rem',
    fontWeight: '500',
    flex: 1
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 0 0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '15px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
  },
  statIconWrapper: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#f8fafc',
    margin: '0 0 5px 0'
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '600',
    margin: 0
  },
  filtersSection: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '15px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
  },
  filtersTitle: {
    color: '#f8fafc',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '15px'
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterButton: {
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#cbd5e1',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  filterButtonActive: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  bookingsSection: {
    marginBottom: '40px'
  },
  emptyState: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '15px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
  },
  emptyIcon: {
    fontSize: '4rem',
    color: '#475569',
    marginBottom: '20px'
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '1rem',
    marginBottom: '25px',
    lineHeight: '1.5'
  },
  ctaButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    margin: '0 auto'
  },
  bookingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px'
  },
  bookingCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease'
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(100, 116, 139, 0.3)'
  },
  bookingInfo: {
    flex: 1
  },
  bookingReference: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: '0 0 8px 0'
  },
  statusSection: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  bookingAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  amountIcon: {
    color: '#f59e0b',
    fontSize: '1rem'
  },
  amountText: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f8fafc'
  },
  bookingDetails: {
    marginBottom: '15px'
  },
  detailRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '12px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#cbd5e1',
    fontSize: '0.9rem'
  },
  detailIcon: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    width: '12px'
  },
  requirements: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    marginTop: '10px',
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '8px',
    borderLeft: '2px solid rgba(100, 116, 139, 0.3)'
  },
  bookingActions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  actionButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  cancelButton: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)'
  },
  paymentButton: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)'
  },
  cancellationReason: {
    width: '100%',
    color: '#ef4444',
    fontSize: '0.8rem',
    padding: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  bookingFooter: {
    paddingTop: '15px',
    borderTop: '1px solid rgba(100, 116, 139, 0.3)'
  },
  createdDate: {
    color: '#64748b',
    fontSize: '0.8rem'
  },
  loginPrompt: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '15px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    margin: '50px auto'
  },
  loginIcon: {
    fontSize: '4rem',
    color: '#f59e0b',
    marginBottom: '20px'
  },
  loginTitle: {
    color: '#f8fafc',
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '15px'
  },
  loginText: {
    color: '#94a3b8',
    fontSize: '1.1rem',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  loginButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease'
  }
};

// Add CSS animations
const addAnimations = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(180deg); }
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      .booking-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        border-color: rgba(59, 130, 246, 0.5);
      }

      .action-button:hover,
      .cancel-button:hover,
      .payment-button:hover {
        transform: translateY(-2px);
      }

      .action-button:hover {
        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
      }

      .cancel-button:hover {
        box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
      }

      .payment-button:hover {
        box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
      }

      .filter-button:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
      }

      .back-button:hover,
      .refresh-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
      }

      .cta-button:hover,
      .login-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize animations
addAnimations();

export default BookingHistory;