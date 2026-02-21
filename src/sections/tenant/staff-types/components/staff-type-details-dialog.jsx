'use client';

import { useMemo } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';

import { useGetStaffTypesQuery } from 'src/store/api/staff-types-api';

// ----------------------------------------------------------------------

/**
 * Staff Type Details Dialog Component
 * 
 * Read-only view of staff type details.
 * No action buttons - purely informational.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string|null} props.staffTypeId - Staff type ID
 * @param {Object|null} props.staffTypeData - Staff type data passed from list view (optimization)
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function StaffTypeDetailsDialog({ open, staffTypeId, staffTypeData: initialStaffTypeData, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Use staffTypeData passed from list view (P0-001 FIX: Avoid fetching 1000 records)
  // Fallback: If not provided, fetch with large page size (for backward compatibility)
  const shouldFetch = !initialStaffTypeData && staffTypeId && open;
  const { data: staffTypesResponse, isLoading, error: queryError, isError } = useGetStaffTypesQuery(
    { pageSize: 1000 },
    { skip: !shouldFetch }
  );

  // Find the staff type by ID from the response (fallback only)
  const fetchedStaffType = useMemo(() => {
    if (!staffTypesResponse || !staffTypeId) return null;
    const staffTypes = staffTypesResponse.data || [];
    return staffTypes.find((st) => st.id === staffTypeId) || null;
  }, [staffTypesResponse, staffTypeId]);

  // Use initialStaffTypeData if provided, otherwise use fetched data
  const staffType = initialStaffTypeData || fetchedStaffType;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Staff Type Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading staff type details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <Typography variant="body1" color="error">
            Failed to load staff type details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Network Error'}
          </Typography>
        </Box>
      ) : staffType ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Staff Type Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Staff Type Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{staffType.name}</Typography>
              </Box>
              {staffType.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{staffType.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={staffType.isActive ? 'success' : 'default'} variant="soft">
                    {staffType.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Staff type not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

