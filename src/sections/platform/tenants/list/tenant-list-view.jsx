'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { Card } from '@mui/material';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsQuery, useDeleteTenantMutation, useToggleTenantActiveMutation } from 'src/store/api/tenants-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { TenantFormDialog } from '../form/tenant-form-dialog';
import { TenantDetailsDialog } from '../components/tenant-details-dialog';

// ----------------------------------------------------------------------

/**
 * Tenant List View Component
 * 
 * Displays all tenants in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 */
export function TenantListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogTenantId, setFormDialogTenantId] = useState(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogTenantId, setDetailsDialogTenantId] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTenantId, setDeleteTenantId] = useState(null);
  const [deleteTenantName, setDeleteTenantName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // OwnerId filter state
  const [ownerId, setOwnerId] = useState(null);

  // Minimal form for search (required for Field.Text)
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal form for owner filter (required for Field.Autocomplete)
  const ownerFilterForm = useForm({
    defaultValues: {
      ownerId: null,
    },
  });

  // Watch search form value changes and sync with searchTerm state (one-way sync to avoid circular updates)
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Sync form value with ownerId state
  useEffect(() => {
    ownerFilterForm.setValue('ownerId', ownerId);
  }, [ownerId, ownerFilterForm]);

  // Watch form value changes and sync with ownerId state
  const watchedOwnerId = ownerFilterForm.watch('ownerId');
  useEffect(() => {
    if (watchedOwnerId !== ownerId) {
      setOwnerId(watchedOwnerId);
      setPageNumber(1);
    }
  }, [watchedOwnerId, ownerId]);

  // Owner options (empty for now, will be populated from API in future)
  const ownerOptions = useMemo(() => 
    // TODO: Fetch owners from API when available
    // Example:
    // const { data: owners } = useGetOwnersQuery();
    // return owners?.map(owner => ({ id: owner.id, label: owner.name || owner.email || owner.id })) || [];
     []
  , []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to page 1 when search changes
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch tenants with pagination and search params
  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      searchTerm: debouncedSearchTerm.trim() || undefined,
      ownerId: ownerId || undefined,
    }),
    [pageNumber, pageSize, debouncedSearchTerm, ownerId]
  );

  const { data: tenantsResponse, isLoading, error, refetch } = useGetTenantsQuery(queryParams);

  // Extract data from paginated response
  const tenants = useMemo(() => {
    if (!tenantsResponse) return [];
    return tenantsResponse.data || [];
  }, [tenantsResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!tenantsResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: tenantsResponse.totalCount || 0,
      totalPages: tenantsResponse.totalPages || 0,
      hasPreviousPage: tenantsResponse.hasPreviousPage || false,
      hasNextPage: tenantsResponse.hasNextPage || false,
    };
  }, [tenantsResponse]);

  // Mutations
  const [deleteTenant] = useDeleteTenantMutation();
  const [toggleTenantActive, { isLoading: _isTogglingActive }] = useToggleTenantActiveMutation();

  // Track which tenant is being toggled
  const [togglingTenantId, setTogglingTenantId] = useState(null);

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogTenantId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((tenantId) => {
    setFormDialogMode('edit');
    setFormDialogTenantId(tenantId);
    setFormDialogOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((tenantId) => {
    setDetailsDialogTenantId(tenantId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((tenant) => {
    setDeleteTenantId(tenant.id);
    setDeleteTenantName(tenant.name);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTenantId) return;
    
    try {
      await deleteTenant(deleteTenantId).unwrap();
      toast.success('Tenant deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteTenantId(null);
      setDeleteTenantName(null);
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete tenant',
      });
      toast.error(message);
      console.error('Failed to delete tenant:', err);
    }
  }, [deleteTenantId, deleteTenant]);

  // Handle toggle active
  const handleToggleActive = useCallback(async (tenantId) => {
    setTogglingTenantId(tenantId);
    try {
      await toggleTenantActive(tenantId).unwrap();
      toast.success('Tenant status updated successfully');
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update tenant status',
      });
      toast.error(message);
      console.error('Failed to toggle tenant active status:', err);
    } finally {
      setTogglingTenantId(null);
    }
  }, [toggleTenantActive]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogTenantId(null);
    toast.success(`Tenant ${action} successfully`);
  }, []);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogTenantId(null);
  }, []);

  // Get primary phone from phoneNumbers array
  const getPrimaryPhone = (phoneNumbers) => {
    if (!phoneNumbers || phoneNumbers.length === 0) return '-';
    const primary = phoneNumbers.find((p) => p.isPrimary && p.isActive);
    if (primary) return primary.phoneNumber;
    return phoneNumbers[0]?.phoneNumber || '-';
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
  const rows = useMemo(() => tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description || '-',
      primaryPhone: getPrimaryPhone(tenant.phoneNumbers),
      ownerId: tenant.ownerId || '-',
      isActive: tenant.isActive,
      phoneNumbers: tenant.phoneNumbers || [],
    })), [tenants]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        // minWidth: 200,
        sortable: true,
        filterable: true,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        // minWidth: 200,
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
        // width: 180,
        sortable: true,
        filterable: true,
      },
      {
        field: 'ownerId',
        headerName: 'Owner',
        flex: 1,
        // width: 200,
        sortable: true,
        filterable: true,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        flex: 1,
        // width: 120,
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
            disabled={togglingTenantId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `tenant-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'tenant'}`,
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingTenantId]
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
        <FormProvider {...ownerFilterForm}>
          <Field.Autocomplete
            name="ownerId"
            label="Owner"
            options={ownerOptions}
            getOptionLabel={(option) => {
              if (!option) return '';
              return option.label || option.name || option.email || option.id || '';
            }}
            isOptionEqualToValue={(option, value) => {
              if (!option || !value) return option === value;
              return option.id === value.id;
            }}
            slotProps={{
              textField: {
                size: 'small',
                placeholder: 'All Owners',
              },
            }}
            sx={{ minWidth: { sm: 200 } }}
            // TODO: When owner API is available, update ownerOptions:
            // const { data: owners } = useGetOwnersQuery();
            // const ownerOptions = owners?.map(owner => ({ 
            //   id: owner.id, 
            //   label: owner.name || owner.email || owner.id 
            // })) || [];
          />
        </FormProvider>
        <Field.Button
          variant="contained"
          startIcon="mingcute:add-line"
          onClick={handleCreate}
          sx={{ ml: 'auto' }}
        >
          Create Tenant
        </Field.Button>
      </Stack>


      <CustomTable
        rows={rows}
        columns={columns}
        loading={isLoading}
        actions={actions}
        error={error}
        onRetry={refetch}
        errorEntityLabel="tenants"
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
            title="No tenants found"
            description={
              searchTerm || ownerId
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating a new tenant"
            }
          />
        }
      />

      </Card>

      {/* Form Dialog */}
      <TenantFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        tenantId={formDialogTenantId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Details Dialog */}
      <TenantDetailsDialog
        open={detailsDialogOpen}
        tenantId={detailsDialogTenantId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogTenantId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Tenant"
        content={
          deleteTenantName
            ? `Are you sure you want to delete "${deleteTenantName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this tenant? This action cannot be undone.'
        }
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTenantId(null);
          setDeleteTenantName(null);
        }}
      />
    </Box>
  );
}

