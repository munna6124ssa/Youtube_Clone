const express = require('express');
const { isSouthernState } = require('../utils/location');
const router = express.Router();

// Get current theme based on location and time
router.get('/', async (req, res) => {
  try {
    console.log('Theme endpoint hit');
    console.log('Request user:', req.user ? 'Present' : 'Not present');
    
    let location = req.location || { 
      country: 'IN', 
      state: 'Unknown', 
      city: 'localhost' 
    };
    
    // If user is logged in, use their registered location
    if (req.user) {
      try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (user && user.location && user.location.state !== 'Unknown') {
          location = user.location;
          console.log('Using user registered location:', location);
        }
      } catch (error) {
        console.log('Error fetching user location, using IP location:', error.message);
      }
    }
    
    // Simple theme logic
    const currentHour = new Date().getHours();
    const isLightTimeRange = currentHour >= 10 && currentHour < 12;
    
    // Check if state is southern (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana)
    const isSouthern = isSouthernState(location.state);
    
    // Light theme ONLY if Southern state AND 10 AM-12 PM (regardless of login status)
    const theme = (isSouthern && isLightTimeRange) ? 'light' : 'dark';
    
    let reason = '';
    if (theme === 'light') {
      reason = 'Southern India location (TN/KL/KA/AP/TG) AND time is between 10 AM-12 PM';
    } else {
      if (!isSouthern) {
        reason = 'Not in Southern India (requires TN/KL/KA/AP/TG)';
      } else if (!isLightTimeRange) {
        reason = `Time is outside 10 AM-12 PM range (current: ${currentHour}:00)`;
      } else {
        reason = 'Neither Southern India nor correct time range';
      }
    }
    
    console.log(`Theme determined: ${theme}`, {
      location: location.state,
      hour: currentHour,
      isSouthern,
      isLightTimeRange,
      reason
    });
    
    res.json({
      theme,
      location: {
        state: location.state,
        city: location.city,
        country: location.country
      },
      currentHour,
      reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Theme endpoint error:', error);
    res.status(500).json({ 
      message: 'Server error',
      theme: 'dark' // Fallback theme
    });
  }
});

module.exports = router;
