'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { fDate } from 'src/utils/format-time';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import { useGetStaffTypesDropdownQuery } from 'src/store/api/staff-types-api';
import { useGetStaffQuery, useDeleteStaffMutation, useToggleStaffActiveMutation } from 'src/store/api/staff-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { StaffFormDialog } from '../form/staff-form-dialog';
import { StaffDetailsDialog } from '../components/staff-details-dialog';

// ----------------------------------------------------------------------

/**
 * Staff List View Component
 * 
 * Displays all staff members in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view operations.
 */
export function StaffListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteStaffId, setDeleteStaffId] = useState(null);
  const [deleteStaffName, setDeleteStaffName] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state
  const [branchId, setBranchId] = useState(null);
  const [staffTypeId, setStaffTypeId] = useState(null);

  // Minimal form for search (required for Field.Text)
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal forms for filters (required for Field.Autocomplete)
  const branchFilterForm = useForm({
    defaultValues: {
      branchId: null,
    },
  });

  const staffTypeFilterForm = useForm({
    defaultValues: {
      staffTypeId: null,
    },
  });

  // Watch search form value changes and sync with searchTerm state
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Helper function to extract ID from object or string
  const getId = useCallback((value) => {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return value.id;
    }
    return value;
  }, []);

  // Watch branch filter form value changes (simplified - no sync loop)
  const watchedBranchId = branchFilterForm.watch('branchId');
  useEffect(() => {
    const watchedId = getId(watchedBranchId);
    const currentId = getId(branchId);
    
    // Only update if value actually changed
    if (watchedId !== currentId) {
      setBranchId(watchedBranchId);
      // If branch is selected, clear staff type filter (branchId takes precedence)
      if (watchedBranchId) {
        setStaffTypeId(null);
        staffTypeFilterForm.setValue('staffTypeId', null, { shouldValidate: false, shouldDirty: false });
      }
      setPageNumber(1);
    }
  }, [watchedBranchId, branchId, getId, staffTypeFilterForm]);

  // Watch staff type filter form value changes (simplified - no sync loop)
  const watchedStaffTypeId = staffTypeFilterForm.watch('staffTypeId');
  useEffect(() => {
    // Only apply staff type filter if branch is not selected (branchId takes precedence)
    if (branchId) return;
    
    const watchedId = getId(watchedStaffTypeId);
    const currentId = getId(staffTypeId);
    
    // Only update if value actually changed
    if (watchedId !== currentId) {
      setStaffTypeId(watchedStaffTypeId);
      setPageNumber(1);
    }
  }, [watchedStaffTypeId, staffTypeId, branchId, getId]);

  const { data: branchesDropdown } = useGetBranchesDropdownQuery();
  const { data: staffTypesDropdown } = useGetStaffTypesDropdownQuery();

  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  const staffTypeOptions = useMemo(() => {
    if (!staffTypesDropdown || !Array.isArray(staffTypesDropdown)) return [];
    return staffTypesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [staffTypesDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch staff with pagination, search, and filter params
  const queryParams = useMemo(
    () => {
      // Extract branchId: if it's an object, get the id; if it's a string, use it directly
      const branchIdValue = typeof branchId === 'object' && branchId !== null
        ? branchId.id
        : branchId;

      // Extract staffTypeId: if it's an object, get the id; if it's a string, use it directly
      // Only include if branchId is not set (branchId takes precedence)
      const staffTypeIdValue = branchIdValue
        ? undefined
        : (typeof staffTypeId === 'object' && staffTypeId !== null
            ? staffTypeId.id
            : staffTypeId);

      return {
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        branchId: branchIdValue || undefined,
        staffTypeId: staffTypeIdValue || undefined,
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, branchId, staffTypeId]
  );

  const { data: staffResponse, isLoading, error, refetch } = useGetStaffQuery(queryParams);

  // Extract data from paginated response
  const staff = useMemo(() => {
    if (!staffResponse) return [];
    return staffResponse.data || [];
  }, [staffResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!staffResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: staffResponse.totalCount || 0,
      totalPages: staffResponse.totalPages || 0,
      hasPreviousPage: staffResponse.hasPreviousPage || false,
      hasNextPage: staffResponse.hasNextPage || false,
    };
  }, [staffResponse]);

  // Mutations
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const [toggleStaffActive, { isLoading: _isTogglingActive }] = useToggleStaffActiveMutation();

  // Track which staff is being toggled
  const [togglingStaffId, setTogglingStaffId] = useState(null);

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit (pass full row from list; no getById)
  const handleEdit = useCallback((row) => {
    const record = staff.find((s) => s.id === row.id) ?? null;
    setFormDialogMode('edit');
    setFormDialogRecord(record);
    setFormDialogOpen(true);
  }, [staff]);

  // Handle view (pass full row from list; no getById)
  const handleView = useCallback((row) => {
    const record = staff.find((s) => s.id === row.id) ?? null;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [staff]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((row) => {
    setDeleteStaffId(row.id);
    const staffTypeName = row.staffTypeName && row.staffTypeName !== '-' ? row.staffTypeName : '';
    const branchName = row.branchName && row.branchName !== '-' ? row.branchName : '';
    const fullName = row.fullName || 'Staff member';
    const identifier = [fullName, staffTypeName, branchName].filter(Boolean).join(' - ');
    setDeleteStaffName(identifier);
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteStaffId) return;

    try {
      await deleteStaff(deleteStaffId).unwrap();
      // Use the deleteStaffName which already includes staff type and branch
      const staffName = deleteStaffName || 'Staff member';
      toast.success(`${staffName} deleted successfully`);
      setDeleteConfirmOpen(false);
      setDeleteStaffId(null);
      setDeleteStaffName(null);
      if (staff.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete staff member',
        notFoundMessage: 'Staff member not found',
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleDeleteConfirm() },
        });
      } else {
        toast.error(message);
      }
    }
  }, [deleteStaffId, deleteStaff, deleteStaffName, staff.length, pageNumber]);

  // Handle toggle active with optimistic update
  const handleToggleActive = useCallback(async (staffId) => {
    // Find current staff member to get current isActive state
    const currentStaff = staff.find((s) => s.id === staffId);
    if (!currentStaff) return;

    const previousIsActive = currentStaff.isActive;
    const _newIsActive = !previousIsActive;

    // Optimistic update: update local cache immediately
    // RTK Query will handle the actual cache update, but we need to update the displayed rows
    // Since we're using server-side data, we'll rely on cache invalidation, but show immediate feedback
    setTogglingStaffId(staffId);
    
    try {
      await toggleStaffActive(staffId).unwrap();
      // Find staff name for success message
      const staffMember = staff.find((s) => s.id === staffId);
      const staffName = staffMember 
        ? `${staffMember.firstName} ${staffMember.lastName}`.trim() 
        : 'Staff member';
      // Status is toggled, so new status is opposite of previous
      const newStatus = previousIsActive ? 'deactivated' : 'activated';
      toast.success(`${staffName} ${newStatus} successfully`);
    } catch (err) {
      setTogglingStaffId(null);
      refetch();
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update staff member status',
        notFoundMessage: 'Staff member not found',
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleToggleActive(staffId) },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setTogglingStaffId(null);
    }
  }, [toggleStaffActive, staff, refetch]);

  // Handle form dialog success
  // Contract: onSuccess(id, action, payload?). id is scalar; for create, payload is API result (for display name).
  const handleFormSuccess = useCallback((id, action, payload) => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
    refetch();
    const displayName =
      action === 'created' && payload && (payload.firstName != null || payload.lastName != null)
        ? `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'Staff member'
        : (() => {
            const staffMember = typeof id === 'string' || typeof id === 'number' ? staff.find((s) => s.id === id) : null;
            return staffMember
              ? `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim()
              : 'Staff member';
          })();
    const verb = action === 'created' ? 'created' : 'updated';
    toast.success(`${displayName} ${verb} successfully`);
  }, [staff, refetch]);

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

  // Format date for display (uses shared fDate from format-time)
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    const formatted = fDate(dateString);
    return formatted === 'Invalid date' ? '-' : formatted;
  }, []);

  // Prepare table rows with optimistic update for toggling (use API response keys: branchName, staffTypeName)
  const rows = useMemo(() => staff.map((staffMember) => {
      let isActive = staffMember.isActive;
      if (togglingStaffId === staffMember.id) {
        isActive = !isActive;
      }
      return {
        id: staffMember.id,
        fullName: `${staffMember.firstName} ${staffMember.lastName}`.trim() || '-',
        staffTypeName: staffMember.staffTypeName || '-',
        branchName: staffMember.branchName || '-',
        branchId: staffMember.branchId,
        email: staffMember.email || '-',
        phone: staffMember.phone || '-',
        hireDate: formatDate(staffMember.hireDate),
        isActive,
      };
    }), [staff, formatDate, togglingStaffId]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'fullName',
        headerName: 'Full Name',
        flex: 1,
      },
      {
        field: 'staffTypeName',
        headerName: 'Staff Type',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
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
        field: 'email',
        headerName: 'Email',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'phone',
        headerName: 'Phone',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value === '-' ? '-' : params.value}
          </Typography>
        ),
      },
      {
        field: 'hireDate',
        headerName: 'Hire Date',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
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
            disabled={togglingStaffId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `staff-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.fullName || 'staff member'}`,
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
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingStaffId]
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
              placeholder="Search by name, email, or phone..."
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
                  placeholder: 'All Branches',
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <FormProvider {...staffTypeFilterForm}>
            <Field.Autocomplete
              name="staffTypeId"
              label="Staff Type"
              options={staffTypeOptions}
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
                  placeholder: 'All Staff Types',
                  disabled: !!branchId, // Disable when branch is selected (branchId takes precedence)
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ ml: 'auto', minHeight: 44 }}
          >
            Create Staff
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="staff"
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
              title="No staff members found"
              description={
                searchTerm || branchId || staffTypeId
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating a new staff member"
              }
            />
          }
        />
      </Card>

      {/* Form Dialog */}
      <StaffFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        record={formDialogRecord}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        branchOptions={branchOptions}
        staffTypeOptions={staffTypeOptions}
      />

      {/* Details Dialog */}
      <StaffDetailsDialog
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
        title="Delete Staff Member"
        content={
          deleteStaffName
            ? `Are you sure you want to delete "${deleteStaffName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this staff member? This action cannot be undone.'
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
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteStaffId(null);
          setDeleteStaffName(null);
        }}
        loading={isDeleting}
        disableClose={isDeleting}
      />
    </Box>
  );
}

