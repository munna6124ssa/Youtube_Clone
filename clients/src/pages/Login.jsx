import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  const { login, verifyOTP, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    const result = await login(data);
    
    if (result.success) {
      if (result.requiresOTP) {
        setOtpData({
          userId: result.userId,
          verificationMethod: result.verificationMethod,
          otpMethod: result.otpMethod
        });
        setShowOTPModal(true);
      } else {
        // Small delay to ensure auth state propagates
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      }
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a complete 6-digit OTP');
      return;
    }

    console.log('Submitting OTP verification...'); // Debug log
    const result = await verifyOTP(otpData.userId, otp);
    console.log('OTP verification result:', result); // Debug log
    
    if (result.success) {
      console.log('OTP verified successfully, closing modal and navigating...'); // Debug log
      setShowOTPModal(false);
      // Small delay to ensure auth state propagates
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } else {
      console.log('OTP verification failed:', result.message); // Debug log
      toast.error(result.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - YouTube Clone</title>
        <meta name="description" content="Sign in to your YouTube Clone account" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-youtube-red rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">YT</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-youtube-red hover:text-red-700"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input-field pr-10"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-youtube-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-youtube-red disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                {otpData?.verificationMethod === 'email' ? (
                  <Mail className="h-8 w-8 text-blue-600" />
                ) : (
                  <Shield className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Verify Your Identity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {otpData?.otpMethod || `We've sent a 6-digit code to your ${otpData?.verificationMethod === 'email' ? 'email' : 'phone'}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                🌍 Verification method determined by your location
              </p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="input-field text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOTPModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
