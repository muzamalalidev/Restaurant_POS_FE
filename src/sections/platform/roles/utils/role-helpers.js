// ----------------------------------------------------------------------
// RoleScope: 1=TenantMaster, 2=Tenant, 3=Branch, 4=Platform
// ----------------------------------------------------------------------

const SCOPE_LABELS = {
  1: 'Tenant Master',
  2: 'Tenant',
  3: 'Branch',
  4: 'Platform',
};

export function getScopeDisplayName(scope) {
  if (scope == null) return '';
  const n = typeof scope === 'string' ? Number(scope) : scope;
  return SCOPE_LABELS[n] ?? String(scope);
}

// ----------------------------------------------------------------------

export function getActiveStatusLabel(isActive) {
  return isActive ? 'Active' : 'Inactive';
}

export function getActiveStatusColor(isActive) {
  return isActive ? 'success' : 'default';
}
