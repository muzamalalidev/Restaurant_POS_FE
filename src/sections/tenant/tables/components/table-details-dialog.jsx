'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

import {
  getAvailabilityLabel,
  getAvailabilityColor,
  getActiveStatusLabel,
  getActiveStatusColor,
} from '../utils/table-helpers';

// ----------------------------------------------------------------------

/**
 * Table Details Dialog Component
 *
 * Read-only view of table details. Uses the full row object passed from the list
 * (no getById or extra API call).
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full table object from list
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function TableDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Table Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Table Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Table Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Table Number
                </Typography>
                <Typography variant="body1">{record.tableNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch
                </Typography>
                <Typography variant="body1">{record.branchName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Capacity
                </Typography>
                <Typography variant="body1">{record.capacity}</Typography>
              </Box>
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
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getAvailabilityColor(record.isAvailable)} variant="soft">
                    {getAvailabilityLabel(record.isAvailable)}
                  </Label>
                </Box>
              </Box>
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
            </Stack>
          </Box>
        </Box>
      ) : null}
    </CustomDialog>
  );
}
