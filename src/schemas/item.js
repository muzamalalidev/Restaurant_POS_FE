import { z as zod } from 'zod';

import {
  requiredId,
  optionalUrl,
  booleanField,
  requiredString,
  optionalString,
  numberFromInput,
  requiredNumberOption,
  optionalNumberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createItemSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  categoryId: requiredId('Category is required', 'Invalid category ID'),
  name: requiredString('Name is required', 200, { trim: true }),
  description: optionalString(1000),
  itemType: requiredNumberOption(
    'Item type is required',
    'Item type must be 1, 2, 3, or 4',
    1,
    4
  ),
  price: numberFromInput({ nonnegative: true, emptyAs: 0 }),
  imageUrl: optionalUrl('Invalid URL format'),
  isActive: booleanField(undefined),
  stockQuantity: numberFromInput({ nonnegative: true, emptyAs: 0 }).optional(),
});

export const updateItemSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  categoryId: requiredId('Category is required', 'Invalid category ID'),
  name: requiredString('Name is required', 200, { trim: true }),
  description: optionalString(1000),
  itemType: requiredNumberOption(
    'Item type is required',
    'Item type must be 1, 2, 3, or 4',
    1,
    4
  ),
  price: numberFromInput({ nonnegative: true, emptyAs: 0 }),
  imageUrl: optionalUrl('Invalid URL format'),
  isActive: zod.boolean(),
  isAvailable: zod.boolean(),
  stockQuantity: optionalNumberFromInput({ nonnegative: true }),
});
