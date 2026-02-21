import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function FormSocials({ signInWithGoogle, singInWithGithub, signInWithTwitter, ...other }) {
  return (
    <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }} {...other}>
      <Button
        fullWidth
        variant="outlined"
        size="large"
        color="inherit"
        startIcon={<Iconify icon="socials:google" width={22} />}
        onClick={signInWithGoogle}
        sx={{ justifyContent: 'center' }}
      >
        Continue with Google
      </Button>

      <Button
        fullWidth
        variant="outlined"
        size="large"
        color="inherit"
        startIcon={<Iconify icon="socials:github" width={22} />}
        onClick={singInWithGithub}
        sx={{ justifyContent: 'center' }}
      >
        Continue with Github
      </Button>

      <Button
        fullWidth
        variant="outlined"
        size="large"
        color="inherit"
        startIcon={<Iconify icon="socials:twitter" width={22} />}
        onClick={signInWithTwitter}
        sx={{ justifyContent: 'center' }}
      >
        Continue with Twitter
      </Button>
    </Box>
  );
}

