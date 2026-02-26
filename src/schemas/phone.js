import { z as zod } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

// ----------------------------------------------------------------------
// Phone number schema (create) - supports branch phoneLabel (1|2|3) and tenant label (string)
// ----------------------------------------------------------------------

export const phoneNumberSchema = zod.object({
  phoneNumber: zod
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhoneNumber(val), 'Please enter a valid phone number'),
  isPrimary: zod.boolean().default(false),
  phoneLabel: zod
    .union([
      zod.literal(1),
      zod.literal(2),
      zod.literal(3),
      zod.null(),
    ])
    .optional(),
  label: zod.string().nullable().optional(),
});

// ----------------------------------------------------------------------
// Refine: at most one primary in array (use with array of phone objects)
// ----------------------------------------------------------------------

export function primaryRefine(phones) {
  if (!phones || phones.length === 0) return true;
  const primaryCount = phones.filter((p) => p && p.isPrimary).length;
  return primaryCount <= 1;
}

export const primaryRefineMessage = 'Only one phone number can be marked as primary';

// ----------------------------------------------------------------------
// Update phone number schema (id, parentId, isActive for edit mode)
// ----------------------------------------------------------------------

/**
 * createUpdatePhoneNumberSchema({ idOptional, parentIdKey })
 * idOptional: true -> id can be uuid or '' (new phones). parentIdKey: 'branchId' | 'tenantId'.
 */
export function createUpdatePhoneNumberSchema({ idOptional = true, parentIdKey = 'branchId' }) {
  const idSchema = idOptional
    ? zod.union([zod.string().uuid('Invalid phone ID'), zod.literal('')])
    : zod.string().uuid('Invalid phone ID');
  const parentSchema = zod.union([
    zod.string().uuid(`Invalid ${parentIdKey}`),
    zod.literal(''),
  ]);

  return phoneNumberSchema.extend({
    id: idSchema,
    [parentIdKey]: parentSchema,
    isActive: zod.boolean(),
  });
}
