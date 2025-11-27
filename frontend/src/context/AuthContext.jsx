// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      console.log('🔍 Checking auth status:', { 
        storedUser: !!storedUser, 
        token: !!token 
      });
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token is still valid by making a test request
        try {
          // You can add a token validation endpoint here if needed
          // For now, we'll assume the token is valid if it exists
          console.log('✅ Token found, setting user:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('❌ Token validation failed:', error);
          logout();
        }
      } else {
        console.log('❌ No valid authentication found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, tokens) => {
    console.log('🔄 Logging in user:', userData);
    
    // Update state
    setUser(userData);
    setIsAuthenticated(true);
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authToken', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refreshToken', tokens.refresh);
    }
    
    // Set axios default header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    
    console.log('✅ Login complete - user stored in state and localStorage');
  };

  const logout = () => {
    console.log('🔄 Logging out user');
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Remove axios header
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('✅ Logout complete - all data cleared');
  };

  // Update user data (useful when user profile changes)
  const updateUser = (updatedUserData) => {
    console.log('🔄 Updating user data:', updatedUserData);
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
    localStorage.setItem('user', JSON.stringify({
      ...user,
      ...updatedUserData
    }));
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.is_staff || user?.is_superuser || user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin: isAdmin(),
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};