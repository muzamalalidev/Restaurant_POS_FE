import { z as zod } from 'zod';

import {
  requiredId,
  requiredString,
  optionalString,
  numberFromInput,
  optionalNumberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

/** Accepts Date, dayjs, ISO string, or null for API date-time fields */
const dateTimeOptional = () =>
  zod.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const d = new Date(val);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (val && typeof val.toISOString === 'function') return new Date(val.toISOString());
      return null;
    },
    zod.date().nullable().optional()
  );

const dealItemSchema = zod.object({
  itemId: requiredId('Item is required', 'Invalid item ID'),
  quantity: numberFromInput({ positive: true, int: true, emptyAs: 1 }),
  unitPrice: optionalNumberFromInput({ nonnegative: true }),
});

// ----------------------------------------------------------------------

export const createDealSchema = zod.object({
  itemId: requiredId('Deal item is required', 'Invalid deal item ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  price: numberFromInput({ nonnegative: true }),
  imageUrl: optionalString(500),
  startDate: dateTimeOptional(),
  endDate: dateTimeOptional(),
  items: zod.array(dealItemSchema).min(1, 'Deal must contain at least one item'),
});

export const updateDealSchema = zod.object({
  itemId: requiredId('Deal item is required', 'Invalid deal item ID'),
  name: requiredString('Name is required', 200),
  description: optionalString(1000),
  price: numberFromInput({ nonnegative: true }),
  imageUrl: optionalString(500),
  startDate: dateTimeOptional(),
  endDate: dateTimeOptional(),
  isActive: zod.boolean(),
  items: zod
    .union([zod.array(dealItemSchema).min(1, 'Deal must contain at least one item'), zod.null()])
    .optional(),
});
