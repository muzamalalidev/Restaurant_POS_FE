import { z as zod } from 'zod';

import {
  optionalId,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createTenantMasterSchema = zod.object({
  name: requiredString('Name is required', 200, { trim: true }),
  description: optionalString(1000),
  ownerId: optionalId('Invalid owner ID'),
});

export const updateTenantMasterSchema = zod.object({
  name: requiredString('Name is required', 200, { trim: true }),
  description: optionalString(1000),
  ownerId: optionalId('Invalid owner ID'),
  isActive: zod.boolean(),
});
