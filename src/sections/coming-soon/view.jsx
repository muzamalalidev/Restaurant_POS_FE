'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function ComingSoonView() {
  return (
    <Box sx={{ textAlign: 'center', py: 15 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Coming Soon!
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        We are currently working on this page. Stay tuned!
      </Typography>
    </Box>
  );
}

