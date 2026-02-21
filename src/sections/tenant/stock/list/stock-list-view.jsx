'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';

import { CustomTable } from 'src/components/custom-table';
import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { useGetItemsQuery } from 'src/store/api/items-api';
import { useGetTenantsQuery } from 'src/store/api/tenants-api';
import { useGetCategoriesQuery } from 'src/store/api/categories-api';
import { StockDetailsDialog } from '../components/stock-details-dialog';
import { UpdateStockDialog } from '../form/update-stock-dialog';
import { AdjustStockDialog } from '../form/adjust-stock-dialog';
import { isLowStock, getStockColor, formatStockQuantity } from '../utils/stock-helpers';

// ----------------------------------------------------------------------

/**
 * Stock List View Component
 * 
 * Displays all items with their stock information in a data-dense, filterable grid.
 * Manages dialog state for view/update/adjust operations.
 * 
 * Filter precedence: categoryId takes precedence over tenantId.
 * 
 * P1-003 SECURITY NOTE: Tenant/branch context and isolation are enforced at the backend API level.
 * Backend is the source of truth for authorization and multi-tenant data access.
 */
export function StockListView() {
  // Dialog state management
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogItemId, setDetailsDialogItemId] = useState(null);
  
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateDialogItemId, setUpdateDialogItemId] = useState(null);
  
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustDialogItemId, setAdjustDialogItemId] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state
  const [categoryId, setCategoryId] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);

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

  // Minimal form for low stock filter (required for Field.Switch)
  const lowStockFilterForm = useForm({
    defaultValues: {
      lowStockOnly: false,
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

  // Sync low stock filter form with state
  const isSyncingLowStockRef = useRef(false);
  useEffect(() => {
    if (isSyncingLowStockRef.current) return;
    const currentFormValue = lowStockFilterForm.getValues('lowStockOnly');
    if (currentFormValue !== lowStockOnly) {
      lowStockFilterForm.setValue('lowStockOnly', lowStockOnly, { shouldValidate: false, shouldDirty: false });
    }
  }, [lowStockOnly, lowStockFilterForm]);

  // Watch low stock filter form value changes
  const watchedLowStockOnly = lowStockFilterForm.watch('lowStockOnly');
  useEffect(() => {
    if (watchedLowStockOnly !== lowStockOnly) {
      isSyncingLowStockRef.current = true;
      setLowStockOnly(watchedLowStockOnly);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingLowStockRef.current = false;
      }, 0);
    }
  }, [watchedLowStockOnly, lowStockOnly]);

  // P0-004: Limit dropdown fetches; scope categories by tenant when selected
  const { data: tenantsResponse } = useGetTenantsQuery({
    pageSize: 200,
  });

  const tenantIdForCategories = tenantId
    ? (typeof tenantId === 'object' && tenantId !== null ? tenantId.id : tenantId)
    : undefined;

  const { data: categoriesResponse } = useGetCategoriesQuery({
    pageSize: 200,
    tenantId: tenantIdForCategories,
  });

  // Tenant options for dropdown
  const tenantOptions = useMemo(() => {
    if (!tenantsResponse) return [];
    const tenants = tenantsResponse.data || [];
    return tenants.map((tenant) => ({
      id: tenant.id,
      label: tenant.name || tenant.id,
    }));
  }, [tenantsResponse]);

  // Category options for dropdown
  const categoryOptions = useMemo(() => {
    if (!categoriesResponse) return [];
    const categories = categoriesResponse.data || [];
    return categories.map((category) => ({
      id: category.id,
      label: category.name || category.id,
    }));
  }, [categoriesResponse]);

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

  // Filter items by low stock if enabled
  const filteredItems = useMemo(() => {
    if (!lowStockOnly) return items;
    return items.filter((item) => isLowStock(item.stockQuantity));
  }, [items, lowStockOnly]);

  // Extract pagination metadata (P0-002: always use server totalCount so pagination stays consistent; Low Stock Only filters current page only)
  const paginationMeta = useMemo(() => {
    if (!itemsResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    const totalCount = itemsResponse.totalCount || 0;
    const totalPages = (itemsResponse.totalPages ?? Math.ceil(totalCount / pageSize)) || 0;
    return {
      totalCount,
      totalPages,
      hasPreviousPage: itemsResponse.hasPreviousPage ?? pageNumber > 1,
      hasNextPage: itemsResponse.hasNextPage ?? pageNumber < totalPages,
    };
  }, [itemsResponse, pageSize, pageNumber]);

  // Handle view stock details
  const handleView = useCallback((itemId) => {
    setDetailsDialogItemId(itemId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle update stock
  const handleUpdate = useCallback((itemId) => {
    setUpdateDialogItemId(itemId);
    setUpdateDialogOpen(true);
  }, []);

  // Handle adjust stock
  const handleAdjust = useCallback((itemId) => {
    setAdjustDialogItemId(itemId);
    setAdjustDialogOpen(true);
  }, []);

  // Handle stock operation success
  const handleStockSuccess = useCallback((id, action) => {
    // Refetch items to get updated stock quantities
    refetch();
  }, [refetch]);

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

  // Find category name by ID
  const getCategoryName = useCallback((categoryId, allCategories) => {
    if (!categoryId || !allCategories) return null;
    const category = allCategories.find((cat) => cat.id === categoryId);
    return category?.name || null;
  }, []);

  // Find tenant name by ID
  const getTenantName = useCallback((tenantId, tenants) => {
    if (!tenantId || !tenants) return null;
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.name || null;
  }, []);

  // Prepare table rows
  const rows = useMemo(() => {
    const allCategories = categoriesResponse?.data || [];
    const tenants = tenantsResponse?.data || [];
    
    return filteredItems.map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: getCategoryName(item.categoryId, allCategories),
      tenantId: item.tenantId,
      tenantName: getTenantName(item.tenantId, tenants),
      stockQuantity: item.stockQuantity,
      stockQuantityFormatted: formatStockQuantity(item.stockQuantity),
      isLowStock: isLowStock(item.stockQuantity),
      stockColor: getStockColor(item.stockQuantity),
      isActive: item.isActive,
      isAvailable: item.isAvailable,
    }));
  }, [filteredItems, categoriesResponse, tenantsResponse, getCategoryName, getTenantName]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Item Name',
        flex: 1,
        sortable: true,
        filterable: true,
      },
      {
        field: 'categoryName',
        headerName: 'Category',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value || params.row.categoryId || '-'}
          </Typography>
        ),
      },
      {
        field: 'stockQuantityFormatted',
        headerName: 'Stock Quantity',
        flex: 1,
        sortable: true,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: params.row.stockColor === 'error' ? 'error.main' : 'success.main',
              }}
            >
              {params.value}
            </Typography>
            {params.row.isLowStock && (
              <Label color="error" variant="soft" sx={{ fontSize: '0.75rem' }}>
                Low Stock
              </Label>
            )}
          </Stack>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Label color={params.row.isActive ? 'success' : 'default'} variant="soft" sx={{ fontSize: '0.75rem' }}>
              {params.row.isActive ? 'Active' : 'Inactive'}
            </Label>
            <Label color={params.row.isAvailable ? 'success' : 'default'} variant="soft" sx={{ fontSize: '0.75rem' }}>
              {params.row.isAvailable ? 'Available' : 'Unavailable'}
            </Label>
          </Stack>
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
        id: 'update',
        label: 'Update Stock',
        icon: 'solar:pen-bold',
        onClick: (row) => handleUpdate(row.id),
        order: 2,
      },
      {
        id: 'adjust',
        label: 'Adjust Stock',
        icon: 'solar:add-circle-bold',
        onClick: (row) => handleAdjust(row.id),
        order: 3,
      },
    ],
    [handleView, handleUpdate, handleAdjust]
  );

  // Check if categoryId is selected (for disabling tenantId filter)
  const isCategorySelected = useMemo(() => {
    return categoryId !== null && categoryId !== undefined;
  }, [categoryId]);

  // Error state
  if (error) {
    return (
      <EmptyContent
        title="Error loading stock"
        description={error?.data?.message || 'An error occurred while loading stock information'}
        action={
          <Field.Button variant="contained" onClick={() => refetch()} startIcon="solar:refresh-bold">
            Retry
          </Field.Button>
        }
      />
    );
  }

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
              placeholder="Search by item name..."
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
                        edge="end"
                        onClick={handleSearchClear}
                        sx={{ p: 0.5 }}
                        aria-label="Clear search"
                      >
                        <Iconify icon="eva:close-fill" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                textField: {
                  sx: { flex: { xs: 1, sm: '0 0 300px' } },
                },
              }}
            />
          </FormProvider>

          <FormProvider {...categoryFilterForm}>
            <Field.Autocomplete
              name="categoryId"
              label="Category"
              options={categoryOptions}
              size="small"
              slotProps={{
                autocomplete: {
                  sx: { flex: { xs: 1, sm: '0 0 200px' } },
                },
              }}
            />
          </FormProvider>

          <FormProvider {...tenantFilterForm}>
            <Field.Autocomplete
              name="tenantId"
              label="Tenant"
              options={tenantOptions}
              size="small"
              disabled={isCategorySelected}
              slotProps={{
                autocomplete: {
                  sx: { flex: { xs: 1, sm: '0 0 200px' } },
                },
              }}
            />
          </FormProvider>

          <FormProvider {...lowStockFilterForm}>
            <Field.Switch
              name="lowStockOnly"
              label="Low Stock Only"
              helperText={lowStockOnly ? 'Filters current page only' : undefined}
              sx={{ ml: 'auto' }}
            />
          </FormProvider>
        </Stack>

        {/* Data Grid - P0-001: pagination as object with mode: 'server' to match CustomTable contract */}
        <CustomTable
          rows={rows}
          columns={columns}
          actions={actions}
          loading={isLoading}
          pagination={{
            enabled: true,
            mode: 'server',
            pageSize,
            pageSizeOptions: [10, 25, 50, 100],
            rowCount: paginationMeta.totalCount,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          getRowId={(row) => row.id}
        />
      </Card>

      {/* Stock Details Dialog */}
      <StockDetailsDialog
        open={detailsDialogOpen}
        itemId={detailsDialogItemId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogItemId(null);
        }}
        onUpdate={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogItemId(null);
          if (detailsDialogItemId) {
            handleUpdate(detailsDialogItemId);
          }
        }}
        onAdjust={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogItemId(null);
          if (detailsDialogItemId) {
            handleAdjust(detailsDialogItemId);
          }
        }}
      />

      {/* Update Stock Dialog */}
      <UpdateStockDialog
        open={updateDialogOpen}
        itemId={updateDialogItemId}
        onClose={() => {
          setUpdateDialogOpen(false);
          setUpdateDialogItemId(null);
        }}
        onSuccess={handleStockSuccess}
      />

      {/* Adjust Stock Dialog */}
      <AdjustStockDialog
        open={adjustDialogOpen}
        itemId={adjustDialogItemId}
        onClose={() => {
          setAdjustDialogOpen(false);
          setAdjustDialogItemId(null);
        }}
        onSuccess={handleStockSuccess}
      />
    </Box>
  );
}

