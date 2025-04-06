import React, { createContext, useState, useContext, useEffect } from 'react';
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
  }, [token]);

  // Loading user if token exists
  const loadUser = async () => {
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

      const res = await axios.get('/api/auth/me');
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Registering a new user
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response && error.response.data.error
        ? error.response.data.error
        : 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response && error.response.data.error
        ? error.response.data.error
        : 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.info('You have been logged out');
  };

  // Checking if token is expired
  const isTokenExpired = () => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  };

  // Checking if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Checking if user is the author of a resource
  const isAuthor = (authorId) => {
    return user && user._id === authorId;
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
        isAuthor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};