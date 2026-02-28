'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import {
  useGetTenantMastersQuery,
  useDeleteTenantMasterMutation,
  useToggleTenantMasterActiveMutation,
} from 'src/store/api/tenant-masters-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { TenantMasterFormDialog } from '../form/tenant-master-form-dialog';
import { TenantMasterDetailsDialog } from '../components/tenant-master-details-dialog';
import { getActiveStatusLabel, getActiveStatusColor } from '../utils/tenant-master-helpers';

// ----------------------------------------------------------------------

/**
 * Tenant Master List View Component
 *
 * Displays all tenant masters in a data-dense, filterable grid with actions.
 * P2-004: Platform-level entity (no tenant isolation).
 * P2-001: Role-based visibility for Create/Edit/Delete/Toggle can be applied when backend supports it.
 * P1-003: Owner filter/dropdown not populated until owner/user API is integrated.
 */
export function TenantMasterListView() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTenantMasterId, setDeleteTenantMasterId] = useState(null);
  const [deleteTenantMasterName, setDeleteTenantMasterName] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [ownerId, setOwnerId] = useState(null);

  const searchForm = useForm({
    defaultValues: { searchTerm: '' },
  });

  const ownerFilterForm = useForm({
    defaultValues: { ownerId: null },
  });

  const toggleForm = useForm({
    defaultValues: {},
  });

  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  useEffect(() => {
    ownerFilterForm.setValue('ownerId', ownerId);
  }, [ownerId, ownerFilterForm]);

  const watchedOwnerId = ownerFilterForm.watch('ownerId');
  useEffect(() => {
    if (watchedOwnerId !== ownerId) {
      setOwnerId(watchedOwnerId);
      setPageNumber(1);
    }
  }, [watchedOwnerId, ownerId]);

  // P1-003: Empty until owner/user API is integrated; API supports ownerId filter
  const ownerOptions = useMemo(() => [], []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      searchTerm: debouncedSearchTerm.trim() || undefined,
      ownerId: ownerId?.id ?? ownerId ?? undefined,
    }),
    [pageNumber, pageSize, debouncedSearchTerm, ownerId]
  );

  const { data: response, isLoading, error, refetch } = useGetTenantMastersQuery(queryParams);

  const tenantMasters = useMemo(() => response?.data ?? [], [response]);

  useEffect(() => {
    const values = Object.fromEntries(tenantMasters.map((tm) => [`active_${tm.id}`, tm.isActive]));
    toggleForm.reset(values);
  }, [tenantMasters, toggleForm]);

  // P1-001: include pageNumber and pageSize for table consistency
  const paginationMeta = useMemo(
    () => ({
      pageNumber: response?.pageNumber ?? pageNumber,
      pageSize: response?.pageSize ?? pageSize,
      totalCount: response?.totalCount ?? 0,
      totalPages: response?.totalPages ?? 0,
      hasPreviousPage: response?.hasPreviousPage ?? false,
      hasNextPage: response?.hasNextPage ?? false,
    }),
    [response, pageNumber, pageSize]
  );

  const [deleteTenantMaster, { isLoading: isDeleting }] = useDeleteTenantMasterMutation();
  const [toggleTenantMasterActive, { isLoading: _isTogglingActive }] = useToggleTenantMasterActiveMutation();
  const [togglingTenantMasterId, setTogglingTenantMasterId] = useState(null);
  // P0-004: Ref guard to prevent rapid toggle clicks
  const inFlightIdsRef = useRef(new Set());

  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    const record = tenantMasters.find((tm) => tm.id === row.id) ?? null;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [tenantMasters]);

  const handleView = useCallback((row) => {
    const record = tenantMasters.find((tm) => tm.id === row.id) ?? null;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [tenantMasters]);

  const handleDeleteClick = useCallback((row) => {
    setDeleteTenantMasterId(row.id);
    setDeleteTenantMasterName(row.name);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTenantMasterId) return;
    try {
      await deleteTenantMaster(deleteTenantMasterId).unwrap();
      toast.success('Tenant master deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteTenantMasterId(null);
      setDeleteTenantMasterName(null);
      if (tenantMasters.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete tenant master',
      });
      toast.error(message);
    }
  }, [deleteTenantMasterId, deleteTenantMaster, tenantMasters.length, pageNumber]);

  // P0-004: ref guard prevents rapid clicks
  const handleToggleActive = useCallback(
    async (id, onRevert) => {
      if (inFlightIdsRef.current.has(id)) return;
      inFlightIdsRef.current.add(id);
      setTogglingTenantMasterId(id);
      try {
        await toggleTenantMasterActive(id).unwrap();
        toast.success('Tenant master status updated successfully');
      } catch (err) {
        const { message } = getApiErrorMessage(err, {
          defaultMessage: 'Failed to update status',
        });
        toast.error(message);
        if (onRevert) onRevert();
      } finally {
        inFlightIdsRef.current.delete(id);
        setTogglingTenantMasterId(null);
      }
    },
    [toggleTenantMasterActive]
  );

  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    toast.success(`Tenant master ${action} successfully`);
    refetch(); // P1-004: immediate refresh and consistency with other modules
  }, [refetch]);

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
  }, []);

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

  const rows = useMemo(
    () =>
      tenantMasters.map((tm) => ({
        id: tm.id,
        name: tm.name,
        description: tm.description ?? '-',
        ownerId: tm.ownerId ?? '-',
        isActive: tm.isActive,
      })),
    [tenantMasters]
  );

  // P0-001: sortable false with server pagination
  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'ownerId',
        headerName: 'Owner',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '–' : params.value}
          </Typography>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        flex: 1,
        renderCell: (params) => (
          <Label color={getActiveStatusColor(params.value)} variant="soft">
            {getActiveStatusLabel(params.value)}
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
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Field.Switch
            name={`active_${row.id}`}
            disabled={togglingTenantMasterId === row.id}
            onChange={() => {
              handleToggleActive(row.id, () => toggleForm.setValue(`active_${row.id}`, row.isActive));
            }}
            slotProps={{
              wrapper: { onClick: (e) => e.stopPropagation() },
              switch: {
                size: 'small',
                slotProps: {
                  input: {
                    id: `tenant-master-toggle-${row.id}`,
                    'aria-label': `Toggle active status for ${row.name || 'tenant master'}`,
                  },
                },
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingTenantMasterId, toggleForm]
  );

  return (
    <Box>
      <FormProvider {...toggleForm}>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
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
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleSearchClear} sx={{ minWidth: 'auto', minHeight: 'auto', p: 0.5 }} aria-label="Clear search">
                        <Iconify icon="eva:close-fill" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
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
              getOptionLabel={(option) => (option ? (option.label ?? option.name ?? option.email ?? option.id ?? '') : '')}
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
            />
          </FormProvider>
          <Field.Button variant="contained" startIcon="mingcute:add-line" onClick={handleCreate} sx={{ ml: 'auto' }}>
            Create Tenant Master
          </Field.Button>
        </Stack>

        {/* P0-005: show error in table area so search/filters/Create remain; P0-001: sorting disabled */}
        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="tenant masters"
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
              title="No tenant masters found"
              description={
                searchTerm || ownerId ? 'Try adjusting your search or filter criteria' : 'Get started by creating a new tenant master'
              }
            />
          }
        />
        </Card>

        <TenantMasterFormDialog
          open={formDialogOpen}
          mode={formDialogMode}
          record={formDialogRecord}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />

        <TenantMasterDetailsDialog
          open={detailsDialogOpen}
          record={detailsDialogRecord}
          onClose={() => {
            setDetailsDialogOpen(false);
            setDetailsDialogRecord(null);
          }}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Tenant Master"
          content={
            deleteTenantMasterName
              ? `Are you sure you want to delete "${deleteTenantMasterName}"? This action cannot be undone. All associated tenants will be unlinked from this tenant master.`
              : 'Are you sure you want to delete this tenant master? This action cannot be undone. All associated tenants will be unlinked.'
          }
          action={
            <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isDeleting} loading={isDeleting}>
              Delete
            </Field.Button>
          }
          loading={isDeleting}
          disableClose={isDeleting}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setDeleteTenantMasterId(null);
            setDeleteTenantMasterName(null);
          }}
        />
      </FormProvider>
    </Box>
  );
}
