'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetStockQuery } from 'src/store/api/stock-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

import { isLowStock, getStockColor, formatStockQuantity, LOW_STOCK_THRESHOLD } from '../utils/stock-helpers';

// ----------------------------------------------------------------------

/**
 * Stock Details Dialog Component
 * 
 * Read-only view of stock information.
 * Displays stock details with low stock indicator.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.itemId - Item ID for stock details
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function StockDetailsDialog({ open, itemId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch stock data
  const { data: stockData, isLoading, error: queryError, isError, refetch } = useGetStockQuery(
    itemId,
    { skip: !itemId || !open }
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Stock Details"
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
        loadingMessage="Loading stock details..."
        errorTitle="Failed to load stock details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load stock details',
          notFoundMessage: 'Item not found or an error occurred.',
        }}
        isEmpty={!stockData && !isLoading && !isError}
        emptyMessage="Stock information not found"
      >
        {stockData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Item Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Item Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Item Name
                </Typography>
                <Typography variant="body1">{stockData.itemName || '-'}</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Stock Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Stock Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Stock Quantity
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {formatStockQuantity(stockData.stockQuantity)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Low Stock Threshold
                </Typography>
                <Typography variant="body1">{formatStockQuantity(LOW_STOCK_THRESHOLD)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getStockColor(stockData.stockQuantity)} variant="soft">
                    {isLowStock(stockData.stockQuantity) ? 'Low Stock' : 'Sufficient Stock'}
                  </Label>
                  {isLowStock(stockData.stockQuantity) && (
                    <Label color="error" variant="soft">
                      Warning
                    </Label>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>
        ) : null}
      </QueryStateContent>
    </CustomDialog>
  );
}

