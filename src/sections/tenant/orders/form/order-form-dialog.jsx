'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useCreateOrderMutation } from 'src/store/api/orders-api';
import { useGetBranchesQuery } from 'src/store/api/branches-api';
import { useGetStaffQuery } from 'src/store/api/staff-api';
import { useGetItemsQuery } from 'src/store/api/items-api';
import { createOrderSchema } from '../schemas/order-schema';
import { OrderItemsField } from './components/order-items-field';

// ----------------------------------------------------------------------

/**
 * Order Form Dialog Component
 * 
 * Dialog component for creating orders.
 * Handles form state, validation, and API calls.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function OrderFormDialog({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  
  // State for delivery details collapse
  const [deliveryDetailsOpen, setDeliveryDetailsOpen] = useState(false);

  // Mutations
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const isSubmitting = isCreating;
  // P0-002: Ref guard to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Fetch options for dropdowns (P0-003: limit to 200)
  const { data: branchesResponse } = useGetBranchesQuery({ pageSize: 200 });
  const { data: staffResponse } = useGetStaffQuery({ pageSize: 200 });
  const { data: itemsResponse } = useGetItemsQuery({ pageSize: 200 });

  // Branch options
  const branchOptions = useMemo(() => {
    if (!branchesResponse) return [];
    const branches = branchesResponse.data || [];
    return branches.map((branch) => ({
      id: branch.id,
      label: branch.name || branch.id,
    }));
  }, [branchesResponse]);

  // Staff options
  const staffOptions = useMemo(() => {
    if (!staffResponse) return [];
    const staff = staffResponse.data || [];
    return staff.map((s) => ({
      id: s.id,
      label: s.name || s.id,
    }));
  }, [staffResponse]);

  // Item options (for order items)
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

  // Form setup
  const methods = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues: useMemo(
      () => ({
        branchId: null,
        orderTypeId: null,
        paymentModeId: null,
        staffId: null,
        tableId: null,
        kitchenId: null,
        items: [{ itemId: null, quantity: 1, unitPrice: 0, notes: null }],
        deliveryDetails: null,
        taxAmount: 0,
        taxPercentage: null,
        discountAmount: 0,
        discountPercentage: null,
        notes: null,
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

  // Watch form values for calculations
  const watchedItems = watch('items');
  const watchedTaxAmount = watch('taxAmount');
  const watchedTaxPercentage = watch('taxPercentage');
  const watchedDiscountAmount = watch('discountAmount');
  const watchedDiscountPercentage = watch('discountPercentage');

  // Calculate subtotal from items
  const subtotal = useMemo(() => {
    if (!watchedItems || watchedItems.length === 0) return 0;
    return watchedItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  }, [watchedItems]);

  // Calculate tax amount if percentage provided
  const calculatedTaxAmount = useMemo(() => {
    if (watchedTaxPercentage && watchedTaxPercentage > 0 && subtotal > 0) {
      return subtotal * (watchedTaxPercentage / 100);
    }
    return watchedTaxAmount || 0;
  }, [watchedTaxPercentage, watchedTaxAmount, subtotal]);

  // Calculate discount amount if percentage provided
  const calculatedDiscountAmount = useMemo(() => {
    if (watchedDiscountPercentage && watchedDiscountPercentage > 0 && subtotal > 0) {
      return subtotal * (watchedDiscountPercentage / 100);
    }
    return watchedDiscountAmount || 0;
  }, [watchedDiscountPercentage, watchedDiscountAmount, subtotal]);

  // Calculate total
  const totalAmount = useMemo(() => {
    return subtotal + calculatedTaxAmount - calculatedDiscountAmount;
  }, [subtotal, calculatedTaxAmount, calculatedDiscountAmount]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        branchId: null,
        orderTypeId: null,
        paymentModeId: null,
        staffId: null,
        tableId: null,
        kitchenId: null,
        items: [{ itemId: null, quantity: 1, unitPrice: 0, notes: null }],
        deliveryDetails: null,
        taxAmount: 0,
        taxPercentage: null,
        discountAmount: 0,
        discountPercentage: null,
        notes: null,
      });
      setDeliveryDetailsOpen(false);
    }
  }, [open, reset]);

  // Handle form submit (P0-002: ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Transform items array
      const transformedItems = data.items.map((item) => ({
        itemId: typeof item.itemId === 'object' && item.itemId !== null
          ? item.itemId.id
          : item.itemId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        notes: item.notes === '' ? null : item.notes,
      }));

      // Transform delivery details
      let transformedDeliveryDetails = null;
      if (data.deliveryDetails) {
        const dd = data.deliveryDetails;
        transformedDeliveryDetails = {
          contactName: dd.contactName === '' ? null : dd.contactName,
          phone: dd.phone === '' ? null : dd.phone,
          address: dd.address === '' ? null : dd.address,
          city: dd.city === '' ? null : dd.city,
          postalCode: dd.postalCode === '' ? null : dd.postalCode,
          landmark: dd.landmark === '' ? null : dd.landmark,
          instructions: dd.instructions === '' ? null : dd.instructions,
        };
        // Check if all fields are null/empty
        const hasAnyValue = Object.values(transformedDeliveryDetails).some((val) => val !== null && val !== '');
        if (!hasAnyValue) {
          transformedDeliveryDetails = null;
        }
      }

      const createData = {
        branchId: typeof data.branchId === 'object' && data.branchId !== null
          ? data.branchId.id
          : data.branchId,
        orderTypeId: typeof data.orderTypeId === 'object' && data.orderTypeId !== null
          ? data.orderTypeId.id
          : data.orderTypeId,
        paymentModeId: typeof data.paymentModeId === 'object' && data.paymentModeId !== null
          ? data.paymentModeId.id
          : (data.paymentModeId || null),
        staffId: typeof data.staffId === 'object' && data.staffId !== null
          ? data.staffId.id
          : (data.staffId || null),
        tableId: typeof data.tableId === 'object' && data.tableId !== null
          ? data.tableId.id
          : (data.tableId || null),
        kitchenId: typeof data.kitchenId === 'object' && data.kitchenId !== null
          ? data.kitchenId.id
          : (data.kitchenId || null),
        items: transformedItems,
        deliveryDetails: transformedDeliveryDetails,
        taxAmount: calculatedTaxAmount,
        taxPercentage: watchedTaxPercentage || null,
        discountAmount: calculatedDiscountAmount,
        discountPercentage: watchedDiscountPercentage || null,
        notes: data.notes === '' ? null : data.notes,
      };

      const result = await createOrder(createData).unwrap();
      if (onSuccess) {
        onSuccess(result, 'created');
      }
      reset();
      onClose();
      // P0-004: Parent shows toast on onSuccess; no duplicate here
    } catch (error) {
      console.error('Failed to create order:', error);
      const errorMessage = error?.data?.message || error?.data || error?.message || 'Failed to create order';
      toast.error(errorMessage);
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
        Create Order
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Create Order"
        maxWidth="lg"
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
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Autocomplete
                    name="branchId"
                    label="Branch"
                    options={branchOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    required
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Field.Autocomplete
                    name="orderTypeId"
                    label="Order Type"
                    options={[]}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    required
                    slotProps={{
                      textField: {
                        helperText: 'Order types API not yet implemented',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Autocomplete
                    name="paymentModeId"
                    label="Payment Mode"
                    options={[]}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        helperText: 'Payment modes API not yet implemented',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Field.Autocomplete
                    name="staffId"
                    label="Staff"
                    options={staffOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Autocomplete
                    name="tableId"
                    label="Table"
                    options={[]}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        helperText: 'Tables API not yet implemented',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Field.Autocomplete
                    name="kitchenId"
                    label="Kitchen"
                    options={[]}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        helperText: 'Kitchens API not yet implemented',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Items Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Order Items
              </Typography>
              <OrderItemsField name="items" itemOptions={itemOptions} />
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Delivery Details Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">
                  Delivery Details
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setDeliveryDetailsOpen(!deliveryDetailsOpen)}
                >
                  <Iconify
                    icon={deliveryDetailsOpen ? 'mingcute:up-line' : 'mingcute:down-line'}
                  />
                </IconButton>
              </Box>
              <Collapse in={deliveryDetailsOpen}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Field.Text
                      name="deliveryDetails.contactName"
                      label="Contact Name"
                      placeholder="Enter contact name"
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                    <Field.Text
                      name="deliveryDetails.phone"
                      label="Phone"
                      placeholder="Enter phone number"
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                  </Box>
                  <Field.Text
                    name="deliveryDetails.address"
                    label="Address"
                    placeholder="Enter delivery address"
                  />
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Field.Text
                      name="deliveryDetails.city"
                      label="City"
                      placeholder="Enter city"
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                    <Field.Text
                      name="deliveryDetails.postalCode"
                      label="Postal Code"
                      placeholder="Enter postal code"
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                  </Box>
                  <Field.Text
                    name="deliveryDetails.landmark"
                    label="Landmark"
                    placeholder="Enter landmark (optional)"
                  />
                  <Field.Text
                    name="deliveryDetails.instructions"
                    label="Delivery Instructions"
                    placeholder="Enter delivery instructions (optional)"
                    multiline
                    rows={3}
                  />
                </Box>
              </Collapse>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Pricing Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Pricing
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(subtotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Text
                    name="taxAmount"
                    label="Tax Amount"
                    type="number"
                    placeholder="0.00"
                    slotProps={{
                      input: {
                        inputProps: { min: 0, step: 0.01 },
                      },
                      textField: {
                        size: 'small',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Field.Text
                    name="taxPercentage"
                    label="Tax Percentage"
                    type="number"
                    placeholder="0.00"
                    slotProps={{
                      input: {
                        inputProps: { min: 0, max: 100, step: 0.01 },
                      },
                      textField: {
                        size: 'small',
                        helperText: watchedTaxPercentage && subtotal > 0
                          ? `Calculated: ${new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(calculatedTaxAmount)}`
                          : undefined,
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Text
                    name="discountAmount"
                    label="Discount Amount"
                    type="number"
                    placeholder="0.00"
                    slotProps={{
                      input: {
                        inputProps: { min: 0, step: 0.01 },
                      },
                      textField: {
                        size: 'small',
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Field.Text
                    name="discountPercentage"
                    label="Discount Percentage"
                    type="number"
                    placeholder="0.00"
                    slotProps={{
                      input: {
                        inputProps: { min: 0, max: 100, step: 0.01 },
                      },
                      textField: {
                        size: 'small',
                        helperText: watchedDiscountPercentage && subtotal > 0
                          ? `Calculated: ${new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(calculatedDiscountAmount)}`
                          : undefined,
                      },
                    }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Total Amount:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Notes Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Notes
              </Typography>
              <Field.Text
                name="notes"
                label="Order Notes"
                placeholder="Enter order notes (optional)"
                multiline
                rows={3}
              />
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

