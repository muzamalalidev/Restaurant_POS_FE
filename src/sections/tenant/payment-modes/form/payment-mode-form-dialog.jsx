'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createPaymentModeSchema, updatePaymentModeSchema } from 'src/schemas';
import {
  useGetPaymentModeByIdQuery,
  useCreatePaymentModeMutation,
  useUpdatePaymentModeMutation,
} from 'src/store/api/payment-modes-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Payment Mode Form Dialog
 *
 * Single dialog for create and edit. tenantId is required (from list);
 * id required only for edit. API path uses tenantId; body does not include tenantId.
 */
export function PaymentModeFormDialog({
  open,
  mode,
  tenantId,
  paymentModeId,
  onClose,
  onSuccess,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  const { data: paymentModeData, isLoading: isLoadingPaymentMode, error: queryError, isError, refetch: refetchPaymentMode } = useGetPaymentModeByIdQuery(
    { tenantId, id: paymentModeId },
    { skip: !tenantId || !paymentModeId || mode !== 'edit' || !open }
  );

  const [createPaymentMode, { isLoading: isCreating }] = useCreatePaymentModeMutation();
  const [updatePaymentMode, { isLoading: isUpdating }] = useUpdatePaymentModeMutation();

  const isSubmitting = isCreating || isUpdating;
  const schema = mode === 'create' ? createPaymentModeSchema : updatePaymentModeSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        description: '',
        isActive: true,
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty }, watch } = methods;

  const nameValue = watch('name') ?? '';
  const descriptionValue = watch('description') ?? '';
  const nameLength = nameValue.length;
  const descriptionLength = descriptionValue.length;

  useEffect(() => {
    if (!open) {
      reset({ name: '', description: '', isActive: true });
      return;
    }
    if (mode === 'edit' && paymentModeData) {
      reset({
        name: paymentModeData.name ?? '',
        description: paymentModeData.description ?? '',
        isActive: paymentModeData.isActive ?? true,
      });
    } else if (mode === 'create') {
      reset({ name: '', description: '', isActive: true });
    }
  }, [open, mode, paymentModeData, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmitting || !tenantId) return;

    const body = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive ?? true,
    };

    try {
      if (mode === 'create') {
        const result = await createPaymentMode({ tenantId, body }).unwrap();
        onSuccess?.(result, 'created');
      } else {
        await updatePaymentMode({ tenantId, id: paymentModeId, body }).unwrap();
        onSuccess?.(paymentModeId, 'updated');
      }
      reset();
      onClose();
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} payment mode`,
        validationMessage: 'Validation failed or duplicate name for this tenant.',
      });
      toast.error(message);
    }
  });

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    if (isDirty) {
      setUnsavedChangesDialogOpen(true);
    } else {
      onClose();
    }
  }, [isSubmitting, isDirty, onClose]);

  const handleDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
    reset();
    onClose();
  }, [reset, onClose]);

  const isLoading = mode === 'edit' && (isLoadingPaymentMode || (paymentModeId && !paymentModeData && !isError));

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Payment Mode' : 'Edit Payment Mode'}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isLoading}
      >
        <QueryStateContent
          isLoading={isLoading}
          isError={mode === 'edit' && isError && !paymentModeData}
          error={queryError}
          onRetry={refetchPaymentMode}
          loadingMessage="Loading payment mode..."
          errorTitle="Failed to load payment mode"
          errorMessageOptions={{
            defaultMessage: 'Failed to load payment mode',
            notFoundMessage: 'Payment mode not found. It may have been deleted.',
          }}
        >
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Field.Text
                name="name"
                label="Name"
                required
                slotProps={{ textField: { size: 'small' } }}
                helperText={nameLength > 0 ? `${nameLength}/200` : undefined}
              />
              <Field.Text
                name="description"
                label="Description"
                slotProps={{ textField: { size: 'small', multiline: true, rows: 3 } }}
                helperText={descriptionLength > 0 ? `${descriptionLength}/1000` : undefined}
              />
              <Field.Switch name="isActive" label="Active" />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
                <Field.Button type="button" variant="outlined" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Field.Button>
                <Field.Button type="submit" variant="contained" disabled={isSubmitting}>
                  {mode === 'create' ? 'Create' : 'Save'}
                </Field.Button>
              </Box>
            </Box>
          </Form>
        </QueryStateContent>
      </CustomDialog>

      <ConfirmDialog
        open={unsavedChangesDialogOpen}
        title="Discard Changes?"
        content="You have unsaved changes. Are you sure you want to close without saving?"
        action={
          <Field.Button variant="contained" color="error" onClick={handleDiscard}>
            Discard
          </Field.Button>
        }
        onClose={() => setUnsavedChangesDialogOpen(false)}
      />
    </>
  );
}
