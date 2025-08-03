import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, User, Mail, Phone, Video, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import VerificationCard from '../components/Auth/VerificationCard';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();

  // Indian states list
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu'
  ];

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure auth state is stable
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      console.log('Registration data:', data); // Debug log
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      console.log('Response:', responseData); // Debug log

      if (!response.ok) {
        if (responseData.errors && responseData.errors.length > 0) {
          // Show validation errors
          responseData.errors.forEach(error => {
            toast.error(`${error.path}: ${error.msg}`);
          });
          throw new Error('Validation failed');
        }
        throw new Error(responseData.message || 'Registration failed');
      }

      if (responseData.requiresVerification) {
        // Show verification screen
        setRegistrationData({
          ...responseData,
          originalEmail: data.email // Add the original email from the form
        });
        setShowVerification(true);
        toast.success(responseData.message);
      } else {
        // Direct registration success (shouldn't happen with new flow)
        toast.success('Registration successful!');
        setTimeout(() => {
          navigate('/');
        }, 100);
      }
    } catch (error) {
      console.error('Registration error:', error.message);
      // Only show error toast if it's not a network error
      if (error.message && !error.message.includes('fetch')) {
        toast.error(error.message || 'Registration failed');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  const handleBackToRegister = () => {
    setShowVerification(false);
    setRegistrationData(null);
  };

  // Show verification screen if needed
  if (showVerification && registrationData) {
    return (
      <VerificationCard 
        registrationData={registrationData}
        onBack={handleBackToRegister}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Account - YouTube Clone</title>
        <meta name="description" content="Create your YouTube Clone account" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-youtube-red rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">YT</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-youtube-red hover:text-red-700"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      },
                      maxLength: {
                        value: 30,
                        message: 'Username must be less than 30 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores'
                      }
                    })}
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    className="input-field pl-10"
                    placeholder="Username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
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
                    className="input-field pl-10"
                    placeholder="Email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone number (required for OTP verification)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone', {
                      required: 'Phone number is required for OTP verification',
                      pattern: {
                        value: /^[0-9+\-\s()]{10,15}$/,
                        message: 'Please provide a valid phone number (10-15 digits)'
                      }
                    })}
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className="input-field pl-10"
                    placeholder="Phone number (required for OTP verification)"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  📱 <strong>Required:</strong> Valid phone number needed for SMS OTP verification during registration
                </p>
              </div>

              <div>
                <label htmlFor="channelName" className="sr-only">
                  Channel name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Video className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('channelName', {
                      required: 'Channel name is required',
                      minLength: {
                        value: 1,
                        message: 'Channel name is required'
                      },
                      maxLength: {
                        value: 50,
                        message: 'Channel name must be less than 50 characters'
                      }
                    })}
                    id="channelName"
                    name="channelName"
                    type="text"
                    autoComplete="organization"
                    className="input-field pl-10"
                    placeholder="Channel name"
                  />
                </div>
                {errors.channelName && (
                  <p className="mt-1 text-sm text-red-600">{errors.channelName.message}</p>
                )}
              </div>

              {/* Location Fields */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📍 Location Information (Required for theme and OTP preferences)
                </div>
                
                <div>
                  <label htmlFor="state" className="sr-only">
                    State
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      {...register('state', {
                        required: 'State is required'
                      })}
                      id="state"
                      name="state"
                      autoComplete="address-level1"
                      className="input-field pl-10"
                    >
                      <option value="">Select your state</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="sr-only">
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('city', {
                        required: 'City is required',
                        minLength: {
                          value: 2,
                          message: 'City name must be at least 2 characters'
                        }
                      })}
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      className="input-field pl-10"
                      placeholder="Your city"
                    />
                  </div>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
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
                    autoComplete="new-password"
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
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-youtube-red hover:text-red-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-youtube-red hover:text-red-700">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
