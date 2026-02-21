'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { toast } from 'src/components/snackbar';

import { useGetStockQuery, useUpdateStockMutation } from 'src/store/api/stock-api';
import { updateStockSchema } from '../schemas/stock-schema';
import { formatStockQuantity } from '../utils/stock-helpers';

// ----------------------------------------------------------------------

/**
 * Update Stock Dialog Component
 * 
 * Dialog component for updating stock quantity to an absolute value.
 * Handles form state, validation, and API calls.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.itemId - Item ID for stock update
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function UpdateStockDialog({ open, itemId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  // P0-003: Ref to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Fetch current stock
  const { data: stockData, isLoading: isLoadingStock } = useGetStockQuery(
    itemId,
    { skip: !itemId || !open }
  );

  // Mutations
  const [updateStock, { isLoading: isUpdating }] = useUpdateStockMutation();
  const isSubmitting = isUpdating;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(updateStockSchema),
    defaultValues: useMemo(
      () => ({
        stockQuantity: 0,
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
  const currentStock = stockData?.stockQuantity ?? 0;

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

  // Load stock data
  useEffect(() => {
    if (!open) {
      reset({
        stockQuantity: 0,
      });
      return;
    }

    if (stockData) {
      reset({
        stockQuantity: stockData.stockQuantity ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stockData?.stockQuantity, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    try {
      await updateStock({
        itemId,
        stockQuantity: Number(data.stockQuantity),
      }).unwrap();
      if (onSuccess) {
        onSuccess(itemId, 'updated');
      }
      reset();
      onClose();
      toast.success('Stock updated successfully');
    } catch (error) {
      console.error('Failed to update stock:', error);
      const errorMessage = error?.data?.message || error?.data || error?.message || 'Failed to update stock';
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
        disabled={isSubmitting || wouldBeNegative}
        startIcon="solar:check-circle-bold"
        sx={{ minHeight: 44 }}
      >
        Update Stock
      </Field.Button>
    </Box>
  );

  const isLoading = isLoadingStock;
  const hasError = !stockData && !isLoadingStock && itemId && open;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Update Stock"
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary">
              Loading stock information...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load stock information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Item not found or an error occurred.
            </Typography>
          </Box>
        ) : (
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
        )}
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

