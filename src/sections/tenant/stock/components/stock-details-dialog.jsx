'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';

import { isLowStock, getStockColor, formatStockQuantity, DEFAULT_LOW_STOCK_THRESHOLD } from '../utils/stock-helpers';

// ----------------------------------------------------------------------

/**
 * Stock Details Dialog Component
 *
 * Read-only view of stock information. Uses the full row object passed from the list
 * (no getStock API call). lowStockThreshold defaults to 10 when not present on record.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full item/stock row from list (id, name, stockQuantity, lowStockThreshold?, ...)
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function StockDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const threshold = record?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const stockQuantity = record?.stockQuantity;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Stock Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
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
                <Typography variant="body1">{record.name || '-'}</Typography>
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
                  {formatStockQuantity(stockQuantity)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Low Stock Threshold
                </Typography>
                <Typography variant="body1">{formatStockQuantity(threshold)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Stock Level
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getStockColor(stockQuantity, threshold)} variant="soft">
                    {isLowStock(stockQuantity, threshold) ? 'Low Stock' : 'Sufficient Stock'}
                  </Label>
                  {isLowStock(stockQuantity, threshold) && (
                    <Label color="error" variant="soft">
                      Warning
                    </Label>
                  )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={record.isAvailable ? 'success' : 'error'} variant="soft">
                    {record.isAvailable ? 'Available' : 'Unavailable'}
                  </Label>
                </Box>
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
        </Box>
      ) : null}
    </CustomDialog>
  );
}
