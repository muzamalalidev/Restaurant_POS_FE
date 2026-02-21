'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Field } from 'src/components/hook-form';
import { Label } from 'src/components/label';

import { useGetStockQuery } from 'src/store/api/stock-api';
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
 * @param {Function} props.onUpdate - Callback to open update dialog
 * @param {Function} props.onAdjust - Callback to open adjust dialog
 */
export function StockDetailsDialog({ open, itemId, onClose, onUpdate, onAdjust }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch stock data
  const { data: stockData, isLoading, error: queryError, isError } = useGetStockQuery(
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
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading stock details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
            gap: 2,
          }}
        >
          <Typography variant="body1" color="error">
            Failed to load stock details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Item not found or an error occurred.'}
          </Typography>
        </Box>
      ) : stockData ? (
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
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Item ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {stockData.itemId?.substring(0, 8) + '...' || '-'}
                </Typography>
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

          {/* Actions */}
          {(onUpdate || onAdjust) && (
            <>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Stack direction="row" spacing={2}>
                {onUpdate && (
                  <Field.Button
                    variant="outlined"
                    onClick={() => {
                      onClose();
                      onUpdate();
                    }}
                    sx={{ flex: 1, minHeight: 44 }}
                  >
                    Update Stock
                  </Field.Button>
                )}
                {onAdjust && (
                  <Field.Button
                    variant="contained"
                    onClick={() => {
                      onClose();
                      onAdjust();
                    }}
                    sx={{ flex: 1, minHeight: 44 }}
                  >
                    Adjust Stock
                  </Field.Button>
                )}
              </Stack>
            </>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Stock information not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

