'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetAllRecipesQuery } from 'src/store/api/recipes-api';

import { Label } from 'src/components/label';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

import { formatTimeMinutes, getActiveStatusColor, getActiveStatusLabel } from '../utils/recipe-helpers';

// ----------------------------------------------------------------------

/**
 * Recipe Details Dialog Component
 * 
 * Read-only view of recipe details.
 * No action buttons - purely informational.
 * 
 * Note: GetById endpoint is a placeholder, so we use getAllRecipes with large pageSize
 * and client-side filtering by ID to get recipe data.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string|null} props.recipeId - Recipe ID
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function RecipeDetailsDialog({ open, recipeId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // P0-003/P1-001/P2-002: getRecipeById is placeholder; use getAllRecipes pageSize 200 – find by ID may miss if total > 200
  const { data: recipesResponse, isLoading, error: queryError, isError, refetch } = useGetAllRecipesQuery(
    { pageSize: 200 },
    { skip: !recipeId || !open }
  );

  // Find the recipe by ID from the response
  const recipe = useMemo(() => {
    if (!recipesResponse || !recipeId) return null;
    const recipes = recipesResponse.data || [];
    return recipes.find((r) => r.id === recipeId) || null;
  }, [recipesResponse, recipeId]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Recipe Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      <QueryStateContent
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        loadingMessage="Loading recipe details..."
        errorTitle="Failed to load recipe details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load recipe details',
          notFoundMessage: 'Recipe not found',
        }}
        isEmpty={!recipe && !isLoading && !isError}
        emptyMessage="Recipe not found"
      >
        {recipe ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Recipe Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Recipe Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{recipe.name}</Typography>
              </Box>
              {recipe.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {recipe.description}
                  </Typography>
                </Box>
              )}
              {recipe.instructions && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Instructions
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {recipe.instructions}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Recipe Details */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Recipe Details
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Servings
                </Typography>
                <Typography variant="body1">{recipe.servings}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Preparation Time
                </Typography>
                <Typography variant="body1">{formatTimeMinutes(recipe.preparationTimeMinutes)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cooking Time
                </Typography>
                <Typography variant="body1">{formatTimeMinutes(recipe.cookingTimeMinutes)}</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Ingredients */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Ingredients ({recipe.ingredients?.length || 0})
            </Typography>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <CustomTable
                rows={recipe.ingredients.map((ingredient, index) => ({
                  id: index,
                  itemName: ingredient.itemName || '-',
                  quantity: ingredient.quantity || '0',
                  notes: ingredient.notes || '-',
                }))}
                columns={[
                  {
                    field: 'itemName',
                    headerName: 'Item Name',
                    flex: 2,
                    sortable: false,
                  },
                  {
                    field: 'quantity',
                    headerName: 'Quantity',
                    flex: 1,
                    sortable: false,
                    renderCell: (params) => (
                      <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
                        {params.value}
                      </Typography>
                    ),
                  },
                  {
                    field: 'notes',
                    headerName: 'Notes',
                    flex: 2,
                    sortable: false,
                  },
                ]}
                pagination={{ enabled: false }}
                getRowId={(row) => row.id}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No ingredients added to this recipe.
              </Typography>
            )}
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
                  Active
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getActiveStatusColor(recipe.isActive)} variant="soft">
                    {getActiveStatusLabel(recipe.isActive)}
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

