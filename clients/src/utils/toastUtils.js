import toast from 'react-hot-toast';

// Common toast messages for consistent UX
export const toastMessages = {
  // Authentication
  loginSuccess: () => toast.success('Welcome back! 🎉'),
  loginFailed: (message = 'Login failed') => toast.error(message),
  registerSuccess: () => toast.success('Account created successfully! Welcome aboard! 🚀'),
  registerFailed: (message = 'Registration failed') => toast.error(message),
  logoutSuccess: () => toast.success('Logged out successfully! See you soon! 👋'),
  otpSent: () => toast.success('OTP sent! Please check your message 📱'),
  otpVerified: () => toast.success('Verified successfully! 🎉'),
  otpFailed: (message = 'Invalid OTP') => toast.error(message),

  // General actions
  copySuccess: (item = 'Link') => toast.success(`${item} copied to clipboard! 📋`),
  copyFailed: () => toast.error('Failed to copy to clipboard'),
  saveSuccess: (item = 'Data') => toast.success(`${item} saved successfully! ✅`),
  saveFailed: (item = 'Data') => toast.error(`Failed to save ${item.toLowerCase()}`),
  deleteSuccess: (item = 'Item') => toast.success(`${item} deleted successfully! 🗑️`),
  deleteFailed: (item = 'Item') => toast.error(`Failed to delete ${item.toLowerCase()}`),

  // Network/Loading - DISABLED to prevent spam
  networkError: () => {
    // Network errors are now handled silently
    console.warn('Network error detected (toast disabled to prevent spam)');
  },
  loadingFailed: (item = 'data') => toast.error(`Failed to load ${item}`),
  serverError: () => toast.error('Server error. Please try again later 🔧'),

  // Form validation
  formError: (field) => toast.error(`Please fill in the ${field} field correctly`),
  emailInvalid: () => toast.error('Please enter a valid email address 📧'),
  passwordWeak: () => toast.error('Password must be at least 6 characters long 🔐'),
  phoneInvalid: () => toast.error('Please enter a valid phone number 📱'),

  // Video actions
  videoLiked: () => toast.success('Liked! ❤️'),
  videoDisliked: () => toast.success('Disliked! 👎'),
  videoLikeFailed: () => toast.error('Failed to like video'),
  videoSubscribed: () => toast.success('Subscribed! 🔔'),
  videoUnsubscribed: () => toast.success('Unsubscribed! 🔕'),
  videoSubscribeFailed: () => toast.error('Failed to subscribe'),

  // Comments
  commentAdded: () => toast.success('Comment added! 💬'),
  commentFailed: () => toast.error('Failed to add comment'),
  commentTranslated: () => toast.success('Comment translated! 🌍'),
  commentTranslateFailed: () => toast.error('Translation failed'),
  replyAdded: () => toast.success('Reply added! 💬'),

  // Groups
  groupJoined: () => toast.success('Joined group! 👥'),
  groupLeft: () => toast.success('Left group successfully'),
  groupCreated: () => toast.success('Group created! 🎉'),
  groupFailed: (action = 'action') => toast.error(`Failed to ${action} group`),
  inviteSent: () => toast.success('Invitation sent! 📨'),
  inviteFailed: () => toast.error('Failed to send invitation'),

  // Permissions
  loginRequired: () => toast.error('Please login to continue 🔐'),
  unauthorizedAction: () => toast.error('You are not authorized to perform this action'),

  // Custom messages with loading
  withLoading: {
    login: () => toast.loading('Signing you in...'),
    register: () => toast.loading('Creating your account...'),
    verifyOTP: () => toast.loading('Verifying your code...'),
    loading: (action = 'Loading') => toast.loading(`${action}...`),
    saving: (item = 'Saving') => toast.loading(`${item}...`),
    processing: () => toast.loading('Processing...'),
  }
};

// Utility function to dismiss loading toast and show result
export const dismissAndShow = (loadingToast, resultToast) => {
  toast.dismiss(loadingToast);
  resultToast();
};

// Quick success/error with emoji
export const quickToast = {
  success: (message, emoji = '✅') => toast.success(`${message} ${emoji}`),
  error: (message, emoji = '❌') => toast.error(`${message} ${emoji}`),
  info: (message, emoji = 'ℹ️') => toast(message + ' ' + emoji),
  warning: (message, emoji = '⚠️') => toast(message + ' ' + emoji, {
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
  }),
};

export default toastMessages;
