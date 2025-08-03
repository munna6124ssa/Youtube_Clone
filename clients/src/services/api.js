import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track recent error toasts to prevent spam
const recentErrors = new Set();
const clearErrorAfter = (key, delay = 5000) => {
  setTimeout(() => recentErrors.delete(key), delay);
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error intercepted:', error.config?.url, error.response?.status); // Debug log
    
    // Don't show toasts for certain endpoints or during initialization
    const silentEndpoints = ['/theme', '/auth/me', '/videos'];
    const isSilentCall = silentEndpoints.some(endpoint => error.config?.url?.includes(endpoint));
    
    if (error.response?.status === 401) {
      // Only show session expired for non-auth endpoints
      if (!error.config?.url?.includes('/auth/') && !isSilentCall) {
        const errorKey = 'session-expired';
        if (!recentErrors.has(errorKey)) {
          recentErrors.add(errorKey);
          toast.error('Session expired. Please login again 🔐');
          clearErrorAfter(errorKey);
          Cookies.remove('token');
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status >= 500) {
      // Server errors - only for non-silent endpoints
      const errorKey = `server-error-${error.config?.url}`;
      if (!recentErrors.has(errorKey) && !isSilentCall) {
        recentErrors.add(errorKey);
        toast.error('Server error. Please try again later 🔧');
        clearErrorAfter(errorKey);
      }
    } else if (!error.response) {
      // Network errors - COMPLETELY DISABLED - handle silently
      console.warn('Network error detected (handled silently):', error.config?.url);
      // No toast notification for network errors
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getProfile: () => api.get('/auth/me'),
};

// Videos API
export const videosAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  getVideo: (videoId) => api.get(`/videos/${videoId}`),
  likeVideo: (videoId) => api.post(`/videos/${videoId}/like`),
  dislikeVideo: (videoId) => api.post(`/videos/${videoId}/dislike`),
};

// Comments API
export const commentsAPI = {
  getComments: (videoId, params) => api.get(`/comments/${videoId}`, { params }),
  addComment: (data) => api.post('/comments', data),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  dislikeComment: (commentId) => api.post(`/comments/${commentId}/dislike`),
  translateComment: (commentId, targetLanguage) => 
    api.post(`/comments/${commentId}/translate`, { targetLanguage }),
  addReply: (commentId, content) => 
    api.post(`/comments/${commentId}/reply`, { content }),
};

// Groups API
export const groupsAPI = {
  getGroups: (params) => api.get('/groups', { params }),
  createGroup: (data) => api.post('/groups', data),
  getGroup: (groupId) => api.get(`/groups/${groupId}`),
  joinGroup: (groupId) => api.post(`/groups/${groupId}/join`),
  leaveGroup: (groupId) => api.post(`/groups/${groupId}/leave`),
  inviteUser: (groupId, username) => 
    api.post(`/groups/${groupId}/invite`, { username }),
  getUserGroups: () => api.get('/groups/user/my-groups'),
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  getGroupInvitations: (groupId) => api.get(`/groups/${groupId}/invitations`),
};

// Users API
export const usersAPI = {
  getUser: (userId) => api.get(`/users/${userId}`),
  subscribe: (userId) => api.post(`/users/${userId}/subscribe`),
  searchUsers: (query) => api.get(`/users/search/${query}`),
};

// Theme API
export const themeAPI = {
  getTheme: () => api.get('/theme'),
  setThemePreference: (theme) => api.post('/theme/preference', { theme }),
};

export default api;
