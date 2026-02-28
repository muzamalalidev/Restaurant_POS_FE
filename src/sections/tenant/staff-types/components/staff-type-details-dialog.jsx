'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Type Details Dialog Component
 *
 * Read-only view using record from list (no getById).
 * No action buttons - purely informational.
 */
export function StaffTypeDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Staff Type Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Staff Type Information */}
          <Box>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{record.name}</Typography>
              </Box>
              {record.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{record.description}</Typography>
                </Box>
              )}
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
        </Box>
      ) : null}
    </CustomDialog>
  );
}
