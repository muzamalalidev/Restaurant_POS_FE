import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

/**
 * Build JSON-LD structured data for WebSite
 *
 * This enables:
 * - Sitelinks search box in Google (SearchAction)
 * - Proper site identity for AI systems
 * - Navigation context
 *
 * @returns {Object} JSON-LD WebSite schema
 */
export function buildWebSiteSchema() {
  const siteUrl = CONFIG.site.basePath || 'https://minimal-dashboard.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,

    // === Core identity ===
    name: CONFIG.appName,
    alternateName: ['Cloud Mate', 'Cloud Mate POS'],
    url: siteUrl,
    description: CONFIG.appDescription,

    // === Publisher reference ===
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },

    // === Sitelinks Search Box (Google feature) ===
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },

    // === Language ===
    inLanguage: 'en-US',

    // === Copyright ===
    copyrightHolder: {
      '@id': `${siteUrl}/#organization`,
    },
    copyrightYear: new Date().getFullYear(),
  };
}

// ----------------------------------------------------------------------

/**
 * Server Component that renders WebSite JSON-LD as a script tag
 */
export function WebSiteJsonLd() {
  const schema = buildWebSiteSchema();

  return (
    <script type="application/ld+json" suppressHydrationWarning>
      {JSON.stringify(schema)}
    </script>
  );
}
