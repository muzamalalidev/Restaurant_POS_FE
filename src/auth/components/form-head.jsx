import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function FormHead({ icon, title, description, sx, ...other }) {
  return (
    <Box
      sx={[
        {
          mb: 5,
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          ...(icon && { textAlign: 'center', alignItems: 'center' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {icon && <Box sx={{ width: 96, height: 96 }}>{icon}</Box>}

      <Typography variant="h5">{title}</Typography>

      {description && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

