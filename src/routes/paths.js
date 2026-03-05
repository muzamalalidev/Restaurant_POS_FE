// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PLATFORM: '/platform',
  TENANT: '/tenant',
};

// ----------------------------------------------------------------------

export const paths = {
  comingSoon: '/coming-soon',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  components: '/components',
  pages: '/pages',
  docs: '/docs',
  termsOfService: '/terms-of-service',
  privacyPolicy: '/privacy-policy',
  minimalStore: '#',
  aiAssistant: '/dashboard',
  // AUTH
  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    resetPassword: '/reset-password',
    updatePassword: '/update-password',
    verify: '/verify',
  },
  /** Default website navigation target (root "/" and "Home" links redirect here). Keep in sync with auth.signIn when home should be sign-in. */
  home: '/sign-in',
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
  },
  // PLATFORM
  platform: {
    root: ROOTS.PLATFORM,
    tenants: {
      root: `${ROOTS.PLATFORM}/tenants`,
    },
    tenantMasters: {
      root: `${ROOTS.PLATFORM}/tenant-masters`,
    },
    users: {
      root: `${ROOTS.PLATFORM}/users`,
    },
    roles: {
      root: `${ROOTS.PLATFORM}/roles`,
    },
    branches: {
      root: `${ROOTS.PLATFORM}/branches`,
    },
  },
  // TENANT
  tenant: {
    root: ROOTS.TENANT,
    staffTypes: {
      root: `${ROOTS.TENANT}/staff-types`,
    },
    staff: {
      root: `${ROOTS.TENANT}/staff`,
    },
    categories: {
      root: `${ROOTS.TENANT}/categories`,
    },
    items: {
      root: `${ROOTS.TENANT}/items`,
    },
    deals: {
      root: `${ROOTS.TENANT}/deals`,
    },
    stock: {
      root: `${ROOTS.TENANT}/stock`,
    },
    stockDocuments: {
      root: `${ROOTS.TENANT}/stock-documents`,
    },
    orders: {
      root: `${ROOTS.TENANT}/orders`,
      list: `${ROOTS.TENANT}/orders/list`,
    },
    tables: {
      root: `${ROOTS.TENANT}/tables`,
    },
    recipes: {
      root: `${ROOTS.TENANT}/recipes`,
    },
    kitchens: {
      root: `${ROOTS.TENANT}/kitchens`,
    },
    paymentModes: {
      root: `${ROOTS.TENANT}/payment-modes`,
    },
  },
};
