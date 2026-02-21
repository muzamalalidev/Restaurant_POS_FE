import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }) {
  return (
    <Typography
      component="div"
      variant="caption"
      sx={[
        { mt: 2.5, textAlign: 'center', color: 'text.secondary' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {'By signing up, I agree to '}
      <Link underline="always" color="text.primary">
        Terms of service
      </Link>
      {' and '}
      <Link underline="always" color="text.primary">
        Privacy policy
      </Link>
      .
    </Typography>
  );
}

