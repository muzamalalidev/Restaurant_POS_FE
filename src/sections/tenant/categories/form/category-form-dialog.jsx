'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createCategorySchema, updateCategorySchema } from 'src/schemas';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetCategoriesDropdownQuery,
} from 'src/store/api/categories-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Category Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 * Tenant is taken from route/context; no tenant dropdown.
 *
 * parentId: useGetCategoriesDropdownQuery (tenant from context). Options include
 * "None (Root Category)". In edit mode current category is excluded from options.
 */
export function CategoryFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

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
    formState: { isDirty },
  } = methods;

  // Parent category options: fetch when dialog is open (tenant from context)
  const { data: categoriesDropdown } = useGetCategoriesDropdownQuery(
    {},
    { skip: !open }
  );
  const parentCategoryOptions = useMemo(() => {
    const options = [{ id: null, label: 'None (Root Category)' }];
    if (!categoriesDropdown || !Array.isArray(categoriesDropdown)) return options;
    categoriesDropdown.forEach((item) => {
      if (mode === 'edit' && record?.id != null && item.key === record.id) return;
      options.push({ id: item.key, label: item.value || item.key });
    });
    return options;
  }, [categoriesDropdown, mode, record?.id]);

  // Resolve parent option for edit mode (compare by string to handle API key type)
  const resolvedParentOption = useMemo(() => {
    if (!record?.parentId || parentCategoryOptions.length <= 1) return null;
    return parentCategoryOptions.find(
      (opt) => opt.id != null && String(opt.id) === String(record.parentId)
    ) ?? null;
  }, [record?.parentId, parentCategoryOptions]);

  // Load category data for edit mode from record or reset for create mode.
  // parentId is set from resolvedParentOption when parent options have loaded (edit mode), or synthetic option when not yet loaded.
  useEffect(() => {
    if (!open) {
      reset({
        parentId: null,
        name: '',
        description: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && record) {
      const parentValue = record.parentId != null
        ? (resolvedParentOption ?? { id: record.parentId, label: record.parentName || record.parentId })
        : null;

      reset({
        parentId: parentValue,
        name: record.name || '',
        description: record.description ?? null,
        isActive: record.isActive ?? true,
      });
    } else {
      reset({
        parentId: null,
        name: '',
        description: null,
        isActive: true,
      });
    }
  }, [open, mode, record, record?.id, record?.parentId, record?.name, record?.description, record?.isActive, resolvedParentOption, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // P0-003: Prevent double-submit with ref guard
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      const descriptionValue = data.description === '' ? null : data.description;

      // parentId: "None (Root Category)" option has id null -> send null to API
      const parentIdValue = data.parentId === null || (typeof data.parentId === 'object' && data.parentId !== null && data.parentId.id === null)
        ? null
        : (typeof data.parentId === 'object' && data.parentId !== null
            ? data.parentId.id
            : data.parentId);

      if (mode === 'create') {
        const createData = {
          parentId: parentIdValue,
          name: data.name,
          description: descriptionValue,
          isActive: data.isActive ?? true,
        };
        const result = await createCategory(createData).unwrap();
        if (onSuccess) {
          onSuccess(result?.id ?? result, 'created', result);
        }
      } else {
        const updateData = {
          parentId: parentIdValue,
          name: data.name,
          description: descriptionValue,
          isActive: data.isActive,
        };
        await updateCategory({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} category`,
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
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
        maxWidth="sm"
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

