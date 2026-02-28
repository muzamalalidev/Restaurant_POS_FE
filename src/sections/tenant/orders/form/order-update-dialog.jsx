'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { updateOrderSchema } from 'src/schemas';
import { useUpdateOrderMutation } from 'src/store/api/orders-api';
import { useGetStaffDropdownQuery } from 'src/store/api/staff-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { isActiveStatus, isCompletionStatus, ORDER_STATUS_OPTIONS } from '../utils/order-status';

// ----------------------------------------------------------------------

/**
 * Order Update Dialog Component
 *
 * Dialog for updating order status, staff, and notes. Uses the passed record from the list (no getById).
 *
 * Dropdown analysis:
 * - status: Static (ORDER_STATUS_OPTIONS). No dependency.
 * - staffId: API (useGetStaffDropdownQuery scoped by record.branchId when open). Synthetic option used when record.staffId not yet in staffOptions.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full order record from list (id, staffId, status, notes, tableId, branchId, staffName?)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function OrderUpdateDialog({ open, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Fetch staff options from dropdown API (scoped to order branch when available)
  const { data: staffDropdown } = useGetStaffDropdownQuery(
    open && record?.branchId ? { branchId: record.branchId } : undefined,
    { skip: !open }
  );

  const staffOptionsBase = useMemo(() => {
    if (!staffDropdown || !Array.isArray(staffDropdown)) return [];
    return staffDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [staffDropdown]);

  const effectiveStaffOptions = useMemo(() => {
    if (record?.staffId && !staffOptionsBase.some((s) => s.id === record.staffId)) {
      return [...staffOptionsBase, { id: record.staffId, label: record.staffName || record.staffId }];
    }
    return staffOptionsBase;
  }, [record?.staffId, record?.staffName, staffOptionsBase]);

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
    getValues,
    setValue,
    formState: { isDirty },
  } = methods;

  // Watch status to show table availability warning
  const watchedStatus = watch('status');
  const currentStatus = record?.status;
  const hasTable = record?.tableId !== null && record?.tableId !== undefined;

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

  // Load order data from passed record or reset when closed / no record
  useEffect(() => {
    if (!open) {
      reset({
        staffId: null,
        status: ORDER_STATUS_OPTIONS[0],
        notes: null,
      });
      return;
    }

    if (record) {
      const matchingStaff =
        record.staffId && effectiveStaffOptions.length > 0
          ? effectiveStaffOptions.find((s) => s.id === record.staffId)
          : null;
      const staffValue =
        matchingStaff || (record.staffId ? { id: record.staffId, label: record.staffName || record.staffId } : null);
      const matchingStatus = ORDER_STATUS_OPTIONS.find((opt) => opt.id === record.status);

      reset({
        staffId: staffValue,
        status: matchingStatus || ORDER_STATUS_OPTIONS[0],
        notes: record.notes || null,
      });
    } else {
      reset({
        staffId: null,
        status: ORDER_STATUS_OPTIONS[0],
        notes: null,
      });
    }
  }, [open, record, record?.id, record?.staffId, record?.status, record?.notes, record?.staffName, effectiveStaffOptions, reset]);

  // When staff options load, set staffId to matching option (replaces synthetic)
  useEffect(() => {
    if (open && record?.staffId && staffOptionsBase.length > 0) {
      const matchingStaff = staffOptionsBase.find((s) => s.id === record.staffId);
      if (matchingStaff) {
        const currentValue = getValues('staffId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingStaff.id) {
          setValue('staffId', matchingStaff, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
  }, [open, record?.staffId, staffOptionsBase, getValues, setValue]);

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

      await updateOrder({ id: record.id, ...updateData }).unwrap();
      if (onSuccess) {
        onSuccess(record.id, 'updated');
      }
      reset();
      onClose();
      // P0-004: Parent shows toast on onSuccess; no duplicate here
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Failed to update order',
        notFoundMessage: 'Order not found or already updated',
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => handleSubmit(onSubmit)() },
        });
      } else {
        toast.error(message);
      }
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

  const isLoading = false;
  const hasRecord = Boolean(record);

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
        {hasRecord ? (
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
                options={effectiveStaffOptions}
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
        ) : null}
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

