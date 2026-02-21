import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Create category schema
 */
export const createCategorySchema = zod.object({
  tenantId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid tenant ID')
  ),
  parentId: zod.preprocess(
    (val) => {
      // If it's null or undefined, return null
      if (val === null || val === undefined || val === '') {
        return null;
      }
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID or null)
      return val;
    },
    zod.string().uuid('Invalid parent category ID').nullable().optional()
  ),
  name: zod
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  isActive: zod.boolean().optional(),
});

// ----------------------------------------------------------------------

/**
 * Update category schema
 */
export const updateCategorySchema = zod.object({
  tenantId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid tenant ID')
  ),
  parentId: zod.preprocess(
    (val) => {
      // If it's null or undefined, return null
      if (val === null || val === undefined || val === '') {
        return null;
      }
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID or null)
      return val;
    },
    zod.string().uuid('Invalid parent category ID').nullable().optional()
  ),
  name: zod
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  isActive: zod.boolean(),
});

