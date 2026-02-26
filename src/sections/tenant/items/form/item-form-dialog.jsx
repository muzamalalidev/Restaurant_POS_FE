'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createItemSchema, updateItemSchema } from 'src/schemas';
import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetCategoriesDropdownQuery } from 'src/store/api/categories-api';
import { useGetItemsQuery, useCreateItemMutation, useUpdateItemMutation } from 'src/store/api/items-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Item Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * Note: Since GetById is a placeholder, we use GetAll to find the item by ID.
 * 
 * P2-004 SECURITY NOTE: Tenant context enforcement is handled at the backend API level.
 * Frontend allows selecting any tenant from dropdown; backend must validate user access
 * and enforce multi-tenant isolation. Backend is the source of truth for authorization.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.itemId - Item ID for edit mode
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.tenantOptions - Tenant options for dropdown (from list view; fallback: fetch in form when empty)
 */
export function ItemFormDialog({ open, mode, itemId, onClose, onSuccess, tenantOptions = [] }) {
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

  const { data: itemsResponse, isLoading: isLoadingItem, error: queryError, isError: _isError, refetch: refetchItems } = useGetItemsQuery(
    { pageSize: 1000 },
    { skip: !itemId || mode !== 'edit' || !open }
  );

  // Find the item by ID from the response
  const itemData = useMemo(() => {
    if (!itemsResponse || !itemId || mode !== 'edit') return null;
    const items = itemsResponse.data || [];
    return items.find((item) => item.id === itemId) || null;
  }, [itemsResponse, itemId, mode]);

  // Mutations
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
        price: 0,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
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

  // Load item data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: null,
        price: 0,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
      });
      return;
    }

    if (mode === 'edit' && itemData && effectiveTenantOptions.length > 0) {
      const matchingTenant = effectiveTenantOptions.find((t) => t.id === itemData.tenantId);
      const matchingCategory = categoryOptions.find((cat) => cat.id === itemData.categoryId);
      const matchingItemType = itemTypeOptions.find((opt) => opt.id === itemData.itemType);

      reset({
        tenantId: matchingTenant || null,
        categoryId: matchingCategory || null,
        name: itemData.name || '',
        description: itemData.description || null,
        itemType: matchingItemType || null,
        price: itemData.price || 0,
        imageUrl: itemData.imageUrl || null,
        isActive: itemData.isActive ?? true,
        isAvailable: itemData.isAvailable ?? true,
        stockQuantity: itemData.stockQuantity ?? 0,
      });
    } else if (mode === 'create') {
      reset({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: null,
        price: 0,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, itemData?.id, itemData?.tenantId, itemData?.categoryId, itemData?.name, itemData?.description, itemData?.itemType, itemData?.price, itemData?.imageUrl, itemData?.isActive, itemData?.isAvailable, itemData?.stockQuantity, effectiveTenantOptions, categoryOptions, reset]);

  useEffect(() => {
    if (!open || mode !== 'edit' || !itemData?.categoryId || categoryOptions.length === 0) return;
    const matching = categoryOptions.find((c) => c.id === itemData.categoryId);
    if (matching) {
      setValue('categoryId', matching, { shouldValidate: false, shouldDirty: false });
    }
  }, [open, mode, itemData?.categoryId, categoryOptions, setValue]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // P0-003: Prevent double-submit
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;

    try {
      // Convert empty strings to null for optional fields
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
          tenantId: typeof data.tenantId === 'object' && data.tenantId !== null
            ? data.tenantId.id
            : data.tenantId,
          categoryId: typeof data.categoryId === 'object' && data.categoryId !== null
            ? data.categoryId.id
            : data.categoryId,
          name: data.name,
          description: descriptionValue,
          itemType: typeof data.itemType === 'object' && data.itemType !== null
            ? data.itemType.id
            : Number(data.itemType),
          price: Number(data.price),
          imageUrl: imageUrlValue,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true, // P1-005: Send isAvailable on create
          stockQuantity: Number(stockQuantityValue) || 0,
        };
        const result = await createItem(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        const updateData = {
          tenantId: typeof data.tenantId === 'object' && data.tenantId !== null
            ? data.tenantId.id
            : data.tenantId,
          categoryId: typeof data.categoryId === 'object' && data.categoryId !== null
            ? data.categoryId.id
            : data.categoryId,
          name: data.name,
          description: descriptionValue,
          itemType: typeof data.itemType === 'object' && data.itemType !== null
            ? data.itemType.id
            : Number(data.itemType),
          price: Number(data.price),
          imageUrl: imageUrlValue,
          isActive: data.isActive,
          isAvailable: data.isAvailable,
          stockQuantity: stockQuantityValue === null ? null : Number(stockQuantityValue),
        };
        await updateItem({ id: itemId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(itemId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save item:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} item`,
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
  const isLoading = mode === 'edit' && isLoadingItem;
  const hasError = mode === 'edit' && !itemData && itemsResponse && itemId && open;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Item' : 'Edit Item'}
        maxWidth="md"
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
          onRetry={refetchItems}
          loadingMessage="Loading item data..."
          errorTitle="Failed to load item data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load item data',
            notFoundMessage: 'Item not found or an error occurred.',
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
                    disabled={!watchedTenantId}
                    slotProps={{
                      textField: {
                        helperText: !watchedTenantId ? 'Please select a tenant first' : undefined,
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
                        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>,
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
                  <Field.Text
                    name="imageUrl"
                    label="Image URL"
                    placeholder="Enter image URL (optional)"
                    slotProps={{
                      textField: {
                        helperText: 'Enter a valid URL',
                      },
                    }}
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

