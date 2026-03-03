import { z as zod } from 'zod';

import { optionalId, requiredId, requiredString } from 'src/schemas/fields';

// ----------------------------------------------------------------------
// Scope: 1=TenantMaster, 2=Tenant, 3=Branch, 4=Platform (RoleScope enum)
// ----------------------------------------------------------------------

const scopeSchema = zod
  .number()
  .int()
  .min(1, 'Scope is required')
  .max(4, 'Invalid scope');

// Preprocess dropdown option { id, value } or number
const scopePreprocess = zod.preprocess((val) => {
  if (val == null) return val;
  if (typeof val === 'object' && val !== null && ('id' in val || 'value' in val)) {
    const n = val.id ?? val.value;
    return typeof n === 'string' ? Number(n) : n;
  }
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }
  return val;
}, scopeSchema);

// ----------------------------------------------------------------------

export const createRoleSchema = zod.object({
  name: requiredString('Name is required', 256, { trim: true }),
  scope: scopePreprocess,
  isActive: zod.boolean().optional().default(true),
  permissionIds: zod.array(zod.string().uuid()).optional().nullable(),
});

export const updateRoleSchema = zod.object({
  name: requiredString('Name is required', 256, { trim: true }),
  scope: scopePreprocess,
  isActive: zod.boolean(),
  permissionIds: zod.array(zod.string().uuid()).optional().nullable(),
});

export const assignRoleToUserSchema = zod.object({
  userId: requiredId('User is required', 'Invalid user ID'),
  roleId: requiredId('Role is required', 'Invalid role ID'),
  assignedByUserId: optionalId('Invalid assigner ID').optional().nullable(),
});
