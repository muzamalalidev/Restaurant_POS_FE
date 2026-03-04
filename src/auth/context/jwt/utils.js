import axios from 'src/lib/axios';

import {
  JWT_STORAGE_KEY,
  USER_STORAGE_KEY,
  EXPIRES_AT_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

/**
 * Get refresh token from storage (for refresh endpoint). Do not expose in URLs or logs.
 */
export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

// ----------------------------------------------------------------------

/**
 * Get stored user from storage (from login/refresh response). Returns null if missing or invalid.
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------

/**
 * Get access token expiry (ISO string or null). Used for proactive refresh timer.
 */
export function getExpiresAt() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(EXPIRES_AT_STORAGE_KEY);
}

// ----------------------------------------------------------------------

/**
 * Clear all auth data from storage and remove Bearer from axios. Call on logout and when refresh returns 401.
 */
export function clearSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(EXPIRES_AT_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }
  delete axios.defaults.headers.common.Authorization;
}

// ----------------------------------------------------------------------

/**
 * Set session from login/refresh response or from single accessToken (legacy).
 * @param {string|object} accessTokenOrResponse - Access token string or full LoginResponse { accessToken, refreshToken?, expiresAt?, refreshTokenExpiresAt?, userId, email, userName?, roles?, permissions? }
 * @param {object} [opts] - If first arg is string: { refreshToken?, expiresAt?, user? }
 */
export async function setSession(accessTokenOrResponse, opts = {}) {
  try {
    if (!accessTokenOrResponse) {
      clearSession();
      return;
    }

    let accessToken;
    let refreshToken;
    let expiresAt;
    let user;

    if (typeof accessTokenOrResponse === 'string') {
      accessToken = accessTokenOrResponse;
      refreshToken = opts.refreshToken ?? null;
      expiresAt = opts.expiresAt ?? null;
      user = opts.user ?? null;
    } else {
      const res = accessTokenOrResponse;
      accessToken = res.accessToken ?? res.AccessToken;
      refreshToken = res.refreshToken ?? res.RefreshToken ?? null;
      expiresAt = res.expiresAt ?? res.ExpiresAt ?? null;
      const userId = res.userId ?? res.UserId;
      const email = res.email ?? res.Email;
      const userName = res.userName ?? res.UserName;
      const roles = res.roles ?? res.Roles ?? [];
      const permissions = res.permissions ?? res.Permissions ?? [];
      user = {
        id: userId,
        userId,
        email,
        displayName: userName ?? email,
        userName,
        roles,
        permissions,
      };
    }

    if (!accessToken) {
      clearSession();
      return;
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    if (refreshToken != null) {
      sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    } else {
      sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }

    if (expiresAt != null) {
      sessionStorage.setItem(EXPIRES_AT_STORAGE_KEY, expiresAt);
    } else {
      sessionStorage.removeItem(EXPIRES_AT_STORAGE_KEY);
    }

    if (user != null) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
