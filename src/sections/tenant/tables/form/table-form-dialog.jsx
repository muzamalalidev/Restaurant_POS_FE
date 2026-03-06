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

import { createTableSchema, updateTableSchema } from 'src/schemas';
import { useCreateTableMutation, useUpdateTableMutation } from 'src/store/api/tables-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Table Form Dialog Component
 *
 * Single dialog for create and edit. Edit mode uses record from list (no getById).
 * Branch is taken from route/context; no branch dropdown.
 */
export function TableFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  const [createTable, { isLoading: isCreating }] = useCreateTableMutation();
  const [updateTable, { isLoading: isUpdating }] = useUpdateTableMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);

  const schema = mode === 'create' ? createTableSchema : updateTableSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tableNumber: '',
        capacity: 1,
        location: null,
        isAvailable: true,
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

  // Load table data for edit mode from record or reset for create/close
  useEffect(() => {
    if (!open) {
      reset({
        tableNumber: '',
        capacity: 1,
        location: null,
        isAvailable: true,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && record) {
      reset({
        tableNumber: record.tableNumber || '',
        capacity: record.capacity ?? 1,
        location: record.location ?? null,
        isAvailable: record.isAvailable ?? true,
        isActive: record.isActive ?? true,
      });
    } else {
      reset({
        tableNumber: '',
        capacity: 1,
        location: null,
        isAvailable: true,
        isActive: true,
      });
    }
  }, [open, mode, record, reset]);

  // Handle form submit (P0-002: ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const payload = {
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        location: data.location || null,
        isAvailable: data.isAvailable ?? true,
        isActive: data.isActive ?? true,
      };

      if (mode === 'create') {
        const result = await createTable(payload).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else if (record?.id) {
        await updateTable({ id: record.id, ...payload }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} table`,
        notFoundMessage: 'Table not found',
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
        title={mode === 'create' ? 'Create Table' : 'Edit Table'}
        maxWidth="md"
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
              {/* Table Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Table Information
                </Typography>
                <Stack spacing={2}>
                  {/* Table Number */}
                  <Field.Text
                    name="tableNumber"
                    label="Table Number"
                    placeholder="e.g., T-101, Table 5"
                    required
                  />

                  {/* Capacity */}
                  <Field.NumberInput
                    name="capacity"
                    label="Capacity"
                    placeholder="Number of seats"
                    required
                    slotProps={{
                      input: {
                        inputProps: {
                          min: 1,
                        },
                      },
                    }}
                  />

                  {/* Location */}
                  <Field.Text
                    name="location"
                    label="Location"
                    placeholder="e.g., Window, Outdoor, Main Hall"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Status Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Status
                </Typography>
                <Stack spacing={2}>
                  <Field.Switch
                    name="isAvailable"
                    label="Available"
                  />
                  <Field.Switch
                    name="isActive"
                    label="Active"
                  />
                </Stack>
              </Box>
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

