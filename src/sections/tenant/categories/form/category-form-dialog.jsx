'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { toast } from 'src/components/snackbar';

import { useGetCategoryByIdQuery, useCreateCategoryMutation, useUpdateCategoryMutation } from 'src/store/api/categories-api';
import { createCategorySchema, updateCategorySchema } from '../schemas/category-schema';

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
 * @param {Array} props.tenantOptions - Tenant options for dropdown (from list view)
 * @param {Array} props.categoryOptions - Category options for parent dropdown (from list view)
 */
export function CategoryFormDialog({ open, mode, categoryId, onClose, onSuccess, tenantOptions = [], categoryOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Ref to prevent double-submit (P0-003)
  const isSubmittingRef = useRef(false);

  // Fetch category data for edit mode (GetCategoryById is fully implemented)
  const { data: categoryData, isLoading: isLoadingCategory, error: queryError, isError } = useGetCategoryByIdQuery(categoryId, {
    skip: !categoryId || mode !== 'edit' || !open,
  });

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
    formState: { isDirty },
  } = methods;

  // Watch tenantId to filter parent options
  const watchedTenantId = watch('tenantId');

  // Parent category options filtered by selected tenant
  const parentCategoryOptions = useMemo(() => {
    const options = [
      {
        id: null,
        label: 'None (Root Category)',
      },
    ];

    if (!watchedTenantId || categoryOptions.length === 0) {
      return options;
    }

    // Extract tenant ID from watchedTenantId (could be object or string)
    const tenantIdValue = typeof watchedTenantId === 'object' && watchedTenantId !== null
      ? watchedTenantId.id
      : watchedTenantId;

    // Filter categories by tenant and exclude current category in edit mode
    const filtered = categoryOptions.filter((cat) => {
      // Filter by tenant
      if (cat.tenantId !== tenantIdValue) return false;
      // In edit mode, exclude current category (circular reference prevention)
      if (mode === 'edit' && categoryId && cat.id === categoryId) return false;
      return true;
    });

    filtered.forEach((category) => {
      options.push({
        id: category.id,
        label: category.name || category.id,
      });
    });

    return options;
  }, [watchedTenantId, categoryOptions, mode, categoryId]);

  // Load category data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      reset({
        tenantId: null,
        parentId: null,
        name: '',
        description: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && categoryData && tenantOptions.length > 0) {
      // Find matching tenant object from tenantOptions
      const matchingTenant = categoryData.tenantId && tenantOptions.length > 0
        ? tenantOptions.find((t) => t.id === categoryData.tenantId)
        : null;

      // Find matching parent category object (if parentId is not null)
      let matchingParent = null;
      if (categoryData.parentId && categoryOptions.length > 0) {
        matchingParent = categoryOptions.find((cat) => cat.id === categoryData.parentId);
        if (matchingParent) {
          matchingParent = {
            id: matchingParent.id,
            label: matchingParent.name || matchingParent.id,
          };
        }
      }

      reset({
        tenantId: matchingTenant || null,
        parentId: matchingParent || null,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, categoryData?.id, categoryData?.tenantId, categoryData?.parentId, categoryData?.name, categoryData?.description, categoryData?.isActive, tenantOptions, categoryOptions, reset]);

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
      toast.error(error?.data?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} category`);
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary">
              Loading category data...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load category data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {queryError?.data?.message || queryError?.message || 'Category not found or an error occurred.'}
            </Typography>
          </Box>
        ) : (
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
                    options={tenantOptions}
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

