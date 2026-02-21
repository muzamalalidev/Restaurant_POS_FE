'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export function View500() {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        500 - Internal Server Error
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
        Something went wrong on our end. Please try again later.
      </Typography>

      <Button component={RouterLink} href="/" size="large" variant="contained">
        Go to Home
      </Button>
    </Box>
  );
}

