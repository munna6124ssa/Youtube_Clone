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
    
    // Light theme if Southern state OR 10 AM-12 PM
    const theme = (isSouthern || isLightTimeRange) ? 'light' : 'dark';
    
    let reason = '';
    if (theme === 'light') {
      if (isLightTimeRange && isSouthern) {
        reason = 'Time (10 AM-12 PM) and Southern India location';
      } else if (isLightTimeRange) {
        reason = 'Time is between 10 AM to 12 PM';
      } else if (isSouthern) {
        reason = 'Located in Southern India (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, or Telangana)';
      }
    } else {
      reason = 'Outside 10 AM-12 PM time range and not in Southern India';
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
