'use client';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Details Dialog Component
 *
 * Read-only view using record from list (no getById).
 * Branch name: use record.branchName if present, otherwise record.branchId.
 */
export function StaffDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    const formatted = fDate(dateString, 'DD MMMM YYYY');
    return formatted === 'Invalid date' ? '-' : formatted;
  }, []);

  const branchDisplay = record?.branchName ?? record?.branchId ?? '-';

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Staff Member Details"
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
                  Full Name
                </Typography>
                <Typography variant="body1">
                  {`${record.firstName || ''} ${record.lastName || ''}`.trim() || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Staff Type
                </Typography>
                <Typography variant="body1">{record.staffTypeName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch
                </Typography>
                <Typography variant="body1">{branchDisplay}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={record.isActive ? 'success' : 'default'} variant="soft">
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Contact Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Contact Information
            </Typography>
            <Stack spacing={2}>
              {record.email && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{record.email}</Typography>
                </Box>
              )}
              {record.phone && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{record.phone}</Typography>
                </Box>
              )}
              {record.address && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">{record.address}</Typography>
                </Box>
              )}
              {!record.email && !record.phone && !record.address && (
                <Typography variant="body2" color="text.secondary">
                  No contact information available
                </Typography>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Additional Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Additional Information
            </Typography>
            <Stack spacing={2}>
              {record.hireDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Hire Date
                  </Typography>
                  <Typography variant="body1">{formatDate(record.hireDate)}</Typography>
                </Box>
              )}
              {record.userId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1">{record.userId}</Typography>
                </Box>
              )}
              {!record.hireDate && !record.userId && (
                <Typography variant="body2" color="text.secondary">
                  No additional information available
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      ) : null}
    </CustomDialog>
  );
}
