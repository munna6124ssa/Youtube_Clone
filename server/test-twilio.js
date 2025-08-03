// Simple Twilio test script
const twilio = require('twilio');

// Load environment variables
require('dotenv').config();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testTwilio() {
  console.log('🔧 Testing Twilio configuration...');
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('Phone Number:', process.env.TWILIO_PHONE_NUMBER);
  
  try {
    // Test 1: Check account details
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Account status:', account.status);
    console.log('✅ Account type:', account.type);
    
    // Test 2: List verified phone numbers
    const incomingPhoneNumbers = await twilioClient.incomingPhoneNumbers.list();
    console.log('📱 Available phone numbers:', incomingPhoneNumbers.map(p => p.phoneNumber));
    
    // Test 3: Check if our configured number exists
    const ourNumber = incomingPhoneNumbers.find(p => p.phoneNumber === process.env.TWILIO_PHONE_NUMBER);
    if (ourNumber) {
      console.log('✅ Configured phone number is valid');
    } else {
      console.log('❌ Configured phone number not found in account');
    }
    
  } catch (error) {
    console.error('❌ Twilio test failed:', error.message);
  }
}

testTwilio();
