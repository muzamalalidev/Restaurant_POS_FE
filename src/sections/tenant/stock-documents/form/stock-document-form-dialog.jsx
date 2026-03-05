'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetItemsQuery } from 'src/store/api/items-api';
import { createStockDocumentSchema, updateStockDocumentSchema } from 'src/schemas';
import {
  useCreateStockDocumentMutation,
  useUpdateStockDocumentMutation,
} from 'src/store/api/stock-documents-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { DOCUMENT_TYPE_OPTIONS } from '../utils/stock-document-helpers';
import { StockDocumentItemsField } from './components/stock-document-items-field';

// ----------------------------------------------------------------------

/**
 * Stock Document Form Dialog Component
 *
 * Single dialog for create and edit. Edit mode uses record from list (no getById).
 * Tenant and branch are taken from route/context; no tenant or branch dropdown.
 * documentType: static (DOCUMENT_TYPE_OPTIONS). items[].itemId: from useGetItemsQuery.
 */
export function StockDocumentFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const [itemsReplacementWarningOpen, setItemsReplacementWarningOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const [createStockDocument, { isLoading: isCreating }] = useCreateStockDocumentMutation();
  const [updateStockDocument, { isLoading: isUpdating }] = useUpdateStockDocumentMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);
  const schema = mode === 'create' ? createStockDocumentSchema : updateStockDocumentSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
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
    formState: { isDirty },
  } = methods;

  const { data: itemsQueryData } = useGetItemsQuery({ pageSize: 200 }, { skip: !open });
  const itemOptions = useMemo(() => {
    if (!itemsQueryData) return [];
    const items = itemsQueryData.data || [];
    return items.map((item) => ({
      id: item.id,
      name: item.name || item.id,
      price: item.price || 0,
      isActive: item.isActive ?? true,
      isAvailable: item.isAvailable ?? true,
    }));
  }, [itemsQueryData]);

  // Effective item options: include synthetics for record items not yet in itemOptions (edit mode)
  const effectiveItemOptions = useMemo(() => {
    if (mode !== 'edit' || !record?.items?.length) return itemOptions;
    const idsInOptions = new Set(itemOptions.map((o) => o.id));
    const synthetics = record.items
      .filter((item) => item.itemId && !idsInOptions.has(item.itemId))
      .map((item) => ({
        id: item.itemId,
        name: item.itemName || item.itemId,
        price: item.unitPrice ?? 0,
        isActive: true,
        isAvailable: true,
      }));
    if (synthetics.length === 0) return itemOptions;
    return [...itemOptions, ...synthetics];
  }, [mode, record?.items, itemOptions]);

  // Load document data for edit mode from record or reset for create/close
  useEffect(() => {
    if (!open) {
      reset({
        documentType: null,
        supplierName: null,
        remarks: null,
        items: [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }],
      });
      setItemsReplacementWarningOpen(false);
      setPendingSubmit(null);
      return;
    }

    if (mode === 'edit' && record) {
      const matchingDocumentType = record.documentType
        ? DOCUMENT_TYPE_OPTIONS.find((dt) => dt.id === record.documentType)
        : null;
      const documentTypeValue = matchingDocumentType || (record.documentType != null ? { id: record.documentType, label: String(record.documentType) } : null);

      const itemsData =
        record.items?.map((item) => {
          const matchingItem = effectiveItemOptions.find((opt) => opt.id === item.itemId);
          const itemValue = matchingItem || (item.itemId ? { id: item.itemId, name: item.itemName || item.itemId, price: item.unitPrice ?? 0, isActive: true, isAvailable: true } : null);
          return {
            itemId: itemValue,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            remarks: item.remarks || null,
          };
        }) || [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }];

      reset({
        documentType: documentTypeValue,
        supplierName: record.supplierName || null,
        remarks: record.remarks || null,
        items: itemsData,
      });
    } else if (mode === 'edit' && !record) {
      reset({
        documentType: null,
        supplierName: null,
        remarks: null,
        items: [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }],
      });
    } else if (mode === 'create') {
      reset({
        documentType: null,
        supplierName: null,
        remarks: null,
        items: [{ itemId: null, quantity: 1, unitPrice: null, remarks: null }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.documentType, record?.supplierName, record?.remarks, record?.items, effectiveItemOptions, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
    // Check if editing and items are being replaced
    if (mode === 'edit' && data.items && data.items.length > 0 && record) {
      const currentItemsCount = record.items?.length || 0;
      const newItemsCount = data.items.length;

      const itemsChanged = JSON.stringify(data.items.map((i) => ({
        itemId: typeof i.itemId === 'object' ? i.itemId?.id : i.itemId,
        quantity: i.quantity,
      }))) !== JSON.stringify((record.items || []).map((i) => ({
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

        await updateStockDocument({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
        reset();
        onClose();
        toast.success('Stock document updated successfully');
      }
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode} stock document`,
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => performSubmit(data), 100);
            },
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }, [mode, createStockDocument, updateStockDocument, record, onSuccess, reset, onClose]);

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
        title={mode === 'create' ? 'Create Stock Document' : 'Edit Stock Document'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Document Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Document Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>

                  {/* Document Type */}
                  <Field.Autocomplete
                    name="documentType"
                    label="Document Type"
                    options={DOCUMENT_TYPE_OPTIONS}
                    required
                    disabled={mode === 'edit'}
                    sx={{ flex: 1 }}
                  />

                  {/* Supplier Name */}
                  <Field.Text
                    name="supplierName"
                    label="Supplier Name"
                    placeholder="Enter supplier name (optional)"
                    sx={{ flex: 1 }}
                  />
                       </Box>

                  {/* Remarks */}
                  <Field.Text
                    name="remarks"
                    label="Remarks"
                    placeholder="Enter remarks (optional)"
                    multiline
                    rows={3}
                  />
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Items */}
              <Box>
                <StockDocumentItemsField name="items" itemOptions={effectiveItemOptions} />
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

