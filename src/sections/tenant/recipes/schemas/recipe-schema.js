import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Recipe ingredient schema
 */
export const recipeIngredientSchema = zod.object({
  itemId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid item ID')
  ),
  quantity: zod
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .positive('Quantity must be greater than 0'),
  notes: zod.string().max(500, 'Notes must not exceed 500 characters').nullable().optional(),
});

// ----------------------------------------------------------------------

/**
 * Create recipe schema
 */
export const createRecipeSchema = zod.object({
  itemId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid item ID')
  ),
  name: zod.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters'),
  description: zod.string().max(1000, 'Description must not exceed 1000 characters').nullable().optional(),
  instructions: zod.string().max(5000, 'Instructions must not exceed 5000 characters').nullable().optional(),
  servings: zod.number().int().min(1, 'Servings must be at least 1').optional().default(1),
  preparationTimeMinutes: zod
    .number({ required_error: 'Preparation time is required', invalid_type_error: 'Preparation time must be a number' })
    .min(0, 'Preparation time must be 0 or greater'),
  cookingTimeMinutes: zod
    .number({ required_error: 'Cooking time is required', invalid_type_error: 'Cooking time must be a number' })
    .min(0, 'Cooking time must be 0 or greater'),
  ingredients: zod.array(recipeIngredientSchema).optional().default([]),
});

// ----------------------------------------------------------------------

/**
 * Update recipe schema
 * Note: itemId is not included as it cannot be changed after creation
 */
export const updateRecipeSchema = zod.object({
  name: zod.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters'),
  description: zod.string().max(1000, 'Description must not exceed 1000 characters').nullable().optional(),
  instructions: zod.string().max(5000, 'Instructions must not exceed 5000 characters').nullable().optional(),
  servings: zod.number().int().min(1, 'Servings must be at least 1').optional().default(1),
  preparationTimeMinutes: zod
    .number({ required_error: 'Preparation time is required', invalid_type_error: 'Preparation time must be a number' })
    .min(0, 'Preparation time must be 0 or greater'),
  cookingTimeMinutes: zod
    .number({ required_error: 'Cooking time is required', invalid_type_error: 'Cooking time must be a number' })
    .min(0, 'Cooking time must be 0 or greater'),
  ingredients: zod.array(recipeIngredientSchema).optional().default([]),
});

