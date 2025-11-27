import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaParking, FaSignInAlt, FaExclamationTriangle } from 'react-icons/fa';

function Login() {
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔄 Starting login process...');
    console.log('📤 Form data:', formData);

    try {
      // Try multiple possible login endpoints
      const endpoints = [
        '/api/auth/login/',
        '/api/token/',
        '/api/login/'
      ];

      let response = null;
      let loginData = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          response = await fetch(`http://localhost:8000${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });

          console.log(`📡 Response status for ${endpoint}:`, response.status);

          if (response.ok) {
            loginData = await response.json();
            console.log(`✅ Success with ${endpoint}:`, loginData);
            break;
          }
        } catch (err) {
          console.log(`❌ Failed with ${endpoint}:`, err.message);
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error('All login endpoints failed');
      }

      // Handle different response formats
      let userData, tokens;

      if (loginData.user && loginData.tokens) {
        // Format 1: { user: {}, tokens: {} }
        userData = loginData.user;
        tokens = loginData.tokens;
      } else if (loginData.access && loginData.refresh) {
        // Format 2: { access: '', refresh: '' } (DRF simplejwt)
        tokens = {
          access: loginData.access,
          refresh: loginData.refresh
        };
        // Create minimal user data
        userData = {
          username: formData.username,
          email: formData.username + '@example.com', // Fallback
          is_staff: false,
          is_superuser: false
        };
      } else if (loginData.token) {
        // Format 3: { token: '' } (DRF token auth)
        tokens = {
          access: loginData.token,
          refresh: loginData.token // Same as access for token auth
        };
        userData = {
          username: formData.username,
          email: formData.username + '@example.com',
          is_staff: false,
          is_superuser: false
        };
      } else {
        throw new Error('Unknown response format from server');
      }

      console.log('✅ Processed login data - User:', userData, 'Tokens:', tokens);

      // Store data in localStorage (matching Dashboard expectations)
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('💾 Data stored in localStorage');
      
      // Update auth context
      if (login) {
        await login(userData, tokens);
      }

      console.log('✅ AuthContext updated, redirecting to dashboard...');
      
      // Always redirect to dashboard for now
      navigate('/dashboard', { replace: true });

    } catch (error) {
      console.error('💥 Login exception:', error);
      
      // Provide specific error messages
      if (error.message.includes('All login endpoints failed')) {
        setError('Cannot connect to server. Please check if backend is running on localhost:8000');
      } else if (error.message.includes('Unknown response format')) {
        setError('Server returned unexpected response format');
      } else if (error.message.includes('Network')) {
        setError('Network error. Please check if server is running.');
      } else {
        setError(error.message || 'Login failed. Please check credentials.');
      }
      
      // Clear any partial data
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  // Demo login for testing
  const handleDemoLogin = () => {
    console.log('🚀 Starting demo login...');
    
    const demoUser = {
      username: 'demo_user',
      email: 'demo@example.com',
      is_staff: false,
      is_superuser: false
    };
    
    const demoTokens = {
      access: 'demo_access_token',
      refresh: 'demo_refresh_token'
    };
    
    // Store demo data
    localStorage.setItem('authTokens', JSON.stringify(demoTokens));
    localStorage.setItem('user', JSON.stringify(demoUser));
    
    console.log('💾 Demo data stored, redirecting...');
    
    // Update auth context if available
    if (login) {
      login(demoUser, demoTokens);
    }
    
    navigate('/dashboard', { replace: true });
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}>
        <div style={styles.floatingShape1}></div>
        <div style={styles.floatingShape2}></div>
        <div style={styles.floatingShape3}></div>
      </div>

      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <div style={styles.logo}>
            <FaParking style={styles.logoIcon} />
          </div>
          <h1 style={styles.loginTitle}>User Login</h1>
          <p style={styles.loginSubtitle}>Sign in to your SmartPark account</p>
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
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your username"
              disabled={loading}
              required
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
                placeholder="Enter your password"
                disabled={loading}
                required
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
            className="login-button"
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                Signing in...
              </div>
            ) : (
              <>
                <FaSignInAlt style={styles.loginButtonIcon} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Login Button for Testing */}

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Sign up here
            </Link>
          </p>
          <p style={styles.footerText}>
            Admin?{' '}
            <Link to="/admin-login" style={styles.link}>
              Admin Login
            </Link>
          </p>
          <button 
            onClick={() => navigate('/')}
            style={styles.backButton}
            className="back-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
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
  loginCard: {
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    width: '100%',
    maxWidth: '450px',
    position: 'relative',
    zIndex: 1
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
  loginTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#f8fafc',
    margin: '0 0 10px 0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  loginSubtitle: {
    color: '#94a3b8',
    fontSize: '1rem',
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
    gap: '10px',
    backdropFilter: 'blur(10px)'
  },
  errorIcon: {
    color: '#fca5a5',
    fontSize: '0.9rem'
  },
  errorText: {
    color: '#fca5a5',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  form: {
    marginBottom: '20px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '0.9rem'
  },
  inputIcon: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '10px',
    fontSize: '1rem',
    color: '#f8fafc',
    transition: 'all 0.3s ease',
    outline: 'none',
    backdropFilter: 'blur(10px)'
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
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '5px',
    transition: 'all 0.3s ease'
  },
  loginButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
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
    gap: '10px',
    position: 'relative',
    overflow: 'hidden'
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
  demoSection: {
    textAlign: 'center',
    marginBottom: '25px',
    padding: '15px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)'
  },
  demoButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '8px'
  },
  demoText: {
    color: '#6ee7b7',
    fontSize: '0.8rem',
    margin: 0,
    fontStyle: 'italic'
  },
  footer: {
    textAlign: 'center',
    borderTop: '1px solid rgba(100, 116, 139, 0.3)',
    paddingTop: '20px'
  },
  footerText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: '0 0 10px 0'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  backButton: {
    background: 'rgba(100, 116, 139, 0.1)',
    color: '#94a3b8',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    marginTop: '10px',
    backdropFilter: 'blur(10px)'
  }
};

// Add CSS animations
const addAnimations = () => {
  if (typeof document !== 'undefined') {
    const styleSheet = document.styleSheets[0];
    const animations = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(180deg); }
      }

      input:focus {
        outline: none;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }

      .login-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
      }

      .demo-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      }

      .login-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }

      .login-button:hover::before {
        left: 100%;
      }

      .back-button:hover:not(:disabled) {
        background: rgba(100, 116, 139, 0.2) !important;
        border-color: #3b82f6 !important;
        color: #3b82f6 !important;
        transform: translateY(-1px);
      }

      .eye-button:hover:not(:disabled) {
        color: #3b82f6 !important;
        transform: translateY(-50%) scale(1.1);
      }

      .link:hover {
        color: #60a5fa !important;
        text-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
      }
    `;

    try {
      styleSheet.insertRule(animations, styleSheet.cssRules.length);
    } catch (e) {
      const style = document.createElement('style');
      style.textContent = animations;
      document.head.appendChild(style);
    }
  }
};

addAnimations();

export default Login;