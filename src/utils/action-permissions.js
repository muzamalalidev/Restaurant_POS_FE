/**
 * Action permission codes per resource.
 * Aligned with API_PERMISSIONS_AND_EDGE_CASES_FE_REFERENCE.md.
 * Use with can() from src/utils/permissions to gate Create/Edit/Delete/Toggle and special actions.
 */

export const ACTION_PERMISSIONS = {
  TenantMasters: {
    create: 'TenantMasters.Create',
    update: 'TenantMasters.Update',
    delete: 'TenantMasters.Delete',
    toggleActive: 'TenantMasters.ToggleActive',
  },
  Tenants: {
    create: 'Tenants.Create',
    update: 'Tenants.Update',
    delete: 'Tenants.Delete',
    toggleActive: 'Tenants.ToggleActive',
  },
  Users: {
    toggleActive: 'Users.ToggleActive',
    assignTenantOwnership: 'Users.AssignTenantOwnership',
    registerTenantMaster: 'Users.RegisterTenantMasterUser',
    registerTenant: 'Users.RegisterTenantUser',
    registerBranch: 'Users.RegisterBranchUser',
  },
  Roles: {
    create: 'Roles.Create',
    update: 'Roles.Update',
    delete: 'Roles.Delete',
    toggleActive: 'Roles.ToggleActive',
    assignToUser: 'Roles.AssignToUser',
    removeFromUser: 'Roles.RemoveFromUser',
  },
  Branches: {
    create: 'Branches.Create',
    update: 'Branches.Update',
    delete: 'Branches.Delete',
    toggleActive: 'Branches.ToggleActive',
  },
  StaffTypes: {
    create: 'StaffTypes.Create',
    update: 'StaffTypes.Update',
    delete: 'StaffTypes.Delete',
    toggleActive: 'StaffTypes.ToggleActive',
  },
  Staff: {
    create: 'Staff.Create',
    update: 'Staff.Update',
    delete: 'Staff.Delete',
    toggleActive: 'Staff.ToggleActive',
  },
  Categories: {
    create: 'Categories.Create',
    update: 'Categories.Update',
    delete: 'Categories.Delete',
    toggleActive: 'Categories.ToggleActive',
  },
  Items: {
    create: 'Items.Create',
    update: 'Items.Update',
    delete: 'Items.Delete',
    toggleActive: 'Items.ToggleActive',
  },
  Deals: {
    create: 'Deals.Create',
    update: 'Deals.Update',
    delete: 'Deals.Delete',
    toggleActive: 'Deals.ToggleActive',
  },
  Stock: {
    update: 'Stock.Update',
    adjust: 'Stock.Adjust',
  },
  StockDocuments: {
    create: 'StockDocuments.Create',
    update: 'StockDocuments.Update',
    delete: 'StockDocuments.Delete',
    toggleActive: 'StockDocuments.ToggleActive',
    post: 'StockDocuments.Post',
  },
  Orders: {
    create: 'Orders.Create',
    update: 'Orders.Update',
    delete: 'Orders.Delete',
  },
  Tables: {
    create: 'Tables.Create',
    update: 'Tables.Update',
    delete: 'Tables.Delete',
    toggleActive: 'Tables.ToggleActive',
    release: 'Tables.Release',
  },
  Recipes: {
    create: 'Recipes.Create',
    update: 'Recipes.Update',
    delete: 'Recipes.Delete',
    toggleActive: 'Recipes.ToggleActive',
  },
  Kitchens: {
    create: 'Kitchens.Create',
    update: 'Kitchens.Update',
    delete: 'Kitchens.Delete',
    toggleActive: 'Kitchens.ToggleActive',
  },
  PaymentModes: {
    create: 'PaymentModes.Create',
    update: 'PaymentModes.Update',
    delete: 'PaymentModes.Delete',
    toggleActive: 'PaymentModes.ToggleActive',
  },
};

/**
 * @param {string} resource - Resource key (e.g. 'Branches', 'Roles')
 * @param {string} action - Action key (e.g. 'create', 'update', 'delete', 'toggleActive', 'release', 'post', 'adjust', 'assignTenantOwnership')
 * @returns {string | undefined} Permission code or undefined if not defined
 */
export function getActionPermission(resource, action) {
  const resourcePerms = ACTION_PERMISSIONS[resource];
  if (!resourcePerms) return undefined;
  return resourcePerms[action];
}
