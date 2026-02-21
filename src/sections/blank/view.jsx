'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function BlankView({ title = 'Blank' }) {
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
      <Typography variant="h5">{title}</Typography>
    </Box>
  );
}

