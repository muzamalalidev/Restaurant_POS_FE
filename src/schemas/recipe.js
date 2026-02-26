import { z as zod } from 'zod';

import {
  requiredId,
  requiredString,
  optionalString,
  numberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const recipeIngredientSchema = zod.object({
  itemId: requiredId('Item is required', 'Invalid item ID'),
  quantity: numberFromInput({ positive: true }),
  notes: optionalString(500),
});

// ----------------------------------------------------------------------

export const createRecipeSchema = zod.object({
  itemId: requiredId('Item is required', 'Invalid item ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  instructions: optionalString(5000),
  servings: numberFromInput({ positive: true, int: true, emptyAs: 1 }).optional().default(1),
  preparationTimeMinutes: numberFromInput({ min: 0 }),
  cookingTimeMinutes: numberFromInput({ min: 0 }),
  ingredients: zod.array(recipeIngredientSchema).optional().default([]),
});

export const updateRecipeSchema = zod.object({
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  instructions: optionalString(5000),
  servings: numberFromInput({ positive: true, int: true, emptyAs: 1 }).optional().default(1),
  preparationTimeMinutes: numberFromInput({ min: 0 }),
  cookingTimeMinutes: numberFromInput({ min: 0 }),
  ingredients: zod.array(recipeIngredientSchema).optional().default([]),
});
