'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createStaffTypeSchema, updateStaffTypeSchema } from 'src/schemas';
import {
  useCreateStaffTypeMutation,
  useUpdateStaffTypeMutation,
} from 'src/store/api/staff-types-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Type Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 * allStaffTypes: from list view's useGetStaffTypesQuery (list API); used for duplicate name validation.
 */
export function StaffTypeFormDialog({ open, mode, record, allStaffTypes: initialAllStaffTypes, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Mutations
  const [createStaffType, { isLoading: isCreating }] = useCreateStaffTypeMutation();
  const [updateStaffType, { isLoading: isUpdating }] = useUpdateStaffTypeMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);

  // Use list API response from parent only; no dropdown API call
  const allStaffTypes = useMemo(
    () => (Array.isArray(initialAllStaffTypes) ? initialAllStaffTypes : []),
    [initialAllStaffTypes]
  );

  // Determine schema based on mode
  const schema = mode === 'create' ? createStaffTypeSchema : updateStaffTypeSchema;

  // Form setup
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

  const {
    reset,
    handleSubmit,
    formState: { isDirty },
    setError,
    clearErrors,
  } = methods;

  // Load staff type data for edit mode from record or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && record) {
      reset({
        name: record.name || '',
        description: record.description || null,
        isActive: record.isActive ?? true,
      });
    } else {
      // create, or edit with no record (e.g. row no longer in list)
      reset({
        name: '',
        description: null,
        isActive: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.name, record?.description, record?.isActive, reset]);

  // Handle form submit (ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // P1-001 FIX: Final duplicate check before submission (in case user bypassed blur validation)
    const trimmedName = data.name?.trim();
    if (trimmedName) {
      if (mode === 'create') {
        const isDuplicate = allStaffTypes.some(
          (st) => st.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          setError('name', {
            type: 'manual',
            message: 'This name is already taken. Please choose a different name.',
          });
          isSubmittingRef.current = false;
          return;
        }
      } else if (mode === 'edit' && record) {
        const isDuplicate = allStaffTypes.some(
          (st) => st.id !== record.id && st.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          setError('name', {
            type: 'manual',
            message: 'This name is already taken. Please choose a different name.',
          });
          isSubmittingRef.current = false;
          return;
        }
      }
    }

    try {
      if (mode === 'create') {
        const createData = {
          name: data.name,
          description: data.description || null,
          isActive: data.isActive ?? true,
        };
        const result = await createStaffType(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        const updateData = {
          name: data.name,
          description: data.description || null,
          isActive: data.isActive,
        };
        await updateStaffType({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} staff type`,
        notFoundMessage: 'Staff type not found or has been deleted',
        validationMessage: 'Validation failed. Please check your input.',
      });
      toast.error(message);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return; // Prevent close during submit
    }
    
    // Check for unsaved changes
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
        title={mode === 'create' ? 'Create Staff Type' : 'Edit Staff Type'}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Staff Type Information Section */}
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text
                  name="name"
                  label="Name"
                  placeholder="Enter staff type name"
                  required
                  slotProps={{
                    input: {
                      maxLength: 200,
                    },
                  }}
                  onBlur={async (e) => {
                    const blurNameValue = e.target.value?.trim();
                    if (blurNameValue && mode === 'create') {
                      const isDuplicate = allStaffTypes.some(
                        (st) => st.name.toLowerCase() === blurNameValue.toLowerCase()
                      );
                      if (isDuplicate) {
                        setError('name', {
                          type: 'manual',
                          message: 'This name is already taken. Please choose a different name.',
                        });
                      } else {
                        clearErrors('name');
                      }
                    } else if (blurNameValue && mode === 'edit' && record) {
                      const isDuplicate = allStaffTypes.some(
                        (st) => st.id !== record.id && st.name.toLowerCase() === blurNameValue.toLowerCase()
                      );
                      if (isDuplicate) {
                        setError('name', {
                          type: 'manual',
                          message: 'This name is already taken. Please choose a different name.',
                        });
                      } else {
                        clearErrors('name');
                      }
                    }
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

