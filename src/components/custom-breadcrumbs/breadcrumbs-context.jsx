'use client';

import { useMemo, useState, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------

const BreadcrumbsContext = createContext(null);

const PORTAL_TARGET_ID = 'breadcrumbs-portal-target';

// ----------------------------------------------------------------------

export function BreadcrumbsPortalProvider({ children }) {
  const [portalTarget, setPortalTarget] = useState(null);

  const registerPortalTarget = useCallback((element) => {
    setPortalTarget(element);
  }, []);

  const value = useMemo(
    () => ({
      portalTarget,
      portalTargetId: PORTAL_TARGET_ID,
      registerPortalTarget,
    }),
    [portalTarget, registerPortalTarget]
  );

  return <BreadcrumbsContext.Provider value={value}>{children}</BreadcrumbsContext.Provider>;
}

// ----------------------------------------------------------------------

export function useBreadcrumbsPortal() {
  const context = useContext(BreadcrumbsContext);

  if (!context) {
    // Return safe defaults when used outside provider (backwards compatibility)
    return {
      portalTarget: null,
      portalTargetId: PORTAL_TARGET_ID,
      registerPortalTarget: () => {},
    };
  }

  return context;
}

// ----------------------------------------------------------------------

export { PORTAL_TARGET_ID };
