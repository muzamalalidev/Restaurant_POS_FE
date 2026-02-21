'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

function PlaceholderView({ title }) {
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
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        This is a placeholder view. Replace with your actual implementation.
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function AccountGeneralView() {
  return <PlaceholderView title="Account General" />;
}

export function AccountBillingView() {
  return <PlaceholderView title="Account Billing" />;
}

export function AccountSocialsView() {
  return <PlaceholderView title="Account Socials" />;
}

export function AccountNotificationsView() {
  return <PlaceholderView title="Account Notifications" />;
}

export function AccountChangePasswordView() {
  return <PlaceholderView title="Change Password" />;
}

