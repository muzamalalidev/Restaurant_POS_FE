import { z as zod } from 'zod';

import {
  phoneNumberSchema,
  primaryRefineMessage,
  createUpdatePhoneNumberSchema,
} from 'src/schemas/phone';
import {
  requiredId,
  requiredString,
  optionalString,
  arrayWithAtMostOnePrimary,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createBranchSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  name: requiredString('Name is required', 200),
  address: optionalString(1000),
  phoneNumbers: arrayWithAtMostOnePrimary(phoneNumberSchema, primaryRefineMessage),
  ownerFirstName: requiredString('Owner first name is required', 200),
  ownerLastName: requiredString('Owner last name is required', 200),
  ownerEmail: zod
    .union([
      zod.string().email('Please enter a valid email address').max(255),
      zod.literal(''),
      zod.null(),
    ])
    .optional(),
  ownerPhones: arrayWithAtMostOnePrimary(phoneNumberSchema, primaryRefineMessage).optional(),
});

const updatePhoneNumberSchema = createUpdatePhoneNumberSchema({
  idOptional: true,
  parentIdKey: 'branchId',
});

export const updateBranchSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  name: requiredString('Name is required', 200),
  address: optionalString(1000),
  isActive: zod.boolean(),
  phoneNumbers: arrayWithAtMostOnePrimary(updatePhoneNumberSchema, primaryRefineMessage),
});
