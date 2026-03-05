import { z as zod } from 'zod';

import {
  optionalId,
  booleanField,
  requiredString,
  optionalString,
  numberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createTableSchema = zod.object({
  branchId: optionalId('Invalid branch ID').optional(),
  tableNumber: requiredString('Table number is required', 50),
  capacity: numberFromInput({ positive: true, int: true }),
  location: optionalString(500),
  isAvailable: booleanField(true),
  isActive: booleanField(true),
});

export const updateTableSchema = zod.object({
  branchId: optionalId('Invalid branch ID').optional(),
  tableNumber: requiredString('Table number is required', 50),
  capacity: numberFromInput({ positive: true, int: true }),
  location: optionalString(500),
  isAvailable: zod.boolean(),
  isActive: zod.boolean(),
});
