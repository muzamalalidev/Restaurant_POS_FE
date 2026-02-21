'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function PermissionDeniedView() {
  return (
    <Box
      sx={{
        p: 5,
        width: 1,
        borderRadius: 2,
        bgcolor: 'background.neutral',
        border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Typography variant="h5">Permission Denied</Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        You do not have permission to access this resource.
      </Typography>
    </Box>
  );
}

