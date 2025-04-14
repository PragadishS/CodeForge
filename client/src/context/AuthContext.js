import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Checking if token is expired
  const isTokenExpired = useCallback(() => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      // Add a small buffer (e.g., 10 seconds) to account for timing differences
      return decoded.exp < (Date.now() / 1000) - 10;
    } catch (error) {
      console.error('Token validation error:', error);
      return true;
    }
  }, [token]);

  // Loading user if token exists - defined with useCallback to prevent dependency issues
  const loadUser = useCallback(async () => {
    try {
      // Checking if token is expired
      if (isTokenExpired()) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        toast.error('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      const res = await axios.get('/api/auth/me', {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading user:', error);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else if (!error.response) {
        toast.error('Network error. Please check your connection.');
      } else if (error.response.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else {
        toast.error('Failed to load user profile. Please login again.');
      }
      
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [isTokenExpired, setToken, setUser, setIsAuthenticated, setLoading]);

  // Setting axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      loadUser();
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  }, [token, loadUser, setIsAuthenticated, setUser, setLoading]);

  // Registering a new user
  const register = async (formData) => {
    try {
      // Log payload for debugging
      console.log("Register payload:", JSON.stringify(formData));
      
      const res = await axios.post('/api/auth/register', formData, {
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        toast.error('Registration request timed out. Please try again.');
      } else if (!error.response) {
        toast.error('Network error. Please check your connection.');
      } else {
        const errorMessage = error.response && error.response.data.error
          ? error.response.data.error
          : 'Registration failed. Please try again.';
        toast.error(errorMessage);
      }
      
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      // Clear existing token first
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      
      // Log payload for debugging
      console.log("Login payload:", JSON.stringify(formData));
      
      // Get CSRF token if your backend uses it
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const res = await axios.post('/api/auth/login', formData, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        }
      });
      
      const newToken = res.data.token;
      
      // Validate token before storing
      try {
        jwtDecode(newToken); // This will throw an error if token is invalid
      } catch (tokenError) {
        console.error('Invalid token received:', tokenError);
        toast.error('Authentication error. Please try again.');
        return false;
      }
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        toast.error('Login request timed out. Please try again.');
      } else if (!error.response) {
        toast.error('Network error. Please check your connection.');
      } else if (error.response.status === 400) {
        toast.error('Invalid credentials. Please check your email and password.');
      } else if (error.response.status === 401) {
        toast.error('Unauthorized. Please check your credentials.');
      } else if (error.response.status === 403) {
        toast.error('Account locked or disabled. Please contact support.');
      } else {
        const errorMessage = error.response && error.response.data.error
          ? error.response.data.error
          : 'Login failed. Please check your credentials.';
        toast.error(errorMessage);
      }
      
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.info('You have been logged out');
  };

  // Checking if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Checking if user is the author of a resource
  const isAuthor = (authorId) => {
    return user && user._id === authorId;
  };

  // Refresh token function (if your backend supports it)
  const refreshToken = async () => {
    try {
      const res = await axios.post('/api/auth/refresh', { token }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      toast.error('Session expired. Please login again.');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        isTokenExpired,
        isAdmin,
        isAuthor,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};