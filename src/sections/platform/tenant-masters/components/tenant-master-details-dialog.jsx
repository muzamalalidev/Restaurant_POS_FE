'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetTenantMasterByIdQuery } from 'src/store/api/tenant-masters-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

import { getActiveStatusLabel, getActiveStatusColor } from '../utils/tenant-master-helpers';

// ----------------------------------------------------------------------

/**
 * Tenant Master Details Dialog
 * Read-only view; no actions (use list row actions for Edit/Toggle/Delete).
 */
export function TenantMasterDetailsDialog({ open, tenantMasterId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: tenantMaster, isLoading, error: queryError, isError, refetch } = useGetTenantMasterByIdQuery(tenantMasterId, {
    skip: !tenantMasterId || !open,
  });

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Tenant Master Details"
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
        loadingMessage="Loading tenant master details..."
        errorTitle="Failed to load tenant master details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load tenant master details',
          notFoundMessage: 'Tenant master not found',
        }}
        isEmpty={!tenantMaster && !isLoading && !isError}
        emptyMessage="Tenant master not found"
      >
        {tenantMaster ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          <Box>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{tenantMaster.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{tenantMaster.description || 'No description'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Owner
                </Typography>
                <Typography variant="body1">{tenantMaster.ownerId ?? 'No owner assigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getActiveStatusColor(tenantMaster.isActive)} variant="soft">
                    {getActiveStatusLabel(tenantMaster.isActive)}
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
