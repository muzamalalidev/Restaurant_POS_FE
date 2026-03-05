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

import { can } from 'src/utils/permissions';
import { getApiErrorMessage } from 'src/utils/api-error-message';
import { ACTION_PERMISSIONS } from 'src/utils/action-permissions';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetBranchesQuery, useDeleteBranchMutation, useToggleBranchActiveMutation } from 'src/store/api/branches-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { BranchFormDialog } from '../form/branch-form-dialog';
import { BranchDetailsDialog } from '../components/branch-details-dialog';

// ----------------------------------------------------------------------

/**
 * Branch List View Component
 *
 * Displays all branches in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 * Platform scope: tenant filter and tenant in form.
 */
export function BranchListView() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBranchId, setDeleteBranchId] = useState(null);
  const [deleteBranchName, setDeleteBranchName] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [tenantId, setTenantId] = useState(null);

  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  const tenantFilterForm = useForm({
    defaultValues: {
      tenantId: null,
    },
  });

  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  const getTenantId = useCallback((tenant) => {
    if (!tenant) return null;
    if (typeof tenant === 'object' && tenant !== null && 'id' in tenant) {
      return tenant.id;
    }
    return tenant;
  }, []);

  const isSyncingRef = useRef(false);
  useEffect(() => {
    if (isSyncingRef.current) return;
    const currentFormValue = tenantFilterForm.getValues('tenantId');
    const stateId = getTenantId(tenantId);
    const formId = getTenantId(currentFormValue);
    if (stateId !== formId) {
      tenantFilterForm.setValue('tenantId', tenantId, { shouldValidate: false, shouldDirty: false });
    }
  }, [tenantId, tenantFilterForm, getTenantId]);

  const watchedTenantId = tenantFilterForm.watch('tenantId');
  useEffect(() => {
    const watchedId = getTenantId(watchedTenantId);
    const currentId = getTenantId(tenantId);
    if (watchedId !== currentId) {
      isSyncingRef.current = true;
      setTenantId(watchedTenantId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [watchedTenantId, tenantId, getTenantId]);

  const { data: tenantsDropdown } = useGetTenantsDropdownQuery();
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({
      id: item.key,
      label: item.value || item.key,
    }));
  }, [tenantsDropdown]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = useMemo(
    () => {
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

  const branches = useMemo(() => {
    if (!branchesResponse) return [];
    return branchesResponse.data || [];
  }, [branchesResponse]);

  const paginationMeta = useMemo(() => {
    if (!branchesResponse) {
      return {
        pageNumber: 1,
        pageSize: DEFAULT_PAGINATION.pageSize,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      pageNumber: branchesResponse.pageNumber ?? pageNumber,
      pageSize: branchesResponse.pageSize ?? pageSize,
      totalCount: branchesResponse.totalCount || 0,
      totalPages: branchesResponse.totalPages || 0,
      hasPreviousPage: branchesResponse.hasPreviousPage || false,
      hasNextPage: branchesResponse.hasNextPage || false,
    };
  }, [branchesResponse, pageNumber, pageSize]);

  const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();
  const [toggleBranchActive, { isLoading: _isTogglingActive }] = useToggleBranchActiveMutation();
  const [togglingBranchId, setTogglingBranchId] = useState(null);
  const inFlightIdsRef = useRef(new Set());

  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    const record = branches.find((b) => b.id === row.id) ?? null;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [branches]);

  const handleView = useCallback((row) => {
    const record = branches.find((b) => b.id === row.id) ?? null;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [branches]);

  const handleDeleteClick = useCallback((branch) => {
    setDeleteBranchId(branch.id);
    setDeleteBranchName(branch.name);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteBranchId) return;
    try {
      await deleteBranch(deleteBranchId).unwrap();
      toast.success('Branch deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteBranchId(null);
      setDeleteBranchName(null);
      if (branches.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete branch',
        notFoundMessage: 'Branch not found or already deleted.',
      });
      toast.error(message);
    }
  }, [deleteBranchId, deleteBranch, branches.length, pageNumber]);

  const handleToggleActive = useCallback(async (branchId) => {
    if (inFlightIdsRef.current.has(branchId)) return;
    inFlightIdsRef.current.add(branchId);
    setTogglingBranchId(branchId);
    try {
      await toggleBranchActive(branchId).unwrap();
      toast.success('Branch status updated successfully');
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update branch status',
        notFoundMessage: 'Branch not found or already deleted.',
      });
      toast.error(message);
    } finally {
      inFlightIdsRef.current.delete(branchId);
      setTogglingBranchId(null);
    }
  }, [toggleBranchActive]);

  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    toast.success(`Branch ${action} successfully`);
    refetch();
  }, [refetch]);

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
  }, []);

  const getPrimaryPhone = (branch) => {
    if (branch.primaryPhone) return branch.primaryPhone;
    if (!branch.phoneNumbers || branch.phoneNumbers.length === 0) return '-';
    const primary = branch.phoneNumbers.find((p) => p.isPrimary && p.isActive);
    if (primary) return primary.phoneNumber;
    return branch.phoneNumbers[0]?.phoneNumber || '-';
  };

  const handlePageChange = useCallback((newPage) => {
    setPageNumber(newPage + 1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    searchForm.setValue('searchTerm', '');
    setSearchTerm('');
    setPageNumber(1);
  }, [searchForm]);

  const rows = useMemo(() => branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    address: branch.address || '-',
    tenantName: branch.tenantName || '-',
    primaryPhone: getPrimaryPhone(branch),
    isActive: branch.isActive,
    phoneNumbers: branch.phoneNumbers || [],
  })), [branches]);

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
      },
      {
        field: 'tenantName',
        headerName: 'Tenant',
        flex: 1,
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
        permission: () => can(ACTION_PERMISSIONS.Branches.update),
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
        permission: () => can(ACTION_PERMISSIONS.Branches.toggleActive),
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => handleDeleteClick(row),
        order: 4,
        permission: () => can(ACTION_PERMISSIONS.Branches.delete),
      },
    ],
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingBranchId]
  );

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
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
          {can(ACTION_PERMISSIONS.Branches.create) && (
            <Field.Button
              variant="contained"
              startIcon="mingcute:add-line"
              onClick={handleCreate}
              sx={{ ml: 'auto', minHeight: 44 }}
            >
              Create Branch
            </Field.Button>
          )}
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="branches"
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
              title="No branches found"
              description={
                searchTerm || tenantId
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating a new branch'
              }
            />
          }
        />
      </Card>

      <BranchFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        record={formDialogRecord}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        tenantOptions={tenantOptions}
      />

      <BranchDetailsDialog
        open={detailsDialogOpen}
        record={detailsDialogRecord}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogRecord(null);
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Branch"
        content={
          deleteBranchName
            ? `Are you sure you want to delete "${deleteBranchName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this branch? This action cannot be undone.'
        }
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isDeleting} loading={isDeleting}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteBranchId(null);
          setDeleteBranchName(null);
        }}
        loading={isDeleting}
        disableClose={isDeleting}
      />
    </Box>
  );
}
