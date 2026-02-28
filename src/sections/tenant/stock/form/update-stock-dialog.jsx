'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { updateStockSchema } from 'src/schemas';
import { useUpdateStockMutation } from 'src/store/api/stock-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { formatStockQuantity } from '../utils/stock-helpers';

// ----------------------------------------------------------------------

/**
 * Update Stock Dialog Component
 *
 * Dialog for updating stock quantity to an absolute value. Uses the full row object
 * passed from the list (no getStock API call).
 *
 * Dropdown analysis: No dropdowns. Single field stockQuantity (number). Record from list.
 * When open with no record (e.g. row no longer in list), form resets to stockQuantity: 0.
 */
export function UpdateStockDialog({ open, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  // P0-003: Ref to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Mutations
  const [updateStock, { isLoading: isUpdating }] = useUpdateStockMutation();
  const isSubmitting = isUpdating;

  const currentStock = record?.stockQuantity ?? 0;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(updateStockSchema),
    defaultValues: useMemo(
      () => ({
        stockQuantity: null,
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

  // Watch form values for calculations
  const watchedStockQuantity = watch('stockQuantity');

  // Calculate difference
  const difference = useMemo(() => {
    if (!watchedStockQuantity || watchedStockQuantity === '') return 0;
    const newStock = Number(watchedStockQuantity) || 0;
    return newStock - currentStock;
  }, [watchedStockQuantity, currentStock]);

  // Check if new stock would be negative
  const wouldBeNegative = useMemo(() => {
    if (!watchedStockQuantity || watchedStockQuantity === '') return false;
    const newStock = Number(watchedStockQuantity) || 0;
    return newStock < 0;
  }, [watchedStockQuantity]);

  // Load stock data from record or reset when closed / no record
  useEffect(() => {
    if (!open) {
      reset({ stockQuantity: null });
      return;
    }
    if (record) {
      reset({
        stockQuantity: record.stockQuantity ?? null,
      });
    } else {
      reset({ stockQuantity: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record?.id, record?.stockQuantity, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    try {
      await updateStock({
        itemId: record.id,
        stockQuantity: Number(data.stockQuantity),
      }).unwrap();
      if (onSuccess) {
        onSuccess(record.id, 'updated');
      }
      reset();
      onClose();
      toast.success('Stock updated successfully');
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Failed to update stock',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => {
                onSubmit({ preventDefault: () => {}, target: { checkValidity: () => true } });
              }, 100);
            },
          },
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
        disabled={isSubmitting || wouldBeNegative}
        startIcon="solar:check-circle-bold"
        sx={{ minHeight: 44 }}
      >
        Update Stock
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Update Stock"
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Current Stock Display */}
              <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Current Stock Quantity
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formatStockQuantity(currentStock)}
                </Typography>
              </Box>

              {/* Warning for negative stock */}
              {wouldBeNegative && (
                <Alert severity="error">
                  Stock quantity cannot be negative. Please enter a value greater than or equal to 0.
                </Alert>
              )}

              {/* New Stock Quantity */}
              <Field.Text
                name="stockQuantity"
                label="New Stock Quantity"
                type="number"
                placeholder="Enter new stock quantity"
                required
                slotProps={{
                  input: {
                    inputProps: { min: 0, step: 0.01 },
                  },
                  textField: {
                    size: 'small',
                    helperText: 'This will replace the current stock quantity',
                  },
                }}
              />

              {/* Difference Display */}
              {watchedStockQuantity && watchedStockQuantity !== '' && !wouldBeNegative && (
                <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Change:
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'text.primary',
                      }}
                    >
                      {difference > 0 ? '+' : ''}{formatStockQuantity(difference)}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Form>
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

