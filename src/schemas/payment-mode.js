import { z as zod } from 'zod';

import {
  booleanField,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createPaymentModeSchema = zod.object({
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  isActive: booleanField(true),
});

export const updatePaymentModeSchema = zod.object({
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  isActive: zod.boolean(),
});
