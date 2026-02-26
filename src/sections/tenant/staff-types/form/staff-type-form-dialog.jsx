'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createStaffTypeSchema, updateStaffTypeSchema } from 'src/schemas';
import {
  useGetStaffTypesQuery,
  useCreateStaffTypeMutation,
  useUpdateStaffTypeMutation,
  useGetStaffTypesDropdownQuery,
} from 'src/store/api/staff-types-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Type Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.staffTypeId - Staff type ID for edit mode
 * @param {Object|null} props.staffTypeData - Staff type data passed from list view (for edit mode)
 * @param {Array} props.allStaffTypes - All staff types passed from list view (for duplicate validation)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function StaffTypeFormDialog({ open, mode, staffTypeId, staffTypeData: initialStaffTypeData, allStaffTypes: initialAllStaffTypes, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Use staffTypeData passed from list view (P0-001 FIX: Avoid fetching 1000 records)
  // Fallback: If not provided, fetch with large page size (for backward compatibility)
  const shouldFetch = mode === 'edit' && !initialStaffTypeData && staffTypeId;
  const { data: staffTypesResponse, isLoading: isLoadingStaffType, error: queryError, isError: _isError, refetch: refetchStaffTypes } = useGetStaffTypesQuery(
    { pageSize: 1000 },
    { skip: !shouldFetch }
  );

  // Find the staff type by ID from the response (fallback only)
  const fetchedStaffTypeData = useMemo(() => {
    if (!staffTypesResponse || !staffTypeId || mode !== 'edit') return null;
    const staffTypes = staffTypesResponse.data || [];
    return staffTypes.find((st) => st.id === staffTypeId) || null;
  }, [staffTypesResponse, staffTypeId, mode]);

  // Use initialStaffTypeData if provided, otherwise use fetched data
  const staffTypeData = initialStaffTypeData || fetchedStaffTypeData;

  // Mutations
  const [createStaffType, { isLoading: isCreating }] = useCreateStaffTypeMutation();
  const [updateStaffType, { isLoading: isUpdating }] = useUpdateStaffTypeMutation();

  const isSubmitting = isCreating || isUpdating;

  const { data: staffTypesDropdownFallback } = useGetStaffTypesDropdownQuery(undefined, {
    skip: !!(initialAllStaffTypes && initialAllStaffTypes.length > 0),
  });
  const allStaffTypes = useMemo(() => {
    if (initialAllStaffTypes && initialAllStaffTypes.length > 0) return initialAllStaffTypes;
    if (!staffTypesDropdownFallback || !Array.isArray(staffTypesDropdownFallback)) return [];
    return staffTypesDropdownFallback.map((item) => ({ id: item.key, name: item.value || item.key }));
  }, [initialAllStaffTypes, staffTypesDropdownFallback]);

  // Determine schema based on mode
  const schema = mode === 'create' ? createStaffTypeSchema : updateStaffTypeSchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: null,
      isActive: true,
    },
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    formState: { isDirty },
    watch,
    setError,
    clearErrors,
  } = methods;

  // P2-002 FIX: Watch field values for character counters
  const nameValue = watch('name') || '';
  const descriptionValue = watch('description') || '';
  const nameLength = nameValue.length;
  const descriptionLength = descriptionValue.length;

  // Load staff type data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && staffTypeData) {
      reset({
        name: staffTypeData.name || '',
        description: staffTypeData.description || null,
        isActive: staffTypeData.isActive ?? true,
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        description: null,
        isActive: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, staffTypeData?.id, staffTypeData?.name, staffTypeData?.description, staffTypeData?.isActive, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // P1-002 FIX: Prevent double-submit
    if (isSubmitting) return;
    
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
          return;
        }
      } else if (mode === 'edit' && staffTypeId) {
        const isDuplicate = allStaffTypes.some(
          (st) => st.id !== staffTypeId && st.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          setError('name', {
            type: 'manual',
            message: 'This name is already taken. Please choose a different name.',
          });
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
        await updateStaffType({ id: staffTypeId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(staffTypeId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save staff type:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} staff type`,
        notFoundMessage: 'Staff type not found or has been deleted',
        validationMessage: 'Validation failed. Please check your input.',
      });
      toast.error(message);
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
        Save
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode (P0-001 FIX: Only show loading if we're actually fetching)
  const isLoading = mode === 'edit' && shouldFetch && isLoadingStaffType;
  
  // Error state (P0-002 FIX: Distinguish between network error and not found)
  const hasError = mode === 'edit' && !isLoading && staffTypeId && (!staffTypeData || queryError);
  const errorType = queryError?.status === 404 ? 'not-found' : queryError ? 'network' : (!staffTypeData ? 'not-found' : null);

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Staff Type' : 'Edit Staff Type'}
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
          onRetry={refetchStaffTypes}
          loadingMessage="Loading staff type data..."
          errorTitle={errorType === 'not-found' ? 'Staff type not found' : 'Failed to load staff type data'}
          errorMessageOptions={{
            defaultMessage: 'Please check your connection and try again.',
            notFoundMessage: 'This staff type may have been deleted or does not exist.',
          }}
        >
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Staff Type Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Staff Type Information
                </Typography>
                {/* P1-007 FIX: Add concurrent edit warning */}
                {mode === 'edit' && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'warning.lighter',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'warning.main',
                    }}
                  >
                    <Typography variant="caption" color="warning.darker">
                      Note: This staff type may have been modified in another tab. Please refresh the page if you notice any discrepancies.
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="Enter staff type name"
                    required
                    slotProps={{
                      // P2-002 FIX: Add character counter for name field (max 200)
                      input: {
                        maxLength: 200,
                      },
                      helperText: {
                        sx: {
                          display: 'flex',
                          justifyContent: 'space-between',
                        },
                      },
                    }}
                    helperText={
                      nameLength > 0
                        ? `${nameLength} / 200 characters`
                        : undefined
                    }
                    onBlur={async (e) => {
                      // P1-001 FIX: Check for duplicate name on blur
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
                      } else if (blurNameValue && mode === 'edit' && staffTypeId) {
                        // In edit mode, exclude current staff type from duplicate check
                        const isDuplicate = allStaffTypes.some(
                          (st) => st.id !== staffTypeId && st.name.toLowerCase() === blurNameValue.toLowerCase()
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
                      // P2-002 FIX: Add character counter for description field (max 1000)
                      input: {
                        maxLength: 1000,
                      },
                      helperText: {
                        sx: {
                          display: 'flex',
                          justifyContent: 'space-between',
                        },
                      },
                    }}
                    helperText={
                      descriptionLength > 0
                        ? `${descriptionLength} / 1000 characters${descriptionLength >= 900 ? ' (approaching limit)' : ''}`
                        : undefined
                    }
                  />
                  {/* P1-006 FIX: Show isActive field in create mode as well */}
                  <Field.Switch name="isActive" label="Active" />
                </Box>
              </Box>
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

