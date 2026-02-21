import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Helper to preprocess object to ID string
 */
const preprocessId = (val) => {
  // If it's an object with an id property, extract the id
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return val.id;
  }
  // Otherwise, use the value as-is (should be a string UUID)
  return val;
};

// ----------------------------------------------------------------------

/**
 * Create kitchen schema
 */
export const createKitchenSchema = zod.object({
  tenantId: zod.preprocess(
    preprocessId,
    zod.string().uuid('Invalid tenant ID')
  ),
  branchId: zod.preprocess(
    preprocessId,
    zod.string().uuid('Invalid branch ID')
  ),
  name: zod.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters'),
  description: zod.string().max(1000, 'Description must not exceed 1000 characters').nullable().optional(),
  location: zod.string().max(200, 'Location must not exceed 200 characters').nullable().optional(),
});

// ----------------------------------------------------------------------

/**
 * Update kitchen schema
 */
export const updateKitchenSchema = zod.object({
  tenantId: zod.preprocess(
    preprocessId,
    zod.string().uuid('Invalid tenant ID')
  ),
  branchId: zod.preprocess(
    preprocessId,
    zod.string().uuid('Invalid branch ID')
  ),
  name: zod.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters'),
  description: zod.string().max(1000, 'Description must not exceed 1000 characters').nullable().optional(),
  location: zod.string().max(200, 'Location must not exceed 200 characters').nullable().optional(),
  isActive: zod.boolean().optional().default(true),
});

