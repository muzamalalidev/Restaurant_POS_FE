import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

/**
 * Build JSON-LD structured data for Organization
 *
 * This establishes the business entity for Google Knowledge Graph
 * and helps AI systems understand company context.
 *
 * @returns {Object} JSON-LD Organization schema
 */
export function buildOrganizationSchema() {
  const siteUrl = CONFIG.site.basePath || 'https://minimal-dashboard.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,

    // === Core identity ===
    name: 'Minimal Dashboard',
    legalName: 'Minimal Dashboard',
    url: siteUrl,
    description:
      'A modern dashboard theme built with Next.js, Material UI, and React.',

    // === Visual identity ===
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo/logo-single.png`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}/logo/logo-single.png`,

    // === Contact information ===
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English'],
        url: `${siteUrl}/contact`,
      },
    ],

    // === Social presence ===
    sameAs: [],

    // === Business details ===
    foundingDate: '2024',
  };
}

// ----------------------------------------------------------------------

/**
 * Server Component that renders Organization JSON-LD as a script tag
 */
export function OrganizationJsonLd() {
  const schema = buildOrganizationSchema();

  return (
    <script type="application/ld+json" suppressHydrationWarning>
      {JSON.stringify(schema)}
    </script>
  );
}
