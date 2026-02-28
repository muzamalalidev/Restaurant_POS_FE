'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetItemsQuery } from 'src/store/api/items-api';
import { createRecipeSchema, updateRecipeSchema } from 'src/schemas';
import { useGetAllRecipesQuery, useCreateRecipeMutation, useUpdateRecipeMutation } from 'src/store/api/recipes-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { RecipeIngredientsField } from './components/recipe-ingredients-field';

// ----------------------------------------------------------------------

/**
 * Helper function to extract ID from object or string
 */
const _getId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return value.id;
  }
  return value;
};

// ----------------------------------------------------------------------

/**
 * Recipe Form Dialog Component
 *
 * Single dialog for create and edit. Edit mode uses record from list (no getById).
 *
 * Dropdown analysis:
 * - itemId (create only): API (useGetItemsQuery, RecipeBased items excluding those with recipes). Not shown in edit.
 * - ingredients[].itemId: API (useGetItemsQuery, all active/available items). Synthetic options used in edit when ingredient item not yet in options.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {Object|null} props.record - Full recipe object for edit mode (from list)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function RecipeFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Fetch items for item selector and ingredients (P0-003: limit 200)
  const { data: itemsResponse, isLoading: isLoadingItems } = useGetItemsQuery(
    { pageSize: 200 },
    { skip: !open }
  );

  // Recipes to check which items already have recipes (create mode only)
  const { data: allRecipesResponse } = useGetAllRecipesQuery(
    { pageSize: 200 },
    { skip: mode !== 'create' || !open }
  );

  // Get items that are RecipeBased (itemType = 2)
  const recipeBasedItems = useMemo(() => {
    if (!itemsResponse) return [];
    const items = itemsResponse.data || [];
    return items.filter((item) => item.itemType === 2);
  }, [itemsResponse]);

  // Get items that already have recipes (for create mode filtering)
  const itemsWithRecipes = useMemo(() => {
    if (!allRecipesResponse) return new Set();
    const recipes = allRecipesResponse.data || [];
    return new Set(recipes.map((recipe) => recipe.itemId));
  }, [allRecipesResponse]);

  // Item options for create mode (exclude items that already have recipes)
  const createModeItemOptions = useMemo(() => recipeBasedItems.filter((item) => !itemsWithRecipes.has(item.id)), [recipeBasedItems, itemsWithRecipes]);

  // Item options for edit mode (include all RecipeBased items, but current item's recipe is allowed)
  const editModeItemOptions = useMemo(() => recipeBasedItems, [recipeBasedItems]);

  // Item options based on mode
  const itemOptions = mode === 'create' ? createModeItemOptions : editModeItemOptions;

  // All items for ingredients selector (not just RecipeBased)
  const allItemOptions = useMemo(() => {
    if (!itemsResponse) return [];
    const items = itemsResponse.data || [];
    return items.filter((item) => item.isActive && item.isAvailable);
  }, [itemsResponse]);

  // Effective item options for ingredients: include synthetics for record.ingredients not yet in allItemOptions (edit mode)
  const effectiveAllItemOptions = useMemo(() => {
    if (mode !== 'edit' || !record?.ingredients?.length) return allItemOptions;
    const idsInOptions = new Set(allItemOptions.map((o) => o.id));
    const synthetics = record.ingredients
      .filter((ing) => ing.itemId && !idsInOptions.has(ing.itemId))
      .map((ing) => ({
        id: ing.itemId,
        name: ing.itemName || ing.itemId,
        isActive: true,
        isAvailable: true,
      }));
    if (synthetics.length === 0) return allItemOptions;
    return [...allItemOptions, ...synthetics];
  }, [mode, record?.ingredients, allItemOptions]);

  // Mutations
  const [createRecipe, { isLoading: isCreating }] = useCreateRecipeMutation();
  const [updateRecipe, { isLoading: isUpdating }] = useUpdateRecipeMutation();

  const isSubmitting = isCreating || isUpdating;
  // P0-002: Ref guard to prevent double-submit (state updates async)
  const isSubmittingRef = useRef(false);

  // Determine schema based on mode
  const schema = mode === 'create' ? createRecipeSchema : updateRecipeSchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        itemId: null,
        name: '',
        description: null,
        instructions: null,
        servings: 1,
        preparationTimeMinutes: null,
        cookingTimeMinutes: null,
        ingredients: [],
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { isDirty },
  } = methods;

  // Watch name, description, instructions for character counters
  const watchedName = watch('name');
  const watchedDescription = watch('description');
  const watchedInstructions = watch('instructions');

  // Load recipe data for edit mode from record or reset for create/close
  useEffect(() => {
    if (!open) {
      reset({
        itemId: null,
        name: '',
        description: null,
        instructions: null,
        servings: 1,
        preparationTimeMinutes: null,
        cookingTimeMinutes: null,
        ingredients: [],
      });
      return;
    }

    if (mode === 'edit' && record) {
      const matchingItem =
        record.itemId && itemOptions.length > 0
          ? itemOptions.find((item) => item.id === record.itemId)
          : null;
      const itemIdValue = matchingItem || (record.itemId ? { id: record.itemId, name: record.itemName || record.itemId } : null);

      const formIngredients = (record.ingredients || []).map((ingredient) => {
        const matching = effectiveAllItemOptions.find((opt) => opt.id === ingredient.itemId);
        const itemValue =
          matching ||
          (ingredient.itemId
            ? { id: ingredient.itemId, name: ingredient.itemName || ingredient.itemId, isActive: true, isAvailable: true }
            : null);
        return {
          itemId: itemValue,
          quantity: ingredient.quantity || 1,
          notes: ingredient.notes || null,
        };
      });

      reset({
        itemId: itemIdValue,
        name: record.name || '',
        description: record.description || null,
        instructions: record.instructions || null,
        servings: record.servings || 1,
        preparationTimeMinutes: record.preparationTimeMinutes ?? null,
        cookingTimeMinutes: record.cookingTimeMinutes ?? null,
        ingredients: formIngredients.length > 0 ? formIngredients : [],
      });
    } else if (mode === 'edit' && !record) {
      reset({
        itemId: null,
        name: '',
        description: null,
        instructions: null,
        servings: 1,
        preparationTimeMinutes: null,
        cookingTimeMinutes: null,
        ingredients: [],
      });
    } else if (mode === 'create') {
      reset({
        itemId: null,
        name: '',
        description: null,
        instructions: null,
        servings: 1,
        preparationTimeMinutes: null,
        cookingTimeMinutes: null,
        ingredients: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, record?.itemId, record?.name, record?.description, record?.instructions, record?.servings, record?.preparationTimeMinutes, record?.cookingTimeMinutes, record?.ingredients, record?.itemName, itemOptions, effectiveAllItemOptions, reset]);

  // When item options load in edit mode, set itemId to matching option (replaces synthetic; itemId not shown in edit but kept in form state)
  useEffect(() => {
    if (open && mode === 'edit' && record?.itemId && itemOptions.length > 0) {
      const matchingItem = itemOptions.find((item) => item.id === record.itemId);
      if (matchingItem) {
        const currentValue = getValues('itemId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingItem.id) {
          setValue('itemId', matchingItem, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.itemId, itemOptions.length]);

  // Handle form submit (P0-002: ref guard blocks rapid double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Extract itemId: if it's an object, get the id; if it's a string, use it directly
      const itemIdValue = typeof data.itemId === 'object' && data.itemId !== null
        ? data.itemId.id
        : data.itemId;

      // Transform ingredients from form format to API format
      const apiIngredients = (data.ingredients || []).map((ingredient) => {
        const ingredientItemId = typeof ingredient.itemId === 'object' && ingredient.itemId !== null
          ? ingredient.itemId.id
          : ingredient.itemId;

        return {
          itemId: ingredientItemId,
          quantity: ingredient.quantity,
          notes: ingredient.notes || null,
        };
      });

      const recipePayload = {
        name: data.name,
        description: data.description || null,
        instructions: data.instructions || null,
        servings: data.servings || 1,
        preparationTimeMinutes: data.preparationTimeMinutes,
        cookingTimeMinutes: data.cookingTimeMinutes,
        ingredients: apiIngredients,
      };

      if (mode === 'create') {
        recipePayload.itemId = itemIdValue;
        const result = await createRecipe(recipePayload).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        await updateRecipe({ id: record.id, ...recipePayload }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} recipe`,
        notFoundMessage: 'Recipe or item not found',
        validationMessage: 'Validation failed. Please check your input.',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => onSubmit({ preventDefault: () => {}, target: { checkValidity: () => true } }), 100);
            },
          },
        });
      } else {
        toast.error(message);
      }
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
        {mode === 'create' ? 'Save' : 'Update'}
      </Field.Button>
    </Box>
  );

  // Loading state: only items load for form (edit uses record; create may need items)
  const isLoading = isLoadingItems;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Recipe' : 'Edit Recipe'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
        slotProps={{
          paper: {
            sx: {
              maxHeight: isMobile ? '100vh' : '90vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Form methods={methods} onSubmit={onSubmit}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                pt: 1,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Recipe Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Recipe Information
                </Typography>
                <Stack spacing={2}>
                  {/* Item (only in create mode) */}
                  {mode === 'create' && (
                    <Field.Autocomplete
                      name="itemId"
                      label="Item"
                      options={itemOptions}
                      required
                      getOptionLabel={(option) => {
                        if (!option) return '';
                        return option.name || option.label || option.id || '';
                      }}
                      isOptionEqualToValue={(option, value) => {
                        if (!option || !value) return option === value;
                        return option.id === value.id;
                      }}
                      slotProps={{
                        textField: {
                          placeholder: 'Select RecipeBased item',
                          helperText: 'Only RecipeBased items without existing recipes are shown',
                        },
                      }}
                    />
                  )}

                  {/* Name */}
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="e.g., Margherita Pizza"
                    required
                    slotProps={{
                      textField: {
                        inputProps: {
                          maxLength: 200,
                        },
                        helperText: watchedName ? `${watchedName.length}/200` : 'Required, max 200 characters',
                      },
                    }}
                  />

                  {/* Description */}
                  <Field.Text
                    name="description"
                    label="Description"
                    placeholder="Recipe description (optional)"
                    multiline
                    rows={3}
                    slotProps={{
                      textField: {
                        inputProps: {
                          maxLength: 1000,
                        },
                        helperText: watchedDescription
                          ? `${watchedDescription.length}/1000`
                          : 'Optional, max 1000 characters',
                      },
                    }}
                  />

                  {/* Instructions */}
                  <Field.Text
                    name="instructions"
                    label="Instructions"
                    placeholder="Cooking instructions (optional)"
                    multiline
                    rows={5}
                    slotProps={{
                      textField: {
                        inputProps: {
                          maxLength: 5000,
                        },
                        helperText: watchedInstructions
                          ? `${watchedInstructions.length}/5000`
                          : 'Optional, max 5000 characters',
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Recipe Details Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Recipe Details
                </Typography>
                <Stack spacing={2}>
                  {/* Servings */}
                  <Field.NumberInput
                    name="servings"
                    label="Servings"
                    placeholder="Number of servings"
                    slotProps={{
                      input: {
                        inputProps: {
                          min: 1,
                        },
                      },
                    }}
                  />

                  {/* Preparation Time */}
                  <Field.Text
                    name="preparationTimeMinutes"
                    label="Preparation Time (minutes)"
                    type="number"
                    required
                    slotProps={{
                      input: {
                        inputProps: {
                          min: 0,
                          step: 0.01,
                        },
                      },
                      textField: {
                        placeholder: '0.00',
                        helperText: 'Required, in minutes (decimal allowed)',
                      },
                    }}
                  />

                  {/* Cooking Time */}
                  <Field.Text
                    name="cookingTimeMinutes"
                    label="Cooking Time (minutes)"
                    type="number"
                    required
                    slotProps={{
                      input: {
                        inputProps: {
                          min: 0,
                          step: 0.01,
                        },
                      },
                      textField: {
                        placeholder: '0.00',
                        helperText: 'Required, in minutes (decimal allowed)',
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Ingredients Section */}
              <Box>
                <RecipeIngredientsField
                  name="ingredients"
                  itemOptions={effectiveAllItemOptions}
                  mode={mode}
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

