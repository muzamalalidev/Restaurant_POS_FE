'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { Card } from '@mui/material';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { fDateTime } from 'src/utils/format-time';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import {
  useGetUsersQuery,
  useToggleUserActiveMutation,
} from 'src/store/api/users-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { UserRegisterDialog } from '../form/user-register-dialog';
import { UserDetailsDialog } from '../components/user-details-dialog';
import { AssignTenantOwnershipDialog } from '../components/assign-tenant-ownership-dialog';

// ----------------------------------------------------------------------

/**
 * User List View Component
 * 
 * Displays all users in a data-dense, filterable grid with actions.
 * Manages dialog state for register/view/assign ownership operations.
 */
export function UserListView() {
  // Dialog state management
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [assignOwnershipDialogOpen, setAssignOwnershipDialogOpen] = useState(false);
  const [assignOwnershipUser, setAssignOwnershipUser] = useState(null);

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

  // Fetch users with pagination and search params
  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      searchTerm: debouncedSearchTerm.trim() || undefined,
    }),
    [pageNumber, pageSize, debouncedSearchTerm]
  );

  const { data: usersResponse, isLoading, error, refetch } = useGetUsersQuery(queryParams);

  // Fetch tenants dropdown (for assign ownership dialog)
  const { data: tenantsDropdown } = useGetTenantsDropdownQuery(undefined);

  // Extract data from paginated response
  const users = useMemo(() => {
    if (!usersResponse) return [];
    return usersResponse.data || [];
  }, [usersResponse]);

  // Transform tenants dropdown to options (for assign ownership dialog)
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({
      id: item.key,
      label: item.value || item.key,
    }));
  }, [tenantsDropdown]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!usersResponse) {
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
      pageNumber: usersResponse.pageNumber ?? pageNumber,
      pageSize: usersResponse.pageSize ?? pageSize,
      totalCount: usersResponse.totalCount || 0,
      totalPages: usersResponse.totalPages || 0,
      hasPreviousPage: usersResponse.hasPreviousPage || false,
      hasNextPage: usersResponse.hasNextPage || false,
    };
  }, [usersResponse, pageNumber, pageSize]);

  // Mutations
  const [toggleUserActive, { isLoading: _isTogglingActive }] = useToggleUserActiveMutation();

  // Track which user is being toggled
  const [togglingUserId, setTogglingUserId] = useState(null);
  const inFlightIdsRef = useRef(new Set());

  // Handle register
  const handleRegister = useCallback(() => {
    setRegisterDialogOpen(true);
  }, []);

  // Handle view (pass full row from list; no getById)
  const handleView = useCallback((row) => {
    const record = users.find((u) => u.id === row.id) ?? null;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [users]);

  // Handle assign ownership
  const handleAssignOwnership = useCallback((row) => {
    const user = users.find((u) => u.id === row.id) ?? null;
    setAssignOwnershipUser(user);
    setAssignOwnershipDialogOpen(true);
  }, [users]);

  // Handle toggle active (ref guard prevents rapid clicks)
  const handleToggleActive = useCallback(async (userId) => {
    if (inFlightIdsRef.current.has(userId)) return;
    inFlightIdsRef.current.add(userId);
    setTogglingUserId(userId);
    try {
      await toggleUserActive(userId).unwrap();
      toast.success('User status updated successfully');
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update user status',
      });
      toast.error(message);
    } finally {
      inFlightIdsRef.current.delete(userId);
      setTogglingUserId(null);
    }
  }, [toggleUserActive]);

  // Handle register dialog success
  const handleRegisterSuccess = useCallback(() => {
    setRegisterDialogOpen(false);
    toast.success('User registered successfully');
    refetch();
  }, [refetch]);

  // Handle register dialog close
  const handleRegisterClose = useCallback(() => {
    setRegisterDialogOpen(false);
  }, []);

  // Handle assign ownership success
  const handleAssignOwnershipSuccess = useCallback(() => {
    setAssignOwnershipDialogOpen(false);
    setAssignOwnershipUser(null);
    toast.success('Tenant ownership assigned successfully');
    refetch();
  }, [refetch]);

  // Handle assign ownership close
  const handleAssignOwnershipClose = useCallback(() => {
    setAssignOwnershipDialogOpen(false);
    setAssignOwnershipUser(null);
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
    setPageNumber(1);
  }, [searchForm]);

  // Prepare table rows
  const rows = useMemo(() => users.map((user) => ({
    id: user.id,
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-',
    phoneNumber: user.phoneNumber || '-',
    isActive: user.isActive,
    emailConfirmed: user.emailConfirmed,
    phoneNumberConfirmed: user.phoneNumberConfirmed,
    createdAt: user.createdAt,
    lastUpdatedAt: user.lastUpdatedAt,
  })), [users]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'userName',
        headerName: 'User Name',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'fullName',
        headerName: 'Full Name',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'phoneNumber',
        headerName: 'Phone',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'isActive',
        headerName: 'Active',
        width: 100,
        renderCell: (params) => (
          <Label color={params.value ? 'success' : 'default'} variant="soft">
            {params.value ? 'Active' : 'Inactive'}
          </Label>
        ),
      },
      {
        field: 'emailConfirmed',
        headerName: 'Email Confirmed',
        width: 130,
        renderCell: (params) => (
          <Label color={params.value ? 'success' : 'default'} variant="soft" sx={{ fontSize: '0.75rem' }}>
            {params.value ? 'Confirmed' : 'Not Confirmed'}
          </Label>
        ),
      },
      {
        field: 'phoneNumberConfirmed',
        headerName: 'Phone Confirmed',
        width: 130,
        renderCell: (params) => (
          <Label color={params.value ? 'success' : 'default'} variant="soft" sx={{ fontSize: '0.75rem' }}>
            {params.value ? 'Confirmed' : 'Not Confirmed'}
          </Label>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created At',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value ? fDateTime(params.value) : '-'}
          </Typography>
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
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingUserId === row.id}
            onChange={(event) => {
              event.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            slotProps={{
              input: {
                id: `user-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.userName || 'user'}`,
              },
            }}
          />
        ),
        order: 2,
      },
      {
        id: 'assign-ownership',
        label: 'Assign Tenant Ownership',
        icon: 'solar:user-id-bold',
        onClick: (row) => handleAssignOwnership(row),
        order: 3,
      },
    ],
    [handleView, handleToggleActive, handleAssignOwnership, togglingUserId]
  );

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        {/* Search Bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <FormProvider {...searchForm}>
            <Field.Text
              name="searchTerm"
              size="small"
              placeholder="Search by user name, email, first name, last name, or phone..."
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
              sx={{ maxWidth: { sm: 400 }, flex: 1 }}
            />
          </FormProvider>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleRegister}
            sx={{ ml: { sm: 'auto' }, minHeight: 44 }}
          >
            Register User
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="users"
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
              title="No users found"
              description={
                searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by registering a new user"
              }
            />
          }
        />
      </Card>

      {/* Register Dialog */}
      <UserRegisterDialog
        open={registerDialogOpen}
        onClose={handleRegisterClose}
        onSuccess={handleRegisterSuccess}
      />

      {/* Details Dialog */}
      <UserDetailsDialog
        open={detailsDialogOpen}
        record={detailsDialogRecord}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogRecord(null);
        }}
      />

      {/* Assign Tenant Ownership Dialog */}
      <AssignTenantOwnershipDialog
        open={assignOwnershipDialogOpen}
        user={assignOwnershipUser}
        users={users}
        tenantOptions={tenantOptions}
        onClose={handleAssignOwnershipClose}
        onSuccess={handleAssignOwnershipSuccess}
      />
    </Box>
  );
}

