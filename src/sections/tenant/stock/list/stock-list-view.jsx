'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useGetItemsQuery } from 'src/store/api/items-api';
import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetCategoriesDropdownQuery } from 'src/store/api/categories-api';

import { Label } from 'src/components/label';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { UpdateStockDialog } from '../form/update-stock-dialog';
import { AdjustStockDialog } from '../form/adjust-stock-dialog';
import { StockDetailsDialog } from '../components/stock-details-dialog';
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
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateDialogRecord, setUpdateDialogRecord] = useState(null);

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustDialogRecord, setAdjustDialogRecord] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

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
    { skip: false }
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

  // Filter items by low stock if enabled
  const filteredItems = useMemo(() => {
    if (!lowStockOnly) return items;
    return items.filter((item) => isLowStock(item.stockQuantity, item.lowStockThreshold ?? 10));
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
  const handleView = useCallback((row) => {
    const record = filteredItems.find((i) => i.id === row.id) ?? null;
    if (!record) return;
    setDetailsDialogRecord({
      ...record,
      lowStockThreshold: record.lowStockThreshold ?? 10,
    });
    setDetailsDialogOpen(true);
  }, [filteredItems]);

  // Handle update stock
  const handleUpdate = useCallback((row) => {
    const record = filteredItems.find((i) => i.id === row.id) ?? null;
    if (!record) return;
    setUpdateDialogRecord({ ...record, lowStockThreshold: record.lowStockThreshold ?? 10 });
    setUpdateDialogOpen(true);
  }, [filteredItems]);

  // Handle adjust stock
  const handleAdjust = useCallback((row) => {
    const record = filteredItems.find((i) => i.id === row.id) ?? null;
    if (!record) return;
    setAdjustDialogRecord({ ...record, lowStockThreshold: record.lowStockThreshold ?? 10 });
    setAdjustDialogOpen(true);
  }, [filteredItems]);

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
    setPageNumber(1); // Reset to first page when clearing search
  }, [searchForm]);

 

  const rows = useMemo(() => filteredItems.map((item) => {
    const threshold = item.lowStockThreshold ?? 10;
    return {
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.categoryName ?? '-',
      tenantId: item.tenantId,
      tenantName: item.tenantName ?? '-',
      stockQuantity: item.stockQuantity,
      stockQuantityFormatted: formatStockQuantity(item.stockQuantity),
      isLowStock: isLowStock(item.stockQuantity, threshold),
      stockColor: getStockColor(item.stockQuantity, threshold),
      isActive: item.isActive,
      isAvailable: item.isAvailable,
      lowStockThreshold: threshold,
    };
  }), [filteredItems]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Item Name',
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
        field: 'stockQuantityFormatted',
        headerName: 'Stock Quantity',
        flex: 1,
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
        label: 'View Details',
        icon: 'solar:eye-bold',
        onClick: (row) => handleView(row),
        order: 1,
      },
      {
        id: 'update',
        label: 'Update Stock',
        icon: 'solar:pen-bold',
        onClick: (row) => handleUpdate(row),
        order: 2,
      },
      {
        id: 'adjust',
        label: 'Adjust Stock',
        icon: 'solar:add-circle-bold',
        onClick: (row) => handleAdjust(row),
        order: 3,
      },
    ],
    [handleView, handleUpdate, handleAdjust]
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
              size="small"
              disabled={isCategorySelected}
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
              size="small"
              sx={{ minWidth: { sm: 200 } }}
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
          error={error}
          onRetry={refetch}
          errorEntityLabel="stock"
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
              title="No stock found"
              description={
                searchTerm || categoryId || tenantId
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating a new stock item'
              }
            />
          }
        />
      </Card>

      {/* Stock Details Dialog */}
      <StockDetailsDialog
        open={detailsDialogOpen}
        record={detailsDialogRecord}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogRecord(null);
        }}
      />

      {/* Update Stock Dialog */}
      <UpdateStockDialog
        open={updateDialogOpen}
        record={updateDialogRecord}
        onClose={() => {
          setUpdateDialogOpen(false);
          setUpdateDialogRecord(null);
        }}
        onSuccess={handleStockSuccess}
      />

      {/* Adjust Stock Dialog */}
      <AdjustStockDialog
        open={adjustDialogOpen}
        record={adjustDialogRecord}
        onClose={() => {
          setAdjustDialogOpen(false);
          setAdjustDialogRecord(null);
        }}
        onSuccess={handleStockSuccess}
      />
    </Box>
  );
}

