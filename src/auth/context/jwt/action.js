'use client';

import { paths } from 'src/routes/paths';

import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { setSession, clearSession, getRefreshToken } from './utils';

/** **************************************
 * Sign in
 *************************************** */

// ----------------------------------------------------------------------

export const signInWithPassword = async ({ email, password }) => {
  const params = { email: email?.trim?.(), password: password?.trim?.() };

  const res = await axios.post(endpoints.auth.login, params);
  const data = res.data;

  if (!data?.accessToken) {
    throw new Error('Access token not found in response');
  }

  await setSession(data);
  return data;
};

/** **************************************
 * Sign up
 *************************************** */

// ----------------------------------------------------------------------

export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  const res = await axios.post(endpoints.auth.signUp, params);
  const { accessToken } = res.data;

  if (!accessToken) {
    throw new Error('Access token not found in response');
  }

  await setSession({ ...res.data, accessToken });
};

/** **************************************
 * Refresh (internal: used by interceptor and proactive timer)
 *************************************** */

// ----------------------------------------------------------------------

let refreshPromise = null;

/**
 * Exchange refresh token for new tokens and user. Updates storage and axios header.
 * On 401 or failure: clears session and redirects to sign-in. Caller should not retry.
 * @returns {Promise<object|null>} LoginResponse shape or null if refresh failed (session cleared).
 */
export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken?.trim()) {
    clearSession();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await axios.post(endpoints.auth.refresh, {
        RefreshToken: refreshToken,
      });
      const data = res.data;
      if (!data?.accessToken) {
        clearSession();
        if (typeof window !== 'undefined') {
          window.location.href = paths.auth.signIn;
        }
        return null;
      }
      await setSession(data);
      return data;
    } catch (err) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = paths.auth.signIn;
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** **************************************
 * Sign out
 *************************************** */

// ----------------------------------------------------------------------

export const signOut = async () => {
  const token =
    typeof window !== 'undefined' ? sessionStorage.getItem(JWT_STORAGE_KEY) : null;

  if (token) {
    try {
      await axios.post(endpoints.auth.logout, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Still clear and let caller redirect (401, network, etc.)
    }
  }

  clearSession();
};
