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
import { useGetStaffTypesDropdownQuery } from 'src/store/api/staff-types-api';
import { useCreateStaffMutation, useUpdateStaffMutation } from 'src/store/api/staff-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Staff Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 * Branch is taken from route/context; no branch dropdown.
 *
 * staffTypeId: API-based (staffTypeOptions from list or useGetStaffTypesDropdownQuery fallback).
 * Edit mapping: When options are not yet loaded, staffTypeId is set to synthetic option;
 * when options load, effect re-runs and maps to real option.
 */
export function StaffFormDialog({ open, mode, record, onClose, onSuccess, staffTypeOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  // Fallback: fetch staff types when options not provided
  const { data: staffTypesDropdownFallback } = useGetStaffTypesDropdownQuery(undefined, { skip: staffTypeOptions.length > 0 });
  const effectiveStaffTypeOptions = useMemo(() => {
    if (staffTypeOptions.length > 0) return staffTypeOptions;
    if (!staffTypesDropdownFallback || !Array.isArray(staffTypesDropdownFallback)) return [];
    return staffTypesDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [staffTypeOptions, staffTypesDropdownFallback]);

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

  // Load staff data for edit mode from record or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
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
      return;
    }

    if (mode === 'edit' && record) {
      const matchingStaffType = effectiveStaffTypeOptions.find((st) => st.id === record.staffTypeId);
      const staffTypeValue = matchingStaffType ?? (record.staffTypeId ? { id: record.staffTypeId, label: record.staffTypeName || record.staffTypeId } : null);

      let hireDateValue = null;
      if (record.hireDate) {
        try {
          hireDateValue = new Date(record.hireDate);
        } catch {
          hireDateValue = null;
        }
      }

      reset({
        staffTypeId: staffTypeValue,
        userId: record.userId || null,
        firstName: record.firstName || '',
        lastName: record.lastName || '',
        email: record.email || null,
        phone: record.phone || null,
        address: record.address || null,
        hireDate: hireDateValue,
        isActive: record.isActive ?? true,
      });
    } else {
      reset({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.staffTypeId, record?.firstName, record?.lastName, record?.email, record?.phone, record?.address, record?.hireDate, record?.isActive, effectiveStaffTypeOptions, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // Prevent double submission
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;
    try {
      const staffTypeIdValue = data.staffTypeId?.id ?? data.staffTypeId;
      const emailValue = data.email === '' ? null : data.email;
      const phoneValue = data.phone === '' ? null : data.phone;
      const addressValue = data.address === '' ? null : data.address;

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
          staffTypeId: staffTypeIdValue,
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
          onSuccess(result?.id ?? result, 'created', result);
        }
      } else {
        const updateData = {
          staffTypeId: staffTypeIdValue,
          userId: data.userId || null,
          firstName: data.firstName,
          lastName: data.lastName,
          email: emailValue,
          phone: phoneValue,
          address: addressValue,
          hireDate: hireDateValue,
          isActive: data.isActive,
        };
        await updateStaff({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} staff member`,
        notFoundMessage: 'Staff member not found',
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
        {mode === 'create' ? 'Save' : 'Update'}
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Staff Member' : 'Edit Staff Member'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
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

