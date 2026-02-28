'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

/**
 * User Details Dialog Component
 *
 * Read-only view of user details. Uses the full row object passed from the list
 * (no getById or extra API calls).
 */
export function UserDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fullName = record
    ? `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-'
    : '-';

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="User Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  User Name
                </Typography>
                <Typography variant="body1">{record.userName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{record.email || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1">{fullName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1">{record.phoneNumber || '-'}</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Status */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Status
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Active Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={record.isActive ? 'success' : 'default'} variant="soft">
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email Confirmed
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label
                    color={record.emailConfirmed ? 'success' : 'default'}
                    variant="soft"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {record.emailConfirmed ? 'Confirmed' : 'Not Confirmed'}
                  </Label>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phone Confirmed
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label
                    color={record.phoneNumberConfirmed ? 'success' : 'default'}
                    variant="soft"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {record.phoneNumberConfirmed ? 'Confirmed' : 'Not Confirmed'}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Timestamps */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Timestamps
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {record.createdAt ? fDateTime(record.createdAt) : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Last Updated At
                </Typography>
                <Typography variant="body1">
                  {record.lastUpdatedAt ? fDateTime(record.lastUpdatedAt) : '-'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      ) : null}
    </CustomDialog>
  );
}

