'use client';

import { Provider } from 'react-redux';

import { store } from './index';

// ----------------------------------------------------------------------

/**
 * Redux Provider Component
 * 
 * This provider should be added to the layout.
 * It works alongside existing Context API providers.
 * 
 * Existing Context API + SWR implementations are NOT affected.
 */
export function ReduxProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}

