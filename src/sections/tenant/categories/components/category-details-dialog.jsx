import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetCategoriesQuery, useGetCategoryByIdQuery } from 'src/store/api/categories-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

// ----------------------------------------------------------------------

/**
 * Category Details Dialog Component
 * 
 * Read-only view of category details.
 * No action buttons - purely informational.
 * 
 * Uses GetCategoryById endpoint (fully implemented, not placeholder).
 */
export function CategoryDetailsDialog({ open, categoryId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch category by ID (fully implemented endpoint)
  const { data: category, isLoading, error: queryError, isError, refetch } = useGetCategoryByIdQuery(categoryId, {
    skip: !categoryId || !open,
  });

  // Fetch all categories to find parent name
  const { data: allCategoriesResponse } = useGetCategoriesQuery({
    pageSize: 1000,
  }, {
    skip: !open,
  });

  // Find parent category name
  const parentName = useMemo(() => {
    if (!category?.parentId || !allCategoriesResponse?.data) return null;
    const parent = allCategoriesResponse.data.find((cat) => cat.id === category.parentId);
    return parent?.name || null;
  }, [category?.parentId, allCategoriesResponse]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Category Details"
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
        loadingMessage="Loading category details..."
        errorTitle="Failed to load category details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load category details',
          notFoundMessage: 'Category not found or an error occurred.',
        }}
        isEmpty={!category && !isLoading && !isError}
        emptyMessage="Category not found"
      >
        {category ? (
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
                <Typography variant="body1">{category.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Parent Category
                </Typography>
                <Typography variant="body1">
                  {category.parentId ? (parentName || category.parentId) : 'Root Category'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant ID
                </Typography>
                <Typography variant="body1">{category.tenantId || '-'}</Typography>
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
              {category.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{category.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={category.isActive ? 'success' : 'default'} variant="soft">
                    {category.isActive ? 'Active' : 'Inactive'}
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

