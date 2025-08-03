const { isSouthernState } = require('./location');

/**
 * Determine theme based on current time and location
 * Light theme conditions:
 * 1. South Indian states (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana)
 * 2. Time between 10 AM to 12 PM (regardless of location)
 * 
 * @param {Object} location - User location object with state, city, country
 * @returns {string} - 'light' or 'dark'
 */
function getThemeByTimeAndLocation(location) {
  try {
    const currentHour = new Date().getHours();
    const isLightTimeRange = currentHour >= 10 && currentHour < 12;
    const isSouthern = isSouthernState(location.state);
    
    // Light theme if EITHER South India OR 10 AM-12 PM
    if (isSouthern || isLightTimeRange) {
      return 'light';
    }
    
    // Default to dark theme
    return 'dark';
  } catch (error) {
    console.error('Theme calculation error:', error);
    // Fallback to light theme in case of error
    return 'light';
  }
}

/**
 * Get detailed theme information with reasoning
 * @param {Object} location - User location object
 * @returns {Object} - Theme info with reasoning
 */
function getThemeInfo(location) {
  const theme = getThemeByTimeAndLocation(location);
  const currentHour = new Date().getHours();
  const isLightTimeRange = currentHour >= 10 && currentHour < 12;
  const isSouthern = isSouthernState(location.state);
  
  let reason = '';
  if (theme === 'light') {
    if (isLightTimeRange && isSouthern) {
      reason = 'Time (10 AM-12 PM) and South Indian location';
    } else if (isLightTimeRange) {
      reason = 'Time is between 10 AM to 12 PM';
    } else if (isSouthern) {
      reason = 'Located in South India';
    }
  } else {
    reason = 'Outside 10 AM-12 PM time range and not in South India';
  }
  
  return {
    theme,
    location: {
      state: location.state,
      city: location.city,
      country: location.country
    },
    time: {
      currentHour,
      isLightTimeRange
    },
    reasoning: {
      isSouthernState: isSouthern,
      isLightTime: isLightTimeRange,
      reason
    }
  };
}

module.exports = {
  getThemeByTimeAndLocation,
  getThemeInfo
};
