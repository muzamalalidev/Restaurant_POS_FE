import { z as zod } from 'zod';

import {
  requiredId,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createKitchenSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  branchId: requiredId('Branch is required', 'Invalid branch ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  location: optionalString(200),
});

export const updateKitchenSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  branchId: requiredId('Branch is required', 'Invalid branch ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  location: optionalString(200),
  isActive: zod.boolean().optional().default(true),
});
