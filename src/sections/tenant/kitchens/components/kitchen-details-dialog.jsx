'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

import { getActiveStatusLabel, getActiveStatusColor } from '../utils/kitchen-helpers';

// ----------------------------------------------------------------------

/**
 * Kitchen Details Dialog Component
 *
 * Read-only view of kitchen details. Uses the full row object passed from the list
 * (no getById or tenant/branch fetches). List enriches record with tenantName and branchName.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full kitchen object from list (may include tenantName, branchName)
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function KitchenDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const tenantDisplay = record?.tenantName ?? record?.tenantId ?? '-';
  const branchDisplay = record?.branchName ?? record?.branchId ?? '-';

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Kitchen Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
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
                <Typography variant="body1">{record.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant
                </Typography>
                <Typography variant="body1">{tenantDisplay}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch
                </Typography>
                <Typography variant="body1">{branchDisplay}</Typography>
              </Box>
              {record.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {record.description}
                  </Typography>
                </Box>
              )}
              {record.location && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{record.location}</Typography>
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
                <Label color={getActiveStatusColor(record.isActive)} variant="soft">
                  {getActiveStatusLabel(record.isActive)}
                </Label>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}
    </CustomDialog>
  );
}
