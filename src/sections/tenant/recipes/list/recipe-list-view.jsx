'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetItemsQuery } from 'src/store/api/items-api';
import {
  useGetAllRecipesQuery,
  useDeleteRecipeMutation,
  useToggleRecipeActiveMutation,
} from 'src/store/api/recipes-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { RecipeFormDialog } from '../form/recipe-form-dialog';
import { RecipeDetailsDialog } from '../components/recipe-details-dialog';
import {
  canEdit,
  canDelete,
  formatTimeMinutes,
  getActiveStatusLabel,
  getActiveStatusColor,
} from '../utils/recipe-helpers';

// ----------------------------------------------------------------------

/**
 * Recipe List View Component
 * 
 * Displays all recipes in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view/toggle/delete operations.
 * P1-003: Tenant/recipe isolation is enforced at the backend API level (no tenantId in params).
 * P2-001: Role-based visibility for Create/Edit/Delete/Toggle can be applied when backend supports it.
 */
export function RecipeListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecipeId, setFormDialogRecipeId] = useState(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecipeId, setDetailsDialogRecipeId] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteRecipeId, setDeleteRecipeId] = useState(null);
  const [deleteRecipeName, setDeleteRecipeName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Minimal form for search
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Watch search form value changes and sync with searchTerm state
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Query recipes with pagination and search
  const {
    data: recipesResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllRecipesQuery({
    pageNumber,
    pageSize,
    searchTerm: debouncedSearchTerm || undefined,
  });

  // Extract recipes and pagination metadata
  const recipes = useMemo(() => {
    if (!recipesResponse) return [];
    return recipesResponse.data || [];
  }, [recipesResponse]);

  // Fetch items for item names (P0-003/P1-004: limit to 200)
  const { data: itemsResponse } = useGetItemsQuery(
    { pageSize: 200 },
    { skip: !recipesResponse || recipes.length === 0 }
  );

  const paginationMeta = useMemo(() => {
    if (!recipesResponse) {
      return {
        pageNumber: 1,
        pageSize: 25,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      pageNumber: recipesResponse.pageNumber || 1,
      pageSize: recipesResponse.pageSize || 25,
      totalCount: recipesResponse.totalCount || 0,
      totalPages: recipesResponse.totalPages || 0,
      hasPreviousPage: recipesResponse.hasPreviousPage || false,
      hasNextPage: recipesResponse.hasNextPage || false,
    };
  }, [recipesResponse]);

  // Mutations
  const [deleteRecipe] = useDeleteRecipeMutation();
  const [toggleRecipeActive, { isLoading: _isTogglingActive }] = useToggleRecipeActiveMutation();

  // Track which recipe is being toggled
  const [togglingRecipeId, setTogglingRecipeId] = useState(null);
  // P0-004: Ref guard to prevent rapid toggle clicks
  const inFlightIdsRef = useRef(new Set());

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecipeId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((recipeId) => {
    setFormDialogMode('edit');
    setFormDialogRecipeId(recipeId);
    setFormDialogOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((recipeId) => {
    setDetailsDialogRecipeId(recipeId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((recipe) => {
    setDeleteRecipeId(recipe.id);
    setDeleteRecipeName(recipe.name);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteRecipeId) return;
    
    try {
      await deleteRecipe(deleteRecipeId).unwrap();
      toast.success('Recipe deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteRecipeId(null);
      setDeleteRecipeName(null);
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete recipe',
        notFoundMessage: 'Recipe not found',
      });
      toast.error(message);
      console.error('Failed to delete recipe:', err);
    }
  }, [deleteRecipeId, deleteRecipe]);

  // Handle toggle active (P0-004: ref guard prevents rapid clicks)
  const handleToggleActive = useCallback(async (recipeId) => {
    if (inFlightIdsRef.current.has(recipeId)) return;
    inFlightIdsRef.current.add(recipeId);
    setTogglingRecipeId(recipeId);
    try {
      await toggleRecipeActive(recipeId).unwrap();
      toast.success('Recipe status updated successfully');
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update recipe status',
        notFoundMessage: 'Recipe not found',
      });
      toast.error(message);
      console.error('Failed to toggle recipe active status:', err);
    } finally {
      inFlightIdsRef.current.delete(recipeId);
      setTogglingRecipeId(null);
    }
  }, [toggleRecipeActive]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecipeId(null);
    toast.success(`Recipe ${action} successfully`);
    refetch();
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecipeId(null);
  }, []);

  // Handle pagination change
  const handlePageChange = useCallback((newPage) => {
    setPageNumber(newPage + 1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    searchForm.setValue('searchTerm', '');
    setSearchTerm('');
  }, [searchForm]);

  // Prepare table rows
  const rows = useMemo(() => {
    const items = itemsResponse?.data || [];
    const itemsMap = new Map(items.map((item) => [item.id, item]));

    return recipes.map((recipe) => {
      const item = itemsMap.get(recipe.itemId);
      return {
        id: recipe.id,
        name: recipe.name,
        itemName: item?.name || '-',
        servings: recipe.servings,
        preparationTimeMinutes: recipe.preparationTimeMinutes,
        cookingTimeMinutes: recipe.cookingTimeMinutes,
        ingredientsCount: recipe.ingredients?.length || 0,
        isActive: recipe.isActive,
      };
    });
  }, [recipes, itemsResponse]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 2,
        sortable: false,
      },
      {
        field: 'itemName',
        headerName: 'Item Name',
        flex: 2,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'servings',
        headerName: 'Servings',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'preparationTimeMinutes',
        headerName: 'Prep Time',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2">
            {formatTimeMinutes(params.value)}
          </Typography>
        ),
      },
      {
        field: 'cookingTimeMinutes',
        headerName: 'Cook Time',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2">
            {formatTimeMinutes(params.value)}
          </Typography>
        ),
      },
      {
        field: 'ingredientsCount',
        headerName: 'Ingredients',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Label variant="soft" color="default">
            {params.value} {params.value === 1 ? 'ingredient' : 'ingredients'}
          </Label>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Label color={getActiveStatusColor(params.value)} variant="soft">
            {getActiveStatusLabel(params.value)}
          </Label>
        ),
      },
    ],
    []
  );

  // Define actions
  const actions = useMemo(
    () => [
      {
        id: 'view',
        label: 'View Details',
        icon: 'solar:eye-bold',
        onClick: (row) => handleView(row.id),
        order: 1,
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (row) => handleEdit(row.id),
        order: 2,
        visible: (row) => canEdit(row.isActive),
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingRecipeId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `recipe-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'recipe'}`,
              },
            }}
          />
        ),
        order: 3,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => handleDeleteClick(row),
        order: 4,
        visible: (row) => canDelete(row.isActive),
      },
    ],
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingRecipeId]
  );

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        {/* Header with Create Button */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Recipes
          </Typography>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ minHeight: 44 }}
          >
            Create Recipe
          </Field.Button>
        </Stack>

        {/* Filters */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Search */}
              <FormProvider {...searchForm}>
                <Field.Text
                  name="searchTerm"
                  placeholder="Search by Name, Description, or Instructions..."
                  slotProps={{
                    textField: {
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={handleSearchClear}
                              sx={{ minWidth: 'auto', minHeight: 'auto', p: 0.5 }}
                              aria-label="Clear search"
                            >
                              <Iconify icon="eva:close-fill" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                  sx={{ flex: 1 }}
                />
              </FormProvider>
            </Stack>
          </Stack>
        </Card>

        {/* Table - P0-005: show error in table area so search/Create remain; P0-001: sorting disabled with server pagination */}
        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="recipes"
          pagination={{
            ...DEFAULT_PAGINATION,
            mode: 'server',
            pageSize,
            rowCount: paginationMeta.totalCount,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          getRowId={(row) => row.id}
          emptyContent={
            <EmptyContent
              title="No recipes found"
              description={
                searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by creating a new recipe"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <RecipeFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        recipeId={formDialogRecipeId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Details Dialog */}
      <RecipeDetailsDialog
        open={detailsDialogOpen}
        recipeId={detailsDialogRecipeId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogRecipeId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Recipe?"
        content={`Are you sure you want to delete recipe "${deleteRecipeName}"? This will permanently delete all ingredients. This action cannot be undone.`}
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteRecipeId(null);
          setDeleteRecipeName(null);
        }}
      />
    </Box>
  );
}

