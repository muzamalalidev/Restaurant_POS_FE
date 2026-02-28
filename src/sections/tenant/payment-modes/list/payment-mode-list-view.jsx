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

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import {
  useGetPaymentModesQuery,
  useDeletePaymentModeMutation,
  useTogglePaymentModeActiveMutation,
} from 'src/store/api/payment-modes-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { PaymentModeFormDialog } from '../form/payment-mode-form-dialog';
import { PaymentModeDetailsDialog } from '../components/payment-mode-details-dialog';

// ----------------------------------------------------------------------

const getTenantId = (tenant) => {
  if (!tenant) return null;
  if (typeof tenant === 'object' && tenant !== null && 'id' in tenant) return tenant.id;
  return tenant;
};

// ----------------------------------------------------------------------

/**
 * Payment Mode List View
 *
 * Tenant-scoped: a tenant must be selected before list is fetched.
 * Create/Edit/View/Delete all use the selected tenantId.
 */
export function PaymentModeListView() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePaymentModeId, setDeletePaymentModeId] = useState(null);
  const [deletePaymentModeName, setDeletePaymentModeName] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [tenantId, setTenantId] = useState(null);

  const searchForm = useForm({ defaultValues: { searchTerm: '' } });
  const tenantFilterForm = useForm({ defaultValues: { tenantId: null } });
  const toggleForm = useForm({ defaultValues: {} });

  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  const getTenantIdMemo = useCallback(getTenantId, []);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (isSyncingRef.current) return;
    const currentFormValue = tenantFilterForm.getValues('tenantId');
    const stateId = getTenantIdMemo(tenantId);
    const formId = getTenantIdMemo(currentFormValue);
    if (stateId !== formId) {
      tenantFilterForm.setValue('tenantId', tenantId, { shouldValidate: false, shouldDirty: false });
    }
  }, [tenantId, tenantFilterForm, getTenantIdMemo]);

  const watchedTenantId = tenantFilterForm.watch('tenantId');
  useEffect(() => {
    const watchedId = getTenantIdMemo(watchedTenantId);
    const currentId = getTenantIdMemo(tenantId);
    if (watchedId !== currentId) {
      isSyncingRef.current = true;
      setTenantId(watchedTenantId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [watchedTenantId, tenantId, getTenantIdMemo]);

  const { data: tenantsDropdown } = useGetTenantsDropdownQuery();
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantsDropdown]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resolvedTenantId = useMemo(() => {
    if (typeof tenantId === 'object' && tenantId !== null && 'id' in tenantId) return tenantId.id;
    return tenantId || null;
  }, [tenantId]);

  const queryParams = useMemo(
    () => ({
      tenantId: resolvedTenantId,
      pageNumber,
      pageSize,
      searchTerm: debouncedSearchTerm.trim() || undefined,
    }),
    [resolvedTenantId, pageNumber, pageSize, debouncedSearchTerm]
  );

  const { data: response, isLoading, error, refetch } = useGetPaymentModesQuery(queryParams, {
    skip: !resolvedTenantId,
  });

  const paymentModes = useMemo(() => response?.data ?? [], [response]);

  useEffect(() => {
    const values = Object.fromEntries(paymentModes.map((pm) => [`active_${pm.id}`, pm.isActive]));
    toggleForm.reset(values);
  }, [paymentModes, toggleForm]);

  const paginationMeta = useMemo(
    () => ({
      totalCount: response?.totalCount ?? 0,
      totalPages: response?.totalPages ?? 0,
      hasPreviousPage: response?.hasPreviousPage ?? false,
      hasNextPage: response?.hasNextPage ?? false,
    }),
    [response]
  );

  const [deletePaymentMode, { isLoading: isDeleting }] = useDeletePaymentModeMutation();
  const [togglePaymentModeActive] = useTogglePaymentModeActiveMutation();
  const [togglingId, setTogglingId] = useState(null);

  const handleCreate = useCallback(() => {
    if (!resolvedTenantId) return;
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, [resolvedTenantId]);

  const handleEdit = useCallback((row) => {
    const record = paymentModes.find((p) => p.id === row.id) ?? null;
    if (!record) return;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [paymentModes]);

  const handleView = useCallback((row) => {
    const record = paymentModes.find((p) => p.id === row.id) ?? null;
    if (!record) return;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [paymentModes]);

  const handleDeleteClick = useCallback((row) => {
    setDeletePaymentModeId(row.id);
    setDeletePaymentModeName(row.name);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletePaymentModeId || !resolvedTenantId || isDeleting) return;
    try {
      await deletePaymentMode({ tenantId: resolvedTenantId, id: deletePaymentModeId }).unwrap();
      toast.success('Payment mode deleted successfully');
      setDeleteConfirmOpen(false);
      setDeletePaymentModeId(null);
      setDeletePaymentModeName(null);
      refetch();
      if (paymentModes.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete payment mode',
        notFoundMessage: 'Payment mode not found or already deleted',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => handleDeleteConfirm(),
          },
        });
      } else {
        toast.error(message);
      }
    }
  }, [deletePaymentModeId, resolvedTenantId, isDeleting, deletePaymentMode, refetch, paymentModes.length, pageNumber]);

  const handleToggleActive = useCallback(
    async (id, onRevert) => {
      if (!resolvedTenantId || togglingId === id) return;
      setTogglingId(id);
      try {
        await togglePaymentModeActive({ tenantId: resolvedTenantId, id }).unwrap();
        toast.success('Status updated successfully');
      } catch (err) {
        const { message, isRetryable } = getApiErrorMessage(err, {
          defaultMessage: 'Failed to update status',
          notFoundMessage: 'Payment mode not found',
        });
        if (isRetryable) {
          toast.error(message, {
            action: {
              label: 'Retry',
              onClick: () => handleToggleActive(id, onRevert),
            },
          });
        } else {
          toast.error(message);
        }
        if (onRevert) onRevert();
      } finally {
        setTogglingId(null);
      }
    },
    [resolvedTenantId, togglePaymentModeActive, togglingId]
  );

  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    toast.success(`Payment mode ${action} successfully`);
    refetch();
  }, [refetch]);

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
  }, []);

  const handlePageChange = useCallback((newPage) => setPageNumber(newPage + 1), []);
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);
  const handleSearchClear = useCallback(() => {
    searchForm.setValue('searchTerm', '');
    setSearchTerm('');
    setPageNumber(1); // Reset to first page when clearing search
  }, [searchForm]);

  const rows = useMemo(
    () =>
      paymentModes.map((pm) => ({
        id: pm.id,
        name: pm.name,
        description: pm.description ?? '-',
        isActive: pm.isActive,
      })),
    [paymentModes]
  );

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1 },
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
      { id: 'view', label: 'View', icon: 'solar:eye-bold', onClick: (row) => handleView(row), order: 1 },
      { id: 'edit', label: 'Edit', icon: 'solar:pen-bold', onClick: (row) => handleEdit(row), order: 2 },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Field.Switch
            name={`active_${row.id}`}
            disabled={togglingId === row.id}
            onChange={() => {
              handleToggleActive(row.id, () => toggleForm.setValue(`active_${row.id}`, row.isActive));
            }}
            slotProps={{
              wrapper: { onClick: (e) => e.stopPropagation() },
              switch: {
                size: 'small',
                slotProps: {
                  input: {
                    id: `payment-mode-toggle-${row.id}`,
                    'aria-label': `Toggle active status for ${row.name || 'payment mode'}`,
                  },
                },
              },
            }}
          />
        ),
        order: 3,
      },
      { id: 'delete', label: 'Delete', icon: 'solar:trash-bin-trash-bold', onClick: (row) => handleDeleteClick(row), order: 4 },
    ],
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingId, toggleForm]
  );

  const showTable = !!resolvedTenantId;
  const emptyMessage = !resolvedTenantId
    ? 'Select a tenant to view payment modes'
    : (searchTerm || debouncedSearchTerm) ? 'No payment modes match your search'
    : 'Get started by creating a payment mode';

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
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleSearchClear} sx={{ minWidth: 'auto', minHeight: 'auto', p: 0.5 }} aria-label="Clear search">
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
              getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
              isOptionEqualToValue={(opt, val) => (opt?.id === val?.id)}
              slotProps={{ textField: { size: 'small', placeholder: 'Select tenant' } }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            disabled={!resolvedTenantId}
            sx={{ ml: 'auto', minHeight: 44 }}
          >
            Create Payment Mode
          </Field.Button>
        </Stack>

        {!showTable ? (
          <EmptyContent title="No tenant selected" description={emptyMessage} />
        ) : (
          <CustomTable
            rows={rows}
            columns={columns}
            loading={isLoading}
            actions={actions}
            error={error}
            onRetry={refetch}
            errorEntityLabel="payment modes"
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
            emptyContent={<EmptyContent title="No payment modes found" description={emptyMessage} />}
          />
        )}
        </Card>

        <PaymentModeFormDialog
          open={formDialogOpen}
          mode={formDialogMode}
          tenantId={resolvedTenantId}
          record={formDialogRecord}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />

        <PaymentModeDetailsDialog
          open={detailsDialogOpen}
          record={detailsDialogRecord}
          onClose={() => {
            setDetailsDialogOpen(false);
            setDetailsDialogRecord(null);
          }}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Payment Mode"
          content={
            deletePaymentModeName
              ? `Are you sure you want to delete "${deletePaymentModeName}"? Orders may reference this payment mode.`
              : 'Are you sure you want to delete this payment mode? This action cannot be undone.'
          }
          action={
            <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isDeleting} loading={isDeleting}>
              Delete
            </Field.Button>
          }
          onClose={() => {
            setDeleteConfirmOpen(false);
            setDeletePaymentModeId(null);
            setDeletePaymentModeName(null);
          }}
          loading={isDeleting}
          disableClose={isDeleting}
        />
      </FormProvider>
    </Box>
  );
}
