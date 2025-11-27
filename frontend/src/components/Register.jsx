// components/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaParking, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFocus = (fieldName) => {
    setFocusedInput(fieldName);
  };

  const handleBlur = () => {
    setFocusedInput(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 Starting registration process...');

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Sending registration data to backend...');

      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      console.log('📨 Registration response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Registration successful:', data);
        
        alert('🎉 Registration successful! Please login with your credentials.');
        navigate('/login');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Registration failed:', errorData);
        
        // Handle different error formats from your backend
        if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.username) {
          setError(`Username error: ${errorData.username[0]}`);
        } else if (errorData.email) {
          setError(`Email error: ${errorData.email[0]}`);
        } else if (errorData.password) {
          setError(`Password error: ${errorData.password[0]}`);
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('💥 Registration error:', err);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const baseStyle = { ...styles.input };
    if (focusedInput === fieldName) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        outline: 'none'
      };
    }
    return baseStyle;
  };

  const getInputIcon = (fieldName) => {
    switch (fieldName) {
      case 'username':
        return <FaUser />;
      case 'email':
        return <FaEnvelope />;
      case 'password':
      case 'confirmPassword':
        return <FaLock />;
      default:
        return null;
    }
  };

  return (
    <div style={styles.registerPage}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}>
        <div style={styles.floatingShape1}></div>
        <div style={styles.floatingShape2}></div>
        <div style={styles.floatingShape3}></div>
      </div>

      <div style={styles.registerContainer}>
        <div style={styles.registerCard}>
          <div style={styles.cardHeader}>
            <div style={styles.logo}>
              <FaParking style={styles.logoIcon} />
            </div>
            <h2 style={styles.registerTitle}>Join SmartPark</h2>
            <p style={styles.registerSubtitle}>Create your account in seconds</p>
          </div>

          <div style={styles.cardBody}>
            {error && (
              <div style={styles.alert} role="alert">
                <div style={styles.alertIcon}>⚠️</div>
                <div style={styles.alertText}>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="username" style={styles.formLabel}>
                  Username *
                </label>
                <div style={styles.inputGroup}>
                  <span style={styles.inputIcon}>
                    {getInputIcon('username')}
                  </span>
                  <input
                    type="text"
                    style={getInputStyle('username')}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => handleFocus('username')}
                    onBlur={handleBlur}
                    placeholder="Choose a username"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.formLabel}>
                  Email Address *
                </label>
                <div style={styles.inputGroup}>
                  <span style={styles.inputIcon}>
                    {getInputIcon('email')}
                  </span>
                  <input
                    type="email"
                    style={getInputStyle('email')}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="password" style={styles.formLabel}>
                  Password *
                </label>
                <div style={styles.inputGroup}>
                  <span style={styles.inputIcon}>
                    {getInputIcon('password')}
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    style={getInputStyle('password')}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => handleFocus('password')}
                    onBlur={handleBlur}
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={styles.passwordToggle}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <small style={styles.helpText}>Minimum 6 characters</small>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="confirmPassword" style={styles.formLabel}>
                  Confirm Password *
                </label>
                <div style={styles.inputGroup}>
                  <span style={styles.inputIcon}>
                    {getInputIcon('confirmPassword')}
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    style={getInputStyle('confirmPassword')}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={handleBlur}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    style={styles.passwordToggle}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={loading ? { ...styles.submitButton, ...styles.submitButtonDisabled } : styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div style={styles.spinner}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FaUserPlus style={{ marginRight: '0.5rem' }} />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div style={styles.loginRedirect}>
              <p style={styles.loginText}>
                Already have an account?{' '}
                <Link to="/login" style={styles.loginLink}>
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  registerPage: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  floatingShape1: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '100px',
    height: '100px',
    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    animation: 'float 6s ease-in-out infinite',
    opacity: 0.1,
  },
  floatingShape2: {
    position: 'absolute',
    top: '60%',
    right: '10%',
    width: '150px',
    height: '150px',
    background: 'linear-gradient(45deg, #10b981, #06b6d4)',
    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
    animation: 'float 8s ease-in-out infinite 2s',
    opacity: 0.1,
  },
  floatingShape3: {
    position: 'absolute',
    bottom: '20%',
    left: '60%',
    width: '80px',
    height: '80px',
    background: 'linear-gradient(45deg, #f59e0b, #ef4444)',
    borderRadius: '50% 50% 20% 80% / 25% 80% 20% 75%',
    animation: 'float 7s ease-in-out infinite 1s',
    opacity: 0.1,
  },
  registerContainer: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '440px',
  },
  registerCard: {
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '40px 30px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    borderRadius: '16px',
    marginBottom: '16px',
  },
  logoIcon: {
    fontSize: '28px',
    color: 'white',
  },
  registerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  registerSubtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0,
  },
  cardBody: {
    marginTop: '8px',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  alertIcon: {
    marginRight: '12px',
    fontSize: '16px',
  },
  alertText: {
    color: '#fca5a5',
    fontSize: '14px',
    fontWeight: '500',
  },
  form: {
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '8px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#64748b',
    fontSize: '16px',
    zIndex: 2,
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    transition: 'all 0.2s ease-in-out',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit'
  },
  helpText: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
  },
  submitButton: {
    width: '100%',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
    marginTop: '8px',
    fontFamily: 'inherit'
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  loginRedirect: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  loginText: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0,
  },
  loginLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Register;