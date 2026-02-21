import { paths } from 'src/routes/paths';

/**
 * Route configuration for lazy loading optimization
 * Determines SSR/CSR behavior based on route patterns
 */

// Routes that should use SSR (SEO important, fast initial load)
const SSR_ROUTES = [
  paths.auth.signIn,
  paths.auth.signUp,
  paths.auth.resetPassword,
  paths.auth.updatePassword,
  paths.auth.verify,
  paths.platform.tenantMasters.root,
  '/error/',
  paths.comingSoon,
  '/',
];

// Routes that should use CSR only (heavy components, client-side only)
const CSR_ROUTES = [
  '/components/extra/chart',
  '/components/extra/map',
  '/components/extra/editor',
  '/components/extra/markdown',
  '/components/extra/lightbox',
  '/components/extra/carousel',
  '/components/extra/dnd',
  '/components/extra/organization-chart',
];

/**
 * Determines if a route should use SSR based on pathname
 * @param {string} pathname - The route pathname
 * @returns {boolean} - true if SSR should be enabled
 */
export function shouldUseSSR(pathname) {
  // Check if it's a heavy component route (CSR only)
  const isHeavyComponent = CSR_ROUTES.some((route) => pathname.includes(route));
  if (isHeavyComponent) {
    return false;
  }

  // Check if it's an SSR route
  const isSSRRoute = SSR_ROUTES.some((route) => {
    if (route === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(route);
  });

  return isSSRRoute;
}

/**
 * Gets lazy loading configuration for a route
 * @param {string} pathname - The route pathname
 * @param {object} overrides - Custom options to override defaults
 * @returns {object} - Dynamic import options
 */
export function getLazyLoadingConfig(pathname, overrides = {}) {
  const ssr = overrides.ssr !== undefined ? overrides.ssr : shouldUseSSR(pathname);

  return {
    ssr,
    loading: overrides.loading,
    ...overrides,
  };
}

