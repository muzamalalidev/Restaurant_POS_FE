'use client';

import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';
import { Field } from 'src/components/hook-form';

import { useGetTenantMasterByIdQuery } from 'src/store/api/tenant-masters-api';
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
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading tenant master details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <Typography variant="body1" color="error">
            Failed to load tenant master details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.data?.detail || queryError?.message || 'Network Error'}
          </Typography>
          <Field.Button variant="contained" onClick={() => refetch()} startIcon="solar:refresh-bold">
            Retry
          </Field.Button>
        </Box>
      ) : tenantMaster ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {tenantMaster.id}
                </Typography>
              </Box>
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
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Tenant master not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}
