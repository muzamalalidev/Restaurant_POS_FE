'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createBranchSchema, updateBranchSchema } from 'src/schemas';
import { useCreateBranchMutation, useUpdateBranchMutation } from 'src/store/api/branches-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { PhoneNumbersField } from './components/phone-numbers-field';

// ----------------------------------------------------------------------

/**
 * Normalize phone number by removing spaces, dashes, and parentheses
 * P0-003 FIX: Backend matches phones by normalized format, so we normalize before sending
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  return phoneNumber.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
};

// ----------------------------------------------------------------------

/**
 * Branch Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 *
 * Dropdown analysis:
 * - tenantId: API-based (tenantOptions from list view via useGetTenantsDropdownQuery).
 *   Single select; not dependent on another form field. When options load after dialog
 *   open (edit), a second effect maps record.tenantId to the option object.
 * - phoneNumbers: array field; each item has PhoneLabelSelect (static options: Main,
 *   Delivery, Reservations). No dependent dropdowns in form (no parent -> child chain).
 *
 * Dependent dropdown reset: N/A (Tenant is the only top-level dropdown; no child to
 * reset when Tenant is cleared). If a child dropdown is added later, clear its value
 * and options when parent is cleared.
 *
 * P0-024: Tenant context enforcement is at the backend; frontend sends tenantId,
 * backend validates access and multi-tenant isolation.
 */
export function BranchFormDialog({ open, mode, record, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Track original phoneNumbers state to distinguish null (no change) from [] (soft delete)
  const [originalPhoneNumbers, setOriginalPhoneNumbers] = useState(null);

  // Mutations
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);

  // Determine schema based on mode
  const schema = mode === 'create' ? createBranchSchema : updateBranchSchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        name: '',
        address: null,
        isActive: true,
        phoneNumbers: null,
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    formState: { isDirty },
  } = methods;

  // P1-028 FIX: Track if form has been initialized to prevent multiple resets
  const formInitializedRef = useRef(false);
  const previousBranchIdRef = useRef(null);
  
  // Load branch data for edit mode from record or reset for create mode
  useEffect(() => {
    if (!open) {
      setOriginalPhoneNumbers(null);
      formInitializedRef.current = false;
      previousBranchIdRef.current = null;
      reset({
        tenantId: null,
        name: '',
        address: null,
        isActive: true,
        phoneNumbers: null,
      });
      return;
    }

    const currentBranchId = mode === 'edit' ? record?.id : 'create';
    const shouldInitialize = !formInitializedRef.current || previousBranchIdRef.current !== currentBranchId;

    if (shouldInitialize) {
      if (mode === 'edit' && record) {
        const matchingTenant = record.tenantId && tenantOptions.length > 0
          ? tenantOptions.find((t) => t.id === record.tenantId)
          : null;

        const phoneNumbersData = record.phoneNumbers?.map((phone) => ({
          id: phone.id,
          branchId: phone.branchId,
          phoneNumber: phone.phoneNumber,
          isPrimary: phone.isPrimary,
          phoneLabel: phone.phoneLabel || null,
          isActive: phone.isActive,
        })) || null;

        setOriginalPhoneNumbers(phoneNumbersData);

        reset({
          tenantId: matchingTenant || null,
          name: record.name || '',
          address: record.address || null,
          isActive: record.isActive ?? true,
          phoneNumbers: phoneNumbersData,
        });

        formInitializedRef.current = true;
        previousBranchIdRef.current = currentBranchId;
      } else if (mode === 'create') {
        setOriginalPhoneNumbers(null);
        reset({
          tenantId: null,
          name: '',
          address: null,
          isActive: true,
          phoneNumbers: null,
        });

        formInitializedRef.current = true;
        previousBranchIdRef.current = currentBranchId;
      } else {
        // edit with no record (e.g. row no longer in list)
        setOriginalPhoneNumbers(null);
        reset({
          tenantId: null,
          name: '',
          address: null,
          isActive: true,
          phoneNumbers: null,
        });
        formInitializedRef.current = true;
        previousBranchIdRef.current = currentBranchId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, reset]);

  // Update tenantId when tenantOptions become available in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && record?.tenantId && tenantOptions.length > 0) {
      const matchingTenant = tenantOptions.find((t) => t.id === record.tenantId);
      if (matchingTenant) {
        const currentValue = getValues('tenantId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingTenant.id) {
          setValue('tenantId', matchingTenant, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.tenantId, tenantOptions.length]);

  // Handle form submit (ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Extract tenantId: if it's an object, get the id; if it's a string, use it directly
      const tenantIdValue = typeof data.tenantId === 'object' && data.tenantId !== null
        ? data.tenantId.id
        : data.tenantId;

      if (mode === 'create') {
        // Transform data for create: phoneNumbers should only have phoneNumber, isPrimary, phoneLabel
        // Filter out phones with empty phoneNumber and convert empty array to null
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const createData = {
          tenantId: tenantIdValue,
          name: data.name,
          address: data.address || null,
          phoneNumbers:
            validPhones.length > 0
              ? validPhones.map((phone) => ({
                  phoneNumber: normalizePhoneNumber(phone.phoneNumber), // P0-003 FIX: Normalize before sending
                  isPrimary: phone.isPrimary || false,
                  phoneLabel: phone.phoneLabel || null,
                }))
              : null,
        };
        const result = await createBranch(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        // Transform data for update: include all phone fields, ensure branchId matches
        // Filter out phones with empty phoneNumber
        // Per API spec: empty array [] = soft delete all phones, null = don't modify existing phones
        // P0-001 FIX: Check if phoneNumbers field was modified to distinguish null (no change) from [] (soft delete)
        // P1-006: Empty phone fields are automatically filtered out here - this is correct behavior
        // The full replacement strategy means phones not in validPhones array will be soft deleted
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        
        // Determine phoneNumbers value based on whether field was modified
        // If originalPhoneNumbers was null and current is also null/empty, send null (no change)
        // If originalPhoneNumbers was an array and current is empty, send [] (soft delete)
        // If current has valid phones, send full replacement
        let phoneNumbersValue;
        const wasPhoneNumbersNull = originalPhoneNumbers === null || originalPhoneNumbers === undefined;
        const isPhoneNumbersEmpty = !data.phoneNumbers || data.phoneNumbers.length === 0 || validPhones.length === 0;
        
        if (wasPhoneNumbersNull && isPhoneNumbersEmpty) {
          phoneNumbersValue = null;
        } else if (validPhones.length > 0) {
          phoneNumbersValue = validPhones.map((phone) => ({
            id: phone.id || '',
            branchId: record.id,
            phoneNumber: normalizePhoneNumber(phone.phoneNumber),
            isPrimary: phone.isPrimary || false,
            phoneLabel: phone.phoneLabel || null,
            isActive: phone.isActive !== undefined ? phone.isActive : true,
          }));
        } else {
          phoneNumbersValue = [];
        }

        const updateData = {
          tenantId: tenantIdValue,
          name: data.name,
          address: data.address || null,
          isActive: data.isActive,
          phoneNumbers: phoneNumbersValue,
        };
        await updateBranch({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} branch`,
        notFoundMessage: 'Branch or tenant not found',
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
        title={mode === 'create' ? 'Create Branch' : 'Edit Branch'}
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
            {/* Branch Information Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Branch Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field.Autocomplete
                    name="tenantId"
                    label="Tenant"
                    options={tenantOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        placeholder: 'Select tenant',
                        required: true,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="Enter branch name"
                    required
                    slotProps={{
                      input: {
                        maxLength: 200,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Field.Text
                  name="address"
                  label="Address"
                  placeholder="Enter address (optional)"
                  multiline
                  rows={3}
                  slotProps={{
                    input: {
                      maxLength: 1000,
                    },
                  }}
                />
                {mode === 'edit' && (
                  <Field.Switch name="isActive" label="Active" />
                )}
              </Box>
            </Box>

            <Divider />

            {/* Phone Numbers Section */}
            <Box>
              <PhoneNumbersField name="phoneNumbers" mode={mode} />
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

