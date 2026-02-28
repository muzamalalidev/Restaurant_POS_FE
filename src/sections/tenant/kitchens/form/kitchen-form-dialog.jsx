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
import { useCreateKitchenMutation, useUpdateKitchenMutation } from 'src/store/api/kitchens-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
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
 * Single dialog for create and edit. Edit mode uses record from list (no getById).
 *
 * Dropdown analysis:
 * - tenantId: API (tenantOptions from list or useGetTenantsDropdownQuery when open). Parent of branchId.
 * - branchId: API (useGetBranchesDropdownQuery({ tenantId })). Dependent on tenantId; loaded only when tenant selected; disabled when no tenant. When tenant cleared, branchId resets via effect.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {Object|null} props.record - Full kitchen object for edit mode (from list)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.tenantOptions - Tenant options (from list view; fallback: fetch in form when empty)
 */
export function KitchenFormDialog({ open, mode, record, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const { data: tenantsDropdownFallback, isLoading: isLoadingTenantsFallback } = useGetTenantsDropdownQuery(undefined, {
    skip: tenantOptions.length > 0 || !open,
  });
  const tenantOptionsBase = useMemo(() => {
    if (tenantOptions.length > 0) return tenantOptions;
    if (!tenantsDropdownFallback || !Array.isArray(tenantsDropdownFallback)) return [];
    return tenantsDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantOptions, tenantsDropdownFallback]);

  const effectiveTenantOptions = useMemo(() => {
    if (mode === 'edit' && record?.tenantId && !tenantOptionsBase.some((t) => t.id === record.tenantId)) {
      return [...tenantOptionsBase, { id: record.tenantId, label: record.tenantName || record.tenantId }];
    }
    return tenantOptionsBase;
  }, [mode, record?.tenantId, record?.tenantName, tenantOptionsBase]);

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
  const prevTenantIdRef = useRef(undefined);

  const { data: branchesDropdown, isLoading: isLoadingBranches } = useGetBranchesDropdownQuery(
    { tenantId: selectedTenantIdValue || undefined },
    { skip: !selectedTenantIdValue || !open }
  );
  const branchOptionsBase = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  const effectiveBranchOptions = useMemo(() => {
    if (
      mode === 'edit' &&
      record?.branchId &&
      selectedTenantIdValue &&
      !branchOptionsBase.some((b) => b.id === record.branchId)
    ) {
      return [...branchOptionsBase, { id: record.branchId, label: record.branchName || record.branchId }];
    }
    return branchOptionsBase;
  }, [mode, record?.branchId, record?.branchName, branchOptionsBase, selectedTenantIdValue]);

  const watchedBranchId = watch('branchId');

  // When tenant is cleared, reset branch (dependent dropdown)
  useEffect(() => {
    if (open && !selectedTenantIdValue && watchedBranchId) {
      setValue('branchId', null, { shouldValidate: true });
    }
  }, [open, selectedTenantIdValue, watchedBranchId, setValue]);

  // When tenant changes in create mode, clear branch so user picks branch for new tenant
  useEffect(() => {
    if (!open || mode !== 'create') return;
    if (prevTenantIdRef.current !== selectedTenantIdValue) {
      if (prevTenantIdRef.current !== undefined) setValue('branchId', null, { shouldValidate: true });
      prevTenantIdRef.current = selectedTenantIdValue;
    }
  }, [open, mode, selectedTenantIdValue, setValue]);

  // Load kitchen data for edit mode from record or reset for create/close
  useEffect(() => {
    if (!open) {
      prevTenantIdRef.current = undefined;
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

    if (mode === 'edit' && record) {
      const matchingTenant =
        record.tenantId && effectiveTenantOptions.length > 0
          ? effectiveTenantOptions.find((t) => t.id === record.tenantId)
          : null;
      const tenantValue =
        matchingTenant || (record.tenantId ? { id: record.tenantId, label: record.tenantName || record.tenantId } : null);

      const matchingBranch =
        record.branchId && effectiveBranchOptions.length > 0
          ? effectiveBranchOptions.find((b) => b.id === record.branchId)
          : null;
      const branchValue =
        matchingBranch || (record.branchId ? { id: record.branchId, label: record.branchName || record.branchId } : null);

      reset({
        tenantId: tenantValue,
        branchId: branchValue,
        name: record.name || '',
        description: record.description ?? null,
        location: record.location ?? null,
        isActive: record.isActive ?? true,
      });
    } else if (mode === 'edit' && !record) {
      reset({
        tenantId: null,
        branchId: null,
        name: '',
        description: null,
        location: null,
        isActive: true,
      });
    } else if (mode === 'create') {
      reset({
        tenantId: null,
        branchId: null,
        name: '',
        description: null,
        location: null,
        isActive: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.tenantId, record?.branchId, record?.name, record?.description, record?.location, record?.isActive, record?.tenantName, record?.branchName, effectiveTenantOptions, effectiveBranchOptions, reset]);

  // When branch options load in edit mode, set branchId to matching option (replaces synthetic)
  useEffect(() => {
    if (open && mode === 'edit' && record?.branchId && effectiveBranchOptions.length > 0) {
      const matchingBranch = effectiveBranchOptions.find((b) => b.id === record.branchId);
      if (matchingBranch) {
        const currentValue = getValues('branchId');
        const currentId = getId(currentValue);
        if (currentId !== matchingBranch.id) {
          setValue('branchId', matchingBranch, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.branchId, effectiveBranchOptions.length]);

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
        await updateKitchen({
          id: record.id,
          ...kitchenPayload,
          isActive: data.isActive ?? true,
        }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} kitchen`,
        notFoundMessage: 'Kitchen, tenant, or branch not found',
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

  // Loading: only tenant/branch options (edit uses record; no kitchen fetch)
  const isLoading = isLoadingTenants || isLoadingBranches;

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
                    disabled={mode === 'edit'}
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
                    options={effectiveBranchOptions}
                    loading={isLoadingBranches}
                    required
                    disabled={mode === 'edit' || !selectedTenantIdValue}
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
                        helperText: !selectedTenantIdValue ? 'Select a tenant first' : undefined,
                      },
                    }}
                  />
                  {mode === 'create' && selectedTenantIdValue && effectiveBranchOptions.length === 0 && !isLoadingBranches && (
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

