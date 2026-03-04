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
import { createDealSchema, updateDealSchema } from 'src/schemas';
import {
  useCreateDealMutation,
  useUpdateDealMutation,
} from 'src/store/api/deals-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { DealItemsField } from './components/deal-items-field';

// ----------------------------------------------------------------------

const ITEM_TYPE_DEAL = 4;
const ITEM_TYPES_LINE = [1, 2, 3]; // Direct Sale, Recipe Based, Add On

// ----------------------------------------------------------------------

export function DealFormDialog({ open, mode, record, existingDeals = [], onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  const { data: itemsResponse } = useGetItemsQuery({ pageSize: 200 }, { skip: !open });
  const allItems = useMemo(() => itemsResponse?.data ?? [], [itemsResponse]);
  const dealTypeItems = useMemo(
    () => allItems.filter((item) => item.itemType === ITEM_TYPE_DEAL),
    [allItems]
  );
  const lineItemOptions = useMemo(
    () => allItems.filter((item) => ITEM_TYPES_LINE.includes(item.itemType)),
    [allItems]
  );

  const existingDealItemIds = useMemo(() => {
    if (!existingDeals?.length) return new Set();
    if (mode === 'edit' && record?.id) {
      return new Set(
        existingDeals
          .filter((d) => d.id !== record.id)
          .map((d) => d.itemId)
          .filter(Boolean)
      );
    }
    return new Set(existingDeals.map((d) => d.itemId).filter(Boolean));
  }, [existingDeals, mode, record?.id]);

  const dealItemOptions = useMemo(() => {
    if (mode === 'create') {
      return dealTypeItems.filter((item) => !existingDealItemIds.has(item.id));
    }
    const currentItemId = record?.itemId;
    const rest = dealTypeItems.filter((item) => !existingDealItemIds.has(item.id));
    const hasCurrent = rest.some((item) => item.id === currentItemId);
    if (currentItemId && !hasCurrent) {
      const synthetic = dealTypeItems.find((item) => item.id === currentItemId) || {
        id: currentItemId,
        name: record?.itemName || currentItemId,
      };
      return [synthetic, ...rest];
    }
    return rest;
  }, [mode, record?.itemId, record?.itemName, dealTypeItems, existingDealItemIds]);

  const [createDeal, { isLoading: isCreating }] = useCreateDealMutation();
  const [updateDeal, { isLoading: isUpdating }] = useUpdateDealMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);

  const schema = mode === 'create' ? createDealSchema : updateDealSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        itemId: null,
        name: '',
        description: null,
        price: null,
        imageUrl: null,
        startDate: null,
        endDate: null,
        isActive: true,
        items: [{ itemId: null, quantity: 1, unitPrice: null }],
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty } } = methods;

  useEffect(() => {
    if (!open) {
      reset({
        itemId: null,
        name: '',
        description: null,
        price: null,
        imageUrl: null,
        startDate: null,
        endDate: null,
        isActive: true,
        items: [{ itemId: null, quantity: 1, unitPrice: null }],
      });
      return;
    }

    if (mode === 'edit' && record) {
      const itemIdValue =
        record.itemId && dealItemOptions.length > 0
          ? dealItemOptions.find((o) => o.id === record.itemId) ?? { id: record.itemId, name: record.itemName || record.itemId }
          : record.itemId
            ? { id: record.itemId, name: record.itemName || record.itemId }
            : null;

      const formItems = (record.items || []).map((line) => {
        const opt = lineItemOptions.find((o) => o.id === line.itemId);
        const itemValue = opt ?? (line.itemId ? { id: line.itemId, name: line.itemName || line.itemId } : null);
        return {
          itemId: itemValue,
          quantity: line.quantity ?? 1,
          unitPrice: line.unitPrice ?? null,
        };
      });

      reset({
        itemId: itemIdValue,
        name: record.name || '',
        description: record.description ?? null,
        price: record.price ?? null,
        imageUrl: record.imageUrl ?? null,
        startDate: record.startDate ? new Date(record.startDate) : null,
        endDate: record.endDate ? new Date(record.endDate) : null,
        isActive: record.isActive ?? true,
        items: formItems.length > 0 ? formItems : [{ itemId: null, quantity: 1, unitPrice: null }],
      });
    } else {
      reset({
        itemId: null,
        name: '',
        description: null,
        price: null,
        imageUrl: null,
        startDate: null,
        endDate: null,
        isActive: true,
        items: [{ itemId: null, quantity: 1, unitPrice: null }],
      });
    }
  }, [open, mode, record, dealItemOptions, lineItemOptions, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const itemIdValue = data.itemId?.id ?? data.itemId ?? null;
      const startDateValue = data.startDate
        ? (data.startDate instanceof Date ? data.startDate : new Date(data.startDate)).toISOString()
        : null;
      const endDateValue = data.endDate
        ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)).toISOString()
        : null;

      const mapItems = (items) =>
        (items || [])
          .filter((line) => line.itemId)
          .map((line) => ({
            itemId: line.itemId?.id ?? line.itemId,
            quantity: Number(line.quantity) || 1,
            unitPrice: line.unitPrice != null && line.unitPrice !== '' ? Number(line.unitPrice) : null,
          }));

      if (mode === 'create') {
        const validItems = mapItems(data.items);
        if (validItems.length === 0) {
          toast.error('Deal must contain at least one item');
          return;
        }
        const result = await createDeal({
          itemId: itemIdValue,
          name: data.name,
          description: data.description || null,
          price: Number(data.price),
          imageUrl: data.imageUrl || null,
          startDate: startDateValue,
          endDate: endDateValue,
          items: validItems,
        }).unwrap();
        if (onSuccess) onSuccess(result, 'created');
      } else {
        const validItems = mapItems(data.items);
        const updatePayload = {
          itemId: itemIdValue,
          name: data.name,
          description: data.description || null,
          price: Number(data.price),
          imageUrl: data.imageUrl || null,
          startDate: startDateValue,
          endDate: endDateValue,
          isActive: data.isActive,
          items: validItems.length > 0 ? validItems : null,
        };
        await updateDeal({ id: record.id, ...updatePayload }).unwrap();
        if (onSuccess) onSuccess(record.id, 'updated');
      }
      reset();
      onClose();
    } catch (error) {
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} deal`,
      });
      toast.error(message);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    if (isDirty) {
      setUnsavedChangesDialogOpen(true);
      return;
    }
    reset();
    onClose();
  }, [isSubmitting, isDirty, reset, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCancelDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
  }, []);

  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Field.Button variant="outlined" color="inherit" onClick={handleClose} disabled={isSubmitting}>
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
        title={mode === 'create' ? 'Create Deal' : 'Edit Deal'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Deal Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Field.Autocomplete
                  name="itemId"
                  label="Deal Item"
                  options={dealItemOptions}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.name || option.label || option.id || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id;
                  }}
                  sx={{ flex: 1 }}
                  required
                />
                <Field.Text
                  name="name"
                  label="Name"
                  placeholder="Enter deal name"
                  required
                  sx={{ flex: 1 }}
                />
                </Box>
                <Field.Text
                  name="description"
                  label="Description"
                  placeholder="Description (optional)"
                  multiline
                  rows={2}
                />
                <Field.Text
                  name="price"
                  label="Price"
                  type="number"
                  required
                  slotProps={{
                    input: {
                      inputProps: { min: 0, step: 0.01 },
                    },
                  }}
                />
                <Field.Upload
                  name="imageUrl"
                  useS3
                  s3Mode="auto"
                  accept={{
                    'image/png': ['.png'],
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/webp': ['.webp'],
                  }}
                  maxSize={2 * 1024 * 1024}
                  helperText="Upload deal image (max 2MB, PNG/JPG/WebP)"
                />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                <Field.DateTimePicker
                  name="startDate"
                  label="Start Date"
                />
                <Field.DateTimePicker
                  name="endDate"
                  label="End Date"
                />
                </Box>
                {mode === 'edit' && <Field.Switch name="isActive" label="Active" />}
              </Box>
            </Box>

            <Divider />

            <DealItemsField name="items" itemOptions={lineItemOptions} mode={mode} />
          </Box>
        </Form>
      </CustomDialog>

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
