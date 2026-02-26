'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createStaffSchema, updateStaffSchema } from 'src/schemas';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import { useGetStaffTypesDropdownQuery } from 'src/store/api/staff-types-api';
import { useGetStaffByIdQuery, useCreateStaffMutation, useUpdateStaffMutation } from 'src/store/api/staff-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.staffId - Staff ID for edit mode
 * @param {Object|null} props.staffData - Staff data from list view (avoids re-fetch)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.branchOptions - Branch options for dropdown (from list view)
 * @param {Array} props.staffTypeOptions - Staff type options for dropdown (from list view)
 */
export function StaffFormDialog({ open, mode, staffId, staffData: providedStaffData, onClose, onSuccess, branchOptions = [], staffTypeOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  // Fallback: fetch dropdowns when options not provided (e.g. dialog opened without list)
  const { data: branchesDropdownFallback } = useGetBranchesDropdownQuery(undefined, { skip: branchOptions.length > 0 });
  const { data: staffTypesDropdownFallback } = useGetStaffTypesDropdownQuery(undefined, { skip: staffTypeOptions.length > 0 });
  const effectiveBranchOptions = useMemo(() => {
    if (branchOptions.length > 0) return branchOptions;
    if (!branchesDropdownFallback || !Array.isArray(branchesDropdownFallback)) return [];
    return branchesDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchOptions, branchesDropdownFallback]);
  const effectiveStaffTypeOptions = useMemo(() => {
    if (staffTypeOptions.length > 0) return staffTypeOptions;
    if (!staffTypesDropdownFallback || !Array.isArray(staffTypesDropdownFallback)) return [];
    return staffTypesDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [staffTypeOptions, staffTypesDropdownFallback]);

  const { data: fetchedStaff, isLoading: isLoadingStaff, error: queryError, isError: _isError, refetch: _refetchStaff } = useGetStaffByIdQuery(staffId, {
    skip: !staffId || mode !== 'edit' || !open,
  });

  const staffData = useMemo(() => {
    if (fetchedStaff) return fetchedStaff;
    if (providedStaffData) return providedStaffData;
    return null;
  }, [fetchedStaff, providedStaffData]);

  // Mutations
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

  const isSubmitting = isCreating || isUpdating;

  // Determine schema based on mode
  const schema = mode === 'create' ? createStaffSchema : updateStaffSchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        branchId: null,
        staffTypeId: null,
        userId: null,
        firstName: '',
        lastName: '',
        email: null,
        phone: null,
        address: null,
        hireDate: null,
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

  // Load staff data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      reset({
        branchId: null,
        staffTypeId: null,
        userId: null,
        firstName: '',
        lastName: '',
        email: null,
        phone: null,
        address: null,
        hireDate: null,
        isActive: true,
      });
      return () => {};
    }

    // If staff not found in edit mode, close dialog after a short delay
    if (mode === 'edit' && !staffData && !isLoadingStaff && open && staffId) {
      const timer = setTimeout(() => {
        reset();
        onClose();
      }, 3000); // Close after 3 seconds
      return () => clearTimeout(timer);
    }

    if (mode === 'edit' && staffData && effectiveBranchOptions.length > 0 && effectiveStaffTypeOptions.length > 0) {
      const matchingBranch = effectiveBranchOptions.find((b) => b.id === staffData.branchId);
      const matchingStaffType = effectiveStaffTypeOptions.find((st) => st.id === staffData.staffTypeId);

      // Convert hireDate string to Date object if present
      let hireDateValue = null;
      if (staffData.hireDate) {
        try {
          hireDateValue = new Date(staffData.hireDate);
        } catch {
          hireDateValue = null;
        }
      }

      reset({
        branchId: matchingBranch || null,
        staffTypeId: matchingStaffType || null,
        userId: staffData.userId || null,
        firstName: staffData.firstName || '',
        lastName: staffData.lastName || '',
        email: staffData.email || null,
        phone: staffData.phone || null,
        address: staffData.address || null,
        hireDate: hireDateValue,
        isActive: staffData.isActive ?? true,
      });
    } else if (mode === 'create') {
      reset({
        branchId: null,
        staffTypeId: null,
        userId: null,
        firstName: '',
        lastName: '',
        email: null,
        phone: null,
        address: null,
        hireDate: null,
        isActive: true,
      });
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, staffData?.id, staffData?.branchId, staffData?.staffTypeId, staffData?.firstName, staffData?.lastName, staffData?.email, staffData?.phone, staffData?.address, staffData?.hireDate, staffData?.isActive, effectiveBranchOptions, effectiveStaffTypeOptions, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // Prevent double submission
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;
    try {
      // Convert empty strings to null for optional fields
      const emailValue = data.email === '' ? null : data.email;
      const phoneValue = data.phone === '' ? null : data.phone;
      const addressValue = data.address === '' ? null : data.address;

      // Convert Date object to ISO string for hireDate
      let hireDateValue = null;
      if (data.hireDate) {
        if (data.hireDate instanceof Date) {
          hireDateValue = data.hireDate.toISOString();
        } else {
          hireDateValue = data.hireDate;
        }
      }

      if (mode === 'create') {
        const createData = {
          branchId: data.branchId,
          staffTypeId: data.staffTypeId,
          userId: data.userId || null,
          firstName: data.firstName,
          lastName: data.lastName,
          email: emailValue,
          phone: phoneValue,
          address: addressValue,
          hireDate: hireDateValue,
          isActive: data.isActive ?? true,
        };
        const result = await createStaff(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        const updateData = {
          branchId: data.branchId,
          staffTypeId: data.staffTypeId,
          userId: data.userId || null,
          firstName: data.firstName,
          lastName: data.lastName,
          email: emailValue,
          phone: phoneValue,
          address: addressValue,
          hireDate: hireDateValue,
          isActive: data.isActive,
        };
        await updateStaff({ id: staffId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(staffId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save staff member:', error);
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} staff member`,
        notFoundMessage: 'Staff member or branch not found',
        validationMessage: 'Validation failed. Please check your input.',
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

  // Loading state for edit mode
  const isLoading = mode === 'edit' && isLoadingStaff && !providedStaffData;
  // If in edit mode, and no data found after loading (staff may have been deleted)
  const hasError = mode === 'edit' && !staffData && !isLoadingStaff && open && staffId;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Staff Member' : 'Edit Staff Member'}
        maxWidth="md"
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
          onRetry={() => { reset(); onClose(); }}
          loadingMessage="Loading staff member data..."
          errorTitle="Staff Member Not Found"
          errorMessageOptions={{
            defaultMessage: 'This staff member may have been deleted. The dialog will close automatically.',
            notFoundMessage: 'This staff member may have been deleted. The dialog will close automatically.',
          }}
        >
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Basic Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field.Autocomplete
                    name="branchId"
                    label="Branch"
                    options={effectiveBranchOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    required
                    sx={{ flex: 1 }}
                  />
                  <Field.Autocomplete
                    name="staffTypeId"
                    label="Staff Type"
                    options={effectiveStaffTypeOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    required
                    sx={{ flex: 1 }}
                  />
                  </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                    <Field.Text
                      name="firstName"
                      label="First Name"
                      placeholder="Enter first name"
                      required
                      sx={{ flex: 1 }}
                    />
                    <Field.Text
                      name="lastName"
                      label="Last Name"
                      placeholder="Enter last name"
                      required
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Contact Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field.Text
                    name="email"
                    label="Email"
                    placeholder="Enter email address"
                    type="email"
                    sx={{ flex: 1 }}
                  />
                  <Field.Phone
                    name="phone"
                    label="Phone"
                    placeholder="Enter phone number"
                    sx={{ flex: 1 }}
                  />
                  </Box>
                  <Field.Text
                    name="address"
                    label="Address"
                    placeholder="Enter address"
                    multiline
                    rows={3}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Additional Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Additional Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Field.DatePicker
                    name="hireDate"
                    label="Hire Date"
                    slotProps={{
                      textField: {
                        placeholder: 'Select hire date',
                      },
                    }}
                  />
                  {mode === 'edit' && (
                    <Field.Switch name="isActive" label="Active" />
                  )}
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

