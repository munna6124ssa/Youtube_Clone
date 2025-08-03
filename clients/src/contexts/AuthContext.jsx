import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI, themeAPI } from '../services/api';
import toast from 'react-hot-toast';

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
    const checkAuth = async () => {
      const token = Cookies.get('token');
      console.log('Auth check - token found:', !!token); // Debug log
      if (token) {
        try {
          console.log('Auth check - making API call to /auth/me'); // Debug log
          const response = await authAPI.getProfile();
          console.log('Auth check success:', response.data); // Debug log
          setUser(response.data.user);
          setIsAuthenticated(true);
          console.log('Auth state set - isAuthenticated: true'); // Debug log
        } catch (error) {
          console.error('Auth check failed:', error);
          console.log('Removing invalid token and setting authenticated to false'); // Debug log
          Cookies.remove('token');
          setIsAuthenticated(false);
          setUser(null);
          // Don't show error toast here as it's just a background check
        }
      } else {
        console.log('No token found, setting authenticated to false'); // Debug log
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
      console.log('Auth loading complete'); // Debug log
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const loadingToast = toast.loading('Signing you in...');
    try {
      console.log('Login attempt with:', credentials); // Debug log
      const response = await authAPI.login(credentials);
      console.log('Login response:', response.data); // Debug log
      
      if (response.data.requiresOTP) {
        toast.dismiss(loadingToast);
        toast.success('OTP sent! Please check your message.');
        return {
          success: true,
          requiresOTP: true,
          userId: response.data.userId,
          verificationMethod: response.data.verificationMethod,
          otpMethod: response.data.otpMethod
        };
      }

      // Direct login (no OTP required)
      Cookies.set('token', response.data.token, { expires: 7 });
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.dismiss(loadingToast);
      toast.success('Logged in successfully!');
      
      // Refresh theme based on current location and time
      refreshTheme();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error); // Debug log
      const message = error.response?.data?.message || 'Login failed';
      toast.dismiss(loadingToast);
      toast.error(message);
      return { success: false, message };
    }
  };

  const verifyOTP = async (userId, otp) => {
    const loadingToast = toast.loading('Verifying your code...');
    try {
      console.log('Verifying OTP for userId:', userId, 'otp:', otp); // Debug log
      const response = await authAPI.verifyOTP({ userId, otp });
      console.log('OTP verification response:', response.data); // Debug log
      
      console.log('Setting token and auth state...'); // Debug log
      Cookies.set('token', response.data.token, { expires: 7 });
      setUser(response.data.user);
      setIsAuthenticated(true);
      console.log('Token set, user set, isAuthenticated set to true'); // Debug log
      console.log('Current user:', response.data.user); // Debug log
      
      toast.dismiss(loadingToast);
      toast.success('Login successful!');
      
      // Refresh theme based on current location and time
      refreshTheme();
      
      return { success: true };
    } catch (error) {
      console.error('OTP verification error:', error); // Debug log
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.dismiss(loadingToast);
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    const loadingToast = toast.loading('Creating your account...');
    try {
      console.log('Registration attempt with:', userData); // Debug log
      const response = await authAPI.register(userData);
      console.log('Registration response:', response.data); // Debug log
      
      console.log('Setting token and auth state after registration...'); // Debug log
      Cookies.set('token', response.data.token, { expires: 7 });
      setUser(response.data.user);
      setIsAuthenticated(true);
      console.log('Token set, user set, isAuthenticated set to true'); // Debug log
      console.log('Current user after registration:', response.data.user); // Debug log
      
      toast.dismiss(loadingToast);
      toast.success('Account created successfully!');
      
      // Refresh theme based on current location and time
      refreshTheme();
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      const message = error.response?.data?.message || 'Registration failed';
      toast.dismiss(loadingToast);
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully! See you soon! 👋');
  };

  // Direct login with token and user data (for registration verification)
  const directLogin = (userData, token) => {
    console.log('Direct login with user data:', userData); // Debug log
    Cookies.set('token', token, { expires: 7 });
    setUser(userData);
    setIsAuthenticated(true);
    console.log('Direct login completed - isAuthenticated set to true'); // Debug log
    
    // Refresh theme based on current location and time
    refreshTheme();
  };

  // Function to refresh theme based on current location and time
  const refreshTheme = async () => {
    try {
      const response = await themeAPI.getTheme();
      const newTheme = response.data.theme;
      
      // Check if user has manually set a theme preference
      const savedTheme = localStorage.getItem('theme');
      const isManualTheme = savedTheme && ['light', 'dark'].includes(savedTheme);
      
      // Only apply auto-theme if user hasn't manually set a preference
      if (!isManualTheme) {
        // Apply theme to document
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        const { location, time, reasoning } = response.data;
        console.log(`🎨 Theme refreshed after login: ${newTheme} theme applied`);
        console.log(`ℹ️ 📍 ${location.city}, ${location.state} | ⏰ Hour: ${time.currentHour} | ${reasoning.reason}`);
        
        // Update theme context state without saving to localStorage
        // (ThemeContext should handle this)
        window.dispatchEvent(new CustomEvent('themeRefresh', { detail: { theme: newTheme, auto: true } }));
      } else {
        console.log('🎨 User has manual theme preference, skipping auto-theme');
      }
    } catch (error) {
      console.log('Failed to refresh theme after login (handled silently):', error.message);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    verifyOTP,
    register,
    logout,
    directLogin, // Add the new function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
