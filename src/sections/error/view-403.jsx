'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export function View403() {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        403 - Forbidden
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
        You do not have permission to access this page.
      </Typography>

      <Button component={RouterLink} href="/" size="large" variant="contained">
        Go to Home
      </Button>
    </Box>
  );
}

