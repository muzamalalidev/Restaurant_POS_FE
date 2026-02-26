import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Platform
   */
  {
    subheader: 'Platform',
    items: [
      { title: 'Tenant Masters', path: paths.platform.tenantMasters.root, icon: ICONS.banking, iconName: 'ic-banking' },
      { title: 'Tenants', path: paths.platform.tenants.root, icon: ICONS.ecommerce, iconName: 'ic-ecommerce' },
    ],
  },
  /**
   * Tenant
   */
  {
    subheader: 'Tenant',
    items: [
      { title: 'Branches', path: paths.tenant.branches.root, icon: ICONS.folder, iconName: 'ic-folder' },
      { title: 'Staff Types', path: paths.tenant.staffTypes.root, icon: ICONS.label, iconName: 'ic-label' },
      { title: 'Staff', path: paths.tenant.staff.root, icon: ICONS.user, iconName: 'ic-user' },
      { title: 'Categories', path: paths.tenant.categories.root, icon: ICONS.folder, iconName: 'ic-folder' },
      { title: 'Items', path: paths.tenant.items.root, icon: ICONS.product, iconName: 'ic-product' },
      { title: 'Stock', path: paths.tenant.stock.root, icon: ICONS.analytics, iconName: 'ic-analytics' },
      { title: 'Stock Documents', path: paths.tenant.stockDocuments.root, icon: ICONS.file, iconName: 'ic-file' },
      { title: 'Orders', path: paths.tenant.orders.root, icon: ICONS.order, iconName: 'ic-order' },
      { title: 'Tables', path: paths.tenant.tables.root, icon: ICONS.calendar, iconName: 'ic-calendar' },
      { title: 'Recipes', path: paths.tenant.recipes.root, icon: ICONS.file, iconName: 'ic-file' },
      { title: 'Kitchens', path: paths.tenant.kitchens.root, icon: ICONS.kanban, iconName: 'ic-kanban' },
      { title: 'Payment Modes', path: paths.tenant.paymentModes.root, icon: ICONS.banking, iconName: 'ic-banking' },
    ],
  },
];
