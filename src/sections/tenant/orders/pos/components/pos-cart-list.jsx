'use client';

import { useMemo, useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const MIN_TOUCH = 44;

/**
 * Lightweight cart list (no DataGrid). Inline qty +/- and remove. 44px targets.
 */
export function PosCartList({ name = 'items', itemOptions = [] }) {
  const { control, watch, setValue } = useFormContext();
  const { fields, append: _append, remove } = useFieldArray({ control, name });
  const watchedItems = watch(name);
  const items = useMemo(
    () => (watchedItems && Array.isArray(watchedItems) ? watchedItems : []),
    [watchedItems]
  );

  const getItemName = useCallback(
    (itemId) => {
      if (!itemId) return 'Unknown';
      const id = typeof itemId === 'object' && itemId !== null ? itemId.id : itemId;
      const opt = itemOptions.find((o) => o.id === id);
      return opt?.name || opt?.label || id || 'Unknown';
    },
    [itemOptions]
  );

  const handleQty = useCallback(
    (index, delta) => {
      const q = Number(items[index]?.quantity) || 1;
      const next = Math.max(1, q + delta);
      setValue(`${name}.${index}.quantity`, next, { shouldValidate: true });
    },
    [items, name, setValue]
  );

  if (fields.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Cart is empty. Tap a product to add.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {fields.map((field, index) => {
        const item = items[index];
        const quantity = Number(item?.quantity) || 1;
        const unitPrice = Number(item?.unitPrice) || 0;
        const lineTotal = quantity * unitPrice;
        const itemName = getItemName(item?.itemId);
        return (
          <Box
            key={field.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 1.5,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {itemName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fCurrency(unitPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                each
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => handleQty(index, -1)}
                sx={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH }}
                aria-label="Decrease quantity"
              >
                <Iconify icon="mingcute:minimize-line" />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                {quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleQty(index, 1)}
                sx={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH }}
                aria-label="Increase quantity"
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Stack>
            <Typography variant="subtitle2" sx={{ minWidth: 56, textAlign: 'right' }}>
              {fCurrency(lineTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={() => remove(index)}
              sx={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH }}
              aria-label="Remove item"
            >
              <Iconify icon="mingcute:delete-line" />
            </IconButton>
          </Box>
        );
      })}
    </Stack>
  );
}
