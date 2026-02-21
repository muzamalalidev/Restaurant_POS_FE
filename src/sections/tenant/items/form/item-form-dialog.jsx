'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { useGetItemsQuery, useCreateItemMutation, useUpdateItemMutation } from 'src/store/api/items-api';
import { createItemSchema, updateItemSchema } from '../schemas/item-schema';

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
 * @param {Array} props.tenantOptions - Tenant options for dropdown (from list view)
 * @param {Array} props.categoryOptions - Category options for dropdown (from list view)
 */
export function ItemFormDialog({ open, mode, itemId, onClose, onSuccess, tenantOptions = [], categoryOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // P0-003: Ref to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Fetch all items to find the one we need (since GetById is placeholder)
  const { data: itemsResponse, isLoading: isLoadingItem } = useGetItemsQuery(
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

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: itemTypeOptions[0],
        price: 0,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
      }),
      [itemTypeOptions]
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = methods;

  // Watch tenantId to filter category options
  const watchedTenantId = watch('tenantId');

  // Category options filtered by selected tenant
  const filteredCategoryOptions = useMemo(() => {
    if (!watchedTenantId || categoryOptions.length === 0) {
      return categoryOptions;
    }

    // Extract tenant ID from watchedTenantId (could be object or string)
    const tenantIdValue = typeof watchedTenantId === 'object' && watchedTenantId !== null
      ? watchedTenantId.id
      : watchedTenantId;

    // Filter categories by tenant
    return categoryOptions.filter((cat) => cat.tenantId === tenantIdValue);
  }, [watchedTenantId, categoryOptions]);

  // Load item data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      reset({
        tenantId: null,
        categoryId: null,
        name: '',
        description: null,
        itemType: itemTypeOptions[0],
        price: 0,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
      });
      return;
    }

    if (mode === 'edit' && itemData && tenantOptions.length > 0) {
      // Find matching tenant and category objects from options
      const matchingTenant = tenantOptions.find((t) => t.id === itemData.tenantId);
      const matchingCategory = filteredCategoryOptions.find((cat) => cat.id === itemData.categoryId);
      // Find matching itemType option
      const matchingItemType = itemTypeOptions.find((opt) => opt.id === itemData.itemType);

      reset({
        tenantId: matchingTenant || null,
        categoryId: matchingCategory || null,
        name: itemData.name || '',
        description: itemData.description || null,
        itemType: matchingItemType || itemTypeOptions[0],
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
        itemType: itemTypeOptions[0],
        price: 0,
        imageUrl: null,
        isActive: true,
        isAvailable: true,
        stockQuantity: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, itemData?.id, itemData?.tenantId, itemData?.categoryId, itemData?.name, itemData?.description, itemData?.itemType, itemData?.price, itemData?.imageUrl, itemData?.isActive, itemData?.isAvailable, itemData?.stockQuantity, tenantOptions, filteredCategoryOptions, reset]);

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
      toast.error(error?.data?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} item`);
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary">
              Loading item data...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load item data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Item not found or an error occurred.
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
                    required
                    sx={{ flex: 1 }}
                  />
                  <Field.Autocomplete
                    name="categoryId"
                    label="Category"
                    options={filteredCategoryOptions}
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
                      // Handle both object and number comparisons
                      const optionId = typeof option === 'object' ? option.id : option;
                      const valueId = typeof value === 'object' ? value.id : value;
                      return optionId === valueId;
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

