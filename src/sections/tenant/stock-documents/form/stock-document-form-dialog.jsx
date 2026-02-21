'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { toast } from 'src/components/snackbar';

import {
  useGetStockDocumentQuery,
  useCreateStockDocumentMutation,
  useUpdateStockDocumentMutation,
} from 'src/store/api/stock-documents-api';
import { useGetTenantsQuery } from 'src/store/api/tenants-api';
import { useGetBranchesQuery } from 'src/store/api/branches-api';
import { useGetItemsQuery } from 'src/store/api/items-api';
import { createStockDocumentSchema, updateStockDocumentSchema } from '../schemas/stock-document-schema';
import { DOCUMENT_TYPE_OPTIONS } from '../utils/stock-document-helpers';
import { StockDocumentItemsField } from './components/stock-document-items-field';

// ----------------------------------------------------------------------

/**
 * Stock Document Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.documentId - Document ID for edit mode
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function StockDocumentFormDialog({ open, mode, documentId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  
  // State for items replacement warning (edit mode)
  const [itemsReplacementWarningOpen, setItemsReplacementWarningOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  // Fetch document data for edit mode
  const { data: documentData, isLoading: isLoadingDocument } = useGetStockDocumentQuery(documentId, {
    skip: !documentId || mode !== 'edit' || !open,
  });

  // Mutations
  const [createStockDocument, { isLoading: isCreating }] = useCreateStockDocumentMutation();
  const [updateStockDocument, { isLoading: isUpdating }] = useUpdateStockDocumentMutation();

  const isSubmitting = isCreating || isUpdating;
  // P0-002: Ref guard to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Determine schema based on mode
  const schema = mode === 'create' ? createStockDocumentSchema : updateStockDocumentSchema;

  // Form setup (before option queries that depend on watch)
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        branchId: null,
        documentType: null,
        supplierName: null,
        remarks: null,
        items: [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }],
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
  const watchedBranchId = watch('branchId');
  const watchedItems = watch('items');

  const tenantIdForBranches = (() => {
    if (!watchedTenantId) return undefined;
    return typeof watchedTenantId === 'object' && watchedTenantId !== null && 'id' in watchedTenantId
      ? watchedTenantId.id
      : watchedTenantId;
  })();

  // Fetch options for dropdowns (P0-003: limit 200; P1-001: branches filtered by tenant)
  const { data: tenantsResponse } = useGetTenantsQuery({ pageSize: 200 });
  const { data: branchesResponse } = useGetBranchesQuery({
    tenantId: tenantIdForBranches,
    pageSize: 200,
  });
  const { data: itemsResponse } = useGetItemsQuery({ pageSize: 200 });

  // Tenant options
  const tenantOptions = useMemo(() => {
    if (!tenantsResponse) return [];
    const tenants = tenantsResponse.data || [];
    return tenants.map((tenant) => ({
      id: tenant.id,
      label: tenant.name || tenant.id,
    }));
  }, [tenantsResponse]);

  // Branch options (from API, already filtered by tenant when tenantIdForBranches is set)
  const branchOptions = useMemo(() => {
    if (!branchesResponse) return [];
    const branches = branchesResponse.data || [];
    return branches.map((branch) => ({
      id: branch.id,
      label: branch.name || branch.id,
    }));
  }, [branchesResponse]);

  // Validate branch is in current options (e.g. belongs to selected tenant)
  const branchValidationError = useMemo(() => {
    if (!watchedBranchId || branchOptions.length === 0) return null;
    const branchIdValue = typeof watchedBranchId === 'object' && watchedBranchId !== null && 'id' in watchedBranchId
      ? watchedBranchId.id
      : watchedBranchId;
    const found = branchOptions.some((b) => b.id === branchIdValue);
    if (!found) return 'Selected branch does not belong to the selected tenant';
    return null;
  }, [watchedBranchId, branchOptions]);

  // Item options (for document items)
  const itemOptions = useMemo(() => {
    if (!itemsResponse) return [];
    const items = itemsResponse.data || [];
    return items.map((item) => ({
      id: item.id,
      name: item.name || item.id,
      price: item.price || 0,
      isActive: item.isActive ?? true,
      isAvailable: item.isAvailable ?? true,
    }));
  }, [itemsResponse]);

  // Load document data for edit mode
  useEffect(() => {
    if (!open) {
      reset({
        tenantId: null,
        branchId: null,
        documentType: null,
        supplierName: null,
        remarks: null,
        items: [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }],
      });
      setItemsReplacementWarningOpen(false);
      setPendingSubmit(null);
      return;
    }

    if (mode === 'edit' && documentData) {
      // Find matching tenant and branch objects (branchOptions are tenant-scoped from API)
      const matchingTenant = documentData.tenantId && tenantOptions.length > 0
        ? tenantOptions.find((t) => t.id === documentData.tenantId)
        : null;
      
      const matchingBranch = documentData.branchId && branchOptions.length > 0
        ? branchOptions.find((b) => b.id === documentData.branchId)
        : null;

      const matchingDocumentType = documentData.documentType
        ? DOCUMENT_TYPE_OPTIONS.find((dt) => dt.id === documentData.documentType)
        : null;

      // Transform items for form
      const itemsData = documentData.items?.map((item) => {
        const matchingItem = itemOptions.find((opt) => opt.id === item.itemId);
        return {
          itemId: matchingItem || item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          remarks: item.remarks || null,
        };
      }) || [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }];

      reset({
        tenantId: matchingTenant || documentData.tenantId,
        branchId: matchingBranch || documentData.branchId,
        documentType: matchingDocumentType || documentData.documentType,
        supplierName: documentData.supplierName || null,
        remarks: documentData.remarks || null,
        items: itemsData,
      });
    }
  }, [open, mode, documentData, tenantOptions, branchOptions, itemOptions, reset]);

  // Handle branch change - validate it belongs to tenant
  useEffect(() => {
    if (watchedTenantId && watchedBranchId && branchValidationError) {
      // Clear branch if it doesn't belong to tenant
      setValue('branchId', null, { shouldValidate: true });
    }
  }, [watchedTenantId, watchedBranchId, branchValidationError, setValue]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // Check if editing and items are being replaced
    if (mode === 'edit' && data.items && data.items.length > 0) {
      const currentItemsCount = documentData?.items?.length || 0;
      const newItemsCount = data.items.length;
      
      // Check if items are actually being replaced (not just updated)
      const itemsChanged = JSON.stringify(data.items.map((i) => ({
        itemId: typeof i.itemId === 'object' ? i.itemId.id : i.itemId,
        quantity: i.quantity,
      }))) !== JSON.stringify(documentData.items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
      })));

      if (itemsChanged && (newItemsCount !== currentItemsCount || itemsChanged)) {
        setPendingSubmit(() => () => performSubmit(data));
        setItemsReplacementWarningOpen(true);
        return;
      }
    }

    await performSubmit(data);
  });

  // Perform actual submit (P0-002: ref guard prevents double-submit)
  const performSubmit = useCallback(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Transform items array
      const transformedItems = data.items.map((item) => ({
        itemId: typeof item.itemId === 'object' && item.itemId !== null
          ? item.itemId.id
          : item.itemId,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice === null || item.unitPrice === '' ? null : Number(item.unitPrice),
        remarks: item.remarks === '' ? null : item.remarks,
      }));

      if (mode === 'create') {
        const createData = {
          tenantId: typeof data.tenantId === 'object' && data.tenantId !== null
            ? data.tenantId.id
            : data.tenantId,
          branchId: typeof data.branchId === 'object' && data.branchId !== null
            ? data.branchId.id
            : data.branchId,
          documentType: typeof data.documentType === 'object' && data.documentType !== null
            ? data.documentType.id
            : data.documentType,
          supplierName: data.supplierName === '' ? null : data.supplierName,
          remarks: data.remarks === '' ? null : data.remarks,
          items: transformedItems,
        };

        const result = await createStockDocument(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
        reset();
        onClose();
        toast.success('Stock document created successfully');
      } else {
        // Edit mode
        const updateData = {
          supplierName: data.supplierName === '' ? null : data.supplierName,
          remarks: data.remarks === '' ? null : data.remarks,
          items: transformedItems, // Empty array preserves, non-empty replaces
        };

        await updateStockDocument({ id: documentId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(documentId, 'updated');
        }
        reset();
        onClose();
        toast.success('Stock document updated successfully');
      }
    } catch (error) {
      console.error(`Failed to ${mode} stock document:`, error);
      const errorMessage = error?.data?.message || error?.data || error?.message || `Failed to ${mode} stock document`;
      toast.error(errorMessage);
    } finally {
      isSubmittingRef.current = false;
    }
  }, [mode, createStockDocument, updateStockDocument, documentId, onSuccess, reset, onClose]);

  // Handle confirm items replacement
  const handleConfirmItemsReplacement = useCallback(() => {
    setItemsReplacementWarningOpen(false);
    if (pendingSubmit) {
      pendingSubmit();
      setPendingSubmit(null);
    }
  }, [pendingSubmit]);

  // Handle cancel items replacement
  const handleCancelItemsReplacement = useCallback(() => {
    setItemsReplacementWarningOpen(false);
    setPendingSubmit(null);
  }, []);

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
        disabled={isSubmitting || !!branchValidationError}
        startIcon="solar:check-circle-bold"
        sx={{ minHeight: 44 }}
      >
        {mode === 'create' ? 'Create' : 'Update'}
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode
  const isLoading = mode === 'edit' && isLoadingDocument;
  const hasError = mode === 'edit' && !documentData && !isLoadingDocument && documentId && open;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Stock Document' : 'Edit Stock Document'}
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
              Loading document information...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load document
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document not found or an error occurred.
            </Typography>
          </Box>
        ) : (
          <Form methods={methods} onSubmit={onSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Branch validation error */}
              {branchValidationError && (
                <Alert severity="error">{branchValidationError}</Alert>
              )}

              {/* Document Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Document Information
                </Typography>
                <Stack spacing={2}>
                  {/* Tenant */}
                  <Field.Autocomplete
                    name="tenantId"
                    label="Tenant"
                    options={tenantOptions}
                    required
                    disabled={mode === 'edit'}
                    slotProps={{
                      autocomplete: {
                        onChange: (event, newValue) => {
                          setValue('tenantId', newValue, { shouldValidate: true });
                          // Clear branch when tenant changes
                          setValue('branchId', null, { shouldValidate: true });
                        },
                      },
                    }}
                  />

                  {/* Branch */}
                  <Field.Autocomplete
                    name="branchId"
                    label="Branch"
                    options={branchOptions}
                    required
                    disabled={mode === 'edit' || !watchedTenantId}
                    slotProps={{
                      textField: {
                        helperText: !watchedTenantId ? 'Please select a tenant first' : undefined,
                      },
                    }}
                  />

                  {/* Document Type */}
                  <Field.Autocomplete
                    name="documentType"
                    label="Document Type"
                    options={DOCUMENT_TYPE_OPTIONS}
                    required
                    disabled={mode === 'edit'}
                  />

                  {/* Supplier Name */}
                  <Field.Text
                    name="supplierName"
                    label="Supplier Name"
                    placeholder="Enter supplier name (optional)"
                  />

                  {/* Remarks */}
                  <Field.Text
                    name="remarks"
                    label="Remarks"
                    placeholder="Enter remarks (optional)"
                    multiline
                    rows={3}
                  />
                </Stack>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Items */}
              <Box>
                <StockDocumentItemsField name="items" itemOptions={itemOptions} />
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

      {/* Items Replacement Warning Dialog (Edit Mode) */}
      <ConfirmDialog
        open={itemsReplacementWarningOpen}
        title="Replace Items?"
        content="Providing items array will replace all existing items. Are you sure you want to continue?"
        action={
          <Field.Button variant="contained" color="error" onClick={handleConfirmItemsReplacement}>
            Replace Items
          </Field.Button>
        }
        onClose={handleCancelItemsReplacement}
      />
    </>
  );
}

