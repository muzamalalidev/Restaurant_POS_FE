'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useGetStaffTypesQuery, useDeleteStaffTypeMutation, useToggleStaffTypeActiveMutation } from 'src/store/api/staff-types-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { CustomTable } from 'src/components/custom-table';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

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
  const [formDialogStaffTypeId, setFormDialogStaffTypeId] = useState(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogStaffTypeId, setDetailsDialogStaffTypeId] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteStaffTypeId, setDeleteStaffTypeId] = useState(null);
  const [deleteStaffType, setDeleteStaffType] = useState(null); // P2-003 FIX: Store full object for details
  const [isDeleting, setIsDeleting] = useState(false); // P2-004 FIX: Track delete loading state

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // P2-REMAINING-001 FIX: Fetch all staff types for duplicate validation (pass to form dialog)
  // This avoids fetching 1000 records in the form dialog
  const { data: allStaffTypesResponse } = useGetStaffTypesQuery(
    { pageSize: 1000 },
    { skip: false } // Always fetch for duplicate validation
  );

  // Extract data from paginated response
  const staffTypes = useMemo(() => {
    if (!staffTypesResponse) return [];
    return staffTypesResponse.data || [];
  }, [staffTypesResponse]);

  // P2-REMAINING-001 FIX: Extract all staff types for duplicate validation
  const allStaffTypes = useMemo(() => {
    if (!allStaffTypesResponse) return [];
    return allStaffTypesResponse.data || [];
  }, [allStaffTypesResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!staffTypesResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: staffTypesResponse.totalCount || 0,
      totalPages: staffTypesResponse.totalPages || 0,
      hasPreviousPage: staffTypesResponse.hasPreviousPage || false,
      hasNextPage: staffTypesResponse.hasNextPage || false,
    };
  }, [staffTypesResponse]);

  // Mutations
  const [deleteStaffTypeMutation] = useDeleteStaffTypeMutation();
  const [toggleStaffTypeActive, { isLoading: isTogglingActive }] = useToggleStaffTypeActiveMutation();

  // Track which staff type is being toggled
  const [togglingStaffTypeId, setTogglingStaffTypeId] = useState(null);
  
  // P2-REMAINING-002 FIX: Track optimistic updates for toggle active
  const [optimisticToggleUpdates, setOptimisticToggleUpdates] = useState({});

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogStaffTypeId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((staffTypeId) => {
    setFormDialogMode('edit');
    setFormDialogStaffTypeId(staffTypeId);
    setFormDialogOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((staffTypeId) => {
    setDetailsDialogStaffTypeId(staffTypeId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((staffType) => {
    setDeleteStaffTypeId(staffType.id);
    setDeleteStaffType(staffType); // P2-003 FIX: Store full object
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    // P2-004 FIX: Prevent multiple delete clicks
    if (!deleteStaffTypeId || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteStaffTypeMutation(deleteStaffTypeId).unwrap();
      toast.success('Staff type deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteStaffTypeId(null);
      setDeleteStaffType(null);
    } catch (err) {
      // P1-004 FIX: Distinguish error types
      const errorStatus = err?.status || err?.data?.status;
      let errorMessage;
      
      if (errorStatus === 404) {
        errorMessage = err?.data?.message || 'Staff type not found or has been deleted';
      } else if (errorStatus === 400) {
        // Check if it's the "in use" error
        const message = err?.data?.message || '';
        if (message.includes('being used by staff members')) {
          errorMessage = 'Cannot delete staff type because it is being used by staff members. Please reassign or remove those staff members first.';
        } else {
          errorMessage = err?.data?.message || 'Validation failed. Please check your input.';
        }
      } else if (errorStatus >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err?.data?.message || 'Failed to delete staff type';
      }
      
      toast.error(errorMessage);
      console.error('Failed to delete staff type:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStaffTypeId, deleteStaffTypeMutation, isDeleting]);

  // Handle toggle active
  const handleToggleActive = useCallback(async (staffTypeId) => {
    // P1-005 FIX: Prevent rapid clicks
    if (togglingStaffTypeId === staffTypeId) {
      return; // Already toggling this staff type
    }
    
    // P2-REMAINING-002 FIX: Get current state for optimistic update
    // Check optimistic update first, then fall back to actual data
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
    
    setTogglingStaffTypeId(staffTypeId);
    try {
      await toggleStaffTypeActive(staffTypeId).unwrap();
      toast.success('Staff type status updated successfully');
      // P2-REMAINING-002 FIX: Clear optimistic update on success (cache invalidation will update data)
      setOptimisticToggleUpdates((prev) => {
        const updated = { ...prev };
        delete updated[staffTypeId];
        return updated;
      });
    } catch (err) {
      // P2-REMAINING-002 FIX: Revert optimistic update on error
      setOptimisticToggleUpdates((prev) => {
        const updated = { ...prev };
        delete updated[staffTypeId];
        return updated;
      });
      
      // P1-004 FIX: Distinguish error types
      const errorStatus = err?.status || err?.data?.status;
      let errorMessage;
      
      if (errorStatus === 404) {
        errorMessage = err?.data?.message || 'Staff type not found or has been deleted';
      } else if (errorStatus >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err?.data?.message || 'Failed to update staff type status';
      }
      
      toast.error(errorMessage);
      console.error('Failed to toggle staff type active status:', err);
    } finally {
      setTogglingStaffTypeId(null);
    }
  }, [toggleStaffTypeActive, togglingStaffTypeId, staffTypes]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogStaffTypeId(null);
    toast.success(`Staff type ${action} successfully`);
    // P2-REMAINING-003 FIX: Explicitly refetch to ensure list updates (cache invalidation should handle this, but explicit refetch ensures immediate update)
    refetch();
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogStaffTypeId(null);
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
        field: 'description',
        headerName: 'Description',
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

  // Error state
  if (error) {
    return (
      <EmptyContent
        title="Error loading staff types"
        description={error?.data?.message || 'An error occurred while loading staff types'}
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
            sx={{ ml: 'auto' }}
          >
            Create Staff Type
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
            enabled: false, // P1-008 FIX: Disable sorting since backend doesn't support custom sort parameters and client-side only sorts current page
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
        staffTypeId={formDialogStaffTypeId}
        staffTypeData={staffTypes.find((st) => st.id === formDialogStaffTypeId) || null}
        allStaffTypes={allStaffTypes} // P2-REMAINING-001 FIX: Pass all staff types for duplicate validation
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Details Dialog */}
      <StaffTypeDetailsDialog
        open={detailsDialogOpen}
        staffTypeId={detailsDialogStaffTypeId}
        staffTypeData={staffTypes.find((st) => st.id === detailsDialogStaffTypeId) || null}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogStaffTypeId(null);
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
          <Field.Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={isDeleting}>
            Delete
          </Field.Button>
        }
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false);
            setDeleteStaffTypeId(null);
            setDeleteStaffType(null);
          }
        }}
      />
    </Box>
  );
}

