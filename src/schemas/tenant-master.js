import { z as zod } from 'zod';

import {
  phoneNumberSchema,
  primaryRefineMessage,
} from 'src/schemas/phone';
import {
  optionalId,
  requiredString,
  optionalString,
  arrayWithAtMostOnePrimary,
} from 'src/schemas/fields';

// Import email and password schemas from user schema
const emailSchema = zod
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be 255 characters or less');

const passwordSchema = zod
  .string()
  .min(6, 'Password must be at least 6 characters')
  .refine(
    (val) => /[0-9]/.test(val),
    'Password must contain at least one digit'
  )
  .refine(
    (val) => /[a-z]/.test(val),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (val) => /[A-Z]/.test(val),
    'Password must contain at least one uppercase letter'
  );

// ----------------------------------------------------------------------

export const createTenantMasterSchema = zod.object({
  name: requiredString('Name is required', 200, { trim: true }),
  description: optionalString(1000),
  ownerFirstName: requiredString('Owner first name is required', 200, { trim: true }),
  ownerLastName: requiredString('Owner last name is required', 200, { trim: true }),
  ownerEmail: emailSchema,
  ownerPassword: passwordSchema,
  ownerPhones: arrayWithAtMostOnePrimary(phoneNumberSchema, primaryRefineMessage).optional(),
});

export const updateTenantMasterSchema = zod.object({
  name: requiredString('Name is required', 200, { trim: true }),
  description: optionalString(1000),
  ownerId: optionalId('Invalid owner ID'),
  isActive: zod.boolean(),
});
