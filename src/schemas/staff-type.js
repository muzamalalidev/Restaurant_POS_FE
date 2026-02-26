import { z as zod } from 'zod';

import {
  booleanField,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

const nameWithTrim = () => requiredString('Name is required', 200, { trim: true });

export const createStaffTypeSchema = zod.object({
  name: nameWithTrim(),
  description: optionalString(1000),
  isActive: booleanField(undefined),
});

export const updateStaffTypeSchema = zod.object({
  name: nameWithTrim(),
  description: optionalString(1000),
  isActive: zod.boolean(),
});
