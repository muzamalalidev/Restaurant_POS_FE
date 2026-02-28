import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { ImagePreview } from 'src/components/image-preview';

// ----------------------------------------------------------------------

/**
 * Get ItemType label
 */
const getItemTypeLabel = (itemType) => {
  const labels = {
    1: 'Direct Sale',
    2: 'Recipe Based',
    3: 'Add On',
    4: 'Deal',
  };
  return labels[itemType] || `Unknown (${itemType})`;
};

const formatPrice = (price) =>
  price == null ? '-' : fCurrency(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatStockQuantity = (quantity) =>
  quantity == null ? '-' : fNumber(quantity, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ----------------------------------------------------------------------

/**
 * Item Details Dialog Component
 *
 * Read-only view of item details. Uses the full row object passed from the list
 * (no getById or extra API calls). List view may enrich record with categoryName
 * and tenantName for display.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full item object from list (may include categoryName, tenantName)
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function ItemDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const categoryDisplay = record?.categoryName ?? record?.categoryId ?? '-';
  const tenantDisplay = record?.tenantName ?? record?.tenantId ?? '-';

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Item Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{record.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">{categoryDisplay}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant
                </Typography>
                <Typography variant="body1">{tenantDisplay}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Item Type
                </Typography>
                <Typography variant="body1">
                  {getItemTypeLabel(record.itemType)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Pricing & Inventory */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Pricing & Inventory
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1">{formatPrice(record.price)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Stock Quantity
                </Typography>
                <Typography variant="body1">{formatStockQuantity(record.stockQuantity)}</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Additional Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Additional Information
            </Typography>
            <Stack spacing={2}>
              {record.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{record.description}</Typography>
                </Box>
              )}
              {record.imageUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Image
                  </Typography>
                  <Box
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  >
                    <ImagePreview
                      imageUrl={record.imageUrl}
                      alt={record.name || 'Item image'}
                      width="100%"
                      ratio="16/9"
                      sx={{ maxHeight: 300 }}
                    />
                  </Box>
                  <Link
                    href={record.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    sx={{ display: 'block', wordBreak: 'break-all', color: 'text.secondary' }}
                  >
                    View full URL
                  </Link>
                </Box>
              )}
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
