import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

// External API baseURL (for external services)
const externalBaseURL = CONFIG.serverUrl?.trim() || '';

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 *
 * Handles routing for internal vs external API calls:
 * - If serverUrl is configured: All /api/* routes use external serverUrl
 * - If serverUrl is not configured: /api/* routes use relative URL (same origin)
 * - Absolute URLs (http:// or https://): Don't modify
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const url = config.url || '';

    // Absolute URL provided - don't modify
    if (url.startsWith('http://') || url.startsWith('https://')) {
      config.baseURL = '';
    } else if (url.startsWith('/api/')) {
      // API routes: use external serverUrl if configured, otherwise relative
      if (externalBaseURL) {
        config.baseURL = externalBaseURL;
      } else {
        config.baseURL = '';
      }
    } else if (externalBaseURL) {
      // External relative route - prepend configured serverUrl
      config.baseURL = externalBaseURL;
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong!';
    console.error('Axios error:', message);
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',

  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },

  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },

  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },

  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
