'use client';

import { useMemo } from 'react';

import { can } from 'src/utils/permissions';

import { useAuthContext } from 'src/auth/hooks';

import { navData as baseNavData } from './nav-config-dashboard';

// ----------------------------------------------------------------------

/**
 * Filters nav sections to only include items the user has permission to see.
 * Items with requiredPermission === null are shown to any authenticated user.
 * Sections with zero items after filtering are excluded.
 */
function filterNavDataByPermission(navData, canFn) {
  if (!Array.isArray(navData)) return [];
  return navData
    .map((section) => {
      const filteredItems = (section.items ?? []).filter(
        (item) => item.requiredPermission == null || canFn(item.requiredPermission)
      );
      return filteredItems.length > 0 ? { ...section, items: filteredItems } : null;
    })
    .filter(Boolean);
}

export function useDynamicNavData() {
  const { user } = useAuthContext();
  return useMemo(
    () => filterNavDataByPermission(baseNavData, can),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Recompute when auth changes so nav reflects current permissions
    [user?.id, user?.permissions]
  );
}
