import { z as zod } from 'zod';

// ----------------------------------------------------------------------
// Preprocessors
// ----------------------------------------------------------------------

/**
 * If val is object with id, return val.id; else return val. Handles dropdown option { id, label }.
 */
export function extractId(val) {
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return val.id;
  }
  return val;
}

/**
 * If null/undefined return null; if object with id or value return number; if string coerce to number;
 * if number return as-is; else null.
 */
export function extractNumberFromOption(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val !== null) {
    const n = val.id ?? val.value;
    if (n !== undefined && n !== null) {
      return typeof n === 'number' ? n : Number(n);
    }
  }
  if (typeof val === 'string') {
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }
  return typeof val === 'number' ? val : null;
}

/**
 * Normalize optional ID: ''/null/undefined -> null; object with id -> id; else as-is.
 */
export function normalizeOptionalId(val) {
  if (val === '' || val === null || val === undefined) return null;
  return extractId(val);
}

// ----------------------------------------------------------------------
// Required UUID (dropdown or string)
// ----------------------------------------------------------------------

/**
 * requiredId(requiredMessage, invalidMessage)
 * Preprocess: extractId. Schema: UUID or null, then refine v != null && v !== ''.
 */
export function requiredId(requiredMessage, invalidMessage = 'Invalid ID') {
  return zod.preprocess(
    extractId,
    zod
      .union([zod.string().min(1, requiredMessage).uuid(invalidMessage), zod.null()])
      .refine((v) => v != null && v !== '', requiredMessage)
  );
}

// ----------------------------------------------------------------------
// Optional UUID (dropdown or string)
// ----------------------------------------------------------------------

/**
 * optionalId(invalidMessage)
 * Preprocess: normalizeOptionalId. Schema: uuid nullable optional.
 */
export function optionalId(invalidMessage = 'Invalid ID') {
  return zod.preprocess(
    normalizeOptionalId,
    zod.string().uuid(invalidMessage).nullable().optional()
  );
}

// ----------------------------------------------------------------------
// Required ID that may be UUID (string) or enum number (e.g. order type)
// ----------------------------------------------------------------------

/**
 * requiredIdOrNumber(requiredMessage, invalidMessage)
 * Preprocess: extractId. Schema: non-empty string, int number, or null; then refine not null.
 * Use for dropdowns where the API returns enum keys as number or string (e.g. order types).
 */
export function requiredIdOrNumber(requiredMessage, invalidMessage = 'Invalid selection') {
  return zod.preprocess(
    extractId,
    zod
      .union([
        zod.string().min(1, requiredMessage),
        zod.number().int(),
        zod.null(),
      ])
      .refine((v) => v != null && v !== '', requiredMessage)
  );
}

// ----------------------------------------------------------------------
// Required number from dropdown (option object or number)
// ----------------------------------------------------------------------

/**
 * requiredNumberOption(requiredMessage, invalidMessage, min, max)
 */
export function requiredNumberOption(requiredMessage, invalidMessage, min, max) {
  return zod.preprocess(
    extractNumberFromOption,
    zod
      .union([zod.number().int().min(min).max(max, invalidMessage), zod.null()])
      .refine((v) => v !== null, requiredMessage)
  );
}

/**
 * optionalNumberOption(min, max)
 */
export function optionalNumberOption(min = -Infinity, max = Infinity) {
  return zod.preprocess(
    extractNumberFromOption,
    zod
      .number()
      .int()
      .min(min)
      .max(max)
      .nullable()
      .optional()
  );
}

// ----------------------------------------------------------------------
// String fields
// ----------------------------------------------------------------------

/**
 * requiredString(requiredMessage, maxLen, { trim?: boolean })
 */
export function requiredString(requiredMessage, maxLen = 2000, opts = {}) {
  const { trim = false } = opts;
  let schema = zod.string().min(1, requiredMessage).max(maxLen, `Must be ${maxLen} characters or less`);
  if (trim) {
    schema = zod.preprocess((val) => (typeof val === 'string' ? val.trim() : val), schema);
  }
  return schema;
}

/**
 * optionalString(maxLen) - nullable, optional, or empty string
 */
export function optionalString(maxLen = 2000) {
  return zod
    .string()
    .max(maxLen, `Must be ${maxLen} characters or less`)
    .nullable()
    .optional()
    .or(zod.literal(''));
}

/**
 * optionalUrl() - url or null or empty string
 */
export function optionalUrl(invalidMessage = 'Invalid URL format') {
  return zod
    .string()
    .url(invalidMessage)
    .nullable()
    .optional()
    .or(zod.literal(''));
}

/**
 * optionalEmail() - email or null or empty string
 */
export function optionalEmail(invalidMessage = 'Please enter a valid email address') {
  return zod
    .string()
    .email(invalidMessage)
    .max(255, 'Email must be 255 characters or less')
    .nullable()
    .optional()
    .or(zod.literal(''));
}

// ----------------------------------------------------------------------
// Number from input (string or number)
// ----------------------------------------------------------------------

function preprocessNumberInput(val, emptyAs) {
  if (val === '' || val === null || val === undefined) {
    return emptyAs;
  }
  if (typeof val === 'string') {
    const num = Number(val);
    return Number.isNaN(num) ? (emptyAs !== undefined ? emptyAs : val) : num;
  }
  return val;
}

/**
 * numberFromInput(opts) - opts: { emptyAs?, min?, max?, nonnegative?, positive?, int? }
 * Omit emptyAs for required fields (empty input fails). Use emptyAs: 0 for optional default zero.
 */
export function numberFromInput(opts = {}) {
  const { emptyAs, min, max, nonnegative = false, positive = false, int = false } = opts;
  let schema = zod.number();
  if (int) schema = schema.int();
  if (min !== undefined) schema = schema.min(min);
  if (max !== undefined) schema = schema.max(max);
  if (nonnegative) schema = schema.nonnegative('Must be non-negative');
  if (positive) schema = schema.positive('Must be greater than 0');
  return zod.preprocess((val) => preprocessNumberInput(val, emptyAs), schema);
}

/**
 * optionalNumberFromInput(opts) - same preprocess; nullable optional for edit-mode
 */
export function optionalNumberFromInput(opts = {}) {
  const { min, max, nonnegative = false, positive = false, int = false } = opts;
  let schema = zod.number().nullable().optional();
  if (int) schema = schema.refine((n) => n == null || Number.isInteger(n), 'Must be an integer');
  if (min !== undefined) schema = schema.refine((n) => n == null || n >= min, `Must be at least ${min}`);
  if (max !== undefined) schema = schema.refine((n) => n == null || n <= max, `Must be at most ${max}`);
  if (nonnegative) schema = schema.refine((n) => n == null || n >= 0, 'Must be non-negative');
  if (positive) schema = schema.refine((n) => n == null || n > 0, 'Must be greater than 0');
  return zod.preprocess((val) => preprocessNumberInput(val, null), schema);
}

// ----------------------------------------------------------------------
// Boolean
// ----------------------------------------------------------------------

/**
 * booleanField(defaultValue) - optional default for create; no default for update.
 * No arg -> optional (create); with default -> optional with default; for update use .refine or require in form.
 */
export function booleanField(defaultValue) {
  if (defaultValue !== undefined) {
    return zod.boolean().optional().default(defaultValue);
  }
  return zod.boolean().optional();
}

// ----------------------------------------------------------------------
// Array with refine (at most one primary)
// ----------------------------------------------------------------------

/**
 * arrayWithAtMostOnePrimary(itemSchema) - refine: primaryCount <= 1
 */
export function arrayWithAtMostOnePrimary(itemSchema, message = 'Only one phone number can be marked as primary') {
  return zod
    .array(itemSchema)
    .nullable()
    .optional()
    .refine(
      (arr) => {
        if (!arr || arr.length === 0) return true;
        const primaryCount = arr.filter((p) => p && p.isPrimary).length;
        return primaryCount <= 1;
      },
      message
    );
}

// ----------------------------------------------------------------------
// Date optional (e.g. hireDate)
// ----------------------------------------------------------------------

/**
 * dateOptional() - preprocess: null/'' -> null; string -> Date; invalid -> null. Schema: date nullable optional.
 */
export function dateOptional() {
  return zod.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const date = new Date(val);
        return Number.isNaN(date.getTime()) ? null : date;
      }
      return null;
    },
    zod.date().nullable().optional()
  );
}

// ----------------------------------------------------------------------
// Re-export zod for domain schemas that need raw zod (e.g. union, literal)
// ----------------------------------------------------------------------

export { zod };
