'use client';

import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetStaffDropdownQuery } from 'src/store/api/staff-api';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import { useGetOrdersQuery, useDeleteOrderMutation } from 'src/store/api/orders-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { OrderFormDialog } from '../form/order-form-dialog';
import { OrderUpdateDialog } from '../form/order-update-dialog';
import { OrderDetailsDialog } from '../components/order-details-dialog';
import { getOrderStatusLabel, getOrderStatusColor, ORDER_STATUS_OPTIONS } from '../utils/order-status';

// ----------------------------------------------------------------------

const formatCurrency = (amount) =>
  amount == null ? '-' : fCurrency(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ----------------------------------------------------------------------

/**
 * Order List View Component
 * 
 * Displays all orders in a data-dense, filterable grid with actions.
 * Manages dialog state for create/view/update/delete operations.
 * 
 * Filter precedence: branchId > staffId > customerId.
 * P2-001: Tenant/branch isolation is enforced at the backend API level (no tenantId in params).
 * P2-004: Role-based visibility for Create/Update/Delete can be applied when backend supports it.
 */
export function OrderListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateDialogRecord, setUpdateDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [deleteOrderIdDisplay, setDeleteOrderIdDisplay] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state (with precedence: branchId > staffId > customerId)
  const [branchId, setBranchId] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [status, setStatus] = useState(null);

  // Minimal form for search
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal forms for filters
  const branchFilterForm = useForm({
    defaultValues: {
      branchId: null,
    },
  });

  const staffFilterForm = useForm({
    defaultValues: {
      staffId: null,
    },
  });

  const customerFilterForm = useForm({
    defaultValues: {
      customerId: null,
    },
  });

  const statusFilterForm = useForm({
    defaultValues: {
      status: null,
    },
  });

  // Watch search form value changes
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
  }, [branchId, branchFilterForm, getId]);

  // Watch branch filter form value changes
  const watchedBranchId = branchFilterForm.watch('branchId');
  useEffect(() => {
    const watchedId = getId(watchedBranchId);
    const currentId = getId(branchId);
    
    if (watchedId !== currentId) {
      isSyncingBranchRef.current = true;
      setBranchId(watchedBranchId);
      // When branchId is selected, clear staffId and customerId (branchId takes precedence)
      if (watchedBranchId) {
        setStaffId(null);
        setCustomerId(null);
        staffFilterForm.setValue('staffId', null, { shouldValidate: false, shouldDirty: false });
        customerFilterForm.setValue('customerId', null, { shouldValidate: false, shouldDirty: false });
      }
      setPageNumber(1);
      setTimeout(() => {
        isSyncingBranchRef.current = false;
      }, 0);
    }
  }, [watchedBranchId, branchId, staffFilterForm, customerFilterForm, getId]);

  // Sync staff filter form with state
  const isSyncingStaffRef = useRef(false);
  useEffect(() => {
    if (isSyncingStaffRef.current) return;
    const currentFormValue = staffFilterForm.getValues('staffId');
    const stateId = getId(staffId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      staffFilterForm.setValue('staffId', staffId, { shouldValidate: false, shouldDirty: false });
    }
  }, [staffId, staffFilterForm, getId]);

  // Watch staff filter form value changes
  const watchedStaffId = staffFilterForm.watch('staffId');
  useEffect(() => {
    // Only apply staff filter if branch is not selected (branchId takes precedence)
    if (branchId) return;
    
    const watchedId = getId(watchedStaffId);
    const currentId = getId(staffId);
    
    if (watchedId !== currentId) {
      isSyncingStaffRef.current = true;
      setStaffId(watchedStaffId);
      // When staffId is selected, clear customerId (staffId takes precedence over customerId)
      if (watchedStaffId) {
        setCustomerId(null);
        customerFilterForm.setValue('customerId', null, { shouldValidate: false, shouldDirty: false });
      }
      setPageNumber(1);
      setTimeout(() => {
        isSyncingStaffRef.current = false;
      }, 0);
    }
  }, [watchedStaffId, staffId, branchId, customerFilterForm, getId]);

  // Sync customer filter form with state
  const isSyncingCustomerRef = useRef(false);
  useEffect(() => {
    if (isSyncingCustomerRef.current) return;
    const currentFormValue = customerFilterForm.getValues('customerId');
    const stateId = getId(customerId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      customerFilterForm.setValue('customerId', customerId, { shouldValidate: false, shouldDirty: false });
    }
  }, [customerId, customerFilterForm, getId]);

  // Watch customer filter form value changes
  const watchedCustomerId = customerFilterForm.watch('customerId');
  useEffect(() => {
    // Only apply customer filter if branch and staff are not selected
    if (branchId || staffId) return;
    
    const watchedId = getId(watchedCustomerId);
    const currentId = getId(customerId);
    
    if (watchedId !== currentId) {
      isSyncingCustomerRef.current = true;
      setCustomerId(watchedCustomerId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingCustomerRef.current = false;
      }, 0);
    }
  }, [watchedCustomerId, customerId, branchId, staffId, getId]);

  // Sync status filter form with state
  const isSyncingStatusRef = useRef(false);
  useEffect(() => {
    if (isSyncingStatusRef.current) return;
    const currentFormValue = statusFilterForm.getValues('status');
    const stateId = getId(status);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      statusFilterForm.setValue('status', status, { shouldValidate: false, shouldDirty: false });
    }
  }, [status, statusFilterForm, getId]);

  // Watch status filter form value changes
  const watchedStatus = statusFilterForm.watch('status');
  useEffect(() => {
    const watchedId = getId(watchedStatus);
    const currentId = getId(status);
    
    if (watchedId !== currentId) {
      isSyncingStatusRef.current = true;
      setStatus(watchedStatus);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingStatusRef.current = false;
      }, 0);
    }
  }, [watchedStatus, status, getId]);

  const { data: branchesDropdown } = useGetBranchesDropdownQuery();
  const { data: staffDropdown } = useGetStaffDropdownQuery();

  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  const staffOptions = useMemo(() => {
    if (!staffDropdown || !Array.isArray(staffDropdown)) return [];
    return staffDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [staffDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders with pagination, search, and filter params
  const queryParams = useMemo(
    () => {
      // Extract branchId: if it's an object, get the id; if it's a string, use it directly
      const branchIdValue = typeof branchId === 'object' && branchId !== null
        ? branchId.id
        : branchId;

      // Extract staffId: only include if branchId is not set (branchId takes precedence)
      const staffIdValue = branchIdValue
        ? undefined
        : (typeof staffId === 'object' && staffId !== null
            ? staffId.id
            : staffId);

      // Extract customerId: only include if branchId and staffId are not set
      const customerIdValue = branchIdValue || staffIdValue
        ? undefined
        : (typeof customerId === 'object' && customerId !== null
            ? customerId.id
            : customerId);

      // Extract status: if it's an object, get the id; if it's a number, use it directly
      const statusValue = typeof status === 'object' && status !== null
        ? status.id
        : status;

      return {
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
        branchId: branchIdValue || undefined,
        staffId: staffIdValue || undefined,
        customerId: customerIdValue || undefined,
        status: statusValue || undefined,
        includeItems: true, // Full row for View/Update without getById
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, branchId, staffId, customerId, status]
  );

  const { data: ordersResponse, isLoading, error, refetch } = useGetOrdersQuery(queryParams);

  // Extract data from paginated response
  const orders = useMemo(() => {
    if (!ordersResponse) return [];
    return ordersResponse.data || [];
  }, [ordersResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!ordersResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: ordersResponse.totalCount || 0,
      totalPages: ordersResponse.totalPages || 0,
      hasPreviousPage: ordersResponse.hasPreviousPage || false,
      hasNextPage: ordersResponse.hasNextPage || false,
    };
  }, [ordersResponse]);

  // Mutations
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogOpen(true);
  }, []);

  // Handle update (pass full row; resolve record from orders)
  const handleUpdate = useCallback((row) => {
    const record = orders.find((o) => o.id === row.id) ?? null;
    if (!record) return;
    setUpdateDialogRecord(record);
    setUpdateDialogOpen(true);
  }, [orders]);

  // Handle view
  const handleView = useCallback((row) => {
    const record = orders.find((o) => o.id === row.id) ?? null;
    if (!record) return;
    setDetailsDialogRecord(record);
    setDetailsDialogOpen(true);
  }, [orders]);

  // Handle delete confirmation
  const handleDeleteClick = useCallback((row) => {
    setDeleteOrderId(row.id);
    setDeleteOrderIdDisplay(row.id.substring(0, 8) + '...');
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteOrderId) return;

    try {
      await deleteOrder(deleteOrderId).unwrap();
      toast.success('Order deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteOrderId(null);
      setDeleteOrderIdDisplay(null);
      if (orders.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete order',
        notFoundMessage: 'Order not found or already deleted',
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleDeleteConfirm() },
        });
      } else {
        toast.error(message);
      }
    }
  }, [deleteOrderId, deleteOrder, orders.length, pageNumber]);

  // Handle form dialog success
  const handleFormSuccess = useCallback((id, action) => {
    setFormDialogOpen(false);
    refetch();
    toast.success(`Order ${action} successfully`);
  }, [refetch]);

  // Handle form dialog close
  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
  }, []);

  // Handle update dialog success
  const handleUpdateSuccess = useCallback((id, action) => {
    setUpdateDialogOpen(false);
    setUpdateDialogRecord(null);
    refetch();
    toast.success(`Order ${action} successfully`);
  }, [refetch]);

  // Handle update dialog close
  const handleUpdateClose = useCallback(() => {
    setUpdateDialogOpen(false);
    setUpdateDialogRecord(null);
  }, []);

  // Handle details dialog close
  const handleDetailsClose = useCallback(() => {
    setDetailsDialogOpen(false);
    setDetailsDialogRecord(null);
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

  // Prepare table rows (use API response keys: branchName, orderTypeName, paymentMode, staffName, tableName, etc.)
  const rows = useMemo(() => orders.map((order) => ({
      id: order.id,
      branchId: order.branchId,
      branchName: order.branchName ?? '-',
      orderTypeId: order.orderTypeId,
      orderTypeName: order.orderTypeName ?? '-',
      paymentModeName: order.paymentMode?.name ?? order.orderTypeName ?? '-',
      status: order.status,
      statusLabel: getOrderStatusLabel(order.status),
      totalAmount: order.totalAmount,
      totalAmountFormatted: formatCurrency(order.totalAmount),
      subTotal: order.subTotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      staffId: order.staffId,
      staffName: order.staffName ?? '-',
      tableId: order.tableId,
      tableName: order.tableName ?? '-',
      customerId: order.customerId,
      customerName: order.customerName ?? '-',
      kitchenId: order.kitchenId,
      kitchenName: order.kitchenName ?? '-',
      notes: order.notes || '-',
    })), [orders]);

  // Define columns
  const columns = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'Order ID',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {params.value?.substring(0, 8) + '...' || '-'}
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
        field: 'statusLabel',
        headerName: 'Status',
        flex: 1,
        renderCell: (params) => (
          <Label color={getOrderStatusColor(params.row.status)} variant="soft" sx={{ fontSize: '0.75rem' }}>
            {params.value}
          </Label>
        ),
      },
      {
        field: 'totalAmountFormatted',
        headerName: 'Total Amount',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'notes',
        headerName: 'Notes',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 200,
          }}>
            {params.value}
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
        id: 'update',
        label: 'Update',
        icon: 'solar:pen-bold',
        onClick: (row) => handleUpdate(row),
        order: 2,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => handleDeleteClick(row),
        order: 3,
      },
    ],
    [handleView, handleUpdate, handleDeleteClick]
  );

  // Check if branchId is selected (for disabling staffId and customerId filters)
  const isBranchSelected = useMemo(() => branchId !== null && branchId !== undefined, [branchId]);

  // Check if staffId is selected (for disabling customerId filter)
  const isStaffSelected = useMemo(() => staffId !== null && staffId !== undefined, [staffId]);

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
              placeholder="Search orders..."
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
          <FormProvider {...staffFilterForm}>
            <Field.Autocomplete
              name="staffId"
              label="Staff"
              options={staffOptions}
              getOptionLabel={(option) => {
                if (!option) return '';
                return option.label || option.name || option.id || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                return option.id === value.id;
              }}
              disabled={isBranchSelected}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'All Staff',
                  helperText: isBranchSelected ? 'Disabled when branch is selected' : undefined,
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <FormProvider {...customerFilterForm}>
            <Field.Autocomplete
              name="customerId"
              label="Customer"
              options={[]}
              getOptionLabel={(option) => {
                if (!option) return '';
                return option.label || option.name || option.id || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                return option.id === value.id;
              }}
              disabled={isBranchSelected || isStaffSelected}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'All Customers',
                  helperText: (isBranchSelected || isStaffSelected) ? 'Disabled when branch or staff is selected' : 'Customers API not yet implemented',
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <FormProvider {...statusFilterForm}>
            <Field.Autocomplete
              name="status"
              label="Status"
              options={ORDER_STATUS_OPTIONS}
              getOptionLabel={(option) => {
                if (!option) return '';
                if (typeof option === 'number') {
                  const found = ORDER_STATUS_OPTIONS.find((opt) => opt.id === option);
                  return found?.label || '';
                }
                return option.label || option.name || option.id || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                const optionId = typeof option === 'object' ? option.id : option;
                const valueId = typeof value === 'object' ? value.id : value;
                return optionId === valueId;
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'All Statuses',
                },
              }}
              sx={{ minWidth: { sm: 200 } }}
            />
          </FormProvider>
          <Button
            component={Link}
            href={paths.tenant.orders.root}
            variant="contained"
            startIcon={<Iconify icon="solar:cart-large-2-bold" />}
            sx={{ ml: 'auto', flexShrink: 0 }}
          >
            POS
          </Button>
        </Stack>

      {/* Data Grid - P0-005: show error in table area so filters/Create remain; P0-001: sorting disabled with server pagination; P1-005: no initialState */}
      <CustomTable
        rows={rows}
        columns={columns}
        actions={actions}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        errorEntityLabel="orders"
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
            title="No orders found"
            description={
              searchTerm || branchId || staffId || customerId || status
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating a new order"
            }
            action={
              <Field.Button variant="contained" onClick={handleCreate} startIcon="mingcute:add-line">
                Create Order
              </Field.Button>
            }
          />
        }
      />
      </Card>


      {/* Create Order Dialog */}
      <OrderFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        branchOptions={branchOptions}
        staffOptions={staffOptions}
      />

      {/* Update Order Dialog */}
      <OrderUpdateDialog
        open={updateDialogOpen}
        record={updateDialogRecord}
        onClose={handleUpdateClose}
        onSuccess={handleUpdateSuccess}
      />

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        open={detailsDialogOpen}
        record={detailsDialogRecord}
        onClose={handleDetailsClose}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Order?"
        content={`Are you sure you want to delete order ${deleteOrderIdDisplay || ''}? This action cannot be undone.`}
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
          setDeleteOrderId(null);
          setDeleteOrderIdDisplay(null);
        }}
        loading={isDeleting}
        disableClose={isDeleting}
      />
    </Box>
  );
}

