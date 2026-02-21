'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { toast } from 'src/components/snackbar';

import { useGetKitchenByIdQuery, useCreateKitchenMutation, useUpdateKitchenMutation } from 'src/store/api/kitchens-api';
import { useGetTenantsQuery } from 'src/store/api/tenants-api';
import { useGetBranchesQuery } from 'src/store/api/branches-api';
import { createKitchenSchema, updateKitchenSchema } from '../schemas/kitchen-schema';

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
 */
export function KitchenFormDialog({ open, mode, kitchenId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Fetch kitchen data for edit mode using GetById (full implementation)
  const { data: kitchenData, isLoading: isLoadingKitchen, error: queryError, isError, refetch: refetchKitchen } = useGetKitchenByIdQuery(
    kitchenId,
    { skip: !kitchenId || mode !== 'edit' || !open }
  );

  // Fetch tenants for selector (P0-003: limit 200)
  const { data: tenantsResponse, isLoading: isLoadingTenants } = useGetTenantsQuery({ pageSize: 200 });
  const tenantOptions = useMemo(() => {
    if (!tenantsResponse) return [];
    const tenants = tenantsResponse.data || [];
    return tenants.map((tenant) => ({
      id: tenant.id,
      label: tenant.name || tenant.id,
    }));
  }, [tenantsResponse]);

  // Mutations
  const [createKitchen, { isLoading: isCreating }] = useCreateKitchenMutation();
  const [updateKitchen, { isLoading: isUpdating }] = useUpdateKitchenMutation();

  const isSubmitting = isCreating || isUpdating;
  // P0-002: Ref guard to prevent double-submit (state updates async)
  const isSubmittingRef = useRef(false);

  // Determine schema based on mode
  const schema = mode === 'create' ? createKitchenSchema : updateKitchenSchema;

  // Form setup
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

  // Watch tenantId to filter branches
  const watchedTenantIdFromForm = watch('tenantId');
  const selectedTenantIdValue = useMemo(() => getId(watchedTenantIdFromForm), [watchedTenantIdFromForm]);

  // Fetch branches filtered by selected tenant (P0-003: limit 200)
  const { data: branchesResponse, isLoading: isLoadingBranches } = useGetBranchesQuery(
    {
      tenantId: selectedTenantIdValue || undefined,
      pageSize: 200,
    },
    { skip: false }
  );

  const branchOptions = useMemo(() => {
    if (!branchesResponse) return [];
    const branches = branchesResponse.data || [];
    return branches.map((branch) => ({
      id: branch.id,
      label: branch.name || branch.id,
    }));
  }, [branchesResponse]);

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
        const matchingTenant = kitchenData.tenantId && tenantOptions.length > 0
          ? tenantOptions.find((t) => t.id === kitchenData.tenantId)
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
  }, [open, mode, kitchenId, kitchenData?.id, reset, tenantOptions.length]);

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
      const errorStatus = error?.status || error?.data?.status;
      let errorMessage;

      if (errorStatus === 404) {
        errorMessage = error?.data?.message || 'Kitchen, tenant, or branch not found';
      } else if (errorStatus === 400) {
        errorMessage = error?.data?.message || 'Validation failed. Please check your input.';
      } else if (errorStatus >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error?.data?.message || error?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} kitchen`;
      }

      toast.error(errorMessage);
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary">
              Loading kitchen data...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load kitchen data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {queryError?.data?.message || queryError?.message || 'Kitchen not found or an error occurred.'}
            </Typography>
            <Field.Button variant="contained" onClick={() => refetchKitchen()} startIcon="solar:refresh-bold">
              Retry
            </Field.Button>
          </Box>
        ) : (
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
                    options={tenantOptions}
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
        )}
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

