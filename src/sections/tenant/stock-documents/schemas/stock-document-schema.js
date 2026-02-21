import { z as zod } from 'zod';

// ----------------------------------------------------------------------

/**
 * Stock Document Item schema
 */
const stockDocumentItemSchema = zod.object({
  itemId: zod.preprocess(
    (val) => {
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      return val;
    },
    zod.string().uuid('Item ID must be a valid GUID')
  ),
  quantity: zod.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().positive('Quantity must be greater than zero')
  ),
  unitPrice: zod.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().nonnegative('Unit price must be non-negative').nullable().optional()
  ),
  remarks: zod.string().nullable().optional().or(zod.literal('')),
});

// ----------------------------------------------------------------------

/**
 * Create Stock Document schema
 */
export const createStockDocumentSchema = zod.object({
  tenantId: zod.preprocess(
    (val) => {
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      return val;
    },
    zod.string().uuid('Tenant ID must be a valid GUID')
  ),
  branchId: zod.preprocess(
    (val) => {
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      return val;
    },
    zod.string().uuid('Branch ID must be a valid GUID')
  ),
  documentType: zod.preprocess(
    (val) => {
      if (typeof val === 'object' && val !== null && 'id' in val) {
        return val.id;
      }
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    zod.number().int().min(1).max(3, 'Document type must be 1 (Purchase), 2 (Adjustment), or 3 (Wastage)')
  ),
  supplierName: zod.string().max(500, 'Supplier name must be at most 500 characters').nullable().optional().or(zod.literal('')),
  remarks: zod.string().max(2000, 'Remarks must be at most 2000 characters').nullable().optional().or(zod.literal('')),
  items: zod.array(stockDocumentItemSchema).min(1, 'Stock document must contain at least one item'),
});

// ----------------------------------------------------------------------

/**
 * Update Stock Document schema
 */
export const updateStockDocumentSchema = zod.object({
  supplierName: zod.string().max(500, 'Supplier name must be at most 500 characters').nullable().optional().or(zod.literal('')),
  remarks: zod.string().max(2000, 'Remarks must be at most 2000 characters').nullable().optional().or(zod.literal('')),
  items: zod.array(stockDocumentItemSchema).optional(), // Optional - empty array preserves existing items
});

