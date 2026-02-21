import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

/**
 * Build JSON-LD structured data for a blog post
 *
 * @param {Object} post - The blog post object
 * @returns {Object} JSON-LD BlogPosting schema
 */
export function buildBlogPostSchema(post) {
  const siteUrl = CONFIG.site.basePath || 'https://minimal-dashboard.com';
  const postUrl = `${siteUrl}/blog/${post.slug?.current}`;

  const authorSameAs = [];
  if (post.author?.social?.linkedin) authorSameAs.push(post.author.social.linkedin);
  if (post.author?.social?.twitter) authorSameAs.push(post.author.social.twitter);
  if (post.author?.social?.website) authorSameAs.push(post.author.social.website);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',

    headline: post.title,
    description: post.seoDescription,
    abstract: post.aiSummary,

    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,

    author: {
      '@type': 'Person',
      name: post.author?.name || 'Minimal Dashboard Team',
      ...(post.author?.slug?.current && {
        url: `${siteUrl}/author/${post.author.slug.current}`,
      }),
      ...(authorSameAs.length > 0 && { sameAs: authorSameAs }),
      ...(post.author?.role && { jobTitle: post.author.role }),
      worksFor: {
        '@type': 'Organization',
        name: 'Minimal Dashboard',
        url: siteUrl,
      },
    },

    publisher: {
      '@type': 'Organization',
      name: 'Minimal Dashboard',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo/logo-single.png`,
        width: 512,
        height: 512,
      },
    },

    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },

    ...(post.mainImage?.asset?.url && {
      image: {
        '@type': 'ImageObject',
        url: post.mainImage.asset.url,
        ...(post.mainImage.alt && { caption: post.mainImage.alt }),
      },
    }),

    ...(post.keywords?.length > 0 && {
      keywords: post.keywords.join(', '),
    }),
    ...(post.categories?.length > 0 && {
      articleSection: post.categories.map((c) => c.title).join(', '),
      about: post.categories.map((c) => ({
        '@type': 'Thing',
        name: c.title,
      })),
    }),

    isPartOf: {
      '@type': 'Blog',
      name: 'Minimal Dashboard Blog',
      url: `${siteUrl}/blog`,
    },
    inLanguage: 'en-US',
  };

  return JSON.parse(JSON.stringify(schema));
}

// ----------------------------------------------------------------------

/**
 * Server Component that renders BlogPosting JSON-LD as a script tag
 *
 * @param {Object} props
 * @param {Object} props.post - Blog post object
 */
export function BlogPostJsonLd({ post }) {
  if (!post) return null;

  const schema = buildBlogPostSchema(post);

  return (
    <script type="application/ld+json" suppressHydrationWarning>
      {JSON.stringify(schema)}
    </script>
  );
}
