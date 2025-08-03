const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter (only initialize if credentials are provided)
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.warn('Email transporter initialization failed:', error.message);
  }
}

// Twilio client (only initialize if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.warn('Twilio initialization failed:', error.message);
  }
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailOTP = async (email, otp) => {
  try {
    if (!emailTransporter) {
      console.warn('Email not configured, cannot send OTP via email');
      return false;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'YouTube Clone - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff0000;">YouTube Clone</h2>
          <p>Your OTP for verification is:</p>
          <h1 style="color: #ff0000; font-size: 32px; text-align: center; background: #f5f5f5; padding: 20px; border-radius: 8px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `
    };

    // Add timeout to prevent hanging
    const emailPromise = emailTransporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout')), 8000)
    );
    
    await Promise.race([emailPromise, timeoutPromise]);
    console.log('Email OTP sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email OTP:', error.message);
    return false;
  }
};

const sendSMSOTP = async (phone, otp) => {
  try {
    if (!twilioClient) {
      console.warn('Twilio not configured, falling back to email for SMS OTP');
      return false;
    }
    
    // Format phone number for international dialing
    let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // If phone already starts with country code, use as is
    if (formattedPhone.length >= 10) {
      // Check if it's a US number (starts with 1 and has 11 digits)
      if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
        formattedPhone = '+' + formattedPhone;
      }
      // Check if it's already an international format (12+ digits)
      else if (formattedPhone.length >= 12) {
        formattedPhone = '+' + formattedPhone;
      }
      // For Indian numbers (10 digits without country code)
      else if (formattedPhone.length === 10) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1); // Remove leading 0
        }
        formattedPhone = '+91' + formattedPhone; // Add India country code
      }
      // For other cases, assume India if no country code
      else {
        formattedPhone = '+91' + formattedPhone;
      }
    } else {
      // Default to India for short numbers
      formattedPhone = '+91' + formattedPhone;
    }
    
    console.log('Sending SMS to formatted number:', formattedPhone); // Debug log
    
    await twilioClient.messages.create({
      body: `Your YouTube Clone verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    
    // Handle Twilio trial account limitations in development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      if (error.code === 21608 || error.code === 21211 || error.message.includes('unverified')) {
        console.log('🔥 Twilio trial limitation detected - enabling development fallback');
        console.log(`📱 Development SMS OTP for ${phone}: ${otp}`);
        console.log('🚀 In production, verify this number at: https://www.twilio.com/console/phone-numbers/verified');
        return true; // Return success for development
      }
    }
    
    return false;
  }
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendSMSOTP
};
