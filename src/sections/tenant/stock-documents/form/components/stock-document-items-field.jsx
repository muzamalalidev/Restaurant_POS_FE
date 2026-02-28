'use client';

import { useMemo, useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { CustomTable } from 'src/components/custom-table';

// ----------------------------------------------------------------------

/**
 * Stock Document Items Field Component
 * 
 * Manages an array of stock document items with add/remove, validation, and subtotal calculation.
 */
export function StockDocumentItemsField({ name = 'items', itemOptions = [] }) {
  const { control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const watchedItems = watch(name);
  const items = useMemo(
    () => (watchedItems && Array.isArray(watchedItems) ? watchedItems : []),
    [watchedItems]
  );

  // Calculate subtotal for each item
  const calculateSubtotal = useCallback((index) => {
    const item = items[index];
    if (!item) return 0;
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return quantity * unitPrice;
  }, [items]);

  // Calculate total subtotal
  const totalSubtotal = useMemo(() => items.reduce((sum, _, index) => sum + calculateSubtotal(index), 0), [items, calculateSubtotal]);

  // Handle add item
  const handleAdd = useCallback(() => {
    const newItem = {
      itemId: null,
      quantity: 1,
      unitPrice: null,
      remarks: null,
    };
    append(newItem);
  }, [append]);

  // Handle remove item
  const handleRemove = useCallback(
    (index) => {
      if (fields.length > 1) {
        remove(index);
      }
    },
    [remove, fields.length]
  );

  // Handle item selection - auto-fill unit price
  const handleItemChange = useCallback(
    (index, selectedItem) => {
      if (selectedItem && selectedItem.price !== undefined) {
        setValue(`${name}.${index}.unitPrice`, selectedItem.price, { shouldValidate: true });
      }
    },
    [setValue, name]
  );

  // Filter items to active and available only
  const filteredItemOptions = useMemo(() => itemOptions.filter((item) => item.isActive && item.isAvailable), [itemOptions]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">Document Items</Typography>
        <Field.Button
          size="small"
          variant="outlined"
          startIcon="mingcute:add-line"
          onClick={handleAdd}
          sx={{ minHeight: 44 }}
        >
          Add Item
        </Field.Button>
      </Box>

      {fields.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No items added. Click &quot;Add Item&quot; to add items to this document.
          </Typography>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CustomTable
            rows={fields.map((field, index) => ({
              id: field.id,
              index,
              itemId: items[index]?.itemId || null,
              quantity: items[index]?.quantity || 1,
              unitPrice: items[index]?.unitPrice ?? null,
              remarks: items[index]?.remarks || null,
              subtotal: calculateSubtotal(index),
            }))}
            columns={[
              {
                field: 'itemId',
                headerName: 'Item',
                flex: 2,
                renderCell: (params) => (
                  <Field.Autocomplete
                    name={`${name}.${params.row.index}.itemId`}
                    options={filteredItemOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      if (typeof option === 'string') {
                        const found = filteredItemOptions.find((opt) => opt.id === option);
                        return found?.name || '';
                      }
                      return option.name || option.label || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      const optionId = typeof option === 'object' ? option.id : option;
                      const valueId = typeof value === 'object' ? value.id : value;
                      return optionId === valueId;
                    }}
                    onChange={(event, newValue) => {
                      setValue(`${name}.${params.row.index}.itemId`, newValue, { shouldValidate: true });
                      handleItemChange(params.row.index, newValue);
                    }}
                    slotProps={{
                      textField: {
                        placeholder: 'Select item',
                        size: 'small',
                      },
                    }}
                    required
                    sx={{ flex: 1 }}
                  />
                ),
              },
              {
                field: 'quantity',
                headerName: 'Quantity',
                width: 120,
                renderCell: (params) => (
                  <Field.Text
                    name={`${name}.${params.row.index}.quantity`}
                    type="number"
                    slotProps={{
                      input: {
                        inputProps: { min: 0.01, step: 0.01 },
                        sx: { textAlign: 'right' },
                      },
                      textField: {
                        size: 'small',
                      },
                    }}
                    required
                  />
                ),
              },
              {
                field: 'unitPrice',
                headerName: 'Unit Price',
                width: 120,
                renderCell: (params) => (
                  <Field.Text
                    name={`${name}.${params.row.index}.unitPrice`}
                    type="number"
                    slotProps={{
                      input: {
                        inputProps: { min: 0, step: 0.01 },
                        sx: { textAlign: 'right' },
                      },
                      textField: {
                        size: 'small',
                        placeholder: 'Optional',
                      },
                    }}
                  />
                ),
              },
              {
                field: 'subtotal',
                headerName: 'Subtotal',
                width: 120,
                renderCell: (params) => (
                  <Typography variant="body2" sx={{ fontWeight: 600, width: '100%', textAlign: 'right' }}>
                    {fCurrency(params.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                ),
              },
              {
                field: 'remarks',
                headerName: 'Remarks',
                flex: 1,
                renderCell: (params) => (
                  <Field.Text
                    name={`${name}.${params.row.index}.remarks`}
                    placeholder="Item remarks (optional)"
                    size="small"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                ),
              },
              {
                field: 'actions',
                headerName: '',
                width: 60,
                renderCell: (params) => (
                  fields.length > 1 ? (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemove(params.row.index)}
                      sx={{ minHeight: 44, minWidth: 44 }}
                    >
                      <Iconify icon="mingcute:delete-line" />
                    </IconButton>
                  ) : null
                ),
              },
            ]}
            pagination={false}
            toolbar={false}
            hideFooter
            getRowId={(row) => row.id}
          />

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Typography variant="subtitle2">Total Subtotal:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {fCurrency(totalSubtotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Stack>
          </Box>
        </Card>
      )}
    </Box>
  );
}

