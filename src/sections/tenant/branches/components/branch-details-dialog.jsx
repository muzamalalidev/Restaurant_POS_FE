'use client';

import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';

import { useGetBranchByIdQuery } from 'src/store/api/branches-api';

// ----------------------------------------------------------------------

/**
 * PhoneLabel enum mapping
 */
const PHONE_LABEL_MAP = {
  1: 'Main',
  2: 'Delivery',
  3: 'Reservations',
};

// ----------------------------------------------------------------------

/**
 * Branch Details Dialog Component
 * 
 * Read-only view of branch details.
 * No action buttons - purely informational.
 */
export function BranchDetailsDialog({ open, branchId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch branch data
  const { data: branch, isLoading, error: queryError, isError } = useGetBranchByIdQuery(branchId, {
    skip: !branchId || !open,
  });

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Branch Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading branch details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <Typography variant="body1" color="error">
            Failed to load branch details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Network Error'}
          </Typography>
        </Box>
      ) : branch ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Branch Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{branch.name}</Typography>
              </Box>
              {branch.address && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">{branch.address}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant
                </Typography>
                <Typography variant="body1">{branch.tenantName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={branch.isActive ? 'success' : 'default'} variant="soft">
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Phone Numbers */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Phone Numbers
            </Typography>
            {branch.phoneNumbers && branch.phoneNumbers.length > 0 ? (
              <Stack spacing={1.5}>
                {branch.phoneNumbers.map((phone) => (
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
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
                        {phone.phoneLabel && (
                          <Typography variant="caption" color="text.secondary">
                            {PHONE_LABEL_MAP[phone.phoneLabel] || `Label: ${phone.phoneLabel}`}
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
            Branch not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

