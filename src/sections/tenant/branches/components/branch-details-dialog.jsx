'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

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
 * Read-only view using record from list (no getById).
 * No action buttons - purely informational.
 */
export function BranchDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Branch Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
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
                <Typography variant="body1">{record.name}</Typography>
              </Box>
              {record.address && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">{record.address}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant
                </Typography>
                <Typography variant="body1">{record.tenantName || '-'}</Typography>
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

          {/* Phone Numbers */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Phone Numbers
            </Typography>
            {record.phoneNumbers && record.phoneNumbers.length > 0 ? (
              <Stack spacing={1.5}>
                {record.phoneNumbers.map((phone) => (
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
      ) : null}
    </CustomDialog>
  );
}
