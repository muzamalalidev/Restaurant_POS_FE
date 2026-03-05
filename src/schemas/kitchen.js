import { z as zod } from 'zod';

import {
  optionalId,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createKitchenSchema = zod.object({
  tenantId: optionalId('Invalid tenant ID').optional(),
  branchId: optionalId('Invalid branch ID').optional(),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  location: optionalString(200),
});

export const updateKitchenSchema = zod.object({
  tenantId: optionalId('Invalid tenant ID').optional(),
  branchId: optionalId('Invalid branch ID').optional(),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  location: optionalString(200),
  isActive: zod.boolean().optional().default(true),
});
