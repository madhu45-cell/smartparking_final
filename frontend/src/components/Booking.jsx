// components/Booking.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaParking, 
  FaCar, 
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaArrowLeft,
  FaCheckCircle,
  FaUser,
  FaCreditCard,
  FaMapMarkerAlt,
  FaBolt,
  FaWheelchair,
  FaShieldAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    start_time: '',
    expected_end_time: '',
    vehicle_number: '',
    vehicle_type: 'sedan',
    vehicle_model: '',
    vehicle_color: '',
    special_requirements: ''
  });
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [duration, setDuration] = useState(1);
  const [error, setError] = useState('');

  // API Base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    checkAuthentication();
    if (location.state?.slot) {
      setSlot(location.state.slot);
      console.log('🎯 Slot data received:', location.state.slot);
    } else {
      console.log('❌ No slot data found, redirecting...');
      navigate('/slot-availability');
    }
  }, [location, navigate]);

  useEffect(() => {
    calculateCost();
  }, [duration, slot]);

  // Debug current booking data
  useEffect(() => {
    console.log('📊 Current booking data:', {
      start_time: bookingData.start_time,
      expected_end_time: bookingData.expected_end_time,
      duration: duration,
      calculatedCost: calculatedCost
    });
    
    if (bookingData.start_time && bookingData.expected_end_time) {
      const start = new Date(bookingData.start_time);
      const end = new Date(bookingData.expected_end_time);
      const diff = end.getTime() - start.getTime();
      const diffHours = diff / (1000 * 60 * 60);
      
      console.log('⏰ Time difference:', {
        start: start.toString(),
        end: end.toString(),
        differenceMs: diff,
        differenceHours: diffHours
      });
    }
  }, [bookingData, duration, calculatedCost]);

  const checkAuthentication = () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (!userData || !token) {
      console.log('🔐 No authentication found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      console.log('✅ User authenticated:', parsedUser);
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      navigate('/login');
    }
  };

  const calculateCost = () => {
    if (slot) {
      // Use the correct field names from your ParkingSlot model
      const baseRate = slot.base_rate_per_hour || 0;
      const premiumRate = slot.premium_rate_per_hour || 0;
      const totalRate = baseRate + premiumRate;
      
      const cost = totalRate * duration;
      setCalculatedCost(cost);
      console.log('💰 Cost calculated:', {
        baseRate,
        premiumRate,
        totalRate,
        duration,
        cost
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    setDuration(newDuration);
    
    // Update end time if start time is set
    if (bookingData.start_time) {
      const startTime = new Date(bookingData.start_time);
      const endTime = new Date(startTime.getTime() + newDuration * 60 * 60 * 1000);
      
      console.log('⏱️ Duration changed:', {
        newDuration,
        start: startTime.toString(),
        calculatedEnd: endTime.toString()
      });
      
      setBookingData(prev => ({
        ...prev,
        expected_end_time: endTime.toISOString().slice(0, 16)
      }));
    }
  };

  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    setBookingData(prev => ({
      ...prev,
      start_time: startTime
    }));

    // Calculate end time
    if (startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
      
      console.log('📅 Calculating end time:', {
        start: start.toString(),
        duration: duration,
        calculatedEnd: end.toString()
      });
      
      setBookingData(prev => ({
        ...prev,
        expected_end_time: end.toISOString().slice(0, 16)
      }));
    }
  };

  // Simple datetime formatting
  const formatDateTimeForBackend = (datetimeLocal) => {
    if (!datetimeLocal) return '';
    
    // Convert from datetime-local format to ISO string
    const date = new Date(datetimeLocal);
    const isoString = date.toISOString();
    
    console.log('🕒 Formatting datetime:', { 
      input: datetimeLocal, 
      output: isoString 
    });
    
    return isoString;
  };

  // Simplified validation
  const validateBookingData = () => {
    console.log('🔍 Validating booking data:', bookingData);

    if (!bookingData.start_time || !bookingData.expected_end_time) {
      throw new Error('Start time and end time are required');
    }

    const startTime = new Date(bookingData.start_time);
    const endTime = new Date(bookingData.expected_end_time);
    const now = new Date();

    console.log('⏰ Time validation:', {
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      now: now.toString(),
      startTimeValue: startTime.getTime(),
      endTimeValue: endTime.getTime()
    });

    // Basic future check
    if (startTime < now) {
      throw new Error('Start time cannot be in the past. Please select a future time.');
    }

    // Simple end time check
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }

    // Check minimum duration (at least 1 hour)
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    console.log('📅 Duration calculation:', { durationMs, durationHours });
    
    if (durationHours < 1) {
      throw new Error('Minimum booking duration is 1 hour');
    }

    if (!bookingData.vehicle_number?.trim()) {
      throw new Error('Vehicle number is required');
    }

    if (!slot?.id) {
      throw new Error('Invalid slot selection');
    }

    console.log('✅ All validation passed');
    return true;
  };

  const createBooking = async (bookingPayload) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('📤 Creating booking with payload:', bookingPayload);
      
      const response = await fetch(`${API_BASE_URL}/bookings/create/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bookingPayload)
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ Backend error response:', errorData);
        } catch (parseError) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle specific error cases
        if (errorData.error) {
          // Fix: Handle the specific backend error about rate_per_hour
          if (errorData.error.includes('rate_per_hour')) {
            throw new Error('Backend configuration error. Please contact administrator.');
          }
          throw new Error(errorData.error);
        } else if (errorData.non_field_errors) {
          throw new Error(errorData.non_field_errors[0]);
        } else if (errorData.start_time) {
          throw new Error(`Start time: ${errorData.start_time[0]}`);
        } else if (errorData.expected_end_time) {
          throw new Error(`End time: ${errorData.expected_end_time[0]}`);
        } else if (errorData.vehicle_number) {
          throw new Error(`Vehicle number: ${errorData.vehicle_number[0]}`);
        } else {
          throw new Error('Booking creation failed. Please check your input and try again.');
        }
      }
      
      const data = await response.json();
      console.log('✅ Booking created successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Starting booking validation...');
      
      // Validate data first
      validateBookingData();
      
      // Prepare booking payload with properly formatted dates
      const bookingPayload = {
        parking_slot_id: slot.id,
        start_time: formatDateTimeForBackend(bookingData.start_time),
        expected_end_time: formatDateTimeForBackend(bookingData.expected_end_time),
        vehicle_number: bookingData.vehicle_number.trim().toUpperCase(),
        vehicle_type: bookingData.vehicle_type,
        vehicle_model: bookingData.vehicle_model.trim(),
        vehicle_color: bookingData.vehicle_color.trim(),
        special_requirements: bookingData.special_requirements.trim()
      };

      console.log('🚀 Submitting booking request:', bookingPayload);
      
      const result = await createBooking(bookingPayload);
      
      console.log('🎉 Booking successful, redirecting...');
      
      // Navigate to booking confirmation
      navigate('/booking-history', { 
        state: { 
          bookingSuccess: true,
          bookingId: result.booking?.id || result.id,
          slot: slot
        } 
      });
      
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      // Fix: Provide more user-friendly error message for the backend issue
      if (error.message.includes('rate_per_hour')) {
        setError('System configuration error. Please try again later or contact support.');
      } else {
        setError(error.message || 'Failed to create booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get current datetime with proper formatting
  const getCurrentDateTime = () => {
    const now = new Date();
    // Add 1 hour to ensure minimum 1 hour in future
    now.setHours(now.getHours() + 1);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Auto-set initial times when component loads
  useEffect(() => {
    if (slot && !bookingData.start_time) {
      const defaultStartTime = getCurrentDateTime();
      const start = new Date(defaultStartTime);
      const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
      
      console.log('🎯 Setting default times:', {
        defaultStartTime,
        calculatedEnd: end.toISOString().slice(0, 16)
      });
      
      setBookingData(prev => ({
        ...prev,
        start_time: defaultStartTime,
        expected_end_time: end.toISOString().slice(0, 16)
      }));
    }
  }, [slot]);

  const getSlotIcon = (slot) => {
    if (slot.is_ev_charging) {
      return <FaBolt style={{ color: '#10b981' }} />;
    }
    if (slot.is_handicap_accessible) {
      return <FaWheelchair style={{ color: '#f59e0b' }} />;
    }
    if (slot.is_covered) {
      return <FaShieldAlt style={{ color: '#3b82f6' }} />;
    }
    return <FaParking style={{ color: '#8b5cf6' }} />;
  };

  const getTypeDisplayName = (type) => {
    switch (type) {
      case 'premium':
        return 'Premium';
      case 'valet':
        return 'Valet';
      case 'covered':
        return 'Covered';
      case 'ev':
        return 'EV Charging';
      case 'handicap':
        return 'Handicap';
      default:
        return 'Standard';
    }
  };

  const getSizeDisplayName = (size) => {
    switch (size) {
      case 'compact':
        return 'Compact Car';
      case 'medium':
        return 'Sedan';
      case 'large':
        return 'SUV';
      case 'xlarge':
        return 'Truck/Bus';
      default:
        return 'Any Vehicle';
    }
  };

  const getFeaturesList = (slot) => {
    const features = [];
    if (slot.is_ev_charging) features.push('EV Charging');
    if (slot.is_handicap_accessible) features.push('Handicap Accessible');
    if (slot.is_covered) features.push('Covered');
    if (slot.has_security_camera) features.push('Security Camera');
    
    // Add features from features_list array if available
    if (slot.features_list && Array.isArray(slot.features_list)) {
      features.push(...slot.features_list.filter(f => f && f.trim() !== ''));
    }
    
    return features.slice(0, 4);
  };

  // Calculate the total hourly rate properly
  const getTotalHourlyRate = (slot) => {
    if (!slot) return 0;
    const baseRate = parseFloat(slot.base_rate_per_hour) || 0;
    const premiumRate = parseFloat(slot.premium_rate_per_hour) || 0;
    return baseRate + premiumRate;
  };

  if (!slot || !user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.backgroundAnimation}>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
        </div>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading booking page...</p>
        </div>
      </div>
    );
  }

  const totalHourlyRate = getTotalHourlyRate(slot);

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
            onClick={() => navigate('/slot-availability')}
            style={styles.backButton}
            className="back-button"
          >
            <FaArrowLeft style={styles.backIcon} />
            Back to Available Slots
          </button>
          <h1 style={styles.title}>
            <FaParking style={styles.titleIcon} />
            Book Parking Slot
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.alert}>
            <FaExclamationTriangle style={styles.alertIcon} />
            <div style={styles.alertText}>{error}</div>
          </div>
        )}

        <div style={styles.bookingLayout}>
          {/* Booking Form */}
          <div style={styles.formSection}>
            <div style={styles.formCard}>
              <div style={styles.formSectionHeader}>
                <FaUser style={styles.sectionIcon} />
                <h2 style={styles.sectionTitle}>Booking Information</h2>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Start Time *</label>
                    <input
                      type="datetime-local"
                      name="start_time"
                      value={bookingData.start_time}
                      onChange={handleStartTimeChange}
                      min={getCurrentDateTime()}
                      style={styles.formInput}
                      required
                    />
                    <small style={styles.helpText}>
                      Bookings must start at least 1 hour from now
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Duration (hours) *</label>
                    <select
                      value={duration}
                      onChange={handleDurationChange}
                      style={styles.formSelect}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hours => (
                        <option key={hours} value={hours}>
                          {hours} hour{hours > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    <small style={styles.helpText}>
                      Select how long you need the parking spot
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Expected End Time *</label>
                    <input
                      type="datetime-local"
                      name="expected_end_time"
                      value={bookingData.expected_end_time}
                      onChange={handleInputChange}
                      style={styles.formInput}
                      required
                      readOnly
                    />
                    <small style={styles.helpText}>
                      Automatically calculated based on start time and duration
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Vehicle Number *</label>
                    <input
                      type="text"
                      name="vehicle_number"
                      value={bookingData.vehicle_number}
                      onChange={handleInputChange}
                      style={styles.formInput}
                      placeholder="e.g., ABC123"
                      required
                      maxLength="20"
                    />
                    <small style={styles.helpText}>
                      Enter your vehicle license plate number
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Vehicle Type *</label>
                    <select
                      name="vehicle_type"
                      value={bookingData.vehicle_type}
                      onChange={handleInputChange}
                      style={styles.formSelect}
                    >
                      <option value="compact">Compact Car</option>
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="ev">Electric Vehicle</option>
                    </select>
                    <small style={styles.helpText}>
                      Select your vehicle type
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Vehicle Model</label>
                    <input
                      type="text"
                      name="vehicle_model"
                      value={bookingData.vehicle_model}
                      onChange={handleInputChange}
                      style={styles.formInput}
                      placeholder="e.g., Toyota Camry"
                      maxLength="50"
                    />
                    <small style={styles.helpText}>
                      Optional: Your vehicle model
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Vehicle Color</label>
                    <input
                      type="text"
                      name="vehicle_color"
                      value={bookingData.vehicle_color}
                      onChange={handleInputChange}
                      style={styles.formInput}
                      placeholder="e.g., Blue"
                      maxLength="20"
                    />
                    <small style={styles.helpText}>
                      Optional: Your vehicle color
                    </small>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Special Requirements</label>
                  <textarea
                    name="special_requirements"
                    value={bookingData.special_requirements}
                    onChange={handleInputChange}
                    style={styles.formTextarea}
                    placeholder="Any special requirements or notes..."
                    rows="3"
                    maxLength="500"
                  />
                  <small style={styles.helpText}>
                    Optional: Any special requirements for your booking
                  </small>
                </div>

                <button 
                  type="submit" 
                  style={loading ? styles.submitButtonDisabled : styles.submitButton}
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? (
                    <>
                      <div style={styles.buttonSpinner}></div>
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle style={styles.buttonIcon} />
                      Confirm Booking - ₹{calculatedCost.toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div style={styles.summarySection}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Booking Summary</h2>
              
              <div style={styles.slotInfo}>
                <div style={styles.slotHeader}>
                  <div style={styles.slotIconWrapper}>
                    {getSlotIcon(slot)}
                  </div>
                  <div>
                    <h3 style={styles.slotNumber}>{slot.slot_number}</h3>
                    <p style={styles.slotDetails}>
                      {getTypeDisplayName(slot.slot_type)} • Floor {slot.floor} • {getSizeDisplayName(slot.slot_size)}
                    </p>
                  </div>
                </div>
                
                {getFeaturesList(slot).length > 0 && (
                  <div style={styles.features}>
                    <strong style={styles.featuresLabel}>Features:</strong>
                    <div style={styles.featuresList}>
                      {getFeaturesList(slot).map((feature, index) => (
                        <span key={index} style={styles.featureTag}>{feature}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.costBreakdown}>
                <h3 style={styles.costTitle}>Cost Breakdown</h3>
                
                <div style={styles.costItem}>
                  <span>Base Rate ({duration} hours)</span>
                  <span>₹{((slot.base_rate_per_hour || 0) * duration).toFixed(2)}</span>
                </div>
                
                {(slot.premium_rate_per_hour > 0) && (
                  <div style={styles.costItem}>
                    <span>Premium Charges ({duration} hours)</span>
                    <span>₹{((slot.premium_rate_per_hour || 0) * duration).toFixed(2)}</span>
                  </div>
                )}
                
                <div style={styles.totalCost}>
                  <strong>Total Cost</strong>
                  <strong>₹{calculatedCost.toFixed(2)}</strong>
                </div>
              </div>

              <div style={styles.userInfo}>
                <h3 style={styles.userTitle}>User Information</h3>
                <div style={styles.userDetails}>
                  <p><strong>Name:</strong> {user.username}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              </div>

              <div style={styles.bookingNotes}>
                <FaCheckCircle style={styles.noteIcon} />
                <p style={styles.noteText}>Your booking will be confirmed immediately upon submission</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... (keep all the same styles from previous version)


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
    maxWidth: '1400px',
    margin: '0 auto'
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
    marginBottom: '30px',
    position: 'relative'
  },
  backButton: {
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    marginBottom: '25px',
    backdropFilter: 'blur(10px)'
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
    textAlign: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  titleIcon: {
    color: '#3b82f6',
    fontSize: '2.2rem'
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    marginBottom: '25px',
    backdropFilter: 'blur(10px)'
  },
  alertIcon: {
    color: '#fca5a5',
    fontSize: '1.2rem',
    marginRight: '12px'
  },
  alertText: {
    color: '#fca5a5',
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  bookingLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
    alignItems: 'start'
  },
  formSection: {
    position: 'relative'
  },
  formCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '35px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
  },
  formSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid rgba(100, 116, 139, 0.3)'
  },
  sectionIcon: {
    color: '#3b82f6',
    fontSize: '1.8rem'
  },
  sectionTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '25px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formLabel: {
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '0.95rem'
  },
  formInput: {
    padding: '15px 18px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  formSelect: {
    padding: '15px 18px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer'
  },
  formTextarea: {
    padding: '15px 18px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '100px'
  },
  helpText: {
    color: '#64748b',
    fontSize: '0.85rem',
    marginTop: '5px',
    display: 'block'
  },
  submitButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    padding: '18px 30px',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    position: 'relative',
    overflow: 'hidden'
  },
  submitButtonDisabled: {
    background: 'rgba(100, 116, 139, 0.5)',
    color: '#cbd5e1',
    border: 'none',
    padding: '18px 30px',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  },
  buttonSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  buttonIcon: {
    fontSize: '1.2rem'
  },
  summarySection: {
    position: 'sticky',
    top: '20px'
  },
  summaryCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
  },
  summaryTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '2px solid rgba(100, 116, 139, 0.3)'
  },
  slotInfo: {
    marginBottom: '30px'
  },
  slotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px'
  },
  slotIconWrapper: {
    background: 'rgba(59, 130, 246, 0.2)',
    padding: '15px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slotNumber: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0
  },
  slotDetails: {
    color: '#94a3b8',
    margin: '8px 0 0 0',
    fontSize: '0.95rem'
  },
  features: {
    marginTop: '20px'
  },
  featuresLabel: {
    color: '#e2e8f0',
    fontSize: '0.9rem',
    marginBottom: '10px',
    display: 'block'
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  featureTag: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '500',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  costBreakdown: {
    marginBottom: '30px',
    paddingBottom: '25px',
    borderBottom: '1px solid rgba(100, 116, 139, 0.3)'
  },
  costTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '20px'
  },
  costItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    fontSize: '0.95rem',
    color: '#cbd5e1'
  },
  totalCost: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    marginTop: '15px',
    borderTop: '1px solid rgba(100, 116, 139, 0.3)',
    fontSize: '1.1rem',
    color: '#f8fafc',
    fontWeight: '600'
  },
  userInfo: {
    marginBottom: '25px'
  },
  userTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '15px'
  },
  userDetails: {
    color: '#cbd5e1',
    fontSize: '0.95rem'
  },
  bookingNotes: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.2)'
  },
  noteIcon: {
    color: '#22c55e',
    fontSize: '1.3rem',
    flexShrink: 0
  },
  noteText: {
    color: '#86efac',
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '500'
  }
};

// Add CSS animations
const addAnimations = () => {
  if (typeof document !== 'undefined') {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(180deg); }
      }

      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }

      .back-button:hover {
        border-color: #3b82f6 !important;
        background: rgba(59, 130, 246, 0.1) !important;
        transform: translateY(-2px);
      }

      .submit-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
      }

      .submit-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }

      .submit-button:hover::before {
        left: 100%;
      }
    `;

    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
      // Fallback: create a style element
      const style = document.createElement('style');
      style.textContent = keyframes;
      document.head.appendChild(style);
    }
  }
};

// Initialize animations
addAnimations();

export default Booking;