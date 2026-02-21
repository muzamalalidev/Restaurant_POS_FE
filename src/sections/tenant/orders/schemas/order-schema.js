import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * OrderItem schema
 */
const orderItemSchema = zod.object({
  itemId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Item ID must be a valid GUID')
  ),
  quantity: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().int().positive('Quantity must be a positive integer')
  ),
  unitPrice: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Unit price must be non-negative')
  ),
  notes: zod
    .string()
    .nullable()
    .optional()
    .or(zod.literal('')),
});

// ----------------------------------------------------------------------

/**
 * DeliveryDetails schema
 */
// P1-004: max length for delivery detail strings (align with backend limits)
const deliveryDetailsSchema = zod.object({
  contactName: zod
    .string()
    .max(500)
    .nullable()
    .optional()
    .or(zod.literal('')),
  phone: zod
    .string()
    .max(50)
    .nullable()
    .optional()
    .or(zod.literal('')),
  address: zod
    .string()
    .max(500)
    .nullable()
    .optional()
    .or(zod.literal('')),
  city: zod
    .string()
    .max(500)
    .nullable()
    .optional()
    .or(zod.literal('')),
  postalCode: zod
    .string()
    .max(50)
    .nullable()
    .optional()
    .or(zod.literal('')),
  landmark: zod
    .string()
    .max(500)
    .nullable()
    .optional()
    .or(zod.literal('')),
  instructions: zod
    .string()
    .max(2000)
    .nullable()
    .optional()
    .or(zod.literal('')),
}).nullable().optional();

// ----------------------------------------------------------------------

/**
 * Create order schema
 */
export const createOrderSchema = zod.object({
  branchId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Branch ID must be a valid GUID')
  ),
  orderTypeId: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Otherwise, use the value as-is (should be a string UUID)
      return val;
    },
    zod.string().uuid('Order Type ID must be a valid GUID')
  ),
  paymentModeId: zod.preprocess(
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
    zod.string().uuid('Payment Mode ID must be a valid GUID').nullable().optional()
  ),
  staffId: zod.preprocess(
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
    zod.string().uuid('Staff ID must be a valid GUID').nullable().optional()
  ),
  tableId: zod.preprocess(
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
    zod.string().uuid('Table ID must be a valid GUID').nullable().optional()
  ),
  kitchenId: zod.preprocess(
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
    zod.string().uuid('Kitchen ID must be a valid GUID').nullable().optional()
  ),
  items: zod.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  deliveryDetails: deliveryDetailsSchema,
  taxAmount: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Tax amount must be non-negative').default(0)
  ),
  taxPercentage: zod.preprocess(
    (val) => {
      // If it's null, undefined, or empty string, return null
      if (val === null || val === undefined || val === '') {
        return null;
      }
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? null : num;
      }
      return val;
    },
    zod.number().nonnegative('Tax percentage must be non-negative').nullable().optional()
  ),
  discountAmount: zod.preprocess(
    (val) => {
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Discount amount must be non-negative').default(0)
  ),
  discountPercentage: zod.preprocess(
    (val) => {
      // If it's null, undefined, or empty string, return null
      if (val === null || val === undefined || val === '') {
        return null;
      }
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? null : num;
      }
      return val;
    },
    zod.number().nonnegative('Discount percentage must be non-negative').nullable().optional()
  ),
  notes: zod
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .nullable()
    .optional()
    .or(zod.literal('')),
});

// ----------------------------------------------------------------------

/**
 * Update order schema
 */
export const updateOrderSchema = zod.object({
  staffId: zod.preprocess(
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
    zod.string().uuid('Staff ID must be a valid GUID').nullable().optional()
  ),
  status: zod.preprocess(
    (val) => {
      // If it's an object with an id property, extract the id
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      // Convert string to number if needed
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().int().min(1).max(12, 'Order status must be between 1 and 12')
  ),
  notes: zod
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .nullable()
    .optional()
    .or(zod.literal('')),
});

