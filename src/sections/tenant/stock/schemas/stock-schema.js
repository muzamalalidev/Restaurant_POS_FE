import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Update stock schema
 */
export const updateStockSchema = zod.object({
  stockQuantity: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Stock quantity must be non-negative')
  ),
});

// ----------------------------------------------------------------------

/**
 * Adjust stock schema
 */
export const adjustStockSchema = zod.object({
  adjustmentQuantity: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number('Adjustment quantity must be a valid number').refine((n) => n !== 0, 'Adjustment must not be zero')
  ),
  reason: zod
    .string()
    .nullable()
    .optional()
    .or(zod.literal('')),
});

// ----------------------------------------------------------------------

/**
 * Check availability schema
 */
export const checkAvailabilitySchema = zod.object({
  items: zod.array(
    zod.object({
      itemId: zod.string().uuid('Item ID must be a valid GUID'),
      quantity: zod.preprocess(
        (val) => {
          // Convert string to number if needed
          if (typeof val === 'string') {
            const num = Number(val);
            return isNaN(num) ? val : num;
          }
          return val;
        },
        zod.number().positive('Quantity must be positive')
      ),
    })
  ).min(1, 'At least one item is required'),
});

