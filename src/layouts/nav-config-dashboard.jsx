import { paths } from 'src/routes/paths';
import { routePermissionByPath } from 'src/routes/route-permissions';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const icon = (name) => <Iconify width={22} icon={name} />;

const ICONS = {
  tenantMasters: icon('solar:buildings-2-outline'),
  tenants: icon('solar:shop-2-outline'),
  user: icon('solar:user-outline'),
  roles: icon('solar:shield-user-outline'),
  branches: icon('solar:map-point-outline'),
  staffTypes: icon('solar:tag-outline'),
  staff: icon('solar:users-group-two-rounded-outline'),
  categories: icon('solar:folder-outline'),
  product: icon('solar:box-outline'),
  deals: icon('solar:gift-outline'),
  analytics: icon('solar:chart-2-outline'),
  file: icon('solar:document-outline'),
  order: icon('solar:cart-large-2-outline'),
  tables: icon('solar:widget-2-outline'),
  recipes: icon('solar:document-text-outline'),
  kitchens: icon('solar:chef-hat-outline'),
  banking: icon('solar:wallet-money-outline'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Platform
   */
  {
    subheader: 'Platform',
    items: [
      {
        title: 'Tenant Masters',
        path: paths.platform.tenantMasters.root,
        icon: ICONS.tenantMasters,
        requiredPermission: routePermissionByPath[paths.platform.tenantMasters.root],
      },
      {
        title: 'Tenants',
        path: paths.platform.tenants.root,
        icon: ICONS.tenants,
        requiredPermission: routePermissionByPath[paths.platform.tenants.root],
      },
      {
        title: 'Users',
        path: paths.platform.users.root,
        icon: ICONS.user,
        requiredPermission: routePermissionByPath[paths.platform.users.root],
      },
      {
        title: 'Roles',
        path: paths.platform.roles.root,
        icon: ICONS.roles,
        requiredPermission: routePermissionByPath[paths.platform.roles.root],
      },
      {
        title: 'Branches',
        path: paths.platform.branches.root,
        icon: ICONS.branches,
        requiredPermission: routePermissionByPath[paths.platform.branches.root],
      },
    ],
  },
  /**
   * Tenant
   */
  {
    subheader: 'Tenant',
    items: [
      {
        title: 'Staff Types',
        path: paths.tenant.staffTypes.root,
        icon: ICONS.staffTypes,
        requiredPermission: routePermissionByPath[paths.tenant.staffTypes.root],
      },
      {
        title: 'Staff',
        path: paths.tenant.staff.root,
        icon: ICONS.staff,
        requiredPermission: routePermissionByPath[paths.tenant.staff.root],
      },
      {
        title: 'Categories',
        path: paths.tenant.categories.root,
        icon: ICONS.categories,
        requiredPermission: routePermissionByPath[paths.tenant.categories.root],
      },
      {
        title: 'Items',
        path: paths.tenant.items.root,
        icon: ICONS.product,
        requiredPermission: routePermissionByPath[paths.tenant.items.root],
      },
      {
        title: 'Deals',
        path: paths.tenant.deals.root,
        icon: ICONS.deals,
        requiredPermission: routePermissionByPath[paths.tenant.deals.root],
      },
      {
        title: 'Stock',
        path: paths.tenant.stock.root,
        icon: ICONS.analytics,
        requiredPermission: routePermissionByPath[paths.tenant.stock.root],
      },
      {
        title: 'Stock Documents',
        path: paths.tenant.stockDocuments.root,
        icon: ICONS.file,
        requiredPermission: routePermissionByPath[paths.tenant.stockDocuments.root],
      },
      {
        title: 'POS',
        path: paths.tenant.orders.root,
        icon: ICONS.order,
        requiredPermission: routePermissionByPath[paths.tenant.orders.root],
      },
      {
        title: 'Tables',
        path: paths.tenant.tables.root,
        icon: ICONS.tables,
        requiredPermission: routePermissionByPath[paths.tenant.tables.root],
      },
      {
        title: 'Recipes',
        path: paths.tenant.recipes.root,
        icon: ICONS.file,
        requiredPermission: routePermissionByPath[paths.tenant.recipes.root],
      },
      {
        title: 'Kitchens',
        path: paths.tenant.kitchens.root,
        icon: ICONS.kitchens,
        requiredPermission: routePermissionByPath[paths.tenant.kitchens.root],
      },
      {
        title: 'Payment Modes',
        path: paths.tenant.paymentModes.root,
        icon: ICONS.banking,
        requiredPermission: routePermissionByPath[paths.tenant.paymentModes.root],
      },
    ],
  },
];
