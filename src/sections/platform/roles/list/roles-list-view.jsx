'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { can } from 'src/utils/permissions';
import { getApiErrorMessage } from 'src/utils/api-error-message';
import { ACTION_PERMISSIONS } from 'src/utils/action-permissions';

import {
  useGetRolesQuery,
  useDeleteRoleMutation,
  useToggleRoleActiveMutation,
  useGetRoleScopesDropdownQuery,
} from 'src/store/api/roles-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { RoleFormDialog } from '../form/role-form-dialog';
import { RoleDetailDrawer } from '../components/role-detail-drawer';
import { getScopeDisplayName, getActiveStatusLabel, getActiveStatusColor } from '../utils/role-helpers';

// ----------------------------------------------------------------------

export function RolesListView() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const drawerOpen = !!selectedRoleId;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [deleteRoleName, setDeleteRoleName] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const searchForm = useForm({ defaultValues: { searchTerm: '' } });
  const scopeFilterForm = useForm({ defaultValues: { scope: null } });
  const statusFilterForm = useForm({ defaultValues: { status: null } });
  const toggleForm = useForm({ defaultValues: {} });

  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  const watchedScope = scopeFilterForm.watch('scope');
  useEffect(() => {
    const v = watchedScope?.id ?? watchedScope;
    if (v !== scopeFilter) {
      setScopeFilter(v);
      setPageNumber(1);
    }
  }, [watchedScope, scopeFilter]);

  const watchedStatus = statusFilterForm.watch('status');
  useEffect(() => {
    if (watchedStatus !== statusFilter) {
      setStatusFilter(watchedStatus);
      setPageNumber(1);
    }
  }, [watchedStatus, statusFilter]);

  const { data: scopesDropdown } = useGetRoleScopesDropdownQuery();

  const scopeOptions = useMemo(() => {
    if (!scopesDropdown || !Array.isArray(scopesDropdown)) return [];
    return scopesDropdown.map((d) => {
      const key = d.key ?? d.Key;
      const num = typeof key === 'string' ? Number(key) : key;
      return {
        id: Number.isNaN(num) ? key : num,
        label: d.value ?? d.Value ?? String(key),
      };
    });
  }, [scopesDropdown]);

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
      scope: scopeFilter !== undefined && scopeFilter !== null ? scopeFilter : undefined,
      isActive: statusFilter !== undefined && statusFilter !== null ? statusFilter : undefined,
    }),
    [pageNumber, pageSize, debouncedSearchTerm, scopeFilter, statusFilter]
  );

  const { data: response, isLoading, error, refetch } = useGetRolesQuery(queryParams);

  const roles = useMemo(() => response?.data ?? [], [response]);

  useEffect(() => {
    const values = Object.fromEntries(roles.map((r) => [`active_${r.id}`, r.isActive]));
    toggleForm.reset(values);
  }, [roles, toggleForm]);

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

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [toggleRoleActive] = useToggleRoleActiveMutation();
  const [togglingRoleId, setTogglingRoleId] = useState(null);
  const inFlightIdsRef = useRef(new Set());

  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    const record = roles.find((r) => r.id === row.id) ?? null;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [roles]);

  const handleView = useCallback((row) => {
    setSelectedRoleId(row.id);
  }, []);

  const handleDeleteClick = useCallback((row) => {
    setDeleteRoleId(row.id);
    setDeleteRoleName(row.name);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteRoleId) return;
    try {
      await deleteRole(deleteRoleId).unwrap();
      toast.success('Role deleted successfully');
      setDeleteConfirmOpen(false);
      if (selectedRoleId === deleteRoleId) {
        setSelectedRoleId(null);
      }
      setDeleteRoleId(null);
      setDeleteRoleName(null);
      if (roles.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
      refetch();
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete role',
      });
      if (isRetryable) {
        toast.error(message, { action: { label: 'Retry', onClick: () => handleDeleteConfirm() } });
      } else {
        toast.error(message);
      }
    }
  }, [deleteRoleId, deleteRole, selectedRoleId, roles.length, pageNumber, refetch]);

  const handleToggleActive = useCallback(
    async (id, onRevert) => {
      if (inFlightIdsRef.current.has(id)) return;
      inFlightIdsRef.current.add(id);
      setTogglingRoleId(id);
      try {
        await toggleRoleActive(id).unwrap();
        toast.success('Role status updated successfully');
      } catch (err) {
        const { message, isRetryable } = getApiErrorMessage(err, {
          defaultMessage: 'Failed to update status',
        });
        if (onRevert) onRevert();
        if (isRetryable) {
          toast.error(message, { action: { label: 'Retry', onClick: () => handleToggleActive(id, onRevert) } });
        } else {
          toast.error(message);
        }
      } finally {
        inFlightIdsRef.current.delete(id);
        setTogglingRoleId(null);
      }
    },
    [toggleRoleActive]
  );

  const handleFormSuccess = useCallback(
    (id, action) => {
      setFormDialogOpen(false);
      setFormDialogMode('create');
      setFormDialogRecord(null);
      toast.success(`Role ${action} successfully`);
      refetch();
      if (action === 'created' && id) {
        setSelectedRoleId(id);
      }
    },
    [refetch]
  );

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedRoleId(null);
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
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        scope: r.scope,
        scopeName: getScopeDisplayName(r.scope),
        isActive: r.isActive,
      })),
    [roles]
  );

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1 },
      {
        field: 'scopeName',
        headerName: 'Scope',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
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
        permission: () => can(ACTION_PERMISSIONS.Roles.update),
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Field.Switch
            name={`active_${row.id}`}
            disabled={togglingRoleId === row.id}
            onChange={() => {
              handleToggleActive(row.id, () => toggleForm.setValue(`active_${row.id}`, row.isActive));
            }}
            slotProps={{
              wrapper: { onClick: (e) => e.stopPropagation() },
              switch: {
                size: 'small',
                slotProps: {
                  input: {
                    id: `role-toggle-${row.id}`,
                    'aria-label': `Toggle active status for ${row.name || 'role'}`,
                  },
                },
              },
            }}
          />
        ),
        order: 3,
        permission: () => can(ACTION_PERMISSIONS.Roles.toggleActive),
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => handleDeleteClick(row),
        order: 4,
        permission: () => can(ACTION_PERMISSIONS.Roles.delete),
      },
    ],
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingRoleId, toggleForm]
  );

  return (
    <Box sx={{ display: 'flex', minHeight: 0, flex: 1 }}>
      <FormProvider {...toggleForm}>
        <Card variant="outlined" sx={{ p: 2, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
            <FormProvider {...searchForm}>
              <Field.Text
                name="searchTerm"
                size="small"
                placeholder="Search by name..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
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
                    ) : undefined,
                  },
                }}
                sx={{ maxWidth: { sm: 320 } }}
              />
            </FormProvider>
            <FormProvider {...scopeFilterForm}>
              <Field.Autocomplete
                name="scope"
                label="Scope"
                options={scopeOptions}
                getOptionLabel={(option) => (option ? (option.label ?? String(option.id ?? '')) : '')}
                isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                slotProps={{
                  textField: {
                    size: 'small',
                    placeholder: 'All scopes',
                  },
                }}
                sx={{ minWidth: { sm: 160 } }}
              />
            </FormProvider>
            <FormProvider {...statusFilterForm}>
              <Field.Autocomplete
                name="status"
                label="Status"
                options={[
                  { id: null, label: 'All' },
                  { id: true, label: 'Active' },
                  { id: false, label: 'Inactive' },
                ]}
                getOptionLabel={(option) => (option ? (option.label ?? String(option.id)) : '')}
                isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                slotProps={{
                  textField: {
                    size: 'small',
                    placeholder: 'All statuses',
                  },
                }}
                sx={{ minWidth: { sm: 140 } }}
              />
            </FormProvider>
            {can(ACTION_PERMISSIONS.Roles.create) && (
              <Field.Button
                variant="contained"
                startIcon="mingcute:add-line"
                onClick={handleCreate}
                sx={{ ml: { sm: 'auto' } }}
              >
                Create Role
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
            errorEntityLabel="roles"
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
                title="No roles found"
                description={
                  searchTerm || scopeFilter != null || statusFilter != null
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating a new role'
                }
              />
            }
          />
        </Card>

        <RoleDetailDrawer
          open={drawerOpen}
          selectedRoleId={selectedRoleId}
          onClose={handleDrawerClose}
          canUpdate={can(ACTION_PERMISSIONS.Roles.update)}
          canAssign={can(ACTION_PERMISSIONS.Roles.assignToUser)}
        />

        <RoleFormDialog
          open={formDialogOpen}
          mode={formDialogMode}
          record={formDialogRecord}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Role"
          content={
            deleteRoleName
              ? `Are you sure you want to delete "${deleteRoleName}"? This action cannot be undone.`
              : 'Are you sure you want to delete this role? This action cannot be undone.'
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
          loading={isDeleting}
          disableClose={isDeleting}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setDeleteRoleId(null);
            setDeleteRoleName(null);
          }}
        />
      </FormProvider>
    </Box>
  );
}
