'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme, useMediaQuery } from '@mui/material';

import { updateOrderSchema } from 'src/schemas';
import { useGetStaffQuery } from 'src/store/api/staff-api';
import { useGetOrderByIdQuery, useUpdateOrderMutation } from 'src/store/api/orders-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { isActiveStatus, isCompletionStatus, ORDER_STATUS_OPTIONS } from '../utils/order-status';

// ----------------------------------------------------------------------

/**
 * Order Update Dialog Component
 * 
 * Dialog component for updating order status, staff, and notes.
 * Handles form state, validation, and API calls.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.orderId - Order ID for update
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function OrderUpdateDialog({ open, orderId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Fetch order data (P1-006: refetch for Retry on error)
  const { data: orderData, isLoading: isLoadingOrder, error: queryError, isError: _isError, refetch: refetchOrder } = useGetOrderByIdQuery(
    { id: orderId, includeItems: false },
    { skip: !orderId || !open }
  );

  // Fetch staff options (P0-003: limit to 200)
  const { data: staffResponse } = useGetStaffQuery({ pageSize: 200 });

  // Staff options
  const staffOptions = useMemo(() => {
    if (!staffResponse) return [];
    const staff = staffResponse.data || [];
    return staff.map((s) => ({
      id: s.id,
      label: s.name || s.id,
    }));
  }, [staffResponse]);

  // Mutations
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const isSubmitting = isUpdating;
  // P0-002: Ref guard to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Form setup
  const methods = useForm({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: useMemo(
      () => ({
        staffId: null,
        status: ORDER_STATUS_OPTIONS[0],
        notes: null,
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = methods;

  // Watch status to show table availability warning
  const watchedStatus = watch('status');
  const currentStatus = orderData?.status;
  const hasTable = orderData?.tableId !== null && orderData?.tableId !== undefined;

  // Check if status change will affect table availability
  const willFreeTable = useMemo(() => {
    if (!hasTable || !currentStatus || !watchedStatus) return false;
    const currentIsCompletion = isCompletionStatus(currentStatus);
    const newIsCompletion = isCompletionStatus(
      typeof watchedStatus === 'object' && watchedStatus !== null
        ? watchedStatus.id
        : watchedStatus
    );
    return !currentIsCompletion && newIsCompletion;
  }, [hasTable, currentStatus, watchedStatus]);

  const willReserveTable = useMemo(() => {
    if (!hasTable || !currentStatus || !watchedStatus) return false;
    const currentIsCompletion = isCompletionStatus(currentStatus);
    const newIsActive = isActiveStatus(
      typeof watchedStatus === 'object' && watchedStatus !== null
        ? watchedStatus.id
        : watchedStatus
    );
    return currentIsCompletion && newIsActive;
  }, [hasTable, currentStatus, watchedStatus]);

  // Load order data for edit mode
  useEffect(() => {
    if (!open) {
      reset({
        staffId: null,
        status: ORDER_STATUS_OPTIONS[0],
        notes: null,
      });
      return;
    }

    if (orderData) {
      // Find matching staff and status objects from options
      const matchingStaff = orderData.staffId
        ? staffOptions.find((s) => s.id === orderData.staffId)
        : null;
      const matchingStatus = ORDER_STATUS_OPTIONS.find((opt) => opt.id === orderData.status);

      reset({
        staffId: matchingStaff || null,
        status: matchingStatus || ORDER_STATUS_OPTIONS[0],
        notes: orderData.notes || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderData?.id, orderData?.staffId, orderData?.status, orderData?.notes, staffOptions, reset]);

  // Handle form submit (P0-002: ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const updateData = {
        staffId: typeof data.staffId === 'object' && data.staffId !== null
          ? data.staffId.id
          : (data.staffId || null),
        status: typeof data.status === 'object' && data.status !== null
          ? data.status.id
          : Number(data.status),
        notes: data.notes === '' ? null : data.notes,
      };

      await updateOrder({ id: orderId, ...updateData }).unwrap();
      if (onSuccess) {
        onSuccess(orderId, 'updated');
      }
      reset();
      onClose();
      // P0-004: Parent shows toast on onSuccess; no duplicate here
    } catch (error) {
      console.error('Failed to update order:', error);
      const errorMessage = error?.data?.message || error?.data || error?.message || 'Failed to update order';
      toast.error(errorMessage);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      setUnsavedChangesDialogOpen(true);
      return;
    }

    reset();
    onClose();
  }, [isSubmitting, isDirty, reset, onClose]);

  // Handle confirm discard changes
  const handleConfirmDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
    reset();
    onClose();
  }, [reset, onClose]);

  // Handle cancel discard changes
  const handleCancelDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
  }, []);

  // Render actions
  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Field.Button
        variant="outlined"
        color="inherit"
        onClick={handleClose}
        disabled={isSubmitting}
      >
        Cancel
      </Field.Button>
      <Field.Button
        variant="contained"
        type="submit"
        onClick={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        startIcon="solar:check-circle-bold"
        sx={{ minHeight: 44 }}
      >
        Update Order
      </Field.Button>
    </Box>
  );

  const isLoading = isLoadingOrder;
  const hasError = !orderData && !isLoadingOrder && orderId && open;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Update Order"
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <QueryStateContent
          isLoading={isLoading}
          isError={hasError}
          error={queryError}
          onRetry={refetchOrder}
          loadingMessage="Loading order data..."
          errorTitle="Failed to load order data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load order data',
            notFoundMessage: 'Order not found or an error occurred.',
          }}
        >
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Table Availability Warning */}
              {hasTable && (willFreeTable || willReserveTable) && (
                <Alert severity="info">
                  {willFreeTable && 'Changing status to a completion status will free the table.'}
                  {willReserveTable && 'Changing status from a completion status will reserve the table again.'}
                </Alert>
              )}

              {/* Status */}
              <Field.Autocomplete
                name="status"
                label="Order Status"
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
                required
              />

              {/* Staff */}
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
                slotProps={{
                  textField: {
                    helperText: 'Leave empty to preserve existing staff assignment',
                  },
                }}
              />

              {/* Notes */}
              <Field.Text
                name="notes"
                label="Order Notes"
                placeholder="Enter order notes (optional)"
                multiline
                rows={4}
                slotProps={{
                  textField: {
                    helperText: 'Leave empty to preserve existing notes',
                  },
                }}
              />
            </Box>
          </Form>
        </QueryStateContent>
      </CustomDialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        open={unsavedChangesDialogOpen}
        title="Discard Changes?"
        content="You have unsaved changes. Are you sure you want to close without saving?"
        action={
          <Field.Button variant="contained" color="error" onClick={handleConfirmDiscard}>
            Discard
          </Field.Button>
        }
        onClose={handleCancelDiscard}
      />
    </>
  );
}

