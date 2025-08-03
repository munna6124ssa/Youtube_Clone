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
    
    // Theme logic: Light theme ONLY for anonymous users in Southern states during 10 AM-12 PM
    // Logged-in users always get dark theme
    let theme, reason;
    
    if (req.user) {
      // Logged-in users always get dark theme
      theme = 'dark';
      reason = 'Logged-in users get dark theme';
    } else {
      // Anonymous users: Light theme only if Southern state AND 10 AM-12 PM
      if (isSouthern && isLightTimeRange) {
        theme = 'light';
        reason = 'Anonymous user in Southern India during 10 AM-12 PM';
      } else {
        theme = 'dark';
        reason = isSouthern ? 
          'Anonymous user in Southern India but outside 10 AM-12 PM' : 
          'Anonymous user not in Southern India';
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
