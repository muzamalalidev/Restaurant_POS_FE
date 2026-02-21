import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  appName: 'Minimal Dashboard',
  appVersion: packageJson.version,
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://cloudpartner-latest.onrender.com',
  assetsDir: process.env.NEXT_PUBLIC_ASSETS_DIR ?? '/',
  isStaticExport: JSON.parse(process.env.BUILD_STATIC_EXPORT ?? 'false'),
  /**
   * Site URL (for SEO JSON-LD schemas)
   */
  site: {
    basePath: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://minimal-dashboard.com',
  },
  /**
   * Auth
   * @method jwt | amplify | firebase | supabase | auth0
   */
  auth: {
    method: 'jwt',
    skip: true,
    redirectPath: paths.platform.tenantMasters.root,
  },
  /**
   * Google Maps
   */
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  /**
   * Mapbox
   */
  mapboxApiKey: process.env.NEXT_PUBLIC_MAPBOX_API_KEY ?? '',
};

