const geoip = require('geoip-lite');

const getLocationFromIP = (ip) => {
  // Handle localhost/development
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return {
      country: 'IN',
      state: 'Unknown',
      city: 'localhost',
      latitude: 20.5937,
      longitude: 78.9629
    };
  }

  const geo = geoip.lookup(ip);
  if (geo) {
    return {
      country: geo.country,
      state: geo.region,
      city: geo.city,
      latitude: geo.ll[0],
      longitude: geo.ll[1]
    };
  }

  return null;
};

const isSouthernState = (state) => {
  if (!state) return false;
  
  const southernStates = [
    // Tamil Nadu
    'TN', 'Tamil Nadu', 'Tamilnadu', 'Tamil-Nadu',
    // Kerala  
    'KL', 'Kerala', 'Kerela',
    // Karnataka
    'KA', 'Karnataka', 'Karnatka', 'Karnātaka',
    // Andhra Pradesh
    'AP', 'Andhra Pradesh', 'Andhra', 'AndhraPradesh', 'Andhra-Pradesh',
    // Telangana
    'TG', 'TS', 'Telangana', 'Telengana', 'Telagana'
  ];
  
  const normalizedState = state.toLowerCase().trim().replace(/[-\s]/g, '');
  return southernStates.some(s => {
    const normalizedSouthernState = s.toLowerCase().replace(/[-\s]/g, '');
    return normalizedState.includes(normalizedSouthernState) || 
           normalizedSouthernState.includes(normalizedState);
  });
};

const getThemeByTimeAndLocation = (location) => {
  const now = new Date();
  const hour = now.getHours();
  
  // Check if time is between 10 AM to 12 PM (10:00 to 11:59)
  const isLightTimeRange = hour >= 10 && hour < 12;
  
  // Check if location is southern India
  const isSouthern = location && isSouthernState(location.state);
  
  // Light theme if EITHER:
  // 1. Time is 10 AM to 12 PM, OR
  // 2. Location is South India
  if (isLightTimeRange || isSouthern) {
    return 'light';
  }
  
  // Dark theme for all other cases
  return 'dark';
};

module.exports = {
  getLocationFromIP,
  isSouthernState,
  getThemeByTimeAndLocation
};
