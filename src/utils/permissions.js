import { getStoredUser } from 'src/auth/context/jwt/utils';

// ----------------------------------------------------------------------

/**
 * Check if the current user has a given permission (by permission code).
 * Permission codes match backend RequirePermission attribute (e.g. "Roles.GetAll", "Roles.Create").
 *
 * @param {string} permissionCode - Permission code (e.g. "Roles.GetAll")
 * @returns {boolean} True if user has the permission
 */
export function can(permissionCode) {
  if (!permissionCode || typeof permissionCode !== 'string') {
    return false;
  }
  const user = getStoredUser();
  const permissions = user?.permissions;
  if (!Array.isArray(permissions)) {
    return false;
  }
  return permissions.includes(permissionCode);
}
