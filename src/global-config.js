import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  appName: 'Cloud Mate Restaurant POS',
  appDescription:
    'Cloud Mate is a cloud-powered Restaurant POS that helps teams take orders faster, manage operations smarter, and grow revenue — all from one reliable platform.',
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
   * Invoice / receipt printer name. Shown in UI; in browser user must select this printer in the print dialog.
   * For Electron or backend print services, use this value to target the device.
   */
  invoicePrinterName: process.env.NEXT_PUBLIC_INVOICE_PRINTER_NAME ?? 'POS-80',
  /**
   * Mapbox
   */
  mapboxApiKey: process.env.NEXT_PUBLIC_MAPBOX_API_KEY ?? '',
};

