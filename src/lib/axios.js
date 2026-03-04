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

    // Handle FormData: remove Content-Type so browser can set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
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
 * - On 401: try refresh once (unless this was the refresh request), then retry original request.
 * - Refresh failure: refreshSession() clears and redirects to sign-in.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config;
    const isRefreshRequest =
      config?.url?.includes('/auth/refresh') || config?.url?.endsWith?.('refresh');

    if (status === 401 && config && !isRefreshRequest && !config._retry) {
      const { getRefreshToken } = await import('src/auth/context/jwt/utils');
      const refreshToken = getRefreshToken();
      if (refreshToken?.trim()) {
        try {
          const { refreshSession } = await import('src/auth/context/jwt/action');
          const data = await refreshSession();
          if (data?.accessToken) {
            config._retry = true;
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${data.accessToken}`;
            return axiosInstance(config);
          }
        } catch {
          return Promise.reject(error);
        }
      }
    }

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error.response.data : null) ||
      error?.message ||
      'Something went wrong!';
    const errWithStatus = new Error(message);
    errWithStatus.status = status;
    errWithStatus.data = error?.response?.data;
    errWithStatus.response = error?.response;
    return Promise.reject(errWithStatus);
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
    login: '/api/auth/login',
    me: '/api/auth/me',
    permissions: '/api/auth/permissions',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    signIn: '/api/auth/login',
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
