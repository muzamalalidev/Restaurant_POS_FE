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
import { useGetBranchByIdQuery, useCreateBranchMutation, useUpdateBranchMutation } from 'src/store/api/branches-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
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
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * P0-024 SECURITY NOTE: Tenant context enforcement is handled at the backend API level.
 * Frontend allows selecting any tenant from dropdown, but backend must validate:
 * - User has access to selected tenant
 * - User has permission to create/edit branches for that tenant
 * - Multi-tenant isolation is enforced in API layer
 * This is a defense-in-depth approach - backend is the source of truth for authorization.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.branchId - Branch ID for edit mode
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.tenantOptions - Tenant options for dropdown (from list view)
 */
export function BranchFormDialog({ open, mode, branchId, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  
  // Track original phoneNumbers state to distinguish null (no change) from [] (soft delete)
  const [originalPhoneNumbers, setOriginalPhoneNumbers] = useState(null);

  // Fetch branch data for edit mode
  const { data: branchData, isLoading: isLoadingBranch, error: queryError, isError, refetch: refetchBranch } = useGetBranchByIdQuery(branchId, {
    skip: !branchId || mode !== 'edit',
  });

  // Mutations
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const isSubmitting = isCreating || isUpdating;

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
    watch,
    formState: { isDirty },
  } = methods;
  
  // P2-007, P2-008 FIX: Watch field values for character counters
  const nameValue = watch('name');
  const addressValue = watch('address');
  const nameLength = nameValue?.length || 0;
  const addressLength = addressValue?.length || 0;

  // P1-028 FIX: Track if form has been initialized to prevent multiple resets
  const formInitializedRef = useRef(false);
  const previousBranchIdRef = useRef(null);
  
  // Load branch data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
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

    // P1-028 FIX: Only reset when branch ID changes or form hasn't been initialized
    const currentBranchId = mode === 'edit' ? branchData?.id : 'create';
    const shouldInitialize = !formInitializedRef.current || previousBranchIdRef.current !== currentBranchId;

    if (shouldInitialize) {
      if (mode === 'edit' && branchData) {
        // Find matching tenant object from tenantOptions (only if options are available)
        const matchingTenant = branchData.tenantId && tenantOptions.length > 0
          ? tenantOptions.find((t) => t.id === branchData.tenantId)
          : null;
        
        const phoneNumbersData = branchData.phoneNumbers?.map((phone) => ({
          id: phone.id,
          branchId: phone.branchId,
          phoneNumber: phone.phoneNumber,
          isPrimary: phone.isPrimary,
          phoneLabel: phone.phoneLabel || null,
          isActive: phone.isActive,
        })) || null;
        
        // Track original phoneNumbers state for update logic
        setOriginalPhoneNumbers(phoneNumbersData);
        
        reset({
          tenantId: matchingTenant || null,
          name: branchData.name || '',
          address: branchData.address || null,
          isActive: branchData.isActive ?? true,
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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, branchData?.id, reset]);
  
  // Separate effect to update tenantId when tenantOptions become available in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && branchData?.tenantId && tenantOptions.length > 0) {
      const matchingTenant = tenantOptions.find((t) => t.id === branchData.tenantId);
      if (matchingTenant) {
        // Only update if the current value doesn't match
        const currentValue = getValues('tenantId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingTenant.id) {
          setValue('tenantId', matchingTenant, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // Only run when tenantOptions data actually changes (use length as proxy for data availability)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, branchData?.tenantId, tenantOptions.length]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // P1-004 FIX: Prevent double submit - early return if already submitting
    if (isSubmitting) {
      return;
    }
    
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
          // Original was null and still null/empty - don't modify existing phones
          phoneNumbersValue = null;
        } else if (validPhones.length > 0) {
          // User has valid phones - send full replacement
          phoneNumbersValue = validPhones.map((phone) => ({
            id: phone.id || '', // Empty string for new phones, UUID for existing
            branchId, // Must match path parameter (all phones belong to this branch)
            phoneNumber: normalizePhoneNumber(phone.phoneNumber), // P0-003 FIX: Normalize before sending
            isPrimary: phone.isPrimary || false,
            phoneLabel: phone.phoneLabel || null,
            isActive: phone.isActive !== undefined ? phone.isActive : true,
          }));
        } else {
          // Original had phones but now empty - soft delete all phones
          phoneNumbersValue = [];
        }
        
        const updateData = {
          tenantId: tenantIdValue,
          name: data.name,
          address: data.address || null,
          isActive: data.isActive,
          phoneNumbers: phoneNumbersValue,
        };
        await updateBranch({ id: branchId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(branchId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save branch:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} branch`,
        notFoundMessage: 'Branch or tenant not found',
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

  // Loading state for edit mode
  const isLoading = mode === 'edit' && isLoadingBranch;
  const hasError = mode === 'edit' && isError;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Branch' : 'Edit Branch'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
        // P1-014 FIX: Constrain dialog height to 80% viewport on tablet/desktop via slotProps
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
        <QueryStateContent
          isLoading={isLoading}
          isError={hasError}
          error={queryError}
          onRetry={refetchBranch}
          loadingMessage="Loading branch data..."
          errorTitle="Failed to load branch data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load branch data',
            notFoundMessage: 'Branch not found',
          }}
        >
          <Form methods={methods} onSubmit={onSubmit}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 3, 
                pt: 1,
                // P1-014 FIX: Make content scrollable if it exceeds dialog height
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
                      // P2-008 FIX: Add character counter for name field (max 200)
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
                      // P2-007 FIX: Add character counter for address field (max 1000)
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
                      addressLength > 0
                        ? `${addressLength} / 1000 characters${addressLength >= 900 ? ' (approaching limit)' : ''}`
                        : undefined
                    }
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

