import { z as zod } from 'zod';

import {
  requiredId,
  optionalId,
  optionalString,
  numberFromInput,
  requiredIdOrNumber,
  requiredNumberOption,
  optionalNumberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

const orderItemSchema = zod.object({
  itemId: requiredId('Item is required', 'Item ID must be a valid GUID'),
  quantity: numberFromInput({ positive: true, int: true }),
  unitPrice: numberFromInput({ nonnegative: true, emptyAs: 0 }),
  notes: optionalString(2000),
});

const deliveryDetailsSchema = zod
  .object({
    contactName: optionalString(500),
    phone: optionalString(50),
    address: optionalString(500),
    city: optionalString(500),
    postalCode: optionalString(50),
    landmark: optionalString(500),
    instructions: optionalString(2000),
  })
  .nullable()
  .optional();

// ----------------------------------------------------------------------

export const createOrderSchema = zod.object({
  branchId: requiredId('Branch is required', 'Branch ID must be a valid GUID'),
  orderTypeId: requiredIdOrNumber('Order type is required', 'Order type must be a valid selection'),
  paymentModeId: optionalId('Payment Mode ID must be a valid GUID'),
  staffId: optionalId('Staff ID must be a valid GUID'),
  tableId: optionalId('Table ID must be a valid GUID'),
  kitchenId: optionalId('Kitchen ID must be a valid GUID'),
  items: zod.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  deliveryDetails: deliveryDetailsSchema,
  taxAmount: numberFromInput({ nonnegative: true, emptyAs: 0 }).optional().default(0),
  taxPercentage: optionalNumberFromInput({ nonnegative: true }),
  discountAmount: numberFromInput({ nonnegative: true, emptyAs: 0 }).optional().default(0),
  discountPercentage: optionalNumberFromInput({ nonnegative: true }),
  notes: optionalString(2000),
});

export const updateOrderSchema = zod.object({
  staffId: optionalId('Staff ID must be a valid GUID'),
  status: requiredNumberOption(
    'Status is required',
    'Order status must be between 1 and 12',
    1,
    12
  ),
  notes: optionalString(2000),
});
