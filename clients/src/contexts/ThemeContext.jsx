import React, { createContext, useContext, useState, useEffect } from 'react';
import { themeAPI } from '../services/api';
import toast from 'react-hot-toast';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [autoTheme, setAutoTheme] = useState(null); // Store the auto-detected theme

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Get user's saved preference from localStorage
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          console.log('🎨 Using saved theme preference:', savedTheme);
          setTheme(savedTheme);
          applyTheme(savedTheme);
        } else {
          // Get theme based on time and location
          try {
            console.log('🎨 Fetching auto theme from server...');
            const response = await themeAPI.getTheme();
            const locationBasedTheme = response.data.theme;
            const themeInfo = response.data;
            
            setAutoTheme(locationBasedTheme);
            setTheme(locationBasedTheme);
            applyTheme(locationBasedTheme);
            
            // Show notification about auto theme with detailed reason
            const { location, time, reasoning } = themeInfo;
            const themeIcon = locationBasedTheme === 'light' ? '☀️' : '🌙';
            const message = `${themeIcon} Auto-theme: ${locationBasedTheme} theme applied`;
            const details = `📍 ${location.city}, ${location.state} | ⏰ Hour: ${time.currentHour} | ${reasoning.reason}`;
            
            console.log(`🎨 ${message}`);
            console.log(`ℹ️ ${details}`);
            
            // Show toast notification only for successful theme detection
            toast(message, {
              duration: 4000,
              style: {
                background: locationBasedTheme === 'light' ? '#F3F4F6' : '#374151',
                color: locationBasedTheme === 'light' ? '#1F2937' : '#F9FAFB',
                border: `2px solid ${locationBasedTheme === 'light' ? '#E5E7EB' : '#4B5563'}`,
              },
            });
            
          } catch (error) {
            console.log('⚠️ Failed to get auto theme from server, using fallback');
            console.log('Error details:', error.message);
            // Silently fall back to light theme - no error toast needed
            const fallbackTheme = 'light';
            setTheme(fallbackTheme);
            applyTheme(fallbackTheme);
          }
        }
      } catch (error) {
        console.error('Theme initialization error:', error);
        // Silent fallback - no error notification needed
        setTheme('light');
        applyTheme('light');
      } finally {
        setLoading(false);
      }
    };

    initializeTheme();

    // Listen for theme refresh events from AuthContext
    const handleThemeRefresh = (event) => {
      const { theme, auto } = event.detail;
      if (auto && !localStorage.getItem('theme')) {
        console.log('🎨 Received auto-theme refresh:', theme);
        setTheme(theme);
        setAutoTheme(theme);
        applyTheme(theme);
      }
    };

    window.addEventListener('themeRefresh', handleThemeRefresh);

    return () => {
      window.removeEventListener('themeRefresh', handleThemeRefresh);
    };
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save preference to backend if user is logged in
    try {
      await themeAPI.setThemePreference(newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateTheme(newTheme);
  };

  const resetToAutoTheme = async () => {
    try {
      const response = await themeAPI.getTheme();
      const locationBasedTheme = response.data.theme;
      setAutoTheme(locationBasedTheme);
      setTheme(locationBasedTheme);
      applyTheme(locationBasedTheme);
      localStorage.removeItem('theme'); // Remove manual preference
      
      if (response.data.location) {
        const { city, state } = response.data.location;
        console.log(`🎨 Theme reset to auto: ${locationBasedTheme} based on ${city}, ${state} and current time`);
      }
    } catch (error) {
      console.error('Failed to reset to auto theme:', error);
    }
  };

  const value = {
    theme,
    autoTheme,
    loading,
    updateTheme,
    toggleTheme,
    resetToAutoTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
