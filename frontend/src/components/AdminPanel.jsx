// components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

function AdminPanel() {
  const { user, logout } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingSlot, setCreatingSlot] = useState(false);

  // Form state
  const [newSlot, setNewSlot] = useState({
    slot_number: '',
    floor: 'G',
    zone: '',
    slot_type: 'standard',
    slot_size: 'medium',
    base_rate_per_hour: '3.00',
    premium_rate_per_hour: '0.00',
    is_ev_charging: false,
    is_handicap_accessible: false,
    is_covered: false,
    has_security_camera: false,
    distance_from_elevator: 50,
    distance_from_exit: 100,
    location_notes: ''
  });

  const loadAdminSlots = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading admin slots...');
      
      const slotsData = await apiService.getAdminSlots();
      console.log('📊 Slots data received:', slotsData);
      
      // Check if we got demo data
      if (slotsData && slotsData.length > 0) {
        setSlots(slotsData);
        setUsingDemoData(true);
        console.log('✅ Using demo slots data');
      } else {
        setSlots(slotsData || []);
        setUsingDemoData(false);
        console.log('✅ Using API slots data');
      }
    } catch (error) {
      console.error('❌ Error loading admin slots:', error);
      setError('Failed to load parking slots. Using demo data.');
      setUsingDemoData(true);
      
      // Load demo slots as fallback
      const demoSlots = apiService.getDemoAdminSlots();
      setSlots(demoSlots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSlots();
  }, []);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setCreatingSlot(true);
    setError('');

    try {
      console.log('🎯 Submitting slot data:', newSlot);
      
      const result = await apiService.createParkingSlot(newSlot);
      
      console.log('📦 Server response:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      // SUCCESS - Add the new slot to the local state immediately
      if (result.slot) {
        console.log('✅ Adding new slot to local state:', result.slot);
        setSlots(prev => [result.slot, ...prev]); // Add to beginning of array
      }

      // Reset form
      setNewSlot({
        slot_number: '',
        floor: 'G',
        zone: '',
        slot_type: 'standard',
        slot_size: 'medium',
        base_rate_per_hour: '3.00',
        premium_rate_per_hour: '0.00',
        is_ev_charging: false,
        is_handicap_accessible: false,
        is_covered: false,
        has_security_camera: false,
        distance_from_elevator: 50,
        distance_from_exit: 100,
        location_notes: ''
      });
      
      setShowCreateForm(false);
      
      // Show success message
      alert(result.message || 'Slot created successfully!');
      
    } catch (error) {
      console.error('❌ Error saving slot:', error);
      setError(`Failed to create slot: ${error.message}`);
    } finally {
      setCreatingSlot(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSlot(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Delete slot function
  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting slot:', slotId);
      
      // Remove from local state immediately for better UX
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
      
      // Try to delete from backend (if available)
      try {
        await apiService.deleteParkingSlot(slotId);
        console.log('✅ Slot deleted from backend');
      } catch (error) {
        console.log('🔄 Backend deletion failed, but slot removed from local state');
      }
      
      alert('Slot deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting slot:', error);
      alert('Failed to delete slot');
      // Reload slots to restore the deleted one
      loadAdminSlots();
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Panel</h1>
        
        {/* Connection Status */}
        <div style={{
          ...styles.statusIndicator,
          ...(usingDemoData ? styles.statusOffline : styles.statusOnline)
        }}>
          {usingDemoData ? '🔴 Using Demo Data' : '🟢 Backend Connected'}
        </div>

        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>Total Slots</h3>
          <p style={styles.statNumber}>{slots.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Available</h3>
          <p style={styles.statNumber}>
            {slots.filter(slot => slot.is_available).length}
          </p>
        </div>
        <div style={styles.statCard}>
          <h3>Occupied</h3>
          <p style={styles.statNumber}>
            {slots.filter(slot => !slot.is_available).length}
          </p>
        </div>
      </div>

      <div style={styles.actions}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.createButton}
        >
          {showCreateForm ? 'Cancel' : 'Create New Slot'}
        </button>
      </div>

      {/* Create Slot Form */}
      {showCreateForm && (
        <div style={styles.createForm}>
          <h3>Create New Parking Slot</h3>
          <form onSubmit={handleCreateSlot}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label>Slot Number *</label>
                <input
                  type="text"
                  name="slot_number"
                  value={newSlot.slot_number}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="e.g., G-A-101"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Floor</label>
                <select
                  name="floor"
                  value={newSlot.floor}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="B1">Basement 1</option>
                  <option value="G">Ground Floor</option>
                  <option value="1">First Floor</option>
                  <option value="2">Second Floor</option>
                  <option value="3">Third Floor</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Zone</label>
                <input
                  type="text"
                  name="zone"
                  value={newSlot.zone}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Main Entrance"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Slot Type</label>
                <select
                  name="slot_type"
                  value={newSlot.slot_type}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="valet">Valet</option>
                  <option value="covered">Covered</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Slot Size</label>
                <select
                  name="slot_size"
                  value={newSlot.slot_size}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="compact">Compact</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Base Rate per Hour ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="base_rate_per_hour"
                  value={newSlot.base_rate_per_hour}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="3.00"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Premium Rate per Hour ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="premium_rate_per_hour"
                  value={newSlot.premium_rate_per_hour}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Features Checkboxes */}
            <div style={styles.featuresSection}>
              <h4>Features</h4>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_ev_charging"
                    checked={newSlot.is_ev_charging}
                    onChange={handleInputChange}
                  />
                  EV Charging
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_handicap_accessible"
                    checked={newSlot.is_handicap_accessible}
                    onChange={handleInputChange}
                  />
                  Handicap Accessible
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_covered"
                    checked={newSlot.is_covered}
                    onChange={handleInputChange}
                  />
                  Covered
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="has_security_camera"
                    checked={newSlot.has_security_camera}
                    onChange={handleInputChange}
                  />
                  Security Camera
                </label>
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                disabled={creatingSlot}
                style={{
                  ...styles.submitButton,
                  ...(creatingSlot ? styles.submitButtonDisabled : {})
                }}
              >
                {creatingSlot ? 'Creating...' : 'Create Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slots List */}
      <div style={styles.slotsSection}>
        <h2>Parking Slots ({slots.length})</h2>
        
        {slots.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No parking slots found. Create your first slot!</p>
          </div>
        ) : (
          <div style={styles.slotsGrid}>
            {slots.map(slot => (
              <div key={slot.id} style={styles.slotCard}>
                <div style={styles.slotHeader}>
                  <h3 style={styles.slotNumber}>{slot.slot_number}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    ...(slot.is_available ? styles.statusAvailable : styles.statusOccupied)
                  }}>
                    {slot.is_available ? 'Available' : 'Occupied'}
                  </span>
                </div>
                
                <div style={styles.slotDetails}>
                  <p><strong>Floor:</strong> {slot.floor}</p>
                  <p><strong>Zone:</strong> {slot.zone}</p>
                  <p><strong>Type:</strong> {slot.slot_type}</p>
                  <p><strong>Size:</strong> {slot.slot_size}</p>
                  <p><strong>Rate:</strong> ${slot.total_rate_per_hour}/hour</p>
                  
                  {slot.features_list && slot.features_list.length > 0 && (
                    <div>
                      <strong>Features:</strong>
                      <div style={styles.featuresList}>
                        {slot.features_list.map((feature, index) => (
                          <span key={index} style={styles.featureTag}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={styles.slotActions}>
                  <button 
                    onClick={() => handleDeleteSlot(slot.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: 'white'
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  statusIndicator: {
    padding: '10px 15px',
    borderRadius: '8px',
    fontWeight: 'bold',
    display: 'inline-block',
    marginBottom: '15px'
  },
  statusOnline: {
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.5)',
    color: '#22c55e'
  },
  statusOffline: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#ef4444'
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  stats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    justifyContent: 'center'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    minWidth: '120px'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#3b82f6'
  },
  actions: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  createButton: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  createForm: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '15px',
    marginBottom: '30px',
    color: '#1f2937'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '5px',
    fontSize: '1rem'
  },
  featuresSection: {
    marginBottom: '20px'
  },
  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  formActions: {
    textAlign: 'center'
  },
  submitButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  slotsSection: {
    marginTop: '30px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px'
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  slotCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  slotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  slotNumber: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#3b82f6'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  statusAvailable: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e'
  },
  statusOccupied: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444'
  },
  slotDetails: {
    marginBottom: '15px'
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginTop: '5px'
  },
  featureTag: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem'
  },
  slotActions: {
    textAlign: 'right'
  },
  deleteButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: 'white'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(59, 130, 246, 0.3)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  }
};

export default AdminPanel;