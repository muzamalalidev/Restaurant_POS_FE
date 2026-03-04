import { z as zod } from 'zod';

import {
  phoneNumberSchema,
  primaryRefineMessage,
  createUpdatePhoneNumberSchema,
} from 'src/schemas/phone';
import {
  optionalId,
  requiredId,
  requiredString,
  optionalString,
  arrayWithAtMostOnePrimary,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

export const createTenantSchema = zod.object({
  tenantMasterId: requiredId('Tenant master is required', 'Invalid tenant master ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  address: optionalString(500),
  city: optionalString(100),
  state: optionalString(100),
  country: optionalString(100),
  postalCode: optionalString(20),
  phoneNumbers: arrayWithAtMostOnePrimary(phoneNumberSchema, primaryRefineMessage),
});

const updatePhoneNumberSchema = createUpdatePhoneNumberSchema({
  idOptional: true,
  parentIdKey: 'tenantId',
});

export const updateTenantSchema = zod.object({
  tenantMasterId: optionalId('Invalid tenant master ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  address: optionalString(500),
  city: optionalString(100),
  state: optionalString(100),
  country: optionalString(100),
  postalCode: optionalString(20),
  ownerId: optionalId('Invalid owner ID'),
  isActive: zod.boolean(),
  phoneNumbers: arrayWithAtMostOnePrimary(updatePhoneNumberSchema, primaryRefineMessage),
});
