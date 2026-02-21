'use client';

import { useRef, useEffect } from 'react';

import Box from '@mui/material/Box';

import { PORTAL_TARGET_ID, useBreadcrumbsPortal } from './breadcrumbs-context';

// ----------------------------------------------------------------------

export function BreadcrumbsPortalTarget({ sx, ...other }) {
  const ref = useRef(null);
  const { registerPortalTarget } = useBreadcrumbsPortal();

  useEffect(() => {
    if (ref.current) {
      registerPortalTarget(ref.current);
    }

    return () => {
      registerPortalTarget(null);
    };
  }, [registerPortalTarget]);

  return (
    <Box
      ref={ref}
      id={PORTAL_TARGET_ID}
      sx={[
        {
          display: 'flex',
          flex: '1 1 auto',
          alignItems: 'center',
          minWidth: 0, // Allow text truncation
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}
