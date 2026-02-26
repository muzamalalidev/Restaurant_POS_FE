'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetStaffTypesQuery } from 'src/store/api/staff-types-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

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
  const { data: staffTypesResponse, isLoading, error: queryError, isError, refetch } = useGetStaffTypesQuery(
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
      <QueryStateContent
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        loadingMessage="Loading staff type details..."
        errorTitle="Failed to load staff type details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load staff type details',
          notFoundMessage: 'Staff type not found',
        }}
        isEmpty={!staffType && !isLoading && !isError}
        emptyMessage="Staff type not found"
      >
        {staffType ? (
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
        ) : null}
      </QueryStateContent>
    </CustomDialog>
  );
}

