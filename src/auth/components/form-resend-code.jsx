import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function FormResendCode({ onResendCode, value, disabled, sx, ...other }) {
  return (
    <Box
      sx={[
        {
          mt: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          typography: 'body2',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {`Don't have a code? `}
      </Typography>

      <Link
        variant="subtitle2"
        onClick={onResendCode}
        sx={{
          ml: 0.5,
          cursor: 'pointer',
          ...(disabled && { color: 'text.disabled', pointerEvents: 'none' }),
        }}
      >
        Resend code {disabled && value > 0 ? `(${value}s)` : ''}
      </Link>
    </Box>
  );
}

