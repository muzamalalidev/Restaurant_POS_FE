import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { _mock } from 'src/_mock';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function NavUpgradeSupabase({ sx, ...other }) {
  const { user, loading } = useAuthContext();

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.displayName || user?.email || 'Account';
  const email = user?.email || '';

  if (loading) {
    return (
      <Box sx={[{ px: 2, py: 5, textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
      </Box>
    );
  }

  return (
    <Box sx={[{ px: 2, py: 5, textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar src={user?.photoURL || _mock.image.avatar(24)} alt={displayName} sx={{ width: 48, height: 48 }}>
            {displayName?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Box>

        <Typography variant="h6" sx={{ mt: 2, mb: 0.5 }}>
          {displayName}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {email}
        </Typography>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:star-bold-duotone" />}
          sx={{ mb: 2 }}
        >
          Upgrade to Pro
        </Button>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Get unlimited access to all features
        </Typography>
      </Box>
    </Box>
  );
}
