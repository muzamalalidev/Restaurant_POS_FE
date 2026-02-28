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

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import {
  useGetAllTablesQuery,
  useDeleteTableMutation,
  useReleaseTableMutation,
  useToggleTableActiveMutation,
} from 'src/store/api/tables-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { TableFormDialog } from '../form/table-form-dialog';
import { TableDetailsDialog } from '../components/table-details-dialog';
import {
  canEdit,
  canDelete,
  canRelease,
  getAvailabilityLabel,
  getAvailabilityColor,
  getActiveStatusLabel,
  getActiveStatusColor,
} from '../utils/table-helpers';

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
 * Table List View Component
 * 
 * Displays all tables in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view/release/toggle/delete operations.
 * 
 * Required filter: branchId (required for GetAllTables).
 * P1-005: Tenant/branch isolation is enforced at the backend API level (no tenantId in params).
 * P2-001: Role-based visibility for Create/Edit/Release/Delete can be applied when backend supports it.
 */
export function TableListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTableId, setDeleteTableId] = useState(null);
  const [deleteTableNumber, setDeleteTableNumber] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state (required: branchId)
  const [branchId, setBranchId] = useState(null);

  // Minimal form for search
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal form for branch filter (required)
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

  // Sync form value with branchId state
  const isSyncingRef = useRef(false);
  useEffect(() => {
    if (isSyncingRef.current) {
      return;
    }
    const currentFormValue = branchFilterForm.getValues('branchId');
    const stateId = getId(branchId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      branchFilterForm.setValue('branchId', branchId, { shouldValidate: false, shouldDirty: false });
    }
  }, [branchId, branchFilterForm]);

  // Watch form value changes and sync with branchId state
  const watchedBranchId = branchFilterForm.watch('branchId');
  useEffect(() => {
    const watchedId = getId(watchedBranchId);
    const currentId = getId(branchId);
    
    if (watchedId !== currentId) {
      isSyncingRef.current = true;
      setBranchId(watchedBranchId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [watchedBranchId, branchId]);

  const { data: branchesDropdown } = useGetBranchesDropdownQuery();
  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Check if required filters are present
  const hasRequiredFilters = useMemo(() => !!getId(branchId), [branchId]);

  // Fetch tables with pagination and search params
  const queryParams = useMemo(
    () => {
      const branchIdValue = getId(branchId);
      
      return {
        branchId: branchIdValue || undefined,
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, branchId]
  );

  const { data: tablesResponse, isLoading, error, refetch } = useGetAllTablesQuery(queryParams, {
    skip: !hasRequiredFilters, // Skip query if required filters are missing
  });

  // Extract data from paginated response
  const tables = useMemo(() => {
    if (!tablesResponse) return [];
    return tablesResponse.data || [];
  }, [tablesResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!tablesResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: tablesResponse.totalCount || 0,
      totalPages: tablesResponse.totalPages || 0,
      hasPreviousPage: tablesResponse.hasPreviousPage || false,
      hasNextPage: tablesResponse.hasNextPage || false,
    };
  }, [tablesResponse]);

  // Mutations
  const [deleteTable, { isLoading: isDeleting }] = useDeleteTableMutation();
  const [releaseTable, { isLoading: _isReleasing }] = useReleaseTableMutation();
  const [toggleTableActive, { isLoading: _isTogglingActive }] = useToggleTableActiveMutation();

  // Track which table is being released or toggled
  const [releasingTableId, setReleasingTableId] = useState(null);
  const [togglingTableId, setTogglingTableId] = useState(null);
  // P0-004: Ref guard to prevent rapid Release/Toggle clicks
  const inFlightIdsRef = useRef(new Set());

  // Handle create
  const handleCreate = useCallback(() => {
    if (!getId(branchId)) {
      toast.error('Please select a branch first');
      return;
    }
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, [branchId]);

  // Handle edit (pass full row; resolve record from tables)
  const handleEdit = useCallback((row) => {
    const record = tables.find((t) => t.id === row.id) ?? null;
    if (!record) return;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [tables]);

  // Handle view
  const handleView = useCallback((row) => {
    const record = tables.find((t) => t.id === row.id) ?? null;
    if (!record) return;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [tables]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((table) => {
    setDeleteTableId(table.id);
    setDeleteTableNumber(table.tableNumber);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTableId) return;

    try {
      await deleteTable(deleteTableId).unwrap();
      toast.success('Table deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteTableId(null);
      setDeleteTableNumber(null);
      if (tables.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete table',
        notFoundMessage: 'Table not found',
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
  }, [deleteTableId, deleteTable, tables.length, pageNumber]);

  // Handle release table (P0-004: ref guard prevents rapid clicks)
  const handleRelease = useCallback(async (tableId) => {
    if (inFlightIdsRef.current.has(`release:${tableId}`)) return;
    inFlightIdsRef.current.add(`release:${tableId}`);
    setReleasingTableId(tableId);
    try {
      await releaseTable(tableId).unwrap();
      toast.success('Table released successfully');
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to release table',
        notFoundMessage: 'Table not found',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => handleRelease(tableId),
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      inFlightIdsRef.current.delete(`release:${tableId}`);
      setReleasingTableId(null);
    }
  }, [releaseTable]);

  // Handle toggle active (P0-004: ref guard prevents rapid clicks)
  const handleToggleActive = useCallback(async (tableId) => {
    if (inFlightIdsRef.current.has(`toggle:${tableId}`)) return;
    inFlightIdsRef.current.add(`toggle:${tableId}`);
    setTogglingTableId(tableId);
    try {
      await toggleTableActive(tableId).unwrap();
      toast.success('Table status updated successfully');
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update table status',
        notFoundMessage: 'Table not found',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => handleToggleActive(tableId),
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      inFlightIdsRef.current.delete(`toggle:${tableId}`);
      setTogglingTableId(null);
    }
  }, [toggleTableActive]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    toast.success(`Table ${action} successfully`);
    refetch();
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
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
    setPageNumber(1); // Reset to first page when clearing search
  }, [searchForm]);

  // Prepare table rows
  const rows = useMemo(() => tables.map((table) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      branchName: table.branchName || '-',
      capacity: table.capacity,
      location: table.location || '-',
      isAvailable: table.isAvailable,
      isActive: table.isActive,
    })), [tables]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'tableNumber',
        headerName: 'Table Number',
        flex: 1,
      },
      {
        field: 'branchName',
        headerName: 'Branch',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'capacity',
        headerName: 'Capacity',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2">
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'location',
        headerName: 'Location',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.value === '-' ? 'Not specified' : params.value}
          </Typography>
        ),
      },
      {
        field: 'isAvailable',
        headerName: 'Available',
        flex: 1,
        renderCell: (params) => (
          <Label color={getAvailabilityColor(params.value)} variant="soft">
            {getAvailabilityLabel(params.value)}
          </Label>
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
        id: 'edit',
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (row) => handleEdit(row),
        order: 2,
        visible: (row) => canEdit(row.isActive),
      },
      {
        id: 'release',
        label: 'Release',
        icon: 'solar:check-circle-bold',
        onClick: (row) => handleRelease(row.id),
        order: 3,
        visible: (row) => canRelease(row.isAvailable),
        disabled: (row) => releasingTableId === row.id,
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingTableId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `table-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.tableNumber || 'table'}`,
              },
            }}
          />
        ),
        order: 4,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => handleDeleteClick(row),
        order: 5,
        visible: (row) => canDelete(row.isActive),
      },
    ],
    [handleView, handleEdit, handleRelease, handleToggleActive, handleDeleteClick, releasingTableId, togglingTableId]
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
              placeholder="Search by Table Number or Location..."
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
          <FormProvider {...branchFilterForm}>
            <Field.Autocomplete
              name="branchId"
              label="Branch"
              options={branchOptions}
              required
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
                  placeholder: 'Select branch',
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            disabled={!hasRequiredFilters}
            sx={{ ml: 'auto', minHeight: 44 }}
          >
            Create Table
          </Field.Button>
        </Stack>

        {/* Table - P0-005: show error in table area so branch/Create remain; P0-001: sorting disabled with server pagination */}
        {!hasRequiredFilters ? (
            <EmptyContent
              title="Select a Branch"
              description="Please select a branch to view tables"
            />
        ) : (
          <CustomTable
            rows={rows}
            columns={columns}
            loading={isLoading}
            actions={actions}
            error={error}
            onRetry={refetch}
            errorEntityLabel="tables"
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
                title="No tables found"
                description={
                  searchTerm
                    ? "Try adjusting your search criteria"
                    : "Get started by creating a new table"
                }
              />
            }
          />
        )}
      </Card>

      {/* Form Dialog */}
      <TableFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        record={formDialogRecord}
        branchId={getId(branchId)}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        branchOptions={branchOptions}
      />

      {/* Details Dialog */}
      <TableDetailsDialog
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
        title="Delete Table?"
        content={`Are you sure you want to delete table "${deleteTableNumber}"? This action cannot be undone.`}
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
          setDeleteTableId(null);
          setDeleteTableNumber(null);
        }}
        loading={isDeleting}
        disableClose={isDeleting}
      />
    </Box>
  );
}

