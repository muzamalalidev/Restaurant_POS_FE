import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Create table schema
 */
export const createTableSchema = zod.object({
  branchId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid branch ID')
  ),
  tableNumber: zod.string().min(1, 'Table number is required').max(50, 'Table number must be at most 50 characters'),
  capacity: zod.number().int().positive('Capacity must be a positive integer'),
  location: zod.string().max(500, 'Location must be at most 500 characters').nullable().optional(),
  isAvailable: zod.boolean().optional().default(true),
  isActive: zod.boolean().optional().default(true),
});

// ----------------------------------------------------------------------

/**
 * Update table schema
 */
export const updateTableSchema = createTableSchema;

