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

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
  useGetCategoriesDropdownQuery,
  useToggleCategoryActiveMutation,
} from 'src/store/api/categories-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { CategoryFormDialog } from '../form/category-form-dialog';
import { CategoryDetailsDialog } from '../components/category-details-dialog';

// ----------------------------------------------------------------------

/**
 * Category List View Component
 * 
 * Displays all categories in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 */
export function CategoryListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogCategoryId, setFormDialogCategoryId] = useState(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogCategoryId, setDetailsDialogCategoryId] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state
  const [tenantId, setTenantId] = useState(null);
  const [parentId, setParentId] = useState(null);

  // Minimal form for search (required for Field.Text)
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal forms for filters (required for Field.Autocomplete)
  const tenantFilterForm = useForm({
    defaultValues: {
      tenantId: null,
    },
  });

  const parentFilterForm = useForm({
    defaultValues: {
      parentId: null,
    },
  });

  // Watch search form value changes and sync with searchTerm state
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Helper function to extract ID from object or string
  const getId = useCallback((value) => {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return value.id;
    }
    return value;
  }, []);

  // Sync tenant filter form with state
  const isSyncingTenantRef = useRef(false);
  useEffect(() => {
    if (isSyncingTenantRef.current) return;
    const currentFormValue = tenantFilterForm.getValues('tenantId');
    const stateId = getId(tenantId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      tenantFilterForm.setValue('tenantId', tenantId, { shouldValidate: false, shouldDirty: false });
    }
  }, [tenantId, tenantFilterForm, getId]);

  // Watch tenant filter form value changes
  const watchedTenantId = tenantFilterForm.watch('tenantId');
  useEffect(() => {
    const watchedId = getId(watchedTenantId);
    const currentId = getId(tenantId);
    
    if (watchedId !== currentId) {
      isSyncingTenantRef.current = true;
      setTenantId(watchedTenantId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingTenantRef.current = false;
      }, 0);
    }
  }, [watchedTenantId, tenantId, getId]);

  // Sync parent filter form with state
  const isSyncingParentRef = useRef(false);
  useEffect(() => {
    if (isSyncingParentRef.current) return;
    const currentFormValue = parentFilterForm.getValues('parentId');
    const stateId = getId(parentId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      parentFilterForm.setValue('parentId', parentId, { shouldValidate: false, shouldDirty: false });
    }
  }, [parentId, parentFilterForm, getId]);

  // Watch parent filter form value changes
  const watchedParentId = parentFilterForm.watch('parentId');
  useEffect(() => {
    const watchedId = getId(watchedParentId);
    const currentId = getId(parentId);
    
    if (watchedId !== currentId) {
      isSyncingParentRef.current = true;
      setParentId(watchedParentId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingParentRef.current = false;
      }, 0);
    }
  }, [watchedParentId, parentId, getId]);

  const selectedTenantIdRaw = tenantId ? (typeof tenantId === 'object' && tenantId !== null ? tenantId.id : tenantId) : undefined;
  const { data: tenantsDropdown } = useGetTenantsDropdownQuery();
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({
      id: item.key,
      label: item.value || item.key,
    }));
  }, [tenantsDropdown]);

  const { data: categoriesDropdown } = useGetCategoriesDropdownQuery(
    { tenantId: selectedTenantIdRaw },
    { skip: !selectedTenantIdRaw }
  );
  const parentCategoryOptions = useMemo(() => {
    const options = [{ id: null, label: 'Root Categories' }];
    if (categoriesDropdown && Array.isArray(categoriesDropdown)) {
      categoriesDropdown.forEach((item) => {
        options.push({ id: item.key, label: item.value || item.key });
      });
    }
    return options;
  }, [categoriesDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories with pagination, search, and filter params
  const queryParams = useMemo(
    () => {
      // Extract tenantId: if it's an object, get the id; if it's a string, use it directly
      const tenantIdValue = typeof tenantId === 'object' && tenantId !== null
        ? tenantId.id
        : tenantId;

      // Extract parentId: if it's an object, get the id; if it's a string, use it directly
      // Handle special case: if it's the "Root Categories" option (id: null), pass null
      let parentIdValue = null;
      if (parentId) {
        if (typeof parentId === 'object' && parentId !== null) {
          parentIdValue = parentId.id === null ? null : parentId.id;
        } else {
          parentIdValue = parentId;
        }
      }

      return {
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        tenantId: tenantIdValue || undefined,
        parentId: parentIdValue || undefined,
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, tenantId, parentId]
  );

  const { data: categoriesResponse, isLoading, error, refetch } = useGetCategoriesQuery(queryParams);

  // Extract data from paginated response
  const categories = useMemo(() => {
    if (!categoriesResponse) return [];
    return categoriesResponse.data || [];
  }, [categoriesResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!categoriesResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: categoriesResponse.totalCount || 0,
      totalPages: categoriesResponse.totalPages || 0,
      hasPreviousPage: categoriesResponse.hasPreviousPage || false,
      hasNextPage: categoriesResponse.hasNextPage || false,
    };
  }, [categoriesResponse]);

  // Mutations
  const [deleteCategory] = useDeleteCategoryMutation();
  const [toggleCategoryActive, { isLoading: _isTogglingActive }] = useToggleCategoryActiveMutation();

  // Track which category is being toggled
  const [togglingCategoryId, setTogglingCategoryId] = useState(null);
  
  // P1-009: Ref to prevent rapid toggle clicks
  const togglingCategoryIdsRef = useRef(new Set());

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogCategoryId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((categoryId) => {
    setFormDialogMode('edit');
    setFormDialogCategoryId(categoryId);
    setFormDialogOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((categoryId) => {
    setDetailsDialogCategoryId(categoryId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((row) => {
    setDeleteCategoryId(row.id);
    setDeleteCategoryName(row.name || 'Category');
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteCategoryId) return;
    
    try {
      await deleteCategory(deleteCategoryId).unwrap();
      toast.success('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteCategoryId(null);
      setDeleteCategoryName(null);
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete category',
      });
      toast.error(message);
      console.error('Failed to delete category:', err);
    }
  }, [deleteCategoryId, deleteCategory]);

  // Handle toggle active
  const handleToggleActive = useCallback(async (categoryId) => {
    // P1-009: Prevent rapid toggle clicks with ref guard
    if (togglingCategoryIdsRef.current.has(categoryId)) {
      return;
    }

    togglingCategoryIdsRef.current.add(categoryId);
    setTogglingCategoryId(categoryId);
    
    try {
      await toggleCategoryActive(categoryId).unwrap();
      toast.success('Category status updated successfully');
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update category status',
      });
      toast.error(message);
      console.error('Failed to toggle category active status:', err);
    } finally {
      setTogglingCategoryId(null);
      togglingCategoryIdsRef.current.delete(categoryId);
    }
  }, [toggleCategoryActive]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogCategoryId(null);
    toast.success(`Category ${action} successfully`);
  }, []);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogCategoryId(null);
  }, []);

  // Handle pagination change
  const handlePageChange = useCallback((newPage) => {
    setPageNumber(newPage + 1); // DataGrid uses 0-based, API uses 1-based
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPageNumber(1); // Reset to first page when page size changes
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    searchForm.setValue('searchTerm', '');
    setSearchTerm('');
  }, [searchForm]);

  // Find parent category name by ID
  const getParentName = useCallback((parentIdParam, allCategories) => {
    if (!parentIdParam || !allCategories) return 'Root';
    const parent = allCategories.find((cat) => cat.id === parentIdParam);
    return parent?.name || 'Root';
  }, []);

  const getTenantName = useCallback((tenantIdParam, options) => {
    if (!tenantIdParam || !options?.length) return null;
    const opt = options.find((t) => t.id === tenantIdParam);
    return opt?.label ?? null;
  }, []);

  const rows = useMemo(() => categories.map((category) => ({
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      parentName: getParentName(category.parentId, categories),
      tenantId: category.tenantId,
      tenantName: getTenantName(category.tenantId, tenantOptions),
      description: category.description || '-',
      isActive: category.isActive,
    })), [categories, tenantOptions, getParentName, getTenantName]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        sortable: true,
        filterable: true,
      },
      {
        field: 'parentName',
        headerName: 'Parent Category',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'tenantName',
        headerName: 'Tenant',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value || params.row.tenantId || '-'}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}
          >
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Label color={params.value ? 'success' : 'default'} variant="soft">
            {params.value ? 'Active' : 'Inactive'}
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
        label: 'View',
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
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingCategoryId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `category-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'category'}`,
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
      },
    ],
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingCategoryId]
  );

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        {/* Search and Filter Bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <FormProvider {...searchForm}>
            <Field.Text
              name="searchTerm"
              size="small"
              placeholder="Search by name or description..."
              slotProps={{
                input: {
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
              }}
              sx={{ maxWidth: { sm: 400 } }}
            />
          </FormProvider>
          <FormProvider {...tenantFilterForm}>
            <Field.Autocomplete
              name="tenantId"
              label="Tenant"
              options={tenantOptions}
              getOptionLabel={(option) => {
                if (!option) return '';
                return option.label || option.name || option.id || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                return option.id === value.id;
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'All Tenants',
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <FormProvider {...parentFilterForm}>
            <Field.Autocomplete
              name="parentId"
              label="Parent Category"
              options={parentCategoryOptions}
              getOptionLabel={(option) => {
                if (!option) return '';
                return option.label || option.name || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                // Handle null id for "Root Categories" option
                if (option.id === null && value.id === null) return true;
                return option.id === value.id;
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'All Categories',
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ ml: 'auto' }}
          >
            Create Category
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="categories"
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
              title="No categories found"
              description={
                searchTerm || tenantId || parentId
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating a new category"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <CategoryFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        categoryId={formDialogCategoryId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        tenantOptions={tenantOptions}
      />

      {/* Details Dialog */}
      <CategoryDetailsDialog
        open={detailsDialogOpen}
        categoryId={detailsDialogCategoryId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogCategoryId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Category"
        content={
          deleteCategoryName
            ? `Are you sure you want to delete "${deleteCategoryName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this category? This action cannot be undone.'
        }
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteCategoryId(null);
          setDeleteCategoryName(null);
        }}
      />
    </Box>
  );
}

