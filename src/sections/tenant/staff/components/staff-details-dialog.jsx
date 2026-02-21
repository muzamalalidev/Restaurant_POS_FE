'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';

import { useGetStaffQuery } from 'src/store/api/staff-api';
import { useGetBranchesQuery } from 'src/store/api/branches-api';

// ----------------------------------------------------------------------

/**
 * Staff Details Dialog Component
 * 
 * Read-only view of staff member details.
 * No action buttons - purely informational.
 * 
 * Note: Since GetById is a placeholder, we use GetAll to find the staff member by ID.
 */
export function StaffDetailsDialog({ open, staffId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch all staff to find the one for details view (due to GetById placeholder)
  const { data: staffResponse, isLoading, error: queryError, isError } = useGetStaffQuery(
    { pageSize: 1000 }, // Fetch all to find by ID
    { skip: !staffId || !open }
  );

  // Fetch branches to get branch name
  const { data: branchesResponse } = useGetBranchesQuery({
    pageSize: 1000,
  });

  const staff = useMemo(() => {
    if (staffId && staffResponse?.data) {
      return staffResponse.data.find((s) => s.id === staffId);
    }
    return null;
  }, [staffId, staffResponse]);

  // Find branch name
  const branchName = useMemo(() => {
    if (!staff?.branchId || !branchesResponse?.data) return null;
    const branch = branchesResponse.data.find((b) => b.id === staff.branchId);
    return branch?.name || null;
  }, [staff?.branchId, branchesResponse]);

  // Format date for display
  const formatDate = useMemo(() => {
    return (dateString) => {
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
    };
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
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading staff member details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <Typography variant="body1" color="error">
            Failed to load staff member details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Network Error'}
          </Typography>
        </Box>
      ) : staff ? (
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
                <Typography variant="body1">{branchName || staff.branchId || '-'}</Typography>
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
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Staff member not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

