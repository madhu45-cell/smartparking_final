// components/SlotAvailability.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaParking, 
  FaCar, 
  FaWheelchair, 
  FaBolt, 
  FaStar, 
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaDollarSign,
  FaArrowRight,
  FaSync,
  FaEye,
  FaLayerGroup,
  FaExclamationTriangle,
  FaDatabase,
  FaTools
} from 'react-icons/fa';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

function SlotAvailability() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    floor: '',
    slot_type: '',
    slot_size: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [databaseIssue, setDatabaseIssue] = useState(false);

  useEffect(() => {
    console.log('🎯 SlotAvailability component mounted');
    loadParkingData();
  }, []);

  useEffect(() => {
    filterSlots();
  }, [filters, searchTerm, slots]);

  const loadParkingData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDatabaseIssue(false);
      console.log('🔄 Loading parking data from API...');
      
      try {
        // Fetch available slots from Django API
        const slotsResponse = await apiService.getAvailableSlots();
        console.log('📊 API response received:', slotsResponse);

        if (slotsResponse && Array.isArray(slotsResponse)) {
          // Check if this is real data or demo data from backend
          const hasRealData = slotsResponse.length > 0 && 
                            slotsResponse[0].id !== undefined && 
                            slotsResponse[0].slot_number !== undefined;
          
          if (hasRealData) {
            console.log('✅ Using REAL database data');
            setUsingDemoData(false);
            setDatabaseIssue(false);
          } else {
            console.log('🎯 Using DEMO data from backend');
            setUsingDemoData(true);
            setDatabaseIssue(true);
          }

          const processedSlots = processSlotData(slotsResponse);
          setSlots(processedSlots);
          
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        
        // Check if it's a database schema error
        if (apiError.message?.includes('slot_number') || 
            apiError.message?.includes('1054') ||
            apiError.message?.includes('Unknown column')) {
          console.log('🗄️ Database schema issue detected');
          setDatabaseIssue(true);
          setUsingDemoData(true);
          
          // Use comprehensive demo data
          const demoSlots = getComprehensiveDemoSlots();
          setSlots(demoSlots);
          setError('Database schema needs migration. Using demo data. Please run: python manage.py migrate');
          
        } else {
          // Other API error
          setUsingDemoData(true);
          const demoSlots = getComprehensiveDemoSlots();
          setSlots(demoSlots);
          setError('Cannot connect to server. Using demo data.');
        }
      }
      
    } catch (error) {
      console.error('💥 General error loading parking data:', error);
      
      // Final fallback - use demo data
      setUsingDemoData(true);
      setDatabaseIssue(true);
      const demoSlots = getComprehensiveDemoSlots();
      setSlots(demoSlots);
      setError('Failed to load parking data. Using demo data.');
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get comprehensive demo slots
  const getComprehensiveDemoSlots = () => {
    return [
      {
        id: 1,
        slot_number: 'G-A-101',
        floor: 'G',
        zone: 'Main Entrance',
        slot_type: 'standard',
        slot_size: 'medium',
        status: 'available',
        is_available: true,
        base_rate_per_hour: 30,
        premium_rate_per_hour: 0,
        total_rate_per_hour: 30,
        is_ev_charging: false,
        is_handicap_accessible: false,
        is_covered: false,
        has_security_camera: true,
        features_list: ['Security Camera'],
        location_notes: 'Near main entrance',
        is_active: true,
        description: 'Standard parking slot near main entrance',
        is_demo: true
      },
      {
        id: 2,
        slot_number: 'G-B-102',
        floor: 'G',
        zone: 'Premium Zone',
        slot_type: 'premium',
        slot_size: 'large',
        status: 'available',
        is_available: true,
        base_rate_per_hour: 50,
        premium_rate_per_hour: 20,
        total_rate_per_hour: 70,
        is_ev_charging: true,
        is_handicap_accessible: true,
        is_covered: true,
        has_security_camera: true,
        features_list: ['EV Charging', 'Handicap Accessible', 'Covered', 'Security Camera'],
        location_notes: 'Premium spot near elevator',
        is_active: true,
        description: 'Premium parking with all features',
        is_demo: true
      },
      {
        id: 3,
        slot_number: '1-C-201',
        floor: '1',
        zone: 'North Wing',
        slot_type: 'standard',
        slot_size: 'compact',
        status: 'available',
        is_available: true,
        base_rate_per_hour: 25,
        premium_rate_per_hour: 0,
        total_rate_per_hour: 25,
        is_ev_charging: false,
        is_handicap_accessible: false,
        is_covered: false,
        has_security_camera: false,
        features_list: [],
        location_notes: 'Compact car slot',
        is_active: true,
        description: 'Compact car parking slot',
        is_demo: true
      },
      {
        id: 4,
        slot_number: 'B1-D-001',
        floor: 'B1',
        zone: 'Basement',
        slot_type: 'covered',
        slot_size: 'xlarge',
        status: 'occupied',
        is_available: false,
        base_rate_per_hour: 40,
        premium_rate_per_hour: 10,
        total_rate_per_hour: 50,
        is_ev_charging: false,
        is_handicap_accessible: false,
        is_covered: true,
        has_security_camera: true,
        features_list: ['Covered', 'Security Camera'],
        location_notes: 'Basement covered parking',
        is_active: true,
        description: 'Large covered parking in basement',
        is_demo: true
      },
      {
        id: 5,
        slot_number: 'G-E-103',
        floor: 'G',
        zone: 'EV Zone',
        slot_type: 'standard',
        slot_size: 'medium',
        status: 'available',
        is_available: true,
        base_rate_per_hour: 35,
        premium_rate_per_hour: 15,
        total_rate_per_hour: 50,
        is_ev_charging: true,
        is_handicap_accessible: true,
        is_covered: false,
        has_security_camera: true,
        features_list: ['EV Charging', 'Handicap Accessible', 'Security Camera'],
        location_notes: 'EV charging station',
        is_active: true,
        description: 'Electric vehicle charging slot',
        is_demo: true
      }
    ];
  };

  // Process data from API
  const processSlotData = (slotsData) => {
    if (!slotsData || !Array.isArray(slotsData)) {
      console.error('Invalid slots data:', slotsData);
      return getComprehensiveDemoSlots();
    }

    return slotsData.map(slot => ({
      id: slot.id,
      slot_number: slot.slot_number || `SLOT-${slot.id}`,
      floor: slot.floor || 'G',
      zone: slot.zone || 'General',
      slot_type: slot.slot_type || 'standard',
      slot_size: slot.slot_size || 'medium',
      status: slot.status || 'available',
      available: (slot.status || 'available') === 'available',
      base_rate_per_hour: parseFloat(slot.base_rate_per_hour) || 30,
      premium_rate_per_hour: parseFloat(slot.premium_rate_per_hour) || 0,
      total_rate_per_hour: parseFloat(slot.total_rate_per_hour) || parseFloat(slot.base_rate_per_hour) || 30,
      is_ev_charging: slot.is_ev_charging || false,
      is_handicap_accessible: slot.is_handicap_accessible || false,
      is_covered: slot.is_covered || false,
      has_security_camera: slot.has_security_camera || false,
      features_list: slot.features_list || [],
      location_notes: slot.location_notes || '',
      is_active: slot.is_active !== false,
      description: slot.description || '',
      max_vehicle_size: slot.max_vehicle_size || 'medium',
      is_demo: slot.is_demo || false
    }));
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    loadParkingData();
  };

  const filterSlots = () => {
    let filtered = [...slots];

    // Apply filters
    if (filters.floor) {
      filtered = filtered.filter(slot => slot.floor === filters.floor);
    }
    if (filters.slot_type) {
      filtered = filtered.filter(slot => slot.slot_type === filters.slot_type);
    }
    if (filters.slot_size) {
      filtered = filtered.filter(slot => slot.slot_size === filters.slot_size);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(slot =>
        slot.slot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (slot.zone && slot.zone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (slot.location_notes && slot.location_notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (slot.description && slot.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    console.log(`🔍 Filtered ${filtered.length} slots from ${slots.length} total`);
    setFilteredSlots(filtered);
  };

  const handleBookNow = (slot) => {
    console.log('🎯 Book Now clicked for slot:', slot);
    
    if (!user) {
      alert('Please login to book a parking slot.');
      navigate('/login');
      return;
    }

    if (!slot || !slot.id) {
      console.error('❌ Invalid slot data:', slot);
      alert('Invalid slot data. Please try again.');
      return;
    }

    if (usingDemoData) {
      alert('⚠️ Demo Mode: This is demo data. Real booking requires database setup.');
      return;
    }

    try {
      console.log('🚀 Navigating to booking page...');
      navigate('/booking', { 
        state: { 
          slot: {
            id: slot.id,
            slot_number: slot.slot_number,
            floor: slot.floor,
            zone: slot.zone,
            slot_type: slot.slot_type,
            slot_size: slot.slot_size,
            total_rate_per_hour: slot.total_rate_per_hour,
            base_rate_per_hour: slot.base_rate_per_hour,
            is_ev_charging: slot.is_ev_charging,
            is_handicap_accessible: slot.is_handicap_accessible,
            is_covered: slot.is_covered,
            features_list: slot.features_list,
            description: slot.description
          }
        } 
      });
    } catch (navError) {
      console.error('❌ Navigation error:', navError);
      alert('Navigation failed. Please try again.');
    }
  };

  // Helper functions
  const getSlotIcon = (slot) => {
    if (slot.is_ev_charging) return <FaBolt style={{ color: '#10b981', marginRight: '8px' }} />;
    if (slot.is_handicap_accessible) return <FaWheelchair style={{ color: '#f59e0b', marginRight: '8px' }} />;
    if (slot.slot_type === 'premium') return <FaStar style={{ color: '#f59e0b', marginRight: '8px' }} />;
    return <FaParking style={{ color: '#94a3b8', marginRight: '8px' }} />;
  };

  const getTypeDisplayName = (type) => {
    const types = {
      'standard': 'Standard',
      'premium': 'Premium', 
      'covered': 'Covered',
      'valet': 'Valet'
    };
    return types[type] || 'Standard';
  };

  const getSizeDisplayName = (size) => {
    const sizes = {
      'compact': 'Compact',
      'medium': 'Medium',
      'large': 'Large',
      'xlarge': 'Extra Large'
    };
    return sizes[size] || 'Medium';
  };

  const getStatusBadge = (slot) => {
    const statusStyles = {
      'available': { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
      'occupied': { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
      'maintenance': { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }
    };
    
    const style = statusStyles[slot.status] || statusStyles.available;
    
    return (
      <div style={{
        background: style.background,
        color: style.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '600',
        border: `1px solid ${style.color}33`
      }}>
        {slot.status === 'available' ? 'Available' : 
         slot.status === 'occupied' ? 'Occupied' : 'Maintenance'}
      </div>
    );
  };

  const getFeaturesList = (slot) => {
    const features = [];
    if (slot.is_ev_charging) features.push('EV Charging');
    if (slot.is_handicap_accessible) features.push('Handicap Accessible');
    if (slot.is_covered) features.push('Covered');
    if (slot.has_security_camera) features.push('Security Camera');
    if (slot.features_list && Array.isArray(slot.features_list)) {
      features.push(...slot.features_list.filter(f => f && f.trim() !== ''));
    }
    return features.slice(0, 3);
  };

  if (loading && !refreshing) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.backgroundAnimation}>
          <div style={styles.floatingShape1}></div>
          <div style={styles.floatingShape2}></div>
          <div style={styles.floatingShape3}></div>
        </div>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading available slots...</p>
          <p style={styles.loadingSubtext}>
            {databaseIssue ? 'Database issue detected' : 'Connecting to database...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}>
        <div style={styles.floatingShape1}></div>
        <div style={styles.floatingShape2}></div>
        <div style={styles.floatingShape3}></div>
      </div>

      {/* Header with Database Status */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <FaParking style={styles.titleIcon} />
            Available Parking Slots
          </h1>
          <div style={styles.headerRight}>
            {databaseIssue && (
              <div style={styles.databaseWarning}>
                <FaTools style={styles.warningIcon} />
                Database Schema Issue
              </div>
            )}
            <button 
              onClick={handleRefresh} 
              style={refreshing ? styles.refreshButtonDisabled : styles.refreshButton}
              disabled={refreshing}
              className="refresh-button"
            >
              <FaSync style={refreshing ? styles.refreshingIcon : styles.refreshIcon} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <div style={styles.subtitleSection}>
          <p style={styles.subtitle}>
            {usingDemoData ? (
              <>
                <FaExclamationTriangle style={{ color: '#f59e0b', marginRight: '8px' }} />
                Using Demo Data • Database migrations required
              </>
            ) : (
              <>
                <FaDatabase style={{ color: '#10b981', marginRight: '8px' }} />
                Live Database Data • Real-time availability
              </>
            )}
          </p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <FaExclamationTriangle style={styles.errorIcon} />
            <div>
              <strong style={styles.errorTitle}>Data Loading Issue</strong>
              <p style={styles.errorMessage}>{error}</p>
              {databaseIssue && (
                <div style={styles.fixInstructions}>
                  <p><strong>To fix this:</strong></p>
                  <code style={styles.codeBlock}>
                    cd backend<br/>
                    python manage.py migrate
                  </code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Banner */}
      <div style={styles.statsBanner}>
        <div style={styles.statItem}>
          <div style={styles.statIconWrapper}>
            <FaCar style={{ color: '#10b981' }} />
          </div>
          <div>
            <span style={styles.statNumber}>
              {slots.filter(slot => slot.status === 'available').length}
            </span>
            <span style={styles.statLabel}>Available Now</span>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIconWrapper}>
            <FaLayerGroup style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <span style={styles.statNumber}>{slots.length}</span>
            <span style={styles.statLabel}>Total Slots</span>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIconWrapper}>
            <FaEye style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <span style={styles.statNumber}>
              {slots.length > 0 
                ? Math.round((slots.filter(slot => slot.status === 'available').length / slots.length) * 100)
                : 0
              }%
            </span>
            <span style={styles.statLabel}>Availability</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by slot number, zone, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            className="search-input"
          />
        </div>

        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <FaFilter style={styles.filterIcon} />
              Floor
            </label>
            <select
              value={filters.floor}
              onChange={(e) => setFilters({...filters, floor: e.target.value})}
              style={styles.filterSelect}
              className="filter-select"
            >
              <option value="">All Floors</option>
              <option value="G">Ground Floor</option>
              <option value="1">First Floor</option>
              <option value="2">Second Floor</option>
              <option value="B1">Basement 1</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Type</label>
            <select
              value={filters.slot_type}
              onChange={(e) => setFilters({...filters, slot_type: e.target.value})}
              style={styles.filterSelect}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="covered">Covered</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Size</label>
            <select
              value={filters.slot_size}
              onChange={(e) => setFilters({...filters, slot_size: e.target.value})}
              style={styles.filterSelect}
              className="filter-select"
            >
              <option value="">All Sizes</option>
              <option value="compact">Compact</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={styles.resultsInfo}>
        <span>
          Showing <strong>{filteredSlots.length}</strong> of <strong>{slots.length}</strong> slots
          {usingDemoData && (
            <span style={styles.demoNote}> • Demo Data</span>
          )}
        </span>
      </div>

      {/* Slots Grid */}
      <div style={styles.slotsGrid}>
        {filteredSlots.length > 0 ? (
          filteredSlots.map(slot => (
            <div key={slot.id} style={styles.slotCard} className="slot-card">
              <div style={styles.slotHeader}>
                <div style={styles.slotNumber}>
                  {getSlotIcon(slot)}
                  {slot.slot_number}
                </div>
                {getStatusBadge(slot)}
              </div>

              <div style={styles.slotDetails}>
                <div style={styles.slotInfo}>
                  <FaMapMarkerAlt style={styles.detailIcon} />
                  <span>Floor {slot.floor} • {slot.zone}</span>
                </div>
                <div style={styles.slotInfo}>
                  <FaCar style={styles.detailIcon} />
                  <span>{getTypeDisplayName(slot.slot_type)} • {getSizeDisplayName(slot.slot_size)}</span>
                </div>
                <div style={styles.slotInfo}>
                  <FaDollarSign style={styles.detailIcon} />
                  <span>₹{slot.total_rate_per_hour}/hour</span>
                </div>
                
                {getFeaturesList(slot).length > 0 && (
                  <div style={styles.features}>
                    <span style={styles.featuresLabel}>Features:</span>
                    <div style={styles.featuresList}>
                      {getFeaturesList(slot).map((feature, index) => (
                        <span key={index} style={styles.featureTag}>{feature}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.slotActions}>
                {slot.status === 'available' ? (
                  <button
                    onClick={() => handleBookNow(slot)}
                    style={styles.bookButton}
                    className="book-button"
                  >
                    Book Now
                    <FaArrowRight style={styles.arrowIcon} />
                  </button>
                ) : (
                  <button style={styles.disabledButton} disabled>
                    Not Available
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.noResults}>
            <FaParking style={styles.noResultsIcon} />
            <h3 style={styles.noResultsTitle}>No Matching Slots Found</h3>
            <p style={styles.noResultsText}>
              Try adjusting your filters or search terms to find available slots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
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
    pointerEvents: 'none',
    overflow: 'hidden'
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
  header: {
    marginBottom: '30px',
    position: 'relative',
    zIndex: 2
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  databaseWarning: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
    padding: '8px 15px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  warningIcon: {
    fontSize: '0.8rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  titleIcon: {
    color: '#3b82f6',
    fontSize: '2.2rem'
  },
  subtitleSection: {
    marginBottom: '15px'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: 0,
    display: 'flex',
    alignItems: 'center'
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    backdropFilter: 'blur(10px)'
  },
  errorIcon: {
    color: '#dc2626',
    fontSize: '1.2rem',
    marginTop: '2px'
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: '1rem',
    margin: '0 0 5px 0'
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: '0.9rem',
    margin: '0 0 10px 0'
  },
  fixInstructions: {
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '10px',
    borderRadius: '5px',
    marginTop: '10px'
  },
  codeBlock: {
    background: '#1e293b',
    padding: '8px',
    borderRadius: '5px',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    color: '#10b981',
    display: 'block',
    marginTop: '5px'
  },
  statsBanner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '40px',
    position: 'relative',
    zIndex: 2
  },
  statItem: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease'
  },
  statIconWrapper: {
    background: 'rgba(15, 23, 42, 0.6)',
    padding: '15px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statNumber: {
    display: 'block',
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '5px'
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '1rem',
    fontWeight: '600'
  },
  controls: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
    marginBottom: '25px',
    position: 'relative',
    zIndex: 2
  },
  searchBox: {
    position: 'relative',
    marginBottom: '25px'
  },
  searchIcon: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '1.1rem'
  },
  searchInput: {
    width: '100%',
    padding: '15px 20px 15px 55px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  filterLabel: {
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterIcon: {
    fontSize: '0.9rem',
    color: '#94a3b8'
  },
  filterSelect: {
    padding: '12px 15px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: '#f8fafc',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  resultsInfo: {
    marginBottom: '25px',
    color: '#94a3b8',
    fontSize: '1rem',
    position: 'relative',
    zIndex: 2
  },
  demoNote: {
    color: '#f59e0b',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
    position: 'relative',
    zIndex: 2
  },
  slotCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  slotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  slotNumber: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  slotDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  slotInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#cbd5e1',
    fontSize: '0.95rem'
  },
  detailIcon: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    width: '14px'
  },
  features: {
    marginTop: '8px'
  },
  featuresLabel: {
    color: '#e2e8f0',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '6px',
    display: 'block'
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  featureTag: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  slotActions: {
    marginTop: 'auto'
  },
  bookButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
  },
  arrowIcon: {
    fontSize: '0.9rem',
    transition: 'transform 0.3s ease'
  },
  disabledButton: {
    width: '100%',
    background: 'rgba(100, 116, 139, 0.3)',
    color: '#94a3b8',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'not-allowed'
  },
  noResults: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '2px dashed rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    marginTop: '20px'
  },
  noResultsIcon: {
    fontSize: '4rem',
    color: '#475569',
    marginBottom: '20px'
  },
  noResultsTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '15px'
  },
  noResultsText: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    maxWidth: '500px',
    margin: '0 auto',
    lineHeight: '1.6'
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  loadingContent: {
    textAlign: 'center',
    position: 'relative',
    zIndex: 2
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(59, 130, 246, 0.3)',
    borderLeft: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 30px'
  },
  loadingText: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '10px'
  },
  loadingSubtext: {
    fontSize: '1rem',
    color: '#94a3b8'
  },
  refreshButton: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  refreshButtonDisabled: {
    background: 'rgba(100, 116, 139, 0.2)',
    color: '#64748b',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backdropFilter: 'blur(10px)'
  },
  refreshIcon: {
    fontSize: '0.9rem',
    transition: 'transform 0.3s ease'
  },
  refreshingIcon: {
    fontSize: '0.9rem',
    animation: 'spin 1s linear infinite'
  }
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject the keyframes
const styleElement = document.createElement('style');
styleElement.innerHTML = keyframes;
document.head.appendChild(styleElement);

// Add hover effects via CSS classes
const hoverStyles = `
.search-input:focus {
  outline: none;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.slot-card:hover {
  transform: translateY(-5px) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
}

.book-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6) !important;
}

.book-button:hover .arrow-icon {
  transform: translateX(3px) !important;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.3) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  transform: translateY(-1px) !important;
}

.stat-item:hover {
  transform: translateY(-3px) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
}
`;

const hoverStyleElement = document.createElement('style');
hoverStyleElement.innerHTML = hoverStyles;
document.head.appendChild(hoverStyleElement);

export default SlotAvailability;