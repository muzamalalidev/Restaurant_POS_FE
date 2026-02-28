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

import { fNumber, fCurrency } from 'src/utils/format-number';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetCategoriesDropdownQuery } from 'src/store/api/categories-api';
import { useGetItemsQuery, useDeleteItemMutation, useToggleItemActiveMutation } from 'src/store/api/items-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { ItemFormDialog } from '../form/item-form-dialog';
import { ItemDetailsDialog } from '../components/item-details-dialog';

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
 * Item List View Component
 * 
 * Displays all items in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 * 
 * Filter precedence: categoryId takes precedence over tenantId.
 */
export function ItemListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteItemName, setDeleteItemName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state
  const [categoryId, setCategoryId] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Minimal form for search (required for Field.Text)
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal forms for filters (required for Field.Autocomplete)
  const categoryFilterForm = useForm({
    defaultValues: {
      categoryId: null,
    },
  });

  const tenantFilterForm = useForm({
    defaultValues: {
      tenantId: null,
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

  // Sync category filter form with state
  const isSyncingCategoryRef = useRef(false);
  useEffect(() => {
    if (isSyncingCategoryRef.current) return;
    const currentFormValue = categoryFilterForm.getValues('categoryId');
    const stateId = getId(categoryId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      categoryFilterForm.setValue('categoryId', categoryId, { shouldValidate: false, shouldDirty: false });
    }
  }, [categoryId, categoryFilterForm, getId]);

  // Watch category filter form value changes
  const watchedCategoryId = categoryFilterForm.watch('categoryId');
  useEffect(() => {
    const watchedId = getId(watchedCategoryId);
    const currentId = getId(categoryId);
    
    if (watchedId !== currentId) {
      isSyncingCategoryRef.current = true;
      setCategoryId(watchedCategoryId);
      // When categoryId is selected, clear tenantId (categoryId takes precedence)
      if (watchedCategoryId) {
        setTenantId(null);
        tenantFilterForm.setValue('tenantId', null, { shouldValidate: false, shouldDirty: false });
      }
      setPageNumber(1);
      setTimeout(() => {
        isSyncingCategoryRef.current = false;
      }, 0);
    }
  }, [watchedCategoryId, categoryId, tenantFilterForm, getId]);

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

  const tenantIdForCategories = tenantId
    ? (typeof tenantId === 'object' && tenantId !== null ? tenantId.id : tenantId)
    : undefined;

  const { data: tenantsDropdown } = useGetTenantsDropdownQuery();
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantsDropdown]);

  const { data: categoriesDropdown } = useGetCategoriesDropdownQuery(
    { tenantId: tenantIdForCategories },
    { skip: !tenantIdForCategories }
  );
  const categoryOptions = useMemo(() => {
    if (!categoriesDropdown || !Array.isArray(categoriesDropdown)) return [];
    return categoriesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [categoriesDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch items with pagination, search, and filter params
  const queryParams = useMemo(
    () => {
      // Extract categoryId: if it's an object, get the id; if it's a string, use it directly
      const categoryIdValue = typeof categoryId === 'object' && categoryId !== null
        ? categoryId.id
        : categoryId;

      // Extract tenantId: if it's an object, get the id; if it's a string, use it directly
      // Only include tenantId if categoryId is not set (categoryId takes precedence)
      const tenantIdValue = categoryIdValue
        ? undefined
        : (typeof tenantId === 'object' && tenantId !== null
            ? tenantId.id
            : tenantId);

      return {
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        categoryId: categoryIdValue || undefined,
        tenantId: tenantIdValue || undefined,
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, categoryId, tenantId]
  );

  const { data: itemsResponse, isLoading, error, refetch } = useGetItemsQuery(queryParams);

  // Extract data from paginated response
  const items = useMemo(() => {
    if (!itemsResponse) return [];
    return itemsResponse.data || [];
  }, [itemsResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!itemsResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: itemsResponse.totalCount || 0,
      totalPages: itemsResponse.totalPages || 0,
      hasPreviousPage: itemsResponse.hasPreviousPage || false,
      hasNextPage: itemsResponse.hasNextPage || false,
    };
  }, [itemsResponse]);

  // Mutations
  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();
  const [toggleItemActive, { isLoading: _isTogglingActive }] = useToggleItemActiveMutation();

  // Track which item is being toggled
  const [togglingItemId, setTogglingItemId] = useState(null);
  // P1-002: Ref to prevent rapid toggle clicks
  const togglingItemIdsRef = useRef(new Set());

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit (pass full row from list; no getById)
  const handleEdit = useCallback((row) => {
    const record = items.find((i) => i.id === row.id) ?? null;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [items]);

  // Handle view (pass full row from list; API includes categoryName, tenantName)
  const handleView = useCallback((row) => {
    const record = items.find((i) => i.id === row.id) ?? null;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [items]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((row) => {
    setDeleteItemId(row.id);
    setDeleteItemName(row.name || 'Item');
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteItemId) return;

    try {
      await deleteItem(deleteItemId).unwrap();
      toast.success('Item deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteItemId(null);
      setDeleteItemName(null);
      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete item',
        notFoundMessage: 'Item not found',
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleDeleteConfirm() },
        });
      } else {
        toast.error(message);
      }
    }
  }, [deleteItemId, deleteItem, items.length, pageNumber]);

  // Handle toggle active
  const handleToggleActive = useCallback(async (itemId) => {
    if (togglingItemIdsRef.current.has(itemId)) return;
    togglingItemIdsRef.current.add(itemId);
    setTogglingItemId(itemId);
    try {
      await toggleItemActive(itemId).unwrap();
      toast.success('Item status updated successfully');
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update item status',
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleToggleActive(itemId) },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setTogglingItemId(null);
      togglingItemIdsRef.current.delete(itemId);
    }
  }, [toggleItemActive]);

  // Handle form dialog success
  // Contract: onSuccess(id, action, payload?). For create, payload is API result (optional display name).
  const handleFormSuccess = useCallback((id, action, payload) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    refetch();
    const displayName = action === 'created' && payload?.name != null ? payload.name : null;
    const message = displayName
      ? `Item "${displayName}" ${action} successfully`
      : `Item ${action} successfully`;
    toast.success(message);
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
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
    setPageNumber(1); // Reset to first page when clearing search
  }, [searchForm]);


  // Rows use API response keys (categoryName, tenantName); no lookup from options
  const rows = useMemo(() => items.map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.categoryName ?? '-',
      tenantId: item.tenantId,
      tenantName: item.tenantName ?? '-',
      itemType: item.itemType,
      itemTypeLabel: getItemTypeLabel(item.itemType),
      price: item.price,
      priceFormatted: formatPrice(item.price),
      stockQuantity: item.stockQuantity,
      stockQuantityFormatted: formatStockQuantity(item.stockQuantity),
      description: item.description || '-',
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      isAvailable: item.isAvailable,
    })), [items]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
      },
      {
        field: 'categoryName',
        headerName: 'Category',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value || params.row.categoryId || '-'}
          </Typography>
        ),
      },
      {
        field: 'itemTypeLabel',
        headerName: 'Item Type',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'priceFormatted',
        headerName: 'Price',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'stockQuantityFormatted',
        headerName: 'Stock Quantity',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'isAvailable',
        headerName: 'Available',
        flex: 1,
        renderCell: (params) => (
          <Label color={params.value ? 'success' : 'error'} variant="soft">
            {params.value ? 'Available' : 'Unavailable'}
          </Label>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        flex: 1,
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
        onClick: (row) => handleView(row),
        order: 1,
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (row) => handleEdit(row),
        order: 2,
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingItemId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `item-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'item'}`,
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingItemId]
  );

  // Check if categoryId is selected (for disabling tenantId filter)
  const isCategorySelected = useMemo(() => categoryId !== null && categoryId !== undefined, [categoryId]);

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
              disabled={isCategorySelected}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'All Tenants',
                  helperText: isCategorySelected ? 'Category filter takes precedence over tenant filter' : undefined,
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <FormProvider {...categoryFilterForm}>
            <Field.Autocomplete
              name="categoryId"
              label="Category"
              options={categoryOptions}
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
            sx={{ ml: 'auto', minHeight: 44 }}
          >
            Create Item
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="items"
          pagination={{
            ...DEFAULT_PAGINATION,
            mode: 'server',
            page: pageNumber - 1,
            pageSize,
            rowCount: paginationMeta.totalCount,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          getRowId={(row) => row.id}
          emptyContent={
            <EmptyContent
              title="No items found"
              description={
                searchTerm || categoryId || tenantId
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating a new item"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <ItemFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        record={formDialogRecord}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        tenantOptions={tenantOptions}
      />

      {/* Details Dialog */}
      <ItemDetailsDialog
        open={detailsDialogOpen}
        record={detailsDialogRecord}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogRecord(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Item"
        content={
          deleteItemName
            ? `Are you sure you want to delete "${deleteItemName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this item? This action cannot be undone.'
        }
        action={
          <Field.Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            loading={isDeleting}
          >
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteItemId(null);
          setDeleteItemName(null);
        }}
        loading={isDeleting}
        disableClose={isDeleting}
      />
    </Box>
  );
}

