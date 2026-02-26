'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { createCategorySchema, updateCategorySchema } from 'src/schemas';
import {
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetCategoriesDropdownQuery,
} from 'src/store/api/categories-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Category Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * P0-034 SECURITY NOTE: Tenant context enforcement is handled at the backend API level.
 * Frontend allows selecting any tenant from dropdown, but backend must validate:
 * - User has access to selected tenant
 * - User has permission to create/edit categories for that tenant
 * - Multi-tenant isolation is enforced in API layer
 * This is a defense-in-depth approach - backend is the source of truth for authorization.
 * 
 * P0-038 DATA INTEGRITY NOTE: Optimistic locking for concurrent edits requires backend support.
 * Current implementation does not check LastUpdatedAt timestamp before update.
 * If backend implements optimistic locking, frontend should:
 * - Store LastUpdatedAt when loading category for edit
 * - Send LastUpdatedAt in update request
 * - Handle 409 Conflict response if category was modified since load
 * - Show conflict resolution UI to user
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.categoryId - Category ID for edit mode
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.tenantOptions - Tenant options for dropdown (from list view; fallback: fetch in form when empty)
 */
export function CategoryFormDialog({ open, mode, categoryId, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Ref to prevent double-submit (P0-003)
  const isSubmittingRef = useRef(false);

  // Fetch category data for edit mode (GetCategoryById is fully implemented)
  const { data: categoryData, isLoading: isLoadingCategory, error: queryError, isError, refetch: refetchCategory } = useGetCategoryByIdQuery(categoryId, {
    skip: !categoryId || mode !== 'edit' || !open,
  });

  // Tenant options: use props when provided; otherwise fetch via dropdown (e.g. when dialog opened without list)
  const { data: tenantsDropdownFallback } = useGetTenantsDropdownQuery(undefined, { skip: tenantOptions.length > 0 });
  const effectiveTenantOptions = useMemo(() => {
    if (tenantOptions.length > 0) return tenantOptions;
    if (!tenantsDropdownFallback || !Array.isArray(tenantsDropdownFallback)) return [];
    return tenantsDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantOptions, tenantsDropdownFallback]);

  // Mutations
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const isSubmitting = isCreating || isUpdating;

  // Determine schema based on mode
  const schema = mode === 'create' ? createCategorySchema : updateCategorySchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        parentId: null,
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
    watch,
    setValue,
    formState: { isDirty },
  } = methods;

  // Watch tenantId for dependent category dropdown
  const watchedTenantId = watch('tenantId');
  const selectedTenantIdRaw = useMemo(
    () => (watchedTenantId && typeof watchedTenantId === 'object' && watchedTenantId !== null
      ? watchedTenantId.id
      : watchedTenantId),
    [watchedTenantId]
  );

  // Parent category options: fetch in form when tenant is selected (dependent dropdown)
  const { data: categoriesDropdown } = useGetCategoriesDropdownQuery(
    { tenantId: selectedTenantIdRaw },
    { skip: !selectedTenantIdRaw || !open }
  );
  const parentCategoryOptions = useMemo(() => {
    const options = [{ id: null, label: 'None (Root Category)' }];
    if (!categoriesDropdown || !Array.isArray(categoriesDropdown)) return options;
    categoriesDropdown.forEach((item) => {
      if (mode === 'edit' && categoryId && item.key === categoryId) return;
      options.push({ id: item.key, label: item.value || item.key });
    });
    return options;
  }, [categoriesDropdown, mode, categoryId]);

  // Load category data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
        tenantId: null,
        parentId: null,
        name: '',
        description: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && categoryData && effectiveTenantOptions.length > 0) {
      const matchingTenant = categoryData.tenantId
        ? effectiveTenantOptions.find((t) => t.id === categoryData.tenantId)
        : null;
      reset({
        tenantId: matchingTenant || null,
        parentId: null,
        name: categoryData.name || '',
        description: categoryData.description || null,
        isActive: categoryData.isActive ?? true,
      });
    } else if (mode === 'create') {
      reset({
        tenantId: null,
        parentId: null,
        name: '',
        description: null,
        isActive: true,
      });
    }
  }, [open, mode, categoryData, categoryData?.id, categoryData?.tenantId, categoryData?.name, categoryData?.description, categoryData?.isActive, effectiveTenantOptions, reset]);

  // Edit mode: set parentId when parent options have loaded (dependent on tenant selection)
  useEffect(() => {
    if (!open || mode !== 'edit' || !categoryData?.parentId || parentCategoryOptions.length <= 1) return;
    const matchingParent = parentCategoryOptions.find((opt) => opt.id === categoryData.parentId);
    if (matchingParent) {
      setValue('parentId', matchingParent, { shouldValidate: false, shouldDirty: false });
    }
  }, [open, mode, categoryData?.parentId, parentCategoryOptions, setValue]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // P0-003: Prevent double-submit with ref guard
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      // Convert empty strings to null for optional fields
      const descriptionValue = data.description === '' ? null : data.description;

      // Convert parentId: if it's the "None (Root Category)" option, send null
      const parentIdValue = data.parentId === null || (typeof data.parentId === 'object' && data.parentId !== null && data.parentId.id === null)
        ? null
        : (typeof data.parentId === 'object' && data.parentId !== null
            ? data.parentId.id
            : data.parentId);

      if (mode === 'create') {
        const createData = {
          tenantId: typeof data.tenantId === 'object' && data.tenantId !== null
            ? data.tenantId.id
            : data.tenantId,
          parentId: parentIdValue,
          name: data.name,
          description: descriptionValue,
          isActive: data.isActive ?? true,
        };
        const result = await createCategory(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        const updateData = {
          tenantId: typeof data.tenantId === 'object' && data.tenantId !== null
            ? data.tenantId.id
            : data.tenantId,
          parentId: parentIdValue,
          name: data.name,
          description: descriptionValue,
          isActive: data.isActive,
        };
        await updateCategory({ id: categoryId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(categoryId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} category`,
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
        Save
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode
  const isLoading = mode === 'edit' && isLoadingCategory;
  const hasError = mode === 'edit' && isError && open;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
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
          onRetry={refetchCategory}
          loadingMessage="Loading category data..."
          errorTitle="Failed to load category data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load category data',
            notFoundMessage: 'Category not found or an error occurred.',
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
                  <Field.Autocomplete
                    name="tenantId"
                    label="Tenant"
                    options={effectiveTenantOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    required
                  />
                  <Field.Autocomplete
                    name="parentId"
                    label="Parent Category"
                    options={parentCategoryOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      // Handle null id for "None (Root Category)" option
                      if (option.id === null && value.id === null) return true;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        helperText: 'Leave empty to create a root category',
                      },
                    }}
                  />
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="Enter category name"
                    required
                  />
                  <Field.Text
                    name="description"
                    label="Description"
                    placeholder="Enter description (optional)"
                    multiline
                    rows={3}
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

