'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { adjustStockSchema } from 'src/schemas';
import { useAdjustStockMutation } from 'src/store/api/stock-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { formatStockQuantity } from '../utils/stock-helpers';

// ----------------------------------------------------------------------

/**
 * Quick adjustment buttons configuration
 */
const QUICK_ADJUSTMENTS = [
  { label: '+10', value: 10 },
  { label: '+50', value: 50 },
  { label: '+100', value: 100 },
];

// ----------------------------------------------------------------------

/**
 * Adjust Stock Dialog Component
 *
 * Dialog for adjusting stock quantity by a relative amount. Uses the full row object
 * passed from the list (no getStock API call). Prevents negative stock.
 *
 * Dropdown analysis: No dropdowns. Fields: adjustmentQuantity (number), reason (text).
 * Form always starts with adjustmentQuantity: 0, reason: null when opening for a record.
 * When open with no record, form resets to same defaults.
 */
export function AdjustStockDialog({ open, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  // P0-003: Ref to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Mutations
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();
  const isSubmitting = isAdjusting;

  const currentStock = record?.stockQuantity ?? 0;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: useMemo(
      () => ({
        adjustmentQuantity: null,
        reason: null,
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = methods;

  // Watch form values for calculations
  const watchedAdjustmentQuantity = watch('adjustmentQuantity');

  // Calculate new stock
  const newStock = useMemo(() => {
    if (!watchedAdjustmentQuantity || watchedAdjustmentQuantity === '') return currentStock;
    const adjustment = Number(watchedAdjustmentQuantity) || 0;
    return currentStock + adjustment;
  }, [watchedAdjustmentQuantity, currentStock]);

  // Check if adjustment would result in negative stock
  const wouldBeNegative = useMemo(() => newStock < 0, [newStock]);

  // Load form when record is set or reset when closed / no record
  useEffect(() => {
    if (!open) {
      reset({
        adjustmentQuantity: null,
        reason: null,
      });
      return;
    }
    reset({
      adjustmentQuantity: null,
      reason: null,
    });
  }, [open, record?.id, reset]);

  // Handle quick adjustment
  const handleQuickAdjustment = useCallback(
    (value) => {
      setValue('adjustmentQuantity', value, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    try {
      // Validate that new stock won't be negative
      const adjustment = Number(data.adjustmentQuantity) || 0;
      const calculatedNewStock = currentStock + adjustment;

      if (calculatedNewStock < 0) {
        toast.error(`Cannot adjust stock below zero. Current stock: ${formatStockQuantity(currentStock)}, Adjustment: ${formatStockQuantity(adjustment)}`);
        isSubmittingRef.current = false;
        return;
      }

      await adjustStock({
        itemId: record.id,
        adjustmentQuantity: adjustment,
        reason: data.reason === '' ? null : data.reason,
      }).unwrap();
      if (onSuccess) {
        onSuccess(record.id, 'adjusted');
      }
      reset();
      onClose();
      toast.success('Stock adjusted successfully');
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Failed to adjust stock',
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
        Adjust Stock
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Adjust Stock"
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
                  Cannot adjust stock below zero. Current stock: {formatStockQuantity(currentStock)}, Adjustment: {formatStockQuantity(watchedAdjustmentQuantity || 0)}
                </Alert>
              )}

              {/* Quick Adjustment Buttons */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Quick Adjustments
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {QUICK_ADJUSTMENTS.map((adj) => (
                    <Chip
                      key={adj.label}
                      label={adj.label}
                      onClick={() => handleQuickAdjustment(adj.value)}
                      variant="outlined"
                      sx={{ cursor: 'pointer', minHeight: 44 }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Adjustment Quantity */}
              <Field.Text
                name="adjustmentQuantity"
                label="Adjustment Quantity"
                type="number"
                placeholder="Enter adjustment amount"
                required
                slotProps={{
                  input: {
                    inputProps: { step: 0.01 },
                  },
                  textField: {
                    size: 'small',
                    helperText: 'Positive to add, negative to subtract',
                  },
                }}
              />

              {/* Calculated New Stock Display */}
              {watchedAdjustmentQuantity && watchedAdjustmentQuantity !== '' && !wouldBeNegative && (
                <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      New Stock Quantity:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatStockQuantity(newStock)}
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Reason Field */}
              <Field.Text
                name="reason"
                label="Reason for Adjustment"
                placeholder="Reason for adjustment (e.g., Restock, Damaged)"
                slotProps={{
                  textField: {
                    size: 'small',
                    helperText: 'Optional, for audit trail',
                  },
                }}
              />
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

