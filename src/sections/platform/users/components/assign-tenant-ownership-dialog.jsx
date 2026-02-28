'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { assignTenantOwnershipSchema } from 'src/schemas';
import { useAssignTenantOwnershipMutation } from 'src/store/api/users-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Assign Tenant Ownership Dialog Component
 *
 * Dialog for assigning tenant ownership to a user.
 * Fields: tenantId, newOwnerId (pre-filled with selected user)
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.user - Selected user object (for pre-filling newOwnerId)
 * @param {Array} props.users - Users array from list view (reused to avoid duplicate API call)
 * @param {Array} props.tenantOptions - Tenant options from list view (reused to avoid duplicate API call)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function AssignTenantOwnershipDialog({ open, user, users = [], tenantOptions = [], onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Mutation
  const [assignTenantOwnership, { isLoading: isAssigning }] = useAssignTenantOwnershipMutation();

  const isSubmitting = isAssigning;
  const isSubmittingRef = useRef(false);

  // Transform users to options (from list view prop)
  const userOptions = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.map((u) => ({
      id: u.id,
      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || u.email || u.id,
    }));
  }, [users]);


  // Form setup
  const methods = useForm({
    resolver: zodResolver(assignTenantOwnershipSchema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        newOwnerId: null,
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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset({
        tenantId: null,
        newOwnerId: null,
      });
      return;
    }

    // When dialog opens, reset form (pre-fill will happen in separate effect when userOptions loads)
    reset({
      tenantId: null,
      newOwnerId: null,
    });
  }, [open, reset]);

  // Pre-fill newOwnerId when dialog is open with a user
  useEffect(() => {
    // Only pre-fill if dialog is open, user is provided, userOptions are available, and form doesn't already have a value
    if (!open || !user?.id || userOptions.length === 0) return;
    
    const currentValue = methods.getValues('newOwnerId');
    // Skip if already set (user may have manually selected)
    if (currentValue) return;

    // Find user in options - MUST be found in options for Autocomplete to work correctly
    const found = userOptions.find((opt) => opt.id === user.id);
    
    // Only pre-fill if user is found in options (don't use fallback - it causes validation errors)
    if (!found) return;
    
    // Use setValue instead of reset to avoid triggering full form validation
    // This ensures the Autocomplete receives the object value correctly
    methods.setValue('newOwnerId', found, { 
      shouldDirty: false, 
      shouldValidate: false,  // Don't validate immediately - Autocomplete needs to render first
    });
    
    // Trigger validation after a short delay to ensure Autocomplete has rendered with the object value
    setTimeout(() => {
      const delayedValue = methods.getValues('newOwnerId');
      // Only validate if value is still an object (should be)
      if (typeof delayedValue === 'object' && delayedValue !== null && delayedValue.id) {
        methods.trigger('newOwnerId');
      } else if (typeof delayedValue === 'string') {
        // Value was converted to string - re-set the object value
        methods.setValue('newOwnerId', found, { shouldDirty: false, shouldValidate: true });
      }
    }, 150);
  }, [open, user, userOptions, methods]);

  // Handle form submit (ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Extract IDs (could be objects from Autocomplete or strings)
      const tenantIdValue = typeof data.tenantId === 'object' && data.tenantId !== null
        ? data.tenantId.id || data.tenantId
        : data.tenantId;

      const newOwnerIdValue = typeof data.newOwnerId === 'object' && data.newOwnerId !== null
        ? data.newOwnerId.id || data.newOwnerId
        : data.newOwnerId;

      const assignData = {
        tenantId: tenantIdValue,
        newOwnerId: newOwnerIdValue,
      };

      await assignTenantOwnership(assignData).unwrap();
      
      if (onSuccess) {
        onSuccess();
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Failed to assign tenant ownership',
      });
      
      toast.error(message, {
        action: isRetryable ? {
          label: 'Retry',
          onClick: () => {
            // Retry after a short delay
            setTimeout(() => {
              onSubmit();
            }, 500);
          },
        } : undefined,
      });
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
        Assign Ownership
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Assign Tenant Ownership"
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
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Ownership Assignment
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Autocomplete
                  name="tenantId"
                  label="Tenant"
                  placeholder="Select tenant"
                  options={tenantOptions}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.label || option.id || option || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id || option === value;
                  }}
                  required
                />
                <Field.Autocomplete
                  name="newOwnerId"
                  label="New Owner"
                  placeholder="Select user"
                  options={userOptions}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.label || option.id || option || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id || option === value;
                  }}
                  required
                />
                {user && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                    Pre-filled with selected user: {user.userName || user.email || user.id}
                  </Typography>
                )}
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

