'use client';

import { useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { getCurrencySymbol } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { CustomTable } from 'src/components/custom-table';

// ----------------------------------------------------------------------

/**
 * Deal Items Field Component
 *
 * Manages an array of deal line items: itemId (from non-Deal items), quantity (>= 1), unitPrice (optional).
 * At least one row required (enforced by schema).
 */
export function DealItemsField({ name = 'items', itemOptions = [], mode = 'create' }) {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const items = watch(name) || [];

  const handleAdd = useCallback(() => {
    append({
      itemId: null,
      quantity: 1,
      unitPrice: null,
    });
  }, [append]);

  const handleRemove = useCallback(
    (index) => {
      remove(index);
    },
    [remove]
  );

  const currencySymbol = getCurrencySymbol();
  const showReplaceWarning = mode === 'edit' && fields.length > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle2">Deal Items</Typography>
          {showReplaceWarning && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
              Note: Modifying items will replace all existing deal items
            </Typography>
          )}
        </Box>
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
            No items added. Click &quot;Add Item&quot; to add at least one item to this deal.
          </Typography>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CustomTable
            rows={fields.map((field, index) => ({
              id: field.id,
              index,
              itemId: items[index]?.itemId ?? null,
              quantity: items[index]?.quantity ?? 1,
              unitPrice: items[index]?.unitPrice ?? null,
            }))}
            columns={[
              {
                field: 'itemId',
                headerName: 'Item',
                flex: 2,
                renderCell: (params) => (
                  <Field.Autocomplete
                    name={`${name}.${params.row.index}.itemId`}
                    options={itemOptions}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      if (typeof option === 'string') {
                        const found = itemOptions.find((opt) => opt.id === option);
                        return found?.name || found?.label || '';
                      }
                      return option.name || option.label || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      const optionId = typeof option === 'object' ? option.id : option;
                      const valueId = typeof value === 'object' ? value.id : value;
                      return optionId === valueId;
                    }}
                    slotProps={{
                      textField: {
                        placeholder: 'Select item',
                        size: 'small',
                      },
                    }}
                    required
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
                        inputProps: { min: 1, step: 1 },
                        sx: { textAlign: 'right' },
                      },
                      textField: {
                        size: 'small',
                        placeholder: '1',
                      },
                    }}
                    required
                  />
                ),
              },
              {
                field: 'unitPrice',
                headerName: `Unit Price (${currencySymbol})`,
                width: 140,
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
                field: 'actions',
                headerName: '',
                width: 60,
                renderCell: (params) => (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(params.row.index)}
                    disabled={fields.length <= 1}
                    sx={{ minHeight: 44, minWidth: 44 }}
                    aria-label="Remove item"
                  >
                    <Iconify icon="mingcute:delete-line" />
                  </IconButton>
                ),
              },
            ]}
            pagination={false}
            toolbar={false}
            hideFooter
            getRowId={(row) => row.id}
          />
        </Card>
      )}
    </Box>
  );
}
