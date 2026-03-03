import { z as zod } from 'zod';

import {
  optionalId,
  requiredId,
  requiredString,
  optionalString,
} from 'src/schemas/fields';

// ----------------------------------------------------------------------

/**
 * Extract string value from Autocomplete option object or return as-is if already string
 * Handles dropdown option { id, label } or plain string
 * Returns empty string for null/undefined to work with requiredString validation
 */
function extractStringValue(val) {
  if (val === null || val === undefined) {
    return '';
  }
  if (typeof val === 'object') {
    // Try id first, then label, then any string property
    return val.id || val.label || val.value || '';
  }
  return val;
}

/**
 * Password validation: at least 6 characters, one digit, one lowercase, one uppercase
 */
const passwordSchema = zod
  .string()
  .min(6, 'Password must be at least 6 characters')
  .refine(
    (val) => /[0-9]/.test(val),
    'Password must contain at least one digit'
  )
  .refine(
    (val) => /[a-z]/.test(val),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (val) => /[A-Z]/.test(val),
    'Password must contain at least one uppercase letter'
  );

/**
 * Email validation: required, valid email format
 */
const emailSchema = zod
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be 255 characters or less');

/**
 * Role validation: required string, preprocesses Autocomplete object to extract string value
 */
const roleSchema = zod.preprocess(
  extractStringValue,
  requiredString('Role is required', 200, { trim: true })
);

// ----------------------------------------------------------------------

/**
 * Register User Schema
 * 
 * Used for POST /api/Users/register
 * Fields: email, password, firstName, lastName, role
 */
export const registerUserSchema = zod.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: requiredString('First name is required', 200, { trim: true }),
  lastName: requiredString('Last name is required', 200, { trim: true }),
  role: roleSchema,
});

// Register tenant-master-level user (RegisterTenantMasterUserCommand)
export const registerTenantMasterUserSchema = zod.object({
  email: emailSchema,
  password: passwordSchema,
  userName: optionalString(256),
  firstName: requiredString('First name is required', 200, { trim: true }),
  lastName: requiredString('Last name is required', 200, { trim: true }),
  phoneNumber: optionalString(50),
  tenantMasterId: requiredId('Tenant master is required', 'Invalid tenant master ID'),
  role: roleSchema.optional(),
});

// Register tenant-level user (RegisterTenantUserCommand)
export const registerTenantUserSchema = zod.object({
  email: emailSchema,
  password: passwordSchema,
  userName: optionalString(256),
  firstName: requiredString('First name is required', 200, { trim: true }),
  lastName: requiredString('Last name is required', 200, { trim: true }),
  phoneNumber: optionalString(50),
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  role: roleSchema.optional(),
});

// Register branch-level user (RegisterBranchUserCommand)
export const registerBranchUserSchema = zod.object({
  email: emailSchema,
  password: passwordSchema,
  userName: optionalString(256),
  firstName: requiredString('First name is required', 200, { trim: true }),
  lastName: requiredString('Last name is required', 200, { trim: true }),
  phoneNumber: optionalString(50),
  branchId: requiredId('Branch is required', 'Invalid branch ID'),
  role: roleSchema.optional(),
});

// Scoped register: scope + one of tenantMasterId, tenantId, branchId (for dialog with scope selector)
const scopeSchema = zod.enum(['tenant-master', 'tenant', 'branch']);
export const registerUserScopedSchema = zod
  .object({
    scope: zod.preprocess(
      (val) => (typeof val === 'object' && val !== null && 'id' in val ? val.id : val),
      scopeSchema
    ),
    email: emailSchema,
    password: passwordSchema,
    userName: optionalString(256),
    firstName: requiredString('First name is required', 200, { trim: true }),
    lastName: requiredString('Last name is required', 200, { trim: true }),
    phoneNumber: optionalString(50),
    tenantMasterId: optionalId(),
    tenantId: optionalId(),
    branchId: optionalId(),
    role: roleSchema.optional(),
  })
  .refine(
    (data) =>
      (data.scope === 'tenant-master' && data.tenantMasterId) ||
      (data.scope === 'tenant' && data.tenantId) ||
      (data.scope === 'branch' && data.branchId),
    { message: 'Please select a scope option', path: ['tenantMasterId'] }
  );

// ----------------------------------------------------------------------

/**
 * Assign Tenant Ownership Schema
 * 
 * Used for POST /api/Users/assign-tenant-ownership
 * Fields: tenantId, newOwnerId
 */
export const assignTenantOwnershipSchema = zod.object({
  tenantId: requiredId('Tenant is required', 'Invalid tenant ID'),
  newOwnerId: requiredId('User is required', 'Invalid user ID'),
});

