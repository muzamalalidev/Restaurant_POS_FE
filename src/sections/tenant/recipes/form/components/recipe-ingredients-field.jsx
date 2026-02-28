'use client';

import { useMemo, useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { CustomTable } from 'src/components/custom-table';

// ----------------------------------------------------------------------

/**
 * Recipe Ingredients Field Component
 * 
 * Manages an array of recipe ingredients with add/remove, validation.
 * Each ingredient has: itemId, quantity, and optional notes.
 */
export function RecipeIngredientsField({ name = 'ingredients', itemOptions = [], mode = 'create' }) {
  const { control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const ingredients = watch(name) || [];

  // Handle add ingredient
  const handleAdd = useCallback(() => {
    const newIngredient = {
      itemId: null,
      quantity: 1,
      notes: null,
    };
    append(newIngredient);
  }, [append]);

  // Handle remove ingredient
  const handleRemove = useCallback(
    (index) => {
      remove(index);
    },
    [remove]
  );

  // Filter items to active and available only
  const filteredItemOptions = useMemo(() => itemOptions.filter((item) => item.isActive && item.isAvailable), [itemOptions]);

  // Show warning for update mode that ingredients will be replaced
  const showReplaceWarning = mode === 'edit' && fields.length > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle2">Ingredients</Typography>
          {showReplaceWarning && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
              Note: Modifying ingredients will replace all existing ingredients
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
          Add Ingredient
        </Field.Button>
      </Box>

      {fields.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No ingredients added. Click &quot;Add Ingredient&quot; to add ingredients to this recipe.
          </Typography>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CustomTable
            rows={fields.map((field, index) => ({
              id: field.id,
              index,
              itemId: ingredients[index]?.itemId || null,
              quantity: ingredients[index]?.quantity || 1,
              notes: ingredients[index]?.notes || null,
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
                width: 150,
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
                        placeholder: '0.00',
                      },
                    }}
                    required
                  />
                ),
              },
              {
                field: 'notes',
                headerName: 'Notes',
                flex: 2,
                renderCell: (params) => (
                  <Field.Text
                    name={`${name}.${params.row.index}.notes`}
                    placeholder="Ingredient notes (optional, max 500 chars)"
                    size="small"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          maxLength: 500,
                        },
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
                    sx={{ minHeight: 44, minWidth: 44 }}
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

