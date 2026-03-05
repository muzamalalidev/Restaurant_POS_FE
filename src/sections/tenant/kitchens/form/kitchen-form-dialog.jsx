'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createKitchenSchema, updateKitchenSchema } from 'src/schemas';
import { useCreateKitchenMutation, useUpdateKitchenMutation } from 'src/store/api/kitchens-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Kitchen Form Dialog Component
 *
 * Single dialog for create and edit. Edit mode uses record from list (no getById).
 * Tenant and branch are taken from route/context; no tenant or branch dropdown.
 */
export function KitchenFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const [createKitchen, { isLoading: isCreating }] = useCreateKitchenMutation();
  const [updateKitchen, { isLoading: isUpdating }] = useUpdateKitchenMutation();

  const isSubmitting = isCreating || isUpdating;
  const schema = mode === 'create' ? createKitchenSchema : updateKitchenSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        description: null,
        location: null,
        isActive: true,
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    formState: { isDirty },
  } = methods;

  // Load kitchen data for edit mode from record or reset for create/close
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: null,
        location: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && record) {
      reset({
        name: record.name || '',
        description: record.description ?? null,
        location: record.location ?? null,
        isActive: record.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        description: null,
        location: null,
        isActive: true,
      });
    }
  }, [open, mode, record.id, record.name, record.description, record.location, record.isActive, reset, record]);

  // Handle form submit (P0-002: ref guard blocks rapid double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const kitchenPayload = {
        name: data.name,
        description: data.description || null,
        location: data.location || null,
      };

      if (mode === 'create') {
        const result = await createKitchen(kitchenPayload).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        await updateKitchen({
          id: record.id,
          ...kitchenPayload,
          isActive: data.isActive ?? true,
        }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} kitchen`,
        notFoundMessage: 'Kitchen, tenant, or branch not found',
        validationMessage: 'Validation failed. Please check your input.',
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
        {mode === 'create' ? 'Save' : 'Update'}
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Kitchen' : 'Edit Kitchen'}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
        slotProps={{
          paper: {
            sx: {
              maxHeight: isMobile ? '100vh' : '80vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Form methods={methods} onSubmit={onSubmit}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                pt: 1,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Kitchen Information Section */}
              <Box>
                <Stack spacing={2}>
                  {/* Name */}
                  <Field.Text
                    name="name"
                    label="Kitchen Name"
                    placeholder="e.g., Main Kitchen"
                    required
                    inputProps={{ maxLength: 200 }}
                  />

                  {/* Description */}
                  <Field.Text
                    name="description"
                    label="Description"
                    placeholder="Brief description of the kitchen"
                    multiline
                    rows={2}
                    inputProps={{ maxLength: 1000 }}
                  />

                  {/* Location */}
                  <Field.Text
                    name="location"
                    label="Location"
                    placeholder="e.g., First Floor, Basement"
                    inputProps={{ maxLength: 200 }}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Status Section (only in edit mode) */}
              {mode === 'edit' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Status
                  </Typography>
                  <Stack spacing={2}>
                    <Field.Switch
                      name="isActive"
                      label="Active"
                    />
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

