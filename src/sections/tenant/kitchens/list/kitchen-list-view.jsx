'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import {
  useGetAllKitchensQuery,
  useDeleteKitchenMutation,
  useToggleKitchenActiveMutation,
} from 'src/store/api/kitchens-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { KitchenFormDialog } from '../form/kitchen-form-dialog';
import { KitchenDetailsDialog } from '../components/kitchen-details-dialog';
import {
  canEdit,
  canDelete,
  canToggleActive,
  getActiveStatusLabel,
  getActiveStatusColor,
} from '../utils/kitchen-helpers';

// ----------------------------------------------------------------------

/**
 * Helper function to extract ID from object or string
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return value.id;
  }
  return value;
};

// ----------------------------------------------------------------------

/**
 * Kitchen List View Component
 * 
 * Displays all kitchens in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view/toggle/delete operations.
 * Filter precedence: branchId takes precedence over tenantId.
 * P1-003: Tenant/branch isolation is enforced by the backend (tenantId/branchId in API params and body).
 * P2-001: Role-based visibility for Create/Edit/Delete/Toggle can be applied when backend supports it.
 */
export function KitchenListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogKitchenId, setFormDialogKitchenId] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogKitchenId, setDetailsDialogKitchenId] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteKitchenId, setDeleteKitchenId] = useState(null);
  const [deleteKitchenName, setDeleteKitchenName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state (with precedence: branchId > tenantId)
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);

  // Minimal form for search
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal forms for filters
  const tenantFilterForm = useForm({
    defaultValues: {
      tenantId: null,
    },
  });

  const branchFilterForm = useForm({
    defaultValues: {
      branchId: null,
    },
  });

  // Watch search form value changes
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

  // Sync tenant filter form with state
  const isSyncingTenantRef = useRef(false);
  useEffect(() => {
    if (isSyncingTenantRef.current) return;
    const currentFormValue = tenantFilterForm.getValues('tenantId');
    const stateId = getTenantId(tenantId);
    const formId = getTenantId(currentFormValue);
    
    if (stateId !== formId) {
      tenantFilterForm.setValue('tenantId', tenantId, { shouldValidate: false, shouldDirty: false });
    }
  }, [tenantId, tenantFilterForm, getTenantId]);

  // Watch tenant filter form value changes
  const watchedTenantId = tenantFilterForm.watch('tenantId');
  useEffect(() => {
    const watchedId = getTenantId(watchedTenantId);
    const currentId = getTenantId(tenantId);
    
    if (watchedId !== currentId) {
      isSyncingTenantRef.current = true;
      setTenantId(watchedTenantId);
      // When tenantId is selected, clear branchId if branch doesn't belong to tenant
      // But we'll let the branch filter handle its own validation
      setPageNumber(1);
      setTimeout(() => {
        isSyncingTenantRef.current = false;
      }, 0);
    }
  }, [watchedTenantId, tenantId, getTenantId]);

  // Sync branch filter form with state
  const isSyncingBranchRef = useRef(false);
  useEffect(() => {
    if (isSyncingBranchRef.current) return;
    const currentFormValue = branchFilterForm.getValues('branchId');
    const stateId = getId(branchId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      branchFilterForm.setValue('branchId', branchId, { shouldValidate: false, shouldDirty: false });
    }
  }, [branchId, branchFilterForm]);

  // Watch branch filter form value changes
  const watchedBranchId = branchFilterForm.watch('branchId');
  useEffect(() => {
    const watchedId = getId(watchedBranchId);
    const currentId = getId(branchId);
    
    if (watchedId !== currentId) {
      isSyncingBranchRef.current = true;
      setBranchId(watchedBranchId);
      // When branchId is selected, clear tenantId (branchId takes precedence)
      if (watchedBranchId) {
        setTenantId(null);
        tenantFilterForm.setValue('tenantId', null, { shouldValidate: false, shouldDirty: false });
      }
      setPageNumber(1);
      setTimeout(() => {
        isSyncingBranchRef.current = false;
      }, 0);
    }
  }, [watchedBranchId, branchId, tenantFilterForm]);

  const selectedTenantId = getTenantId(tenantId);
  const { data: tenantsDropdown } = useGetTenantsDropdownQuery();
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantsDropdown]);

  const { data: branchesDropdown } = useGetBranchesDropdownQuery(
    { tenantId: selectedTenantId || undefined },
    { skip: false }
  );
  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch kitchens with pagination, search, and filter params
  const queryParams = useMemo(
    () => {
      // Extract branchId: if it's an object, get the id; if it's a string, use it directly
      const branchIdValue = getId(branchId);

      // Extract tenantId: only include if branchId is not set (branchId takes precedence)
      const tenantIdValue = branchIdValue
        ? undefined
        : getTenantId(tenantId);

      return {
        branchId: branchIdValue || undefined,
        tenantId: tenantIdValue || undefined,
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
      };
    },
    [branchId, tenantId, pageNumber, pageSize, debouncedSearchTerm, getTenantId]
  );

  const {
    data: kitchensResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetAllKitchensQuery(queryParams);

  // Extract kitchens and pagination metadata
  const kitchens = useMemo(() => {
    if (!kitchensResponse) return [];
    return kitchensResponse.data || [];
  }, [kitchensResponse]);

  // P1-001: include pageNumber and pageSize for table consistency
  const paginationMeta = useMemo(() => {
    if (!kitchensResponse) {
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
      pageNumber: kitchensResponse.pageNumber ?? pageNumber,
      pageSize: kitchensResponse.pageSize ?? pageSize,
      totalCount: kitchensResponse.totalCount || 0,
      totalPages: kitchensResponse.totalPages || 0,
      hasPreviousPage: kitchensResponse.hasPreviousPage || false,
      hasNextPage: kitchensResponse.hasNextPage || false,
    };
  }, [kitchensResponse, pageNumber, pageSize]);

  // Mutations
  const [deleteKitchen, { isLoading: isDeleting }] = useDeleteKitchenMutation();
  const [toggleKitchenActive, { isLoading: isTogglingActive }] = useToggleKitchenActiveMutation();

  // Track which kitchen is being toggled
  const [togglingKitchenId, setTogglingKitchenId] = useState(null);
  // P0-004: Ref guard to prevent rapid toggle clicks
  const inFlightIdsRef = useRef(new Set());

  // Helper to get tenant name for display
  const getTenantName = useCallback(
    (tenantIdValue) => {
      const tenant = tenantOptions.find((opt) => opt.id === tenantIdValue);
      return tenant?.label || 'Unknown Tenant';
    },
    [tenantOptions]
  );

  // Helper to get branch name for display
  const getBranchName = useCallback(
    (branchIdValue) => {
      const branch = branchOptions.find((opt) => opt.id === branchIdValue);
      return branch?.label || 'Unknown Branch';
    },
    [branchOptions]
  );

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogKitchenId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((kitchenId) => {
    setFormDialogMode('edit');
    setFormDialogKitchenId(kitchenId);
    setFormDialogOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((kitchenId) => {
    setDetailsDialogKitchenId(kitchenId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((kitchen) => {
    setDeleteKitchenId(kitchen.id);
    setDeleteKitchenName(kitchen.name);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteKitchenId) return;

    try {
      await deleteKitchen(deleteKitchenId).unwrap();
      toast.success('Kitchen deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteKitchenId(null);
      setDeleteKitchenName(null);
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete kitchen',
        notFoundMessage: 'Kitchen not found',
      });
      toast.error(message);
      console.error('Failed to delete kitchen:', err);
    }
  }, [deleteKitchenId, deleteKitchen]);

  // Handle toggle active (P0-004: ref guard prevents rapid clicks)
  const handleToggleActive = useCallback(async (kitchenId) => {
    if (inFlightIdsRef.current.has(kitchenId)) return;
    inFlightIdsRef.current.add(kitchenId);
    setTogglingKitchenId(kitchenId);
    try {
      await toggleKitchenActive(kitchenId).unwrap();
      toast.success('Kitchen status updated successfully');
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update kitchen status',
        notFoundMessage: 'Kitchen not found',
      });
      toast.error(message);
      console.error('Failed to toggle kitchen active status:', err);
    } finally {
      inFlightIdsRef.current.delete(kitchenId);
      setTogglingKitchenId(null);
    }
  }, [toggleKitchenActive]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogKitchenId(null);
    toast.success(`Kitchen ${action} successfully`);
    refetch();
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogKitchenId(null);
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

  // Check if both tenant and branch are selected (show warning)
  const showPrecedenceWarning = useMemo(() => !!getId(branchId) && !!getTenantId(tenantId), [branchId, tenantId, getTenantId]);

  // Prepare table rows
  const rows = useMemo(() => kitchens.map((kitchen) => ({
      id: kitchen.id,
      name: kitchen.name,
      tenantName: getTenantName(kitchen.tenantId),
      branchName: getBranchName(kitchen.branchId),
      description: kitchen.description || '-',
      location: kitchen.location || '-',
      isActive: kitchen.isActive,
    })), [kitchens, getTenantName, getBranchName]);

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
        field: 'tenantName',
        headerName: 'Tenant',
        flex: 1.5,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'branchName',
        headerName: 'Branch',
        flex: 1.5,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 2,
        sortable: false,
        renderCell: (params) => (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 300,
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'location',
        headerName: 'Location',
        flex: 1.5,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
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
          <Tooltip title={row.isActive ? 'Deactivate Kitchen' : 'Activate Kitchen'}>
            <Switch
              checked={!!row.isActive}
              size="small"
              disabled={togglingKitchenId === row.id || isTogglingActive}
              onChange={(event) => {
                event.stopPropagation();
                handleToggleActive(row.id);
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              slotProps={{
                input: {
                  id: `kitchen-toggle-active-${row.id}`,
                  'aria-label': `Toggle active status for ${row.name || 'kitchen'}`,
                },
              }}
            />
          </Tooltip>
        ),
        order: 3,
        visible: (row) => canToggleActive(row.isActive),
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingKitchenId, isTogglingActive]
  );

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        {/* Header with Create Button */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Kitchens
          </Typography>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ minHeight: 44 }}
          >
            Create Kitchen
          </Field.Button>
        </Stack>

        {/* Filters */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2}>
            {/* Precedence Warning */}
            {showPrecedenceWarning && (
              <Alert severity="info">
                Branch filter takes precedence over tenant filter. Only branch filter is applied.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Tenant Filter */}
              <FormProvider {...tenantFilterForm}>
                <Field.Autocomplete
                  name="tenantId"
                  label="Tenant"
                  options={tenantOptions}
                  disabled={!!getId(branchId)} // Disable if branch is selected
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.label || option.id || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id;
                  }}
                  slotProps={{
                    textField: {
                      placeholder: 'Select tenant',
                      size: 'small',
                    },
                  }}
                  sx={{ flex: 1 }}
                />
              </FormProvider>

              {/* Branch Filter */}
              <FormProvider {...branchFilterForm}>
                <Field.Autocomplete
                  name="branchId"
                  label="Branch"
                  options={branchOptions}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.label || option.id || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id;
                  }}
                  slotProps={{
                    textField: {
                      placeholder: 'Select branch',
                      size: 'small',
                    },
                  }}
                  sx={{ flex: 1 }}
                />
              </FormProvider>

              {/* Search */}
              <FormProvider {...searchForm}>
                <Field.Text
                  name="searchTerm"
                  placeholder="Search by Name, Description, or Location..."
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
                      size: 'small',
                    },
                  }}
                  sx={{ flex: 1 }}
                />
              </FormProvider>
            </Stack>
          </Stack>
        </Card>

        {/* Table - P0-005: show error in table area so filters/Create remain; P0-001: sorting disabled with server pagination */}
        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading || isFetching}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="kitchens"
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
              title="No kitchens found"
              description={
                searchTerm || getId(branchId) || getTenantId(tenantId)
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating a new kitchen"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <KitchenFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        kitchenId={formDialogKitchenId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        tenantOptions={tenantOptions}
      />

      {/* Details Dialog */}
      <KitchenDetailsDialog
        open={detailsDialogOpen}
        kitchenId={detailsDialogKitchenId}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogKitchenId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Kitchen?"
        content={`Are you sure you want to delete kitchen "${deleteKitchenName}"? This action cannot be undone.`}
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isDeleting} loading={isDeleting}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteKitchenId(null);
          setDeleteKitchenName(null);
        }}
      />
    </Box>
  );
}

