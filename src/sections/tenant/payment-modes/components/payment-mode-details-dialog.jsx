'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetPaymentModeByIdQuery } from 'src/store/api/payment-modes-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

// ----------------------------------------------------------------------

/**
 * Payment Mode Details Dialog
 *
 * Read-only view. Requires tenantId and paymentModeId for API.
 */
export function PaymentModeDetailsDialog({ open, tenantId, paymentModeId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: paymentMode, isLoading, error: queryError, isError, refetch } = useGetPaymentModeByIdQuery(
    { tenantId, id: paymentModeId },
    { skip: !tenantId || !paymentModeId || !open }
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Payment Mode Details"
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
        loadingMessage="Loading payment mode details..."
        errorTitle="Failed to load payment mode details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load payment mode details',
          notFoundMessage: 'Payment mode not found',
        }}
        isEmpty={!paymentMode && !isLoading && !isError}
        emptyMessage="Payment mode not found"
      >
        {paymentMode ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Payment Mode Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{paymentMode.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{paymentMode.description || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={paymentMode.isActive ? 'success' : 'default'} variant="soft">
                    {paymentMode.isActive ? 'Active' : 'Inactive'}
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
