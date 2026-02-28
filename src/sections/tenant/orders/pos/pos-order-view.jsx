'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, useWatch, FormProvider, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createOrderSchema } from 'src/schemas';
import { useGetItemsQuery } from 'src/store/api/items-api';
import { useCreateOrderMutation } from 'src/store/api/orders-api';
import { useGetStaffDropdownQuery } from 'src/store/api/staff-api';
import { useGetTablesDropdownQuery } from 'src/store/api/tables-api';
import { useGetCategoriesQuery } from 'src/store/api/categories-api';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import { useGetOrderTypesDropdownQuery } from 'src/store/api/order-types-api';
import { useGetPaymentModesDropdownQuery } from 'src/store/api/payment-modes-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { PosCartList } from './components/pos-cart-list';
import { PosProductGrid } from './components/pos-product-grid';
import { PosOrderContext } from './components/pos-order-context';
import { PosCategoryStrip } from './components/pos-category-strip';

// ----------------------------------------------------------------------

const defaultValues = {
  searchTerm: '',
  branchId: null,
  orderTypeId: null,
  paymentModeId: null,
  staffId: null,
  tableId: null,
  kitchenId: null,
  items: [],
  deliveryDetails: null,
  taxAmount: null,
  taxPercentage: null,
  discountAmount: null,
  discountPercentage: null,
  notes: null,
};

// ----------------------------------------------------------------------

function PosOrderContent({
  branchOptions = [],
  orderTypeOptions = [],
  staffOptions = [],
}) {
  const { control, watch, setValue } = useFormContext();
  const [categoryId, setCategoryId] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const branchId = watch('branchId');
  const searchTerm = useWatch({ control, name: 'searchTerm', defaultValue: '' }) ?? '';
  const watchedItems = useWatch({ control, name: 'items', defaultValue: [] });
  const items = useMemo(
    () => (watchedItems && Array.isArray(watchedItems) ? watchedItems : []),
    [watchedItems]
  );
  const taxAmount = watch('taxAmount') ?? 0;
  const taxPercentage = watch('taxPercentage');
  const discountAmount = watch('discountAmount') ?? 0;
  const discountPercentage = watch('discountPercentage');

  const selectedBranchId = useMemo(() => {
    if (!branchId) return null;
    return typeof branchId === 'object' && branchId !== null ? branchId.id : branchId;
  }, [branchId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetCategoriesQuery({
    pageSize: 200,
  });
  const categories = useMemo(
    () => (categoriesResponse?.data ?? []).filter((c) => c.isActive !== false),
    [categoriesResponse]
  );

  const itemsQueryParams = useMemo(
    () => ({
      categoryId: categoryId || undefined,
      pageSize: 500,
      searchTerm: debouncedSearch.trim() || undefined,
    }),
    [categoryId, debouncedSearch]
  );
  const { data: itemsResponse, isLoading: itemsLoading } = useGetItemsQuery(itemsQueryParams);
  const products = useMemo(() => itemsResponse?.data ?? [], [itemsResponse]);
  const itemOptions = useMemo(
    () =>
      products.map((item) => ({
        id: item.id,
        name: item.name || item.id,
        price: item.price ?? 0,
        isActive: item.isActive ?? true,
        isAvailable: item.isAvailable ?? true,
        imageUrl: item.imageUrl,
      })),
    [products]
  );

  const { data: tablesDropdown } = useGetTablesDropdownQuery(
    { branchId: selectedBranchId || undefined },
    { skip: !selectedBranchId }
  );

  const { data: paymentModesDropdown } = useGetPaymentModesDropdownQuery(selectedBranchId ?? undefined, {
    skip: !selectedBranchId,
  });
  const paymentModeOptions = useMemo(() => {
    if (!paymentModesDropdown || !Array.isArray(paymentModesDropdown)) return [];
    return paymentModesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [paymentModesDropdown]);
  const tableOptions = useMemo(() => {
    if (!tablesDropdown || !Array.isArray(tablesDropdown)) return [];
    return tablesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tablesDropdown]);

  const subtotal = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((sum, row) => {
      const q = Number(row.quantity) || 0;
      const p = Number(row.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const calculatedTax = useMemo(() => {
    if (taxPercentage != null && taxPercentage > 0) return subtotal * (taxPercentage / 100);
    return Number(taxAmount) || 0;
  }, [taxPercentage, taxAmount, subtotal]);

  const calculatedDiscount = useMemo(() => {
    if (discountPercentage != null && discountPercentage > 0) return subtotal * (discountPercentage / 100);
    return Number(discountAmount) || 0;
  }, [discountPercentage, discountAmount, subtotal]);

  const grandTotal = subtotal + calculatedTax - calculatedDiscount;
  const itemCount = items.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0);

  const selectedItemIds = useMemo(
    () =>
      items
        .map((row) => {
          const id = row?.itemId;
          return typeof id === 'object' && id !== null ? id.id : id;
        })
        .filter(Boolean),
    [items]
  );

  const addOrToggleItem = useCallback(
    (product) => {
      const productId = product.id;
      const alreadyInCart = items.some((row) => {
        const id = row?.itemId;
        const resolved = typeof id === 'object' && id !== null ? id.id : id;
        return resolved === productId;
      });
      if (alreadyInCart) {
        const nextItems = items.filter((row) => {
          const id = row?.itemId;
          const resolved = typeof id === 'object' && id !== null ? id.id : id;
          return resolved !== productId;
        });
        setValue('items', nextItems, { shouldValidate: true, shouldDirty: true });
      } else {
        setValue(
          'items',
          [...items, { itemId: product.id, quantity: 1, unitPrice: product.price ?? null, notes: null }],
          { shouldValidate: true, shouldDirty: true }
        );
      }
    },
    [items, setValue]
  );

  return (
    <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 400px' },
          gridTemplateRows: { xs: 'auto auto 1fr', md: '1fr' },
          gap: 2,
          overflow: 'hidden',
        }}
      >
        <Card
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <PosCategoryStrip
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
              loading={categoriesLoading}
            />
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
            <PosProductGrid
              items={products}
              loading={itemsLoading}
              onSelectItem={addOrToggleItem}
              searchTerm={debouncedSearch}
              selectedItemIds={selectedItemIds}
            />
          </Box>
        </Card>

        <Card
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          <Stack spacing={2} sx={{ p: 2, overflow: 'auto', flex: 1, minHeight: 0 }}>
            <PosOrderContext
              branchOptions={branchOptions}
              orderTypeOptions={orderTypeOptions}
              tableOptions={tableOptions}
              staffOptions={staffOptions}
              paymentModeOptions={paymentModeOptions}
              branchSelected={!!selectedBranchId}
            />
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 0 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Cart ({itemCount})
              </Typography>
              <PosCartList name="items" itemOptions={itemOptions} />
            </Box>
            <Stack direction="row" spacing={1}>
              <Field.Text
                name="taxPercentage"
                placeholder="Tax %"
                type="number"
                slotProps={{
                  input: { inputProps: { min: 0, max: 100, step: 0.5 } },
                }}
                size="small"
              />
              <Field.Text
                name="discountPercentage"
                placeholder="Disc %"
                type="number"
                slotProps={{
                  input: { inputProps: { min: 0, max: 100, step: 0.5 } },
                }}
                size="small"
              />
            </Stack>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2">
                    {fCurrency(subtotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Stack>
                {(calculatedTax > 0 || taxPercentage) && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tax {taxPercentage != null ? `${taxPercentage}%` : ''}
                    </Typography>
                    <Typography variant="body2">
                      {fCurrency(calculatedTax, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Stack>
                )}
                {(calculatedDiscount > 0 || discountPercentage) && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Discount {discountPercentage != null ? `${discountPercentage}%` : ''}
                    </Typography>
                    <Typography variant="body2">
                      -{fCurrency(calculatedDiscount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Grand total
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    {fCurrency(grandTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
         
            <Field.Text
              name="notes"
              placeholder="Order notes (optional)"
              size="small"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>
        </Card>
      </Box>
  );
}

// ----------------------------------------------------------------------

export function PosOrderView() {
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const isSubmittingRef = useRef(false);

  const { data: branchesDropdown } = useGetBranchesDropdownQuery();
  const { data: staffDropdown } = useGetStaffDropdownQuery();
  const { data: orderTypesDropdown } = useGetOrderTypesDropdownQuery();

  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  const staffOptions = useMemo(() => {
    if (!staffDropdown || !Array.isArray(staffDropdown)) return [];
    return staffDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [staffDropdown]);

  const orderTypeOptions = useMemo(() => {
    if (!orderTypesDropdown || !Array.isArray(orderTypesDropdown)) return [];
    return orderTypesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [orderTypesDropdown]);

  const methods = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedItemsForSubmit = useWatch({ control: methods.control, name: 'items', defaultValue: [] });
  const hasCartItems = (watchedItemsForSubmit?.length ?? 0) > 0;

  const onSubmit = methods.handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    if (!data.items || data.items.length === 0) {
      toast.error('Add at least one item to the order');
      return;
    }
    isSubmittingRef.current = true;
    try {
      const subtotal = data.items.reduce((sum, item) => {
        const q = Number(item.quantity) || 0;
        const p = Number(item.unitPrice) || 0;
        return sum + q * p;
      }, 0);
      const taxPct = data.taxPercentage != null ? Number(data.taxPercentage) : null;
      const discPct = data.discountPercentage != null ? Number(data.discountPercentage) : null;
      const calculatedTax = taxPct != null && taxPct > 0 ? subtotal * (taxPct / 100) : Number(data.taxAmount) || 0;
      const calculatedDiscount =
        discPct != null && discPct > 0 ? subtotal * (discPct / 100) : Number(data.discountAmount) || 0;

      const transformedItems = data.items.map((item) => ({
        itemId: typeof item.itemId === 'object' && item.itemId !== null ? item.itemId.id : item.itemId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        notes: item.notes === '' ? null : item.notes,
      }));
      const createData = {
        branchId: typeof data.branchId === 'object' && data.branchId !== null ? data.branchId.id : data.branchId,
        orderTypeId:
          typeof data.orderTypeId === 'object' && data.orderTypeId !== null ? data.orderTypeId.id : data.orderTypeId,
        paymentModeId:
          typeof data.paymentModeId === 'object' && data.paymentModeId !== null ? data.paymentModeId.id : data.paymentModeId ?? null,
        staffId: typeof data.staffId === 'object' && data.staffId !== null ? data.staffId.id : data.staffId ?? null,
        tableId: typeof data.tableId === 'object' && data.tableId !== null ? data.tableId.id : data.tableId ?? null,
        kitchenId: typeof data.kitchenId === 'object' && data.kitchenId !== null ? data.kitchenId.id : data.kitchenId ?? null,
        items: transformedItems,
        deliveryDetails: null,
        taxAmount: calculatedTax,
        taxPercentage: taxPct ?? null,
        discountAmount: calculatedDiscount,
        discountPercentage: discPct ?? null,
        notes: data.notes === '' ? null : data.notes,
      };
      await createOrder(createData).unwrap();
      toast.success('Order saved');
      methods.reset(defaultValues);
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, { defaultMessage: 'Failed to save order' });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => onSubmit() },
        });
      } else {
        toast.error(message);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  });

  const handleSearchClear = useCallback(() => {
    methods.setValue('searchTerm', '');
  }, [methods]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', p: 2 }}>
      <FormProvider {...methods}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            mb: 2,
            flexShrink: 0,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ p: 2, flexWrap: 'wrap' }}
          >
            <Field.Text
              name="searchTerm"
              size="small"
              placeholder="Search product"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment:
                    methods.watch('searchTerm') && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleSearchClear}
                          sx={{ minWidth: 'auto', minHeight: 'auto', p: 0.5 }}
                          aria-label="Clear search"
                        >
                          <Iconify icon="eva:close-fill" />
                        </IconButton>
                      </InputAdornment>
                    ),
                },
              }}
              sx={{ minWidth: 220, flex: 1, maxWidth: 400 }}
            />
            <Field.Button
              component={Link}
              href={paths.tenant.orders.list}
              variant="outlined"
              sx={{ ml: 'auto', flexShrink: 0 }}
            >
              Order list
            </Field.Button>
          </Stack>
        </Card>

        <Form methods={methods} onSubmit={onSubmit}>
          <PosOrderContent
            branchOptions={branchOptions}
            orderTypeOptions={orderTypeOptions}
            staffOptions={staffOptions}
          />
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 2,
              flexShrink: 0,
              mt: 2,
            }}
          >
            <Field.Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              loading={isCreating}
              disabled={isCreating || !hasCartItems}
              startIcon="solar:check-circle-bold"
              sx={{ minHeight: 48 }}
            >
              Save order
            </Field.Button>
          </Card>
        </Form>
      </FormProvider>
    </Box>
  );
}
