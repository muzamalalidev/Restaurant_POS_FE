'use client';

import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';

import { useGetTenantByIdQuery } from 'src/store/api/tenants-api';

// ----------------------------------------------------------------------

/**
 * Tenant Details Dialog Component
 * 
 * Read-only view of tenant details.
 */
export function TenantDetailsDialog({ open, tenantId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch tenant data
  const { data: tenant, isLoading, error: queryError, isError } = useGetTenantByIdQuery(tenantId, {
    skip: !tenantId || !open,
  });

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Tenant Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading tenant details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <Typography variant="body1" color="error">
            Failed to load tenant details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Network Error'}
          </Typography>
        </Box>
      ) : tenant ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{tenant.name}</Typography>
              </Box>
              {tenant.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{tenant.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={tenant.isActive ? 'success' : 'default'} variant="soft">
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Box>
              </Box>
              {tenant.ownerId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Owner ID
                  </Typography>
                  <Typography variant="body1">{tenant.ownerId}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Phone Numbers */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Phone Numbers
            </Typography>
            {tenant.phoneNumbers && tenant.phoneNumbers.length > 0 ? (
              <Stack spacing={1.5}>
                {tenant.phoneNumbers.map((phone) => (
                  <Box
                    key={phone.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: 1,
                      borderColor: phone.isPrimary ? 'primary.main' : 'divider',
                      bgcolor: phone.isPrimary ? 'primary.lighterChannel' : 'background.neutral',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={phone.isPrimary ? 600 : 400}>
                            {phone.phoneNumber}
                          </Typography>
                          {phone.isPrimary && (
                            <Label color="primary" variant="soft" sx={{ fontSize: '0.75rem' }}>
                              Primary
                            </Label>
                          )}
                          {!phone.isActive && (
                            <Label color="default" variant="soft" sx={{ fontSize: '0.75rem' }}>
                              Inactive
                            </Label>
                          )}
                        </Box>
                        {phone.label && (
                          <Typography variant="caption" color="text.secondary">
                            {phone.label}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No phone numbers
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Tenant not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

