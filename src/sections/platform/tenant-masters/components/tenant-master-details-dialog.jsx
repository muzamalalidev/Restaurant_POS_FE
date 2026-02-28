'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

import { getActiveStatusLabel, getActiveStatusColor } from '../utils/tenant-master-helpers';

// ----------------------------------------------------------------------

/**
 * Tenant Master Details Dialog
 * Read-only view using record from list (no getById).
 * No actions (use list row actions for Edit/Toggle/Delete).
 */
export function TenantMasterDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Tenant Master Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          <Box>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{record.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{record.description || 'No description'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Owner
                </Typography>
                <Typography variant="body1">{record.ownerId ?? 'No owner assigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
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
