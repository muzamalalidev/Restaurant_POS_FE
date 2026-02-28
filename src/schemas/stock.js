import { z as zod } from 'zod';

import {
  requiredId,
  optionalString,
  numberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const updateStockSchema = zod.object({
  stockQuantity: numberFromInput({ nonnegative: true, emptyAs: 0 }),
});

export const adjustStockSchema = zod.object({
  adjustmentQuantity: numberFromInput({}).refine((n) => n !== 0, 'Adjustment must not be zero'),
  reason: optionalString(2000),
});

const checkAvailabilityItemSchema = zod.object({
  itemId: requiredId('Item is required', 'Item ID must be a valid GUID'),
  quantity: numberFromInput({ positive: true }),
});

export const checkAvailabilitySchema = zod.object({
  items: zod
    .array(checkAvailabilityItemSchema)
    .min(1, 'At least one item is required'),
});
