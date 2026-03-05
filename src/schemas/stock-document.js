import { z as zod } from 'zod';

import {
  optionalId,
  requiredId,
  optionalString,
  numberFromInput,
  requiredNumberOption,
  optionalNumberFromInput,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

const stockDocumentItemSchema = zod.object({
  itemId: requiredId('Item is required', 'Item ID must be a valid GUID'),
  quantity: numberFromInput({ positive: true }),
  unitPrice: optionalNumberFromInput({ nonnegative: true }),
  remarks: optionalString(2000),
});

// ----------------------------------------------------------------------

export const createStockDocumentSchema = zod.object({
  tenantId: optionalId('Invalid tenant ID').optional(),
  branchId: optionalId('Invalid branch ID').optional(),
  documentType: requiredNumberOption(
    'Document type is required',
    'Document type must be 1 (Purchase), 2 (Adjustment), or 3 (Wastage)',
    1,
    3
  ),
  supplierName: optionalString(500),
  remarks: optionalString(2000),
  items: zod.array(stockDocumentItemSchema).min(1, 'Stock document must contain at least one item'),
});

export const updateStockDocumentSchema = zod.object({
  supplierName: optionalString(500),
  remarks: optionalString(2000),
  items: zod.array(stockDocumentItemSchema).optional(),
});
