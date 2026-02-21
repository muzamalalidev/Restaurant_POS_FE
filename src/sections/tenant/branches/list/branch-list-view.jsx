'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';

import { CustomTable } from 'src/components/custom-table';
import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { Iconify } from 'src/components/iconify';

import { useGetBranchesQuery, useDeleteBranchMutation, useToggleBranchActiveMutation } from 'src/store/api/branches-api';
import { useGetTenantsQuery } from 'src/store/api/tenants-api';
import { BranchFormDialog } from '../form/branch-form-dialog';
import { BranchDetailsDialog } from '../components/branch-details-dialog';

// ----------------------------------------------------------------------

/**
 * Branch List View Component
 * 
 * Displays all branches in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 */
export function BranchListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogBranchId, setFormDialogBranchId] = useState(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogBranchId, setDetailsDialogBranchId] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBranchId, setDeleteBranchId] = useState(null);
  const [deleteBranchName, setDeleteBranchName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // TenantId filter state
  const [tenantId, setTenantId] = useState(null);

  // Minimal form for search (required for Field.Text)
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal form for tenant filter (required for Field.Autocomplete)
  const tenantFilterForm = useForm({
    defaultValues: {
      tenantId: null,
    },
  });

  // Watch search form value changes and sync with searchTerm state (one-way sync to avoid circular updates)
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Helper function to compare tenant objects by ID
  const getTenantId = useCallback((tenant) => {
    if (!tenant) return null;
    if (typeof tenant === 'object' && tenant !== null && 'id' in tenant) {
      return tenant.id;
    }
    return tenant;
  }, []);

  // Sync form value with tenantId state (only when state actually changes, not on form updates)
  const isSyncingRef = useRef(false);
  useEffect(() => {
    if (isSyncingRef.current) {
      // Skip if we're in the middle of syncing from form to state
      return;
    }
    const currentFormValue = tenantFilterForm.getValues('tenantId');
    const stateId = getTenantId(tenantId);
    const formId = getTenantId(currentFormValue);
    
    // Only update form if the IDs are different
    if (stateId !== formId) {
      tenantFilterForm.setValue('tenantId', tenantId, { shouldValidate: false, shouldDirty: false });
    }
  }, [tenantId, tenantFilterForm, getTenantId]);

  // Watch form value changes and sync with tenantId state
  const watchedTenantId = tenantFilterForm.watch('tenantId');
  useEffect(() => {
    const watchedId = getTenantId(watchedTenantId);
    const currentId = getTenantId(tenantId);
    
    // Compare by ID, not by object reference
    if (watchedId !== currentId) {
      isSyncingRef.current = true;
      setTenantId(watchedTenantId);
      setPageNumber(1);
      // Reset sync flag after state update
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [watchedTenantId, tenantId, getTenantId]);

  // Fetch tenants for dropdown (without pagination to get all tenants)
  const { data: tenantsResponse } = useGetTenantsQuery({
    pageSize: 1000, // Large page size to get all tenants
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to page 1 when search changes
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch branches with pagination and search params
  const queryParams = useMemo(
    () => {
      // Extract tenantId: if it's an object, get the id; if it's a string, use it directly
      const tenantIdValue = typeof tenantId === 'object' && tenantId !== null
        ? tenantId.id
        : tenantId;
      
      return {
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        tenantId: tenantIdValue || undefined,
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, tenantId]
  );

  const { data: branchesResponse, isLoading, error, refetch } = useGetBranchesQuery(queryParams);

  // Extract data from paginated response
  const branches = useMemo(() => {
    if (!branchesResponse) return [];
    return branchesResponse.data || [];
  }, [branchesResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!branchesResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: branchesResponse.totalCount || 0,
      totalPages: branchesResponse.totalPages || 0,
      hasPreviousPage: branchesResponse.hasPreviousPage || false,
      hasNextPage: branchesResponse.hasNextPage || false,
    };
  }, [branchesResponse]);

  // Mutations
  const [deleteBranch] = useDeleteBranchMutation();
  const [toggleBranchActive, { isLoading: isTogglingActive }] = useToggleBranchActiveMutation();

  // Track which branch is being toggled
  const [togglingBranchId, setTogglingBranchId] = useState(null);

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogBranchId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((branchId) => {
    setFormDialogMode('edit');
    setFormDialogBranchId(branchId);
    setFormDialogOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((branchId) => {
    setDetailsDialogBranchId(branchId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((branch) => {
    setDeleteBranchId(branch.id);
    setDeleteBranchName(branch.name);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteBranchId) return;
    
    try {
      await deleteBranch(deleteBranchId).unwrap();
      toast.success('Branch deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteBranchId(null);
      setDeleteBranchName(null);
    } catch (err) {
      // P1-005 FIX: Distinguish error types for better UX
      const errorStatus = err?.status || err?.data?.status;
      let errorMessage;
      
      if (errorStatus === 404) {
        errorMessage = err?.data?.message || 'Branch not found';
      } else if (errorStatus >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err?.data?.message || 'Failed to delete branch';
      }
      
      toast.error(errorMessage);
      console.error('Failed to delete branch:', err);
    }
  }, [deleteBranchId, deleteBranch]);

  // Handle toggle active
  const handleToggleActive = useCallback(async (branchId) => {
    // P1-011 FIX: Prevent rapid clicks - disable immediately
    if (togglingBranchId === branchId) {
      return; // Already toggling this branch
    }
    
    setTogglingBranchId(branchId);
    try {
      await toggleBranchActive(branchId).unwrap();
      toast.success('Branch status updated successfully');
    } catch (err) {
      // P1-005 FIX: Distinguish error types for better UX
      const errorStatus = err?.status || err?.data?.status;
      let errorMessage;
      
      if (errorStatus === 404) {
        errorMessage = err?.data?.message || 'Branch not found';
      } else if (errorStatus >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err?.data?.message || 'Failed to update branch status';
      }
      
      toast.error(errorMessage);
      console.error('Failed to toggle branch active status:', err);
    } finally {
      setTogglingBranchId(null);
    }
  }, [toggleBranchActive, togglingBranchId]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogBranchId(null);
    toast.success(`Branch ${action} successfully`);
    // P0-002 FIX: Explicitly refetch branches to ensure list updates after create/update
    // RTK Query cache invalidation should handle this, but explicit refetch ensures immediate update
    refetch();
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogBranchId(null);
  }, []);

  // Get primary phone from phoneNumbers array or primaryPhone field
  const getPrimaryPhone = (branch) => {
    if (branch.primaryPhone) return branch.primaryPhone;
    if (!branch.phoneNumbers || branch.phoneNumbers.length === 0) return '-';
    const primary = branch.phoneNumbers.find((p) => p.isPrimary && p.isActive);
    if (primary) return primary.phoneNumber;
    return branch.phoneNumbers[0]?.phoneNumber || '-';
  };

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

  // Prepare table rows
  const rows = useMemo(() => {
    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address || '-',
      tenantName: branch.tenantName || '-',
      primaryPhone: getPrimaryPhone(branch),
      isActive: branch.isActive,
      phoneNumbers: branch.phoneNumbers || [],
    }));
  }, [branches]);

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
        field: 'tenantName',
        headerName: 'Tenant',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'address',
        headerName: 'Address',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'primaryPhone',
        headerName: 'Primary Phone',
        flex: 1,
        sortable: true,
        filterable: true,
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
            disabled={togglingBranchId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `branch-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'branch'}`,
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick]
  );

  // Error state
  if (error) {
    return (
      <EmptyContent
        title="Error loading branches"
        description={error?.data?.message || 'An error occurred while loading branches'}
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
              placeholder="Search by name or address..."
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
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ ml: 'auto' }}
          >
            Create Branch
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          pagination={{
            enabled: true,
            mode: 'server',
            pageSize,
            pageSizeOptions: [10, 25, 50, 100],
            rowCount: paginationMeta.totalCount,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          sorting={{
            enabled: true,
            mode: 'client', // Keep client-side sorting for now (backend doesn't support custom sorting)
          }}
          filtering={{
            enabled: false, // Disable client-side filtering (using server-side search)
            quickFilter: false,
          }}
          toolbar={{
            show: false, // Hide default toolbar, using custom search/filter bar above
          }}
          getRowId={(row) => row.id}
          emptyContent={
            <EmptyContent
              title="No branches found"
              description={
                searchTerm || tenantId
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating a new branch"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <BranchFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        branchId={formDialogBranchId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        tenantOptions={tenantOptions}
      />

      {/* Details Dialog */}
      <BranchDetailsDialog
        open={detailsDialogOpen}
        branchId={detailsDialogBranchId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogBranchId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Branch"
        content={
          deleteBranchName
            ? `Are you sure you want to delete "${deleteBranchName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this branch? This action cannot be undone.'
        }
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteBranchId(null);
          setDeleteBranchName(null);
        }}
      />
    </Box>
  );
}

