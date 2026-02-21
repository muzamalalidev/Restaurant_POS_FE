'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export function NotFoundView() {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        404 - Page Not Found
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
        The page you are looking for does not exist.
      </Typography>

      <Button component={RouterLink} href="/" size="large" variant="contained">
        Go to Home
      </Button>
    </Box>
  );
}

