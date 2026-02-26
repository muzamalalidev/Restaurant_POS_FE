'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetStaffByIdQuery } from 'src/store/api/staff-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

// ----------------------------------------------------------------------

/**
 * Staff Details Dialog Component
 *
 * Read-only view of staff member details.
 * No action buttons - purely informational.
 * Branch name is expected from getStaffById response (e.g. staff.branchName).
 */
export function StaffDetailsDialog({ open, staffId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: staff, isLoading, error: queryError, isError, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId || !open,
  });

  // Format date for display
  const formatDate = useMemo(() => (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return dateString;
      }
    }, []);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Staff Member Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      <QueryStateContent
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        loadingMessage="Loading staff member details..."
        errorTitle="Failed to load staff member details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load staff details',
          notFoundMessage: 'Staff not found',
        }}
        isEmpty={!staff && !isLoading && !isError}
        emptyMessage="Staff member not found"
      >
        {staff ? (
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
                  {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Staff Type
                </Typography>
                <Typography variant="body1">{staff.staffTypeName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch
                </Typography>
                <Typography variant="body1">{staff.branchName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={staff.isActive ? 'success' : 'default'} variant="soft">
                    {staff.isActive ? 'Active' : 'Inactive'}
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
              {staff.email && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{staff.email}</Typography>
                </Box>
              )}
              {staff.phone && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{staff.phone}</Typography>
                </Box>
              )}
              {staff.address && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">{staff.address}</Typography>
                </Box>
              )}
              {!staff.email && !staff.phone && !staff.address && (
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
              {staff.hireDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Hire Date
                  </Typography>
                  <Typography variant="body1">{formatDate(staff.hireDate)}</Typography>
                </Box>
              )}
              {staff.userId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1">{staff.userId}</Typography>
                </Box>
              )}
              {!staff.hireDate && !staff.userId && (
                <Typography variant="body2" color="text.secondary">
                  No additional information available
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
        ) : null}
      </QueryStateContent>
    </CustomDialog>
  );
}

