'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

import { getScopeDisplayName, getActiveStatusColor, getActiveStatusLabel } from '../utils/role-helpers';

// ----------------------------------------------------------------------

/**
 * Role Overview Tab
 * Read-only role details.
 */
export function RoleOverviewTab({ role }) {
  if (!role) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No role selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1">{role.name}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Scope
          </Typography>
          <Typography variant="body1">{getScopeDisplayName(role.scope)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Status
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Label color={getActiveStatusColor(role.isActive)} variant="soft">
              {getActiveStatusLabel(role.isActive)}
            </Label>
          </Box>
        </Box>
        {role.createdAt && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">{fDate(role.createdAt)}</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
