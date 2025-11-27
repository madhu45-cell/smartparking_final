import React from 'react';
import { Link } from 'react-router-dom';
import { FaParking, FaClock, FaSearch, FaEye, FaCar, FaUser, FaMapMarkerAlt, FaQrcode, FaShieldAlt } from 'react-icons/fa';

function Home({ user }) {
  return (
    <div style={styles.homeBg}>
      {/* Animated Background Elements */}
      <div style={styles.floatingShapes}>
        <div style={{ ...styles.shape, ...styles.shape1 }}></div>
        <div style={{ ...styles.shape, ...styles.shape2 }}></div>
        <div style={{ ...styles.shape, ...styles.shape3 }}></div>
      </div>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.container}>
          <div style={styles.heroGlow}></div>
          <div style={styles.fadeInUp}>
            <div style={styles.logoIcon}>
              <FaParking style={{ color: 'white', fontSize: '50px' }} />
            </div>
            <h1 style={styles.heroText}>
              Smart<span style={styles.gradientText}>Park</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Revolutionizing urban parking with AI-powered real-time solutions
              {user && (
                <span style={styles.welcomeBadge}>
                  👋 Welcome back, {user.username}!
                </span>
              )}
            </p>
            
            {/* Animated CTA Buttons */}
            <div style={styles.ctaButtons}>
              {user ? (
                <>
                  <Link to="/slot-availability" style={styles.primaryButton}>
                    <FaEye style={styles.buttonIcon} />
                    Live Map
                  </Link>
                  <Link to="/booking" style={styles.secondaryButton}>
                    Book Instantly
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" style={styles.primaryButton}>
                    Start Free Trial
                  </Link>
                  <Link to="/login" style={styles.secondaryButton}>
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Interactive Hero Visual */}
          <div style={styles.heroVisual}>
            <div style={styles.parkingVisual}>
              <div style={styles.parkingLot}>
                {[1, 2, 3, 4].map(slot => (
                  <div key={slot} style={styles.parkingSlot}>
                    <FaCar style={styles.slotIcon} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Why <span style={styles.gradientText}>SmartPark</span>?
            </h2>
            <p style={styles.sectionSubtitle}>Experience the future of urban mobility</p>
          </div>
          
          <div style={styles.featuresGrid}>
            {/* Feature 1 */}
            <div style={styles.featureColumn}>
              <Link to="/booking" style={styles.featureCard}>
                <div style={styles.cardBody}>
                  <div style={styles.featureIconWrapper}>
                    <div style={styles.featureIconPrimary}>
                      <FaParking style={{ color: 'white' }} />
                    </div>
                    <div style={styles.iconGlow}></div>
                  </div>
                  <h3 style={styles.featureTitle}>One-Tap Booking</h3>
                  <p style={styles.featureText}>
                    Reserve your perfect spot in seconds with our intelligent booking system.
                  </p>
                  <div style={styles.featureBadge}>
                    <span style={styles.badgePrimary}>Instant</span>
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Feature 2 */}
            <div style={styles.featureColumn}>
              <Link to="/slot-availability" style={styles.featureCard}>
                <div style={styles.cardBody}>
                  <div style={styles.featureIconWrapper}>
                    <div style={styles.featureIconSuccess}>
                      <FaMapMarkerAlt style={{ color: 'white' }} />
                    </div>
                    <div style={styles.iconGlow}></div>
                  </div>
                  <h3 style={styles.featureTitle}>Live Smart Map</h3>
                  <p style={styles.featureText}>
                    Real-time occupancy tracking with predictive availability.
                  </p>
                  <div style={styles.featureBadge}>
                    <span style={styles.badgeSuccess}>Live</span>
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Feature 3 */}
            <div style={styles.featureColumn}>
              <Link to="/slot-availability" style={styles.featureCard}>
                <div style={styles.cardBody}>
                  <div style={styles.featureIconWrapper}>
                    <div style={styles.featureIconWarning}>
                      <FaQrcode style={{ color: 'white' }} />
                    </div>
                    <div style={styles.iconGlow}></div>
                  </div>
                  <h3 style={styles.featureTitle}>QR Access</h3>
                  <p style={styles.featureText}>
                    Seamless entry and exit with digital QR code verification.
                  </p>
                  <div style={styles.featureBadge}>
                    <span style={styles.badgeWarning}>Smart</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Stats for Logged-in Users */}
          {user && (
            <div style={styles.statsSection}>
              <div style={styles.statsCard}>
                <div style={styles.statsBody}>
                  <h3 style={styles.statsTitle}>Your Parking Hub</h3>
                  <div style={styles.quickActionsGrid}>
                    <div style={styles.quickActionColumn}>
                      <Link to="/slot-availability" style={styles.quickActionButton}>
                        <div style={styles.actionIcon}>
                          <FaEye />
                        </div>
                        <span>Live View</span>
                        <div style={styles.actionGlow}></div>
                      </Link>
                    </div>
                    <div style={styles.quickActionColumn}>
                      <Link to="/booking" style={styles.quickActionButton}>
                        <div style={styles.actionIcon}>
                          <FaCar />
                        </div>
                        <span>Book Slot</span>
                        <div style={styles.actionGlow}></div>
                      </Link>
                    </div>
                    <div style={styles.quickActionColumn}>
                      <Link to="/dashboard" style={styles.quickActionButton}>
                        <div style={styles.actionIcon}>
                          <FaUser />
                        </div>
                        <span>Dashboard</span>
                        <div style={styles.actionGlow}></div>
                      </Link>
                    </div>
                    <div style={styles.quickActionColumn}>
                      <Link to="/slot-availability" style={styles.quickActionButton}>
                        <div style={styles.actionIcon}>
                          <FaShieldAlt />
                        </div>
                        <span>Security</span>
                        <div style={styles.actionGlow}></div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <div style={styles.ctaCard}>
            <div style={styles.ctaRow}>
              <div style={styles.ctaContent}>
                <div style={styles.ctaBody}>
                  <h2 style={styles.ctaTitle}>
                    Ready to Park <span style={styles.gradientText}>Smarter</span>?
                  </h2>
                  <p style={styles.ctaText}>
                    Join thousands of drivers who save time and reduce stress with our intelligent parking platform.
                  </p>
                  <div style={styles.ctaButtons}>
                    {user ? (
                      <Link to="/slot-availability" style={styles.primaryButton}>
                        <FaMapMarkerAlt style={styles.buttonIcon} />
                        Open Live Map
                      </Link>
                    ) : (
                      <Link to="/register" style={styles.primaryButton}>
                        Get Started Free
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.ctaVisual}>
                <div style={styles.floatingCar}>
                  <FaCar style={{ color: 'white', fontSize: '40px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  homeBg: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  
  // Floating Shapes
  floatingShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  shape: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(59, 130, 246, 0.1)',
    animation: 'float 6s ease-in-out infinite'
  },
  shape1: {
    width: '200px',
    height: '200px',
    top: '10%',
    left: '5%',
    animationDelay: '0s'
  },
  shape2: {
    width: '150px',
    height: '150px',
    top: '60%',
    right: '10%',
    animationDelay: '2s'
  },
  shape3: {
    width: '100px',
    height: '100px',
    bottom: '20%',
    left: '20%',
    animationDelay: '4s'
  },
  
  // Hero Section
  heroSection: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 0',
    position: 'relative'
  },
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    textAlign: 'center'
  },
  heroGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
    filter: 'blur(40px)'
  },
  fadeInUp: {
    animation: 'fadeInUp 1s ease-out'
  },
  logoIcon: {
    display: 'inline-flex',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: '2rem'
  },
  heroText: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '1.5rem',
    textShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  },
  gradientText: {
    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#e2e8f0',
    marginBottom: '3rem',
    maxWidth: '600px',
    margin: '0 auto 3rem'
  },
  welcomeBadge: {
    display: 'block',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '25px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginTop: '1rem'
  },
  ctaButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '3rem'
  },
  
  // Buttons
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    border: 'none',
    cursor: 'pointer'
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'transparent',
    color: '#f8fafc',
    padding: '12px 24px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer'
  },
  buttonIcon: {
    marginRight: '0.5rem',
    fontSize: '1rem'
  },
  
  // Hero Visual
  heroVisual: {
    marginTop: '3rem',
    position: 'relative'
  },
  parkingVisual: {
    display: 'inline-block',
    padding: '2rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  parkingLot: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem'
  },
  parkingSlot: {
    width: '60px',
    height: '60px',
    background: 'rgba(34, 197, 94, 0.3)',
    border: '2px solid rgba(34, 197, 94, 0.5)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    animation: 'pulse 2s infinite'
  },
  slotIcon: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1.2rem'
  },
  
  // Features Section
  featuresSection: {
    padding: '3rem 0',
    position: 'relative'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '1rem'
  },
  sectionSubtitle: {
    color: '#e2e8f0',
    opacity: 0.75,
    fontSize: '1.1rem'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  },
  featureColumn: {
    minWidth: 0
  },
  featureCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    position: 'relative',
    textDecoration: 'none',
    display: 'block',
    height: '100%'
  },
  cardBody: {
    padding: '2rem'
  },
  featureIconWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '1rem'
  },
  featureIconPrimary: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
  },
  featureIconSuccess: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #10b981, #059669)'
  },
  featureIconWarning: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)'
  },
  iconGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80px',
    height: '80px',
    background: 'inherit',
    borderRadius: '50%',
    filter: 'blur(10px)',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '1rem'
  },
  featureText: {
    color: '#cbd5e1',
    opacity: 0.75,
    lineHeight: '1.6'
  },
  featureBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem'
  },
  badgePrimary: {
    background: '#3b82f6',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  badgeSuccess: {
    background: '#10b981',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  badgeWarning: {
    background: '#f59e0b',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  
  // Stats Section
  statsSection: {
    marginTop: '3rem'
  },
  statsCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '25px',
    overflow: 'hidden'
  },
  statsBody: {
    padding: '3rem',
    textAlign: 'center'
  },
  statsTitle: {
    color: '#f8fafc',
    marginBottom: '2rem',
    fontSize: '1.5rem'
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  quickActionColumn: {
    marginBottom: '1rem'
  },
  quickActionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    textDecoration: 'none',
    color: 'white',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  actionIcon: {
    width: '50px',
    height: '50px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
    transition: 'all 0.3s ease'
  },
  actionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  
  // CTA Section
  ctaSection: {
    padding: '3rem 0',
    position: 'relative'
  },
  ctaCard: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
    backdropFilter: 'blur(15px)',
    borderRadius: '30px',
    overflow: 'hidden',
    border: '1px solid rgba(100, 116, 139, 0.3)'
  },
  ctaRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr'
  },
  ctaContent: {
    display: 'flex',
    alignItems: 'center'
  },
  ctaBody: {
    padding: '3rem'
  },
  ctaTitle: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '1rem'
  },
  ctaText: {
    color: '#e2e8f0',
    fontSize: '1.1rem',
    marginBottom: '2rem',
    lineHeight: '1.6'
  },
  ctaVisual: {
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  floatingCar: {
    animation: 'float 3s ease-in-out infinite'
  }
};

// Add CSS animations
const addAnimations = () => {
  if (typeof document !== 'undefined') {
    const styleSheet = document.styleSheets[0];
    const animations = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      /* Hover effects */
      .feature-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }
      
      .feature-card:hover .icon-glow {
        opacity: 0.6;
      }
      
      .primary-button:hover::before {
        left: 100%;
      }
      
      .primary-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
      }
      
      .secondary-button:hover {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        transform: translateY(-2px);
      }
      
      .quick-action-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-5px);
      }
      
      .quick-action-button:hover .action-icon {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
      
      .quick-action-button:hover .action-glow {
        opacity: 1;
      }
      
      input, select, textarea {
        color-scheme: dark;
      }
    `;

    try {
      styleSheet.insertRule(animations, styleSheet.cssRules.length);
    } catch (e) {
      // Fallback: create a style element
      const style = document.createElement('style');
      style.textContent = animations;
      document.head.appendChild(style);
    }
  }
};

// Initialize animations
addAnimations();

export default Home;