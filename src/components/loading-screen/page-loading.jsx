'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

/**
 * Lightweight loading component for page transitions
 * Minimal bundle impact, consistent across all pages
 */
export function PageLoading({ sx, ...other }) {
  return (
    <Box
      sx={{
        width: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <CircularProgress />
    </Box>
  );
}

