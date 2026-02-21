import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Create tenant master schema
 */
export const createTenantMasterSchema = zod.object({
  name: zod
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .transform((val) => val?.trim()),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  ownerId: zod.preprocess(
    (v) => {
      if (v === '' || v === undefined || v === null) return null;
      if (typeof v === 'object' && v !== null && 'id' in v) return v.id;
      return v;
    },
    zod.string().uuid('Invalid owner ID').nullable()
  ),
});

// ----------------------------------------------------------------------

/**
 * Update tenant master schema
 */
export const updateTenantMasterSchema = zod.object({
  name: zod
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .transform((val) => val?.trim()),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  ownerId: zod.preprocess(
    (v) => {
      if (v === '' || v === undefined || v === null) return null;
      if (typeof v === 'object' && v !== null && 'id' in v) return v.id;
      return v;
    },
    zod.string().uuid('Invalid owner ID').nullable()
  ),
  isActive: zod.boolean(),
});
