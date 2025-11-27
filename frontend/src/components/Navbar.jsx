// components/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaParking, FaUser, FaSignOutAlt, FaCog, FaLock, FaHome, FaCar, FaHistory, FaCalendarCheck } from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if user is admin/staff
  const isAdmin = user && (user.is_staff || user.is_superuser);

  console.log('Navbar - User:', user);
  console.log('Navbar - Is Admin:', isAdmin);
  console.log('Navbar - Is Authenticated:', isAuthenticated);

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        {/* Logo Section */}
        <Link to="/" style={styles.logo}>
          <FaParking style={styles.logoIcon} />
          <span style={styles.logoText}>SmartPark</span>
        </Link>
        
        {/* Navigation Links */}
        <div style={styles.navLinks}>
          {isAuthenticated && user ? (
            // USER IS LOGGED IN - Show user navigation
            <>
              {/* Show Admin Panel link ONLY for admin users */}
              {isAdmin ? (
                <Link to="/admin" style={styles.adminNavLink}>
                  <FaCog style={styles.adminIcon} />
                  <span style={styles.adminText}>Admin Panel</span>
                </Link>
              ) : (
                // Regular user navigation
                <>
                  <Link to="/dashboard" style={styles.navLink}>
                    <FaHome style={styles.navIcon} />
                    <span style={styles.navText}>Dashboard</span>
                  </Link>
                  <Link to="/slot-availability" style={styles.navLink}>
                    <FaCar style={styles.navIcon} />
                    <span style={styles.navText}>Available Slots</span>
                  </Link>
                  <Link to="/booking" style={styles.navLink}>
                    <FaCalendarCheck style={styles.navIcon} />
                    <span style={styles.navText}>Book Slot</span>
                  </Link>
                  <Link to="/booking-history" style={styles.navLink}>
                    <FaHistory style={styles.navIcon} />
                    <span style={styles.navText}>History</span>
                  </Link>
                </>
              )}
              
              {/* User Section - Shows for both admin and regular users */}
              <div style={styles.userSection}>
                <div style={styles.userInfo}>
                  <FaUser style={styles.userIcon} />
                  <span style={styles.userName}>
                    {user.username}
                    {isAdmin && (
                      <span style={styles.adminBadge}>Admin</span>
                    )}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  style={styles.logoutBtn}
                >
                  <FaSignOutAlt style={styles.logoutIcon} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            // USER IS LOGGED OUT - Show public navigation
            <>
              <Link to="/admin-login" style={styles.adminLoginLink}>
                <FaLock style={styles.adminLoginIcon} />
                <span style={styles.adminLoginText}>Admin Login</span>
              </Link>
              
              <Link to="/login" style={styles.navLink}>
                <span style={styles.navText}>Login</span>
              </Link>
              
              <Link to="/register" style={styles.registerLink}>
                <span style={styles.registerText}>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
    padding: '0.75rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    transition: 'all 0.3s ease'
  },
  logoIcon: {
    color: '#3b82f6',
    fontSize: '1.8rem'
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  navLink: {
    color: '#e2e8f0',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    ':hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6'
    }
  },
  navIcon: {
    fontSize: '0.9rem'
  },
  navText: {
    fontSize: '0.95rem'
  },
  // Admin Login Link (shows when logged out)
  adminLoginLink: {
    color: '#fbbf24',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    ':hover': {
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      transform: 'translateY(-1px)'
    }
  },
  adminLoginIcon: {
    fontSize: '0.9rem'
  },
  adminLoginText: {
    fontSize: '0.9rem'
  },
  // Admin Panel Link (shows when logged in as admin)
  adminNavLink: {
    color: '#fbbf24',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    ':hover': {
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      transform: 'translateY(-1px)'
    }
  },
  adminIcon: {
    fontSize: '0.9rem'
  },
  adminText: {
    fontSize: '0.9rem'
  },
  registerLink: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.6rem 1.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
    }
  },
  registerText: {
    fontSize: '0.95rem'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginLeft: '1rem',
    paddingLeft: '1rem',
    borderLeft: '1px solid rgba(148, 163, 184, 0.3)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#cbd5e1',
    fontSize: '0.9rem'
  },
  userIcon: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  userName: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem'
  },
  adminBadge: {
    background: 'rgba(234, 179, 8, 0.2)',
    color: '#fbbf24',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    border: '1px solid rgba(234, 179, 8, 0.3)'
  },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fecaca',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    ':hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      transform: 'translateY(-1px)'
    }
  },
  logoutIcon: {
    fontSize: '0.8rem'
  }
};

export default Navbar;