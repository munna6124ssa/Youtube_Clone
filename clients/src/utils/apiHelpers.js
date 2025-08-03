import toast from 'react-hot-toast';

/**
 * Utility function to handle API calls with graceful error handling
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Promise} - Promise that resolves with data or null on error
 */
export const safeApiCall = async (apiCall, options = {}) => {
  const {
    showSuccessToast = false,
    successMessage = 'Operation successful',
    showErrorToast = true,
    errorMessage = 'Operation failed',
    fallbackValue = null,
    onSuccess = null,
    onError = null,
  } = options;

  try {
    const response = await apiCall();
    
    if (showSuccessToast) {
      toast.success(successMessage);
    }
    
    if (onSuccess) {
      onSuccess(response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('API call failed:', error.message);
    
    // Only show error toast if it's not a network error (API interceptor handles those)
    // and if showErrorToast is true
    if (showErrorToast && error.response) {
      toast.error(errorMessage);
    }
    
    if (onError) {
      onError(error);
    }
    
    return fallbackValue;
  }
};

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Check if an error is a network error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

/**
 * Get a user-friendly error message from an API error
 * @param {Error} error - The API error
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 404) {
    return 'Resource not found';
  }
  
  if (error.response?.status === 500) {
    return 'Server error occurred';
  }
  
  if (isNetworkError(error)) {
    return 'Network connection failed';
  }
  
  return 'An unexpected error occurred';
};
