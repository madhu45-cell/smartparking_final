import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaUser, FaEye, FaEyeSlash, FaParking, FaArrowRight, FaExclamationTriangle, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Admin login attempt with:', formData.username);

    try {
      // Use the actual API login
      const response = await apiService.login(formData);
      
      console.log('✅ Login response:', response);
      
      if (response.user && (response.user.is_staff || response.user.is_superuser)) {
        // Success - admin user
        console.log('🎯 Admin user authenticated, storing data and redirecting...');
        
        // Use AuthContext login to properly set authentication state
        login(response.user, response.tokens || { access: 'admin-token', refresh: 'admin-refresh-token' });
        
        console.log('✅ AuthContext updated, redirecting to /admin');
        
        // Navigate to admin panel
        navigate('/admin', { replace: true });
        
      } else {
        setError('Access denied. Administrator privileges required.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Fallback to demo admin login if API fails
      console.log('🔄 Trying demo admin login...');
      handleDemoAdminLogin();
    } finally {
      setLoading(false);
    }
  };

  // Demo admin login fallback
  const handleDemoAdminLogin = async () => {
    // Check if it's admin credentials
    if (formData.username.toLowerCase().includes('admin') || formData.username === '') {
      // Create admin user object
      const adminUser = {
        id: 1,
        username: formData.username || 'administrator',
        email: 'admin@smartpark.com',
        is_staff: true,
        is_superuser: true,
        role: 'admin'
      };

      // Create demo tokens
      const demoTokens = {
        access: 'demo-admin-token-' + Date.now(),
        refresh: 'demo-refresh-token-' + Date.now()
      };

      // Use AuthContext login to properly set authentication state
      login(adminUser, demoTokens);
      
      console.log('✅ Demo admin login successful! User data:', adminUser);
      console.log('🔄 Redirecting to /admin...');
      
      // Navigate to admin panel
      navigate('/admin', { replace: true });
      
    } else {
      setError('Invalid admin credentials. Username must contain "admin" or leave empty for demo.');
      setLoading(false);
    }
  };

  // Quick admin login for demo
  const handleQuickAdminLogin = async () => {
    setLoading(true);
    console.log('🚀 Quick admin login initiated...');
    
    try {
      const adminUser = {
        id: 1,
        username: 'administrator',
        email: 'admin@smartpark.com',
        is_staff: true,
        is_superuser: true,
        role: 'admin'
      };

      const demoTokens = {
        access: 'quick-admin-token-' + Date.now(),
        refresh: 'quick-refresh-token-' + Date.now()
      };

      // Use AuthContext login to properly set authentication state
      login(adminUser, demoTokens);
      
      console.log('✅ Quick admin login successful!', adminUser);
      console.log('🔄 Redirecting to /admin...');
      
      // Navigate to admin panel
      navigate('/admin', { replace: true });
      
    } catch (error) {
      console.error('❌ Quick login error:', error);
      setError('Quick login failed');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <div style={styles.logo}>
            <FaParking style={styles.logoIcon} />
          </div>
          <FaLock style={styles.loginIcon} />
          <h1 style={styles.loginTitle}>Admin Login</h1>
          <p style={styles.loginSubtitle}>Access SmartPark Administration Panel</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <FaExclamationTriangle style={styles.errorIcon} />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaUser style={styles.inputIcon} />
              Admin Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter admin username (or leave empty for demo)"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaLock style={styles.inputIcon} />
              Password
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter any password for demo"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.loginButton,
              ...(loading ? styles.loginButtonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                Authenticating...
              </div>
            ) : (
              <>
                <FaSignInAlt style={styles.loginButtonIcon} />
                Access Admin Panel
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>Not an administrator?</p>
          <div style={styles.footerButtons}>
            <button 
              onClick={() => navigate('/login')}
              style={styles.userLoginButton}
              disabled={loading}
            >
              User Login
            </button>
            <button 
              onClick={() => navigate('/')}
              style={styles.backButton}
              disabled={loading}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  loginCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '500px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logo: {
    marginBottom: '15px'
  },
  logoIcon: {
    fontSize: '2.5rem',
    color: '#3b82f6'
  },
  loginIcon: {
    fontSize: '2.5rem',
    color: '#f59e0b',
    marginBottom: '15px'
  },
  loginTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 10px 0'
  },
  loginSubtitle: {
    color: '#64748b',
    fontSize: '1rem',
    margin: 0
  },
  quickLoginSection: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  quickLoginButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    padding: '15px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    marginBottom: '8px'
  },
  quickLoginIcon: {
    fontSize: '1rem'
  },
  arrowIcon: {
    fontSize: '0.9rem'
  },
  quickLoginText: {
    color: '#64748b',
    fontSize: '0.8rem',
    margin: 0
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '25px 0'
  },
  dividerText: {
    background: 'white',
    padding: '0 15px',
    color: '#64748b',
    fontSize: '0.9rem'
  },
  demoInfo: {
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px'
  },
  demoTitle: {
    color: '#92400e',
    fontSize: '1rem',
    margin: '0 0 10px 0',
    textAlign: 'center'
  },
  credentials: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  credentialItem: {
    color: '#92400e',
    fontSize: '0.9rem',
    textAlign: 'center',
    margin: 0
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '12px 15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  errorIcon: {
    color: '#dc2626',
    fontSize: '0.9rem'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  form: {
    marginBottom: '25px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '0.9rem'
  },
  inputIcon: {
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: 'white'
  },
  passwordContainer: {
    position: 'relative'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '5px'
  },
  loginButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  loginButtonIcon: {
    fontSize: '1rem'
  },
  loginButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  footer: {
    textAlign: 'center'
  },
  footerText: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: '0 0 15px 0'
  },
  footerButtons: {
    display: 'flex',
    gap: '10px'
  },
  userLoginButton: {
    flex: 1,
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    border: '2px solid #3b82f6',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem'
  },
  backButton: {
    flex: 1,
    background: 'rgba(107, 114, 128, 0.1)',
    color: '#6b7280',
    border: '2px solid #6b7280',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem'
  }
};

export default AdminLogin;