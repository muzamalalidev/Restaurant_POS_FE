import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * ItemType enum values
 */
const ItemTypeEnum = zod.enum([1, 2, 3, 4], {
  errorMap: () => ({ message: 'Item type must be 1 (Direct Sale), 2 (Recipe Based), 3 (Add On), or 4 (Deal)' }),
});

// ----------------------------------------------------------------------

/**
 * Create item schema
 * P2-001: name is trimmed before validation to reject whitespace-only.
 */
export const createItemSchema = zod.object({
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
  categoryId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid category ID')
  ),
  name: zod.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    zod.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less')
  ),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  itemType: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().int().min(1).max(4, 'Item type must be 1, 2, 3, or 4')
  ),
  price: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Price must be non-negative')
  ),
  imageUrl: zod
    .string()
    .url('Invalid URL format')
    .nullable()
    .optional()
    .or(zod.literal('')),
  isActive: zod.boolean().optional(),
  stockQuantity: zod.preprocess(
    (val) => {
      // Convert string to number if needed, handle empty string
      if (val === '' || val === null || val === undefined) {
        return 0;
      }
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Stock quantity must be non-negative').optional()
  ),
});

// ----------------------------------------------------------------------

/**
 * Update item schema
 */
export const updateItemSchema = zod.object({
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
  categoryId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid category ID')
  ),
  name: zod.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    zod.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less')
  ),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  itemType: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().int().min(1).max(4, 'Item type must be 1, 2, 3, or 4')
  ),
  price: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Price must be non-negative')
  ),
  imageUrl: zod
    .string()
    .url('Invalid URL format')
    .nullable()
    .optional()
    .or(zod.literal('')),
  isActive: zod.boolean(),
  isAvailable: zod.boolean(),
  stockQuantity: zod.preprocess(
    (val) => {
      // Convert string to number if needed, handle empty string/null (preserves existing)
      if (val === '' || val === null || val === undefined) {
        return null;
      }
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? null : num;
      }
      return val;
    },
    zod.number().nonnegative('Stock quantity must be non-negative').nullable().optional()
  ),
});

