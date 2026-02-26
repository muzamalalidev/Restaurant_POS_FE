'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { createKitchenSchema, updateKitchenSchema } from 'src/schemas';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import { useGetKitchenByIdQuery, useCreateKitchenMutation, useUpdateKitchenMutation } from 'src/store/api/kitchens-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Helper function to extract ID from object or string
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return value.id;
  }
  return value;
};

// ----------------------------------------------------------------------

/**
 * Kitchen Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * Note: GetById endpoint is FULLY IMPLEMENTED (not a placeholder).
 * Can be used directly for fetching kitchen details.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.kitchenId - Kitchen ID for edit mode
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.tenantOptions - Tenant options for dropdown (from list view; fallback: fetch in form when empty)
 */
export function KitchenFormDialog({ open, mode, kitchenId, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const { data: kitchenData, isLoading: isLoadingKitchen, error: queryError, isError, refetch: refetchKitchen } = useGetKitchenByIdQuery(
    kitchenId,
    { skip: !kitchenId || mode !== 'edit' || !open }
  );

  const { data: tenantsDropdownFallback, isLoading: isLoadingTenantsFallback } = useGetTenantsDropdownQuery(undefined, { skip: tenantOptions.length > 0 });
  const effectiveTenantOptions = useMemo(() => {
    if (tenantOptions.length > 0) return tenantOptions;
    if (!tenantsDropdownFallback || !Array.isArray(tenantsDropdownFallback)) return [];
    return tenantsDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantOptions, tenantsDropdownFallback]);
  const isLoadingTenants = tenantOptions.length > 0 ? false : isLoadingTenantsFallback;

  const [createKitchen, { isLoading: isCreating }] = useCreateKitchenMutation();
  const [updateKitchen, { isLoading: isUpdating }] = useUpdateKitchenMutation();

  const isSubmitting = isCreating || isUpdating;
  const schema = mode === 'create' ? createKitchenSchema : updateKitchenSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        branchId: null,
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
    getValues,
    setValue,
    watch,
    formState: { isDirty },
  } = methods;

  const watchedTenantIdFromForm = watch('tenantId');
  const selectedTenantIdValue = useMemo(() => getId(watchedTenantIdFromForm), [watchedTenantIdFromForm]);

  const { data: branchesDropdown, isLoading: isLoadingBranches } = useGetBranchesDropdownQuery(
    { tenantId: selectedTenantIdValue || undefined },
    { skip: !selectedTenantIdValue || !open }
  );
  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  // Track if form has been initialized
  const formInitializedRef = useRef(false);
  const previousKitchenIdRef = useRef(null);

  // Load kitchen data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
      previousKitchenIdRef.current = null;
      reset({
        tenantId: null,
        branchId: null,
        name: '',
        description: null,
        location: null,
        isActive: true,
      });
      return;
    }

    const currentKitchenId = mode === 'edit' ? kitchenId : 'create';
    const shouldInitialize = !formInitializedRef.current || previousKitchenIdRef.current !== currentKitchenId;

    if (shouldInitialize) {
      if (mode === 'edit' && kitchenData) {
        // Find matching tenant and branch objects from options
        const matchingTenant = kitchenData.tenantId && effectiveTenantOptions.length > 0
          ? effectiveTenantOptions.find((t) => t.id === kitchenData.tenantId)
          : null;

        // For branch, we need to fetch branches for the tenant first
        // We'll set it in a separate effect after branches are loaded
        reset({
          tenantId: matchingTenant || null,
          branchId: null, // Will be set in separate effect
          name: kitchenData.name || '',
          description: kitchenData.description || null,
          location: kitchenData.location || null,
          isActive: kitchenData.isActive ?? true,
        });

        formInitializedRef.current = true;
        previousKitchenIdRef.current = currentKitchenId;
      } else if (mode === 'create') {
        reset({
          tenantId: null,
          branchId: null,
          name: '',
          description: null,
          location: null,
          isActive: true,
        });

        formInitializedRef.current = true;
        previousKitchenIdRef.current = currentKitchenId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, kitchenId, kitchenData?.id, reset, effectiveTenantOptions.length]);

  // Separate effect to set branchId when branches are loaded in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && kitchenData?.branchId && branchOptions.length > 0) {
      const matchingBranch = branchOptions.find((b) => b.id === kitchenData.branchId);
      if (matchingBranch) {
        const currentValue = getValues('branchId');
        const currentId = getId(currentValue);
        if (currentId !== matchingBranch.id) {
          setValue('branchId', matchingBranch, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, kitchenData?.branchId, branchOptions.length]);

  // Handle form submit (P0-002: ref guard blocks rapid double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const tenantIdValue = getId(data.tenantId);
      const branchIdValue = getId(data.branchId);

      const kitchenPayload = {
        tenantId: tenantIdValue,
        branchId: branchIdValue,
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
        // Include isActive for update
        await updateKitchen({
          id: kitchenId,
          ...kitchenPayload,
          isActive: data.isActive ?? true,
        }).unwrap();
        if (onSuccess) {
          onSuccess(kitchenId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save kitchen:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} kitchen`,
        notFoundMessage: 'Kitchen, tenant, or branch not found',
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
        {mode === 'create' ? 'Create' : 'Update'}
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode
  const isLoading = (mode === 'edit' && isLoadingKitchen) || isLoadingTenants || isLoadingBranches;
  const hasError = mode === 'edit' && (isError || (!kitchenData && !isLoadingKitchen && kitchenId && open));

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Kitchen' : 'Edit Kitchen'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
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
        <QueryStateContent
          isLoading={isLoading}
          isError={hasError}
          error={queryError}
          onRetry={refetchKitchen}
          loadingMessage="Loading kitchen data..."
          errorTitle="Failed to load kitchen data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load kitchen data',
            notFoundMessage: 'Kitchen not found or an error occurred.',
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
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Kitchen Information
                </Typography>
                <Stack spacing={2}>
                  {/* Tenant */}
                  <Field.Autocomplete
                    name="tenantId"
                    label="Tenant"
                    options={effectiveTenantOptions}
                    loading={isLoadingTenants}
                    required
                    disabled={mode === 'edit'} // TenantId cannot be changed on update
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        placeholder: 'Select tenant',
                      },
                    }}
                  />

                  {/* Branch */}
                  <Field.Autocomplete
                    name="branchId"
                    label="Branch"
                    options={branchOptions}
                    loading={isLoadingBranches}
                    required
                    disabled={mode === 'edit'} // BranchId cannot be changed on update
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        placeholder: 'Select branch',
                      },
                    }}
                  />
                  {mode === 'create' && selectedTenantIdValue && branchOptions.length === 0 && (
                    <Alert severity="warning">
                      <AlertTitle>No Branches Available</AlertTitle>
                      No branches found for the selected tenant. Please select a different tenant or create a branch first.
                    </Alert>
                  )}

                  {/* Name */}
                  <Field.Text
                    name="name"
                    label="Kitchen Name"
                    placeholder="e.g., Main Kitchen"
                    required
                    inputProps={{ maxLength: 200 }}
                    characterCounter
                  />

                  {/* Description */}
                  <Field.Text
                    name="description"
                    label="Description"
                    placeholder="Brief description of the kitchen"
                    multiline
                    rows={2}
                    inputProps={{ maxLength: 1000 }}
                    characterCounter
                  />

                  {/* Location */}
                  <Field.Text
                    name="location"
                    label="Location"
                    placeholder="e.g., First Floor, Basement"
                    inputProps={{ maxLength: 200 }}
                    characterCounter
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

