'use client';

import { navData as baseNavData } from './nav-config-dashboard';

// ----------------------------------------------------------------------

export function useDynamicNavData() {
  // Return base nav data - can be extended with dynamic items if needed
  return baseNavData;
}
