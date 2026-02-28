'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import {
  useGetStaffTypesQuery,
  useDeleteStaffTypeMutation,
  useToggleStaffTypeActiveMutation,
} from 'src/store/api/staff-types-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { StaffTypeFormDialog } from '../form/staff-type-form-dialog';
import { StaffTypeDetailsDialog } from '../components/staff-type-details-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Type List View Component
 * 
 * Displays all staff types in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 */
export function StaffTypeListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteStaffTypeId, setDeleteStaffTypeId] = useState(null);
  const [deleteStaffType, setDeleteStaffType] = useState(null); // P2-003 FIX: Store full object for details

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Minimal form for search (required for Field.Text)
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Watch search form value changes and sync with searchTerm state
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to page 1 when search changes
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch staff types with pagination and search params
  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      searchTerm: debouncedSearchTerm.trim() || undefined,
    }),
    [pageNumber, pageSize, debouncedSearchTerm]
  );

  const { data: staffTypesResponse, isLoading, error, refetch } = useGetStaffTypesQuery(queryParams);

  const staffTypes = useMemo(() => {
    if (!staffTypesResponse) return [];
    return staffTypesResponse.data || [];
  }, [staffTypesResponse]);

  // Use list API response for form dialog (duplicate name validation); dropdown remains in form for edge cases
  const allStaffTypes = useMemo(
    () =>
      staffTypes.map((st) => ({
        id: st.id,
        name: st.name,
      })),
    [staffTypes]
  );

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!staffTypesResponse) {
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
      pageNumber: staffTypesResponse.pageNumber ?? pageNumber,
      pageSize: staffTypesResponse.pageSize ?? pageSize,
      totalCount: staffTypesResponse.totalCount || 0,
      totalPages: staffTypesResponse.totalPages || 0,
      hasPreviousPage: staffTypesResponse.hasPreviousPage || false,
      hasNextPage: staffTypesResponse.hasNextPage || false,
    };
  }, [staffTypesResponse, pageNumber, pageSize]);

  // Mutations
  const [deleteStaffTypeMutation, { isLoading: isDeleting }] = useDeleteStaffTypeMutation();
  const [toggleStaffTypeActive, { isLoading: _isTogglingActive }] = useToggleStaffTypeActiveMutation();

  // Track which staff type is being toggled
  const [togglingStaffTypeId, setTogglingStaffTypeId] = useState(null);
  const inFlightIdsRef = useRef(new Set());

  // P2-REMAINING-002 FIX: Track optimistic updates for toggle active
  const [optimisticToggleUpdates, setOptimisticToggleUpdates] = useState({});

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit (pass full row from list; no getById)
  const handleEdit = useCallback((row) => {
    const record = staffTypes.find((st) => st.id === row.id) ?? null;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [staffTypes]);

  // Handle view (pass full row from list; no getById)
  const handleView = useCallback((row) => {
    const record = staffTypes.find((st) => st.id === row.id) ?? null;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [staffTypes]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((staffType) => {
    setDeleteStaffTypeId(staffType.id);
    setDeleteStaffType(staffType); // P2-003 FIX: Store full object
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteStaffTypeId) return;

    try {
      await deleteStaffTypeMutation(deleteStaffTypeId).unwrap();
      toast.success('Staff type deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteStaffTypeId(null);
      setDeleteStaffType(null);
      if (staffTypes.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete staff type',
        notFoundMessage: 'Staff type not found or has been deleted',
        validationMessage: 'Validation failed. Please check your input.',
      });
      toast.error(message);
    }
  }, [deleteStaffTypeId, deleteStaffTypeMutation, staffTypes.length, pageNumber]);

  // Handle toggle active (ref guard prevents rapid clicks; keep optimistic update and revert on error)
  const handleToggleActive = useCallback(async (staffTypeId) => {
    if (inFlightIdsRef.current.has(staffTypeId)) return;

    // P2-REMAINING-002 FIX: Get current state for optimistic update
    const optimisticIsActive = optimisticToggleUpdates[staffTypeId];
    const currentStaffType = staffTypes.find((st) => st.id === staffTypeId);
    const currentIsActive = optimisticIsActive !== undefined
      ? optimisticIsActive
      : (currentStaffType?.isActive ?? false);
    const newIsActive = !currentIsActive;

    // P2-REMAINING-002 FIX: Optimistic update - immediately update UI
    setOptimisticToggleUpdates((prev) => ({
      ...prev,
      [staffTypeId]: newIsActive,
    }));

    inFlightIdsRef.current.add(staffTypeId);
    setTogglingStaffTypeId(staffTypeId);
    try {
      await toggleStaffTypeActive(staffTypeId).unwrap();
      toast.success('Staff type status updated successfully');
      setOptimisticToggleUpdates((prev) => {
        const updated = { ...prev };
        delete updated[staffTypeId];
        return updated;
      });
    } catch (err) {
      setOptimisticToggleUpdates((prev) => {
        const updated = { ...prev };
        delete updated[staffTypeId];
        return updated;
      });

      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update staff type status',
        notFoundMessage: 'Staff type not found or has been deleted',
      });
      toast.error(message);
    } finally {
      inFlightIdsRef.current.delete(staffTypeId);
      setTogglingStaffTypeId(null);
    }
  }, [toggleStaffTypeActive, staffTypes, optimisticToggleUpdates]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    toast.success(`Staff type ${action} successfully`);
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

  // Prepare table rows
  const rows = useMemo(() => staffTypes.map((staffType) => {
      // P2-REMAINING-002 FIX: Use optimistic update if available, otherwise use actual value
      const optimisticIsActive = optimisticToggleUpdates[staffType.id];
      const isActive = optimisticIsActive !== undefined ? optimisticIsActive : staffType.isActive;
      
      return {
        id: staffType.id,
        name: staffType.name,
        description: staffType.description || '-',
        isActive,
      };
    }), [staffTypes, optimisticToggleUpdates]);

  // Define columns (sortable/filterable false: server pagination without server sort/filter)
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
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingStaffTypeId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `staff-type-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'staff type'}`,
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingStaffTypeId]
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
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ ml: 'auto', minHeight: 44 }}
          >
            Create Staff Type
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="staff types"
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
              title="No staff types found"
              description={
                searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by creating a new staff type"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <StaffTypeFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        record={formDialogRecord}
        allStaffTypes={allStaffTypes}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Details Dialog */}
      <StaffTypeDetailsDialog
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
        title="Delete Staff Type"
        loading={isDeleting} // P2-004 FIX: Show loading state
        disableClose={isDeleting} // P2-004 FIX: Prevent close during delete
        content={
          deleteStaffType ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Are you sure you want to delete &quot;{deleteStaffType.name}&quot;?
              </Typography>
              {deleteStaffType.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {deleteStaffType.description}
                </Typography>
              )}
              {/* P1-003 FIX: Add warning about staff member dependencies */}
              <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'medium' }}>
                Note: This staff type cannot be deleted if any staff members are assigned to it.
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 'medium' }}>
                This action cannot be undone.
              </Typography>
            </Box>
          ) : (
            'Are you sure you want to delete this staff type? This action cannot be undone.'
          )
        }
        action={
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isDeleting} loading={isDeleting}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteStaffTypeId(null);
          setDeleteStaffType(null);
        }}
      />
    </Box>
  );
}

