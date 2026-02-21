import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export function CompanyLogosMarquee({ sx, ...other }) {
  return <Box sx={[{ py: 3 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other} />;
}
