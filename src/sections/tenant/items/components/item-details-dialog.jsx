import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetItemsQuery } from 'src/store/api/items-api';
import { useGetTenantsQuery } from 'src/store/api/tenants-api';
import { useGetCategoriesQuery } from 'src/store/api/categories-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

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

/**
 * Format price as currency
 */
const formatPrice = (price) => {
  if (price === null || price === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Format stock quantity
 */
const formatStockQuantity = (quantity) => {
  if (quantity === null || quantity === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(quantity);
};

// ----------------------------------------------------------------------

/**
 * Item Details Dialog Component
 * 
 * Read-only view of item details.
 * No action buttons - purely informational.
 * 
 * Uses GetAll endpoint to find item by ID (since GetById is placeholder).
 */
export function ItemDetailsDialog({ open, itemId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch all items to find the one we need (since GetById is placeholder)
  const { data: itemsResponse, isLoading, error: queryError, isError, refetch } = useGetItemsQuery(
    { pageSize: 1000 },
    { skip: !itemId || !open }
  );

  // Fetch categories and tenants for names
  const { data: categoriesResponse } = useGetCategoriesQuery({
    pageSize: 1000,
  }, {
    skip: !open,
  });

  const { data: tenantsResponse } = useGetTenantsQuery({
    pageSize: 1000,
  }, {
    skip: !open,
  });

  // Find the item by ID from the response
  const item = useMemo(() => {
    if (itemId && itemsResponse?.data) {
      return itemsResponse.data.find((i) => i.id === itemId);
    }
    return null;
  }, [itemId, itemsResponse]);

  // Find category name
  const categoryName = useMemo(() => {
    if (!item?.categoryId || !categoriesResponse?.data) return null;
    const category = categoriesResponse.data.find((cat) => cat.id === item.categoryId);
    return category?.name || null;
  }, [item?.categoryId, categoriesResponse]);

  // Find tenant name
  const tenantName = useMemo(() => {
    if (!item?.tenantId || !tenantsResponse?.data) return null;
    const tenant = tenantsResponse.data.find((t) => t.id === item.tenantId);
    return tenant?.name || null;
  }, [item?.tenantId, tenantsResponse]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Item Details"
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
        loadingMessage="Loading item details..."
        errorTitle="Failed to load item details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load item details',
          notFoundMessage: 'Item not found or an error occurred.',
        }}
        isEmpty={!item && !isLoading && !isError}
        emptyMessage="Item not found"
      >
        {item ? (
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
                <Typography variant="body1">{item.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {categoryName || item.categoryId || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant
                </Typography>
                <Typography variant="body1">
                  {tenantName || item.tenantId || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Item Type
                </Typography>
                <Typography variant="body1">
                  {getItemTypeLabel(item.itemType)}
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
                <Typography variant="body1">{formatPrice(item.price)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Stock Quantity
                </Typography>
                <Typography variant="body1">{formatStockQuantity(item.stockQuantity)}</Typography>
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
              {item.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{item.description}</Typography>
                </Box>
              )}
              {item.imageUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Image URL
                  </Typography>
                  <Link
                    href={item.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body1"
                    sx={{ display: 'block', wordBreak: 'break-all' }}
                  >
                    {item.imageUrl}
                  </Link>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={item.isActive ? 'success' : 'default'} variant="soft">
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Label>
                  <Label color={item.isAvailable ? 'success' : 'default'} variant="soft">
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Label>
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

