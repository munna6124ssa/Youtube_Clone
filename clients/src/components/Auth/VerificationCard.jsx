import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Shield, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VerificationCard = ({ registrationData, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const { directLogin } = useAuth();
  
  const inputRefs = useRef([]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus and handle input
  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Verify OTP mutation
  const verifyMutation = useMutation({
    mutationFn: async (otpString) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/verify-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registrationData.originalEmail || registrationData.email, // Use original email for OTP verification
          otp: otpString
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Account verified successfully! Welcome aboard! 🎉');
      directLogin(data.user, data.token);
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  });

  // Resend OTP mutation
  const resendMutation = useMutation({
    mutationFn: async () => {
      // This would need to be implemented on the backend
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/resend-registration-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registrationData.originalEmail || registrationData.email // Use original email for resend
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('OTP sent successfully!');
      setTimeLeft(600);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    },
    onError: (error) => {
      toast.error('Failed to resend OTP. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    
    verifyMutation.mutate(otpString);
  };

  const handleResend = () => {
    if (canResend && !resendMutation.isPending) {
      resendMutation.mutate();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMethodEmail = registrationData.verificationMethod === 'email';
  const locationInfo = registrationData.location;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Registration</span>
        </button>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 backdrop-blur-sm">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Verify Your Account</h2>
              <p className="text-blue-100 text-center text-sm">
                We've sent a verification code to secure your account
              </p>
            </div>
            
            {/* Decorative elements */}
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/30" />
            <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-white/20" />
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Method Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3 mb-3">
                {isMethodEmail ? (
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">Email Verification</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">SMS Verification</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Code sent to: <span className="font-medium text-gray-900 dark:text-white">
                  {registrationData.verificationTarget}
                </span>
              </p>

              {/* Location Info */}
              {locationInfo && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {locationInfo.city}, {locationInfo.state}
                    {locationInfo.isSouthern && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                        South India - Email OTP
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* OTP Input */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  Enter 6-digit verification code
                </label>
                <div className="flex justify-center space-x-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      disabled={verifyMutation.isPending}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Code expires in <span className="font-mono font-bold text-red-600 dark:text-red-400">
                        {formatTime(timeLeft)}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Code expired
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={verifyMutation.isPending || otp.join('').length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {verifyMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Verify Account</span>
                  </>
                )}
              </button>

              {/* Resend Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || resendMutation.isPending}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
                >
                  {resendMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend Code</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p>Didn't receive the code? Check your spam folder or try resending.</p>
              <p className="mt-1">
                Having trouble? <button className="text-blue-600 dark:text-blue-400 hover:underline">Contact Support</button>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
            <Shield className="w-3 h-3" />
            <span>Your account is protected with secure verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationCard;
