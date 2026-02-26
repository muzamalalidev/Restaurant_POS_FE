import { z as zod } from 'zod';

import {
  phoneNumberSchema,
  primaryRefineMessage,
  createUpdatePhoneNumberSchema,
} from 'src/schemas/phone';
import {
  optionalId,
  requiredString,
  optionalString,
  arrayWithAtMostOnePrimary,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createTenantSchema = zod.object({
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  phoneNumbers: arrayWithAtMostOnePrimary(phoneNumberSchema, primaryRefineMessage),
});

const updatePhoneNumberSchema = createUpdatePhoneNumberSchema({
  idOptional: true,
  parentIdKey: 'tenantId',
});

export const updateTenantSchema = zod.object({
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  ownerId: optionalId('Invalid owner ID'),
  isActive: zod.boolean(),
  phoneNumbers: arrayWithAtMostOnePrimary(updatePhoneNumberSchema, primaryRefineMessage),
});
