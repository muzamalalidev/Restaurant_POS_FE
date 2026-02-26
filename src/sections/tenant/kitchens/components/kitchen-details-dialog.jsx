'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetTenantsQuery } from 'src/store/api/tenants-api';
import { useGetBranchesQuery } from 'src/store/api/branches-api';
import { useGetKitchenByIdQuery } from 'src/store/api/kitchens-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

import { getActiveStatusLabel, getActiveStatusColor } from '../utils/kitchen-helpers';

// ----------------------------------------------------------------------

/**
 * Kitchen Details Dialog Component
 * 
 * Read-only view of kitchen details.
 * No action buttons - purely informational.
 * 
 * Note: GetById endpoint is FULLY IMPLEMENTED (not a placeholder).
 * Can be used directly for fetching kitchen details.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string|null} props.kitchenId - Kitchen ID
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function KitchenDetailsDialog({ open, kitchenId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch kitchen using GetById (full implementation)
  const { data: kitchen, isLoading: isLoadingKitchen, error: queryError, isError, refetch } = useGetKitchenByIdQuery(
    kitchenId,
    { skip: !kitchenId || !open }
  );

  // Fetch tenants/branches for display names (P0-003: limit 200)
  const { data: tenantsResponse, isLoading: isLoadingTenants } = useGetTenantsQuery({ pageSize: 200 });
  const allTenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);

  const { data: branchesResponse, isLoading: isLoadingBranches } = useGetBranchesQuery({ pageSize: 200 });
  const allBranches = useMemo(() => branchesResponse?.data || [], [branchesResponse]);

  // Helper to get tenant name for display
  const getTenantName = useCallback(
    (tenantId) => {
      const tenant = allTenants.find((t) => t.id === tenantId);
      return tenant?.name || 'Unknown Tenant';
    },
    [allTenants]
  );

  // Helper to get branch name for display
  const getBranchName = useCallback(
    (branchId) => {
      const branch = allBranches.find((b) => b.id === branchId);
      return branch?.name || 'Unknown Branch';
    },
    [allBranches]
  );

  const isLoading = isLoadingKitchen || isLoadingTenants || isLoadingBranches;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Kitchen Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      <QueryStateContent
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        loadingMessage="Loading kitchen details..."
        errorTitle="Failed to load kitchen details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load kitchen details',
          notFoundMessage: 'Kitchen not found or has been deleted',
        }}
        isEmpty={!kitchen && !isLoading && !isError}
        emptyMessage="Kitchen not found"
      >
        {kitchen ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Kitchen Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Kitchen Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Kitchen Name
                </Typography>
                <Typography variant="body1">{kitchen.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant
                </Typography>
                <Typography variant="body1">{getTenantName(kitchen.tenantId)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch
                </Typography>
                <Typography variant="body1">{getBranchName(kitchen.branchId)}</Typography>
              </Box>
              {kitchen.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {kitchen.description}
                  </Typography>
                </Box>
              )}
              {kitchen.location && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{kitchen.location}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Status */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Status
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Label color={getActiveStatusColor(kitchen.isActive)} variant="soft">
                  {getActiveStatusLabel(kitchen.isActive)}
                </Label>
              </Box>
            </Box>
          </Box>
        </Box>
        ) : null}
      </QueryStateContent>
    </CustomDialog>
  );
}

