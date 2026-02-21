import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Create staff schema
 */
export const createStaffSchema = zod.object({
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
  staffTypeId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid staff type ID')
  ),
  userId: zod.string().uuid('Invalid user ID').nullable().optional(),
  firstName: zod
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less'),
  lastName: zod
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less'),
  email: zod
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  phone: zod
    .string()
    .max(50, 'Phone must be 50 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  address: zod
    .string()
    .max(1000, 'Address must be 1000 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  hireDate: zod.preprocess(
    (val) => {
      // If it's already a Date object, return it
      if (val instanceof Date) {
        return val;
      }
      // If it's null or undefined, return null
      if (val === null || val === undefined || val === '') {
        return null;
      }
      // If it's a string, try to convert it to a Date
      if (typeof val === 'string') {
        const date = new Date(val);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Return null for invalid values
      return null;
    },
    zod.date().nullable().optional()
  ),
  isActive: zod.boolean().optional(),
});

// ----------------------------------------------------------------------

/**
 * Update staff schema
 */
export const updateStaffSchema = zod.object({
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
  staffTypeId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Invalid staff type ID')
  ),
  userId: zod.string().uuid('Invalid user ID').nullable().optional(),
  firstName: zod
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less'),
  lastName: zod
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less'),
  email: zod
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  phone: zod
    .string()
    .max(50, 'Phone must be 50 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  address: zod
    .string()
    .max(1000, 'Address must be 1000 characters or less')
    .nullable()
    .optional()
    .or(zod.literal('')),
  hireDate: zod.preprocess(
    (val) => {
      // If it's already a Date object, return it
      if (val instanceof Date) {
        return val;
      }
      // If it's null or undefined, return null
      if (val === null || val === undefined || val === '') {
        return null;
      }
      // If it's a string, try to convert it to a Date
      if (typeof val === 'string') {
        const date = new Date(val);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Return null for invalid values
      return null;
    },
    zod.date().nullable().optional()
  ),
  isActive: zod.boolean(),
});

