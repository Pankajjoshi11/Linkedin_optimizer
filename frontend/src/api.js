import axios from 'axios';
import config from './config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 300000, // 5 minutes for file uploads and AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      console.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export default api;
