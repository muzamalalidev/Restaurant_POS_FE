import { z as zod } from 'zod';

import {
  requiredId,
  optionalId,
  booleanField,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createCategorySchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  parentId: optionalId('Invalid parent category ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  isActive: booleanField(undefined),
});

export const updateCategorySchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  parentId: optionalId('Invalid parent category ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  isActive: zod.boolean(),
});
