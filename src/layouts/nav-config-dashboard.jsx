import { paths } from 'src/routes/paths';

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
      { title: 'Tenant Masters', path: paths.platform.tenantMasters.root, icon: ICONS.tenantMasters },
      { title: 'Tenants', path: paths.platform.tenants.root, icon: ICONS.tenants },
      { title: 'Users', path: paths.platform.users.root, icon: ICONS.user },
      { title: 'Roles', path: paths.platform.roles.root, icon: ICONS.roles },
    ],
  },
  /**
   * Tenant
   */
  {
    subheader: 'Tenant',
    items: [
      { title: 'Branches', path: paths.tenant.branches.root, icon: ICONS.branches },
      { title: 'Staff Types', path: paths.tenant.staffTypes.root, icon: ICONS.staffTypes },
      { title: 'Staff', path: paths.tenant.staff.root, icon: ICONS.staff },
      { title: 'Categories', path: paths.tenant.categories.root, icon: ICONS.categories },
      { title: 'Items', path: paths.tenant.items.root, icon: ICONS.product },
      { title: 'Stock', path: paths.tenant.stock.root, icon: ICONS.analytics },
      { title: 'Stock Documents', path: paths.tenant.stockDocuments.root, icon: ICONS.file },
      { title: 'POS', path: paths.tenant.orders.root, icon: ICONS.order },
      { title: 'Tables', path: paths.tenant.tables.root, icon: ICONS.tables },
      { title: 'Recipes', path: paths.tenant.recipes.root, icon: ICONS.file },
      { title: 'Kitchens', path: paths.tenant.kitchens.root, icon: ICONS.kitchens },
      { title: 'Payment Modes', path: paths.tenant.paymentModes.root, icon: ICONS.banking },
    ],
  },
];
