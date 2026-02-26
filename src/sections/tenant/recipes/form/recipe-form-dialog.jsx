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
import { QueryStateContent } from 'src/components/query-state-content';
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
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * Note: GetById endpoint is a placeholder, so we use getAllRecipes with large pageSize
 * and client-side filtering by ID to get recipe data for edit mode.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.recipeId - Recipe ID for edit mode
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 */
export function RecipeFormDialog({ open, mode, recipeId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // P0-003/P1-001: pageSize 200; getRecipeById is placeholder – find by ID may miss recipe if total > pageSize
  const { data: recipesResponse, isLoading: isLoadingRecipe, error: queryError, isError: _isError, refetch: refetchRecipe } = useGetAllRecipesQuery(
    { pageSize: 200 },
    { skip: !recipeId || mode !== 'edit' || !open }
  );

  // Fetch items for item selector (P0-003: limit 200)
  const { data: itemsResponse, isLoading: isLoadingItems } = useGetItemsQuery(
    { pageSize: 200 },
    { skip: !open }
  );

  // Recipes to check which items already have recipes (create mode) (P0-003: limit 200)
  const { data: allRecipesResponse } = useGetAllRecipesQuery(
    { pageSize: 200 },
    { skip: mode !== 'create' || !open }
  );

  // Find the recipe by ID from the response
  const recipeData = useMemo(() => {
    if (!recipesResponse || !recipeId) return null;
    const recipes = recipesResponse.data || [];
    return recipes.find((recipe) => recipe.id === recipeId) || null;
  }, [recipesResponse, recipeId]);

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
        preparationTimeMinutes: 0,
        cookingTimeMinutes: 0,
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

  // Track if form has been initialized
  const formInitializedRef = useRef(false);
  const previousRecipeIdRef = useRef(null);

  // Load recipe data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
      previousRecipeIdRef.current = null;
      reset({
        itemId: null,
        name: '',
        description: null,
        instructions: null,
        servings: 1,
        preparationTimeMinutes: 0,
        cookingTimeMinutes: 0,
        ingredients: [],
      });
      return;
    }

    const currentRecipeId = mode === 'edit' ? recipeId : 'create';
    const shouldInitialize = !formInitializedRef.current || previousRecipeIdRef.current !== currentRecipeId;

    if (shouldInitialize) {
      if (mode === 'edit' && recipeData) {
        // Find matching item object from itemOptions
        const matchingItem = recipeData.itemId && itemOptions.length > 0
          ? itemOptions.find((item) => item.id === recipeData.itemId)
          : null;

        // Transform ingredients from API format to form format
        const formIngredients = (recipeData.ingredients || []).map((ingredient) => ({
          itemId: allItemOptions.find((item) => item.id === ingredient.itemId) || null,
          quantity: ingredient.quantity || 1,
          notes: ingredient.notes || null,
        }));

        reset({
          itemId: matchingItem || null,
          name: recipeData.name || '',
          description: recipeData.description || null,
          instructions: recipeData.instructions || null,
          servings: recipeData.servings || 1,
          preparationTimeMinutes: recipeData.preparationTimeMinutes || 0,
          cookingTimeMinutes: recipeData.cookingTimeMinutes || 0,
          ingredients: formIngredients,
        });

        formInitializedRef.current = true;
        previousRecipeIdRef.current = currentRecipeId;
      } else if (mode === 'create') {
        reset({
          itemId: null,
          name: '',
          description: null,
          instructions: null,
          servings: 1,
          preparationTimeMinutes: 0,
          cookingTimeMinutes: 0,
          ingredients: [],
        });

        formInitializedRef.current = true;
        previousRecipeIdRef.current = currentRecipeId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, recipeId, recipeData?.id, reset]);

  // Separate effect to update itemId when itemOptions become available in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && recipeData?.itemId && itemOptions.length > 0) {
      const matchingItem = itemOptions.find((item) => item.id === recipeData.itemId);
      if (matchingItem) {
        const currentValue = getValues('itemId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingItem.id) {
          setValue('itemId', matchingItem, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, recipeData?.itemId, itemOptions.length]);

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
        await updateRecipe({ id: recipeId, ...recipePayload }).unwrap();
        if (onSuccess) {
          onSuccess(recipeId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save recipe:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} recipe`,
        notFoundMessage: 'Recipe or item not found',
        validationMessage: 'Validation failed. Please check your input.',
      });
      toast.error(message);
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
        {mode === 'create' ? 'Create' : 'Update'}
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode
  const isLoading = (mode === 'edit' && isLoadingRecipe) || isLoadingItems;
  const hasError = mode === 'edit' && !recipeData && !isLoadingRecipe && recipeId && open;

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
        <QueryStateContent
          isLoading={isLoading}
          isError={hasError}
          error={queryError}
          onRetry={refetchRecipe}
          loadingMessage="Loading recipe data..."
          errorTitle="Failed to load recipe data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load recipe data',
            notFoundMessage: 'Recipe not found or an error occurred.',
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
                  itemOptions={allItemOptions}
                  mode={mode}
                />
              </Box>
            </Box>
          </Form>
        </QueryStateContent>
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

