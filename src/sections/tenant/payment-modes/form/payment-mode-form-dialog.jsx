'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createPaymentModeSchema, updatePaymentModeSchema } from 'src/schemas';
import {
  useCreatePaymentModeMutation,
  useUpdatePaymentModeMutation,
} from 'src/store/api/payment-modes-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Payment Mode Form Dialog
 *
 * Single dialog for create and edit. Edit mode uses record from list (no getById).
 * tenantId is required for API and is passed from the list (selected tenant filter).
 *
 * Dropdown analysis: No dropdowns in form. Fields: name, description, isActive. tenantId comes from list as prop.
 */
export function PaymentModeFormDialog({
  open,
  mode,
  tenantId,
  record,
  onClose,
  onSuccess,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const [createPaymentMode, { isLoading: isCreating }] = useCreatePaymentModeMutation();
  const [updatePaymentMode, { isLoading: isUpdating }] = useUpdatePaymentModeMutation();

  const isSubmitting = isCreating || isUpdating;
  const schema = mode === 'create' ? createPaymentModeSchema : updatePaymentModeSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        description: null,
        isActive: true,
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty } } = methods;

  useEffect(() => {
    if (!open) {
      reset({ name: '', description: null, isActive: true });
      return;
    }
    if (mode === 'edit' && record) {
      reset({
        name: record.name ?? '',
        description: record.description ?? null,
        isActive: record.isActive ?? true,
      });
    } else {
      reset({ name: '', description: null, isActive: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.name, record?.description, record?.isActive, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current || isSubmitting || !tenantId) return;
    isSubmittingRef.current = true;

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
        await updatePaymentMode({ tenantId, id: record.id, body }).unwrap();
        onSuccess?.(record.id, 'updated');
      }
      reset();
      onClose();
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} payment mode`,
        validationMessage: 'Validation failed or duplicate name for this tenant.',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => onSubmit({ preventDefault: () => {}, target: { checkValidity: () => true } }), 100);
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

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    if (isDirty) {
      setUnsavedChangesDialogOpen(true);
      return;
    }
    reset();
    onClose();
  }, [isSubmitting, isDirty, reset, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCancelDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
  }, []);

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
        {mode === 'create' ? 'Save' : 'Update'}
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Payment Mode' : 'Edit Payment Mode'}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text
                  name="name"
                  label="Name"
                  placeholder="Enter payment mode name"
                  required
                  slotProps={{
                    input: {
                      maxLength: 200,
                    },
                  }}
                />
                <Field.Text
                  name="description"
                  label="Description"
                  placeholder="Enter description (optional)"
                  multiline
                  rows={3}
                  slotProps={{
                    input: {
                      maxLength: 1000,
                    },
                  }}
                />
                <Field.Switch name="isActive" label="Active" />
              </Box>
            </Box>
          </Box>
        </Form>
      </CustomDialog>

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
