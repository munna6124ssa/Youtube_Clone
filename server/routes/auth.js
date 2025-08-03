const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getLocationFromIP, isSouthernState } = require('../utils/location');
const { generateOTP, sendEmailOTP, sendSMSOTP } = require('../utils/otp');

const router = express.Router();

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('channelName').isLength({ min: 1 }).trim(),
  body('state').notEmpty().trim().withMessage('State is required'),
  body('city').isLength({ min: 2 }).trim().withMessage('City is required'),
  body('phone').notEmpty().withMessage('Phone number is required').matches(/^[0-9+\-\s()]{10,15}$/).withMessage('Please provide a valid phone number (10-15 digits)')
], async (req, res) => {
  try {
    console.log('Registration request body:', req.body); // Debug log
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array()); // Debug log
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, channelName, phone, state, city } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const ipLocation = getLocationFromIP(clientIP);
    
    // Combine user-provided location with IP location
    const location = {
      country: ipLocation?.country || 'IN',
      state: state || ipLocation?.state || 'Unknown',
      city: city || ipLocation?.city || 'Unknown',
      latitude: ipLocation?.latitude || 20.5937,
      longitude: ipLocation?.longitude || 78.9629
    };

    // Determine verification method based on state
    const isSouthern = isSouthernState(location.state);
    const verificationMethod = isSouthern ? 'email' : 'phone';

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (but don't save until verified)
    const user = new User({
      username,
      email,
      password,
      channelName,
      phone: phone || '',
      location,
      verificationMethod,
      isVerified: false // User needs to verify first
    });

    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP temporarily
    otpStore.set(email, {
      otp,
      expiry: otpExpiry,
      userData: {
        username,
        email,
        password,
        channelName,
        phone: phone || '',
        location,
        verificationMethod
      }
    });

    // Send OTP based on location and user preference
    let otpSent = false;
    let currentVerificationMethod = verificationMethod;

    if (isSouthern) {
      // Southern states - send email OTP (as per your location-based rule)
      otpSent = await sendEmailOTP(email, otp);
      currentVerificationMethod = 'email';
    } else {
      // Non-southern states - send SMS OTP (phone is now required)
      otpSent = await sendSMSOTP(phone, otp);
      currentVerificationMethod = 'phone';
    }

    if (!otpSent) {
      // In development, allow registration to proceed even if OTP sending fails
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
        console.log('OTP sending failed, but allowing registration for development');
        console.log(`Development OTP for ${currentVerificationMethod === 'email' ? email : phone}: ${otp}`);
        otpSent = true; // Override for development
      } else {
        return res.status(500).json({ 
          message: 'Failed to send OTP. Please check your email/phone configuration or try again later.' 
        });
      }
    }

    res.status(200).json({
      message: 'Registration initiated. Please verify your account with the OTP sent to your ' + 
               (currentVerificationMethod === 'email' ? 'email' : 'phone number'),
      requiresVerification: true,
      verificationMethod: currentVerificationMethod,
      verificationTarget: currentVerificationMethod === 'email' ? email : phone,
      location: {
        state: location.state,
        city: location.city,
        isSouthern
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    console.log('Login request body:', req.body); // Debug log
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array()); // Debug log
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const location = getLocationFromIP(clientIP);

    console.log('Looking for user with email:', email); // Debug log
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.username, 'verified:', user.isVerified); // Debug log
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update user location and last login
    const currentLocation = getLocationFromIP(clientIP);
    console.log('Current location from IP:', currentLocation); // Debug log
    
    // Only update location if:
    // 1. User doesn't have a location yet, OR
    // 2. Current location is not localhost/unknown (real IP detection)
    if (!user.location || (currentLocation && currentLocation.state !== 'Unknown')) {
      if (currentLocation) {
        user.location = currentLocation;
      }
    }
    user.lastLogin = new Date();
    
    // For theme detection, use user's registered location if available, otherwise use current IP location
    const locationForTheme = user.location || currentLocation;
    const isSouthern = isSouthernState(locationForTheme?.state);
    const currentVerificationMethod = isSouthern ? 'email' : 'phone';
    console.log('User location state:', locationForTheme?.state, 'isSouthern:', isSouthern); // Debug log
    
    await user.save();
    console.log('User updated successfully'); // Debug log

    // Send OTP based on location
    const otp = generateOTP();
    const otpKey = `${user._id}_login`;
    console.log('Generated OTP:', otp, 'for key:', otpKey); // Debug log
    
    otpStore.set(otpKey, {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    let otpSent = false;
    
    // Send actual OTP based on location with timeout protection
    try {
      if (isSouthern) {
        // Southern states - send email OTP
        if (user.email) {
          console.log('Attempting to send email OTP to:', user.email);
          otpSent = await Promise.race([
            sendEmailOTP(user.email, otp),
            new Promise(resolve => setTimeout(() => resolve(false), 8000)) // 8 second timeout
          ]);
          console.log('Email OTP sent result:', otpSent);
        }
      } else {
        // Non-southern states - send SMS OTP (phone is required now)
        if (user.phone) {
          console.log('Attempting to send SMS OTP to:', user.phone);
          otpSent = await Promise.race([
            sendSMSOTP(user.phone, otp),
            new Promise(resolve => setTimeout(() => resolve(false), 8000)) // 8 second timeout
          ]);
          console.log('SMS OTP sent result:', otpSent);
        } else {
          // This shouldn't happen now since phone is required during registration
          return res.status(400).json({ 
            message: 'Phone number not found. Please contact support.' 
          });
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error.message);
      otpSent = false;
    }

    // For development/testing - always allow login even if OTP sending fails
    if (!otpSent) {
      console.warn('OTP sending failed, but allowing login for development');
      console.log('Development OTP for', user.email, ':', otp);
      // Still store the OTP for manual verification
    }

    // Always respond with success for development (even if OTP sending fails)
    res.json({
      message: otpSent ? 'OTP sent successfully' : 'OTP generated (check server logs for development OTP)',
      verificationMethod: currentVerificationMethod,
      requiresOTP: true,
      userId: user._id,
      otpMethod: isSouthern ? 
        (otpSent ? 'Email sent to your registered email' : 'Email sending failed - check server logs for OTP') : 
        (otpSent ? 'SMS sent to your registered phone number' : 'SMS sending failed - check server logs for OTP'),
      developmentNote: !otpSent ? 'Check server console for OTP in development mode' : undefined
    });
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Login error stack:', error.stack); // More detailed error logging
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
// Verify registration OTP
router.post('/verify-registration', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Registration verification - Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    
    console.log('Registration OTP Verification Debug:');
    console.log('- Email:', email);
    console.log('- Provided OTP:', otp);
    console.log('- OTP Store keys:', Array.from(otpStore.keys()));
    
    const storedData = otpStore.get(email);
    console.log('- Stored Data for email:', storedData);
    
    if (!storedData) {
      console.log('No OTP data found for email:', email);
      return res.status(400).json({ message: 'OTP expired or not found. Please register again.' });
    }

    console.log('- Current time:', Date.now());
    console.log('- OTP expires at:', storedData.expiry);
    console.log('- Time remaining:', storedData.expiry - Date.now(), 'ms');

    if (Date.now() > storedData.expiry) {
      console.log('OTP expired for email:', email);
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please register again.' });
    }

    console.log('- Stored OTP:', storedData.otp);
    console.log('- Provided OTP:', otp);
    console.log('- OTP Match:', storedData.otp === otp);
    console.log('- OTP Types:', typeof storedData.otp, typeof otp);

    if (storedData.otp !== otp) {
      console.log('OTP mismatch for email:', email);
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    console.log('Registration OTP verified successfully for:', email);

    // OTP verified - now create the user
    const userData = storedData.userData;
    const user = new User({
      ...userData,
      isVerified: true
    });

    await user.save();
    otpStore.delete(email);

    console.log('User created successfully with ID:', user._id);

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created and verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        channelName: user.channelName,
        location: user.location,
        verificationMethod: user.verificationMethod,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Registration verification error:', error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Resend registration OTP
router.post('/resend-registration-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'No pending registration found. Please register again.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update stored data with new OTP
    storedData.otp = otp;
    storedData.expiry = otpExpiry;
    otpStore.set(email, storedData);

    const userData = storedData.userData;
    const isSouthern = isSouthernState(userData.location.state);
    const verificationMethod = isSouthern ? 'email' : 'phone';

    // Send OTP based on location
    let otpSent = false;

    if (isSouthern) {
      otpSent = await sendEmailOTP(email, otp);
    } else {
      // Phone is now required, so we can directly use it
      otpSent = await sendSMSOTP(userData.phone, otp);
    }

    if (!otpSent) {
      return res.status(500).json({ message: 'Failed to resend OTP' });
    }

    res.json({
      message: 'OTP resent successfully',
      verificationMethod
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', [
  body('userId').isMongoId(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, otp } = req.body;
    const otpKey = `${userId}_login`;
    
    console.log('OTP Verification Debug:');
    console.log('- User ID:', userId);
    console.log('- OTP Key:', otpKey);
    console.log('- Provided OTP:', otp);
    console.log('- OTP Store contents:', Array.from(otpStore.keys()));
    
    const storedOtpData = otpStore.get(otpKey);
    console.log('- Stored OTP Data:', storedOtpData);
    
    if (!storedOtpData) {
      console.log('No OTP found for key:', otpKey);
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    console.log('- Current time:', Date.now());
    console.log('- OTP expires at:', storedOtpData.expires);
    console.log('- Time remaining:', storedOtpData.expires - Date.now(), 'ms');

    if (Date.now() > storedOtpData.expires) {
      console.log('OTP expired, deleting from store');
      otpStore.delete(otpKey);
      return res.status(400).json({ message: 'OTP expired' });
    }

    console.log('- Stored OTP:', storedOtpData.otp);
    console.log('- Provided OTP:', otp);
    console.log('- OTP Match:', storedOtpData.otp === otp);
    console.log('- OTP Types:', typeof storedOtpData.otp, typeof otp);

    if (storedOtpData.otp !== otp) {
      console.log('OTP mismatch!');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP verified successfully
    otpStore.delete(otpKey);
    
    console.log('OTP verification successful for user:', userId);
    const user = await User.findById(userId).select('-password');
    user.isVerified = true;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log('Sending login response with token and user data'); // Debug log
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        channelName: user.channelName,
        location: user.location,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      channelName: req.user.channelName,
      avatar: req.user.avatar,
      location: req.user.location,
      subscribers: req.user.subscribers?.length || 0,
      subscriptions: req.user.subscriptions?.length || 0
    }
  });
});

module.exports = router;
