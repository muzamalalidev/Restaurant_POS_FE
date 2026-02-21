import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Create staff type schema
 */
export const createStaffTypeSchema = zod.object({
  name: zod
    .string()
    .trim() // P2-001 FIX: Reject whitespace-only names
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
  isActive: zod.boolean().optional(),
});

// ----------------------------------------------------------------------

/**
 * Update staff type schema
 */
export const updateStaffTypeSchema = zod.object({
  name: zod
    .string()
    .trim() // P2-001 FIX: Reject whitespace-only names
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  description: zod
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
  isActive: zod.boolean(),
});

