'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getCurrencySymbol } from 'src/utils/format-number';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createItemSchema, updateItemSchema } from 'src/schemas';
import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetCategoriesDropdownQuery } from 'src/store/api/categories-api';
import { useCreateItemMutation, useUpdateItemMutation } from 'src/store/api/items-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Item Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 *
 * Dropdown analysis:
 * - tenantId: API-based (tenantOptions from list or useGetTenantsDropdownQuery fallback).
 *   Parent of categoryId.
 * - categoryId: API-based, dependent on tenantId. useGetCategoriesDropdownQuery({ tenantId })
 *   with skip: !selectedTenantIdRaw || !open. When tenant is cleared, categoryId resets to null
 *   and Category dropdown is disabled.
 * - itemType: Static options (1 Direct Sale, 2 Recipe Based, 3 Add On, 4 Deal). Not dependent.
 *
 * Dependent dropdown reset: When tenantId is cleared, categoryId is set to null and Category
 * is disabled (options load only when tenant selected).
 *
 * P2-004: Tenant context enforced at backend.
 */
export function ItemFormDialog({ open, mode, record, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  const { data: tenantsDropdownFallback } = useGetTenantsDropdownQuery(undefined, { skip: tenantOptions.length > 0 });
  const effectiveTenantOptions = useMemo(() => {
    if (tenantOptions.length > 0) return tenantOptions;
    if (!tenantsDropdownFallback || !Array.isArray(tenantsDropdownFallback)) return [];
    return tenantsDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantOptions, tenantsDropdownFallback]);

  const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();

  const isSubmitting = isCreating || isUpdating;

  // Determine schema based on mode
  const schema = mode === 'create' ? createItemSchema : updateItemSchema;

  // ItemType options
  const itemTypeOptions = useMemo(() => [
    { id: 1, label: 'Direct Sale' },
    { id: 2, label: 'Recipe Based' },
    { id: 3, label: 'Add On' },
    { id: 4, label: 'Deal' },
  ], []);

  // Form setup (itemType starts null - user must select)
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: null,
        price: null,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: null,
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

  const watchedTenantId = watch('tenantId');
  const selectedTenantIdRaw = useMemo(
    () => (watchedTenantId && typeof watchedTenantId === 'object' && watchedTenantId !== null
      ? watchedTenantId.id
      : watchedTenantId),
    [watchedTenantId]
  );

  const { data: categoriesDropdown } = useGetCategoriesDropdownQuery(
    { tenantId: selectedTenantIdRaw },
    { skip: !selectedTenantIdRaw || !open }
  );
  const categoryOptions = useMemo(() => {
    if (!categoriesDropdown || !Array.isArray(categoriesDropdown)) return [];
    return categoriesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [categoriesDropdown]);

  // Dependent dropdown reset: when tenant is cleared, reset categoryId
  useEffect(() => {
    if (open && !selectedTenantIdRaw) {
      setValue('categoryId', null, { shouldValidate: false, shouldDirty: false });
    }
  }, [open, selectedTenantIdRaw, setValue]);

  // Load item data for edit mode from record or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: null,
        price: null,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: null,
      });
      return;
    }

    if (mode === 'edit' && record) {
      const matchingTenant = effectiveTenantOptions.find((t) => t.id === record.tenantId);
      const matchingCategory = categoryOptions.find((cat) => cat.id === record.categoryId);
      const matchingItemType = itemTypeOptions.find((opt) => opt.id === record.itemType);
      const tenantValue = matchingTenant ?? (record.tenantId ? { id: record.tenantId, label: record.tenantName || record.tenantId } : null);
      const categoryValue = matchingCategory ?? (record.categoryId ? { id: record.categoryId, label: record.categoryName || record.categoryId } : null);

      reset({
        tenantId: tenantValue,
        categoryId: categoryValue,
        name: record.name || '',
        description: record.description || null,
        itemType: matchingItemType ?? null,
        price: record.price ?? null,
        imageUrl: record.imageUrl || null,
        isActive: record.isActive ?? true,
        isAvailable: record.isAvailable ?? true,
        stockQuantity: record.stockQuantity ?? null,
      });
    } else {
      // create, or edit with no record (e.g. row no longer in list)
      reset({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: null,
        price: null,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.tenantId, record?.categoryId, record?.name, record?.description, record?.itemType, record?.price, record?.imageUrl, record?.isActive, record?.isAvailable, record?.stockQuantity, effectiveTenantOptions, categoryOptions, reset]);

  // Edit mode: set categoryId when category options load after tenant is set
  useEffect(() => {
    if (!open || mode !== 'edit' || !record?.categoryId || categoryOptions.length === 0) return;
    const matching = categoryOptions.find((c) => c.id === record.categoryId);
    if (matching) {
      setValue('categoryId', matching, { shouldValidate: false, shouldDirty: false });
    }
  }, [open, mode, record?.categoryId, categoryOptions, setValue]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // P0-003: Prevent double-submit
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;

    try {
      const tenantIdValue = data.tenantId?.id ?? data.tenantId;
      const categoryIdValue = data.categoryId?.id ?? data.categoryId;
      const itemTypeValue = Number(data.itemType?.id ?? data.itemType);
      const descriptionValue = data.description === '' ? null : data.description;
      const imageUrlValue = data.imageUrl === '' ? null : data.imageUrl;

      // Handle stockQuantity: in edit mode, if empty/null, don't send it (preserves existing)
      let stockQuantityValue = data.stockQuantity;
      if (mode === 'edit' && (stockQuantityValue === null || stockQuantityValue === undefined || stockQuantityValue === '')) {
        stockQuantityValue = null;
      } else if (stockQuantityValue === '' || stockQuantityValue === null || stockQuantityValue === undefined) {
        stockQuantityValue = 0;
      }

      if (mode === 'create') {
        const createData = {
          tenantId: tenantIdValue,
          categoryId: categoryIdValue,
          name: data.name,
          description: descriptionValue,
          itemType: itemTypeValue,
          price: Number(data.price),
          imageUrl: imageUrlValue,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          stockQuantity: Number(stockQuantityValue) || 0,
        };
        const result = await createItem(createData).unwrap();
        if (onSuccess) {
          onSuccess(result?.id ?? result, 'created', result);
        }
      } else {
        const updateData = {
          tenantId: tenantIdValue,
          categoryId: categoryIdValue,
          name: data.name,
          description: descriptionValue,
          itemType: itemTypeValue,
          price: Number(data.price),
          imageUrl: imageUrlValue,
          isActive: data.isActive,
          isAvailable: data.isAvailable,
          stockQuantity: stockQuantityValue === null ? null : Number(stockQuantityValue),
        };
        await updateItem({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} item`,
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
        title={mode === 'create' ? 'Create Item' : 'Edit Item'}
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
                    sx={{ flex: 1 }}
                  />
                  <Field.Autocomplete
                    name="categoryId"
                    label="Category"
                    options={categoryOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    required
                    disabled={!selectedTenantIdRaw}
                    slotProps={{
                      textField: {
                        helperText: !selectedTenantIdRaw ? 'Select a tenant first' : undefined,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="Enter item name"
                    required
                    sx={{ flex: 1 }}
                  />
                  <Field.Autocomplete
                    name="itemType"
                    label="Item Type"
                    options={itemTypeOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      if (typeof option === 'number') {
                        const found = itemTypeOptions.find((opt) => opt.id === option);
                        return found?.label || '';
                      }
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      const optionId = typeof option === 'object' ? option.id : option;
                      const valueId = typeof value === 'object' ? value.id : value;
                      return optionId === valueId;
                    }}
                    slotProps={{
                      textField: { placeholder: 'Select item type' },
                    }}
                    required
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Field.Text
                    name="description"
                    label="Description"
                    placeholder="Enter description (optional)"
                    multiline
                    rows={3}
                  />
                  
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Pricing & Inventory Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Pricing & Inventory
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field.Text
                    name="price"
                    label="Price"
                    type="number"
                    placeholder="0.00"
                    required
                    slotProps={{
                      input: {
                        inputMode: 'decimal',
                        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol()}</Typography>,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="stockQuantity"
                    label="Stock Quantity"
                    type="number"
                    placeholder={mode === 'edit' ? 'Leave empty to preserve existing value' : '0'}
                    slotProps={{
                      textField: {
                        helperText: mode === 'edit' ? 'Leave empty to preserve existing value' : undefined,
                      },
                      input: {
                        inputMode: 'decimal',
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Additional Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Additional Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Field.Upload
                    name="imageUrl"
                    useS3
                    s3Mode="auto"
                    accept={{
                      'image/png': ['.png'],
                      'image/jpeg': ['.jpg', '.jpeg'],
                      'image/webp': ['.webp'],
                    }}
                    maxSize={5 * 1024 * 1024}
                    helperText="Upload item image (max 5MB, PNG/JPG/WebP)"
                  />
                  {mode === 'edit' && (
                    <>
                      <Field.Switch name="isActive" label="Active" />
                      <Field.Switch name="isAvailable" label="Available" />
                    </>
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

