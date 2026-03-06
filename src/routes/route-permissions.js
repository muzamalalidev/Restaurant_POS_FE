import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------
// Single source of truth for which permission is required to access a route.
// Aligned with API_PERMISSIONS_AND_EDGE_CASES_FE_REFERENCE.md (backend controllers).
// Used by nav-config-dashboard (menu visibility) and PermissionPageGuard (route access).
// null = authenticated only, no specific permission required (use only when API has no GetAll for that list).
// ----------------------------------------------------------------------

export const routePermissionByPath = {
  [paths.platform.tenantMasters.root]: 'TenantMasters.GetAll',
  [paths.platform.tenants.root]: 'Tenants.GetAll',
  [paths.platform.users.root]: 'Users.GetAll',
  [paths.platform.roles.root]: 'Roles.GetAll',
  [paths.platform.branches.root]: 'Branches.GetAll',
  [paths.tenant.staffTypes.root]: 'StaffTypes.GetAll',
  [paths.tenant.staff.root]: 'Staff.GetAll',
  [paths.tenant.categories.root]: 'Categories.GetAll',
  [paths.tenant.items.root]: 'Items.GetAll',
  [paths.tenant.deals.root]: 'Deals.GetAll',
  [paths.tenant.stock.root]: 'Items.GetAll',
  [paths.tenant.stockDocuments.root]: 'StockDocuments.GetAll',
  [paths.tenant.orders.root]: 'Orders.GetAll',
  [paths.tenant.orders.list]: 'Orders.GetAll',
  [paths.tenant.tables.root]: 'Tables.GetAll',
  [paths.tenant.recipes.root]: 'Recipes.GetAll',
  [paths.tenant.kitchens.root]: 'Kitchens.GetAll',
  [paths.tenant.paymentModes.root]: 'PaymentModes.GetAll',
};

/**
 * @param {string} path - Route path (e.g. paths.platform.branches.root)
 * @returns {string | null | undefined} Required permission code, or null for authenticated-only, or undefined if path not in map
 */
export function getRequiredPermissionForPath(path) {
  return routePermissionByPath[path];
}
