import { z as zod } from 'zod';

import {
  requiredId,
  optionalId,
  dateOptional,
  booleanField,
  optionalEmail,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createStaffSchema = zod.object({
  branchId: requiredId('Branch is required', 'Invalid branch ID'),
  staffTypeId: requiredId('Staff type is required', 'Invalid staff type ID'),
  userId: optionalId('Invalid user ID'),
  firstName: requiredString('First name is required', 100),
  lastName: requiredString('Last name is required', 100),
  email: optionalEmail(),
  phone: optionalString(50),
  address: optionalString(1000),
  hireDate: dateOptional(),
  isActive: booleanField(undefined),
});

export const updateStaffSchema = zod.object({
  branchId: requiredId('Branch is required', 'Invalid branch ID'),
  staffTypeId: requiredId('Staff type is required', 'Invalid staff type ID'),
  userId: optionalId('Invalid user ID'),
  firstName: requiredString('First name is required', 100),
  lastName: requiredString('Last name is required', 100),
  email: optionalEmail(),
  phone: optionalString(50),
  address: optionalString(1000),
  hireDate: dateOptional(),
  isActive: zod.boolean(),
});
