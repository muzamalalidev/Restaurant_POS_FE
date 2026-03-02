'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useEffect, useCallback } from 'react';

import { refreshSession } from './action';
import { AuthContext } from '../auth-context';
import { getExpiresAt, isValidToken, getStoredUser } from './utils';
import { JWT_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from './constant';

// Proactive refresh: run refresh this many ms before access token expires
const REFRESH_BEFORE_MS = 2 * 60 * 1000;

// ----------------------------------------------------------------------

function parseExpiresAt(expiresAt) {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) ? t : null;
}

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });
  const refreshTimerRef = useRef(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleProactiveRefresh = useCallback(() => {
    clearRefreshTimer();
    if (typeof window === 'undefined') return;

    const expiresAt = getExpiresAt();
    const expiresMs = parseExpiresAt(expiresAt);
    if (!expiresMs) return;

    const now = Date.now();
    const delay = Math.max(0, expiresMs - now - REFRESH_BEFORE_MS);

    refreshTimerRef.current = setTimeout(async () => {
      refreshTimerRef.current = null;
      try {
        const data = await refreshSession();
        if (data) {
          const user = {
            id: data.userId,
            userId: data.userId,
            email: data.email,
            displayName: data.userName ?? data.email,
            userName: data.userName,
            roles: data.roles ?? [],
            permissions: data.permissions ?? [],
          };
          setState({ user: { ...user, accessToken: data.accessToken } });
          scheduleProactiveRefresh();
        }
      } catch {
        setState({ user: null });
      }
    }, delay);
  }, [clearRefreshTimer, setState]);

  const checkUserSession = useCallback(async () => {
    if (typeof window === 'undefined') {
      setState({ user: null, loading: false });
      return;
    }

    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        const user = getStoredUser();
        setState({
          user: user ? { ...user, accessToken } : null,
          loading: false,
        });
        scheduleProactiveRefresh();
        return;
      }

      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (refreshToken?.trim()) {
        try {
          const data = await refreshSession();
          if (data) {
            const user = {
              id: data.userId,
              userId: data.userId,
              email: data.email,
              displayName: data.userName ?? data.email,
              userName: data.userName,
              roles: data.roles ?? [],
              permissions: data.permissions ?? [],
            };
            setState({ user: { ...user, accessToken: data.accessToken }, loading: false });
            scheduleProactiveRefresh();
            return;
          }
        } catch {
          setState({ user: null, loading: false });
          return;
        }
      }

      setState({ user: null, loading: false });
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState, scheduleProactiveRefresh]);

  useEffect(() => {
    checkUserSession();
    return clearRefreshTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'admin' } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
}
