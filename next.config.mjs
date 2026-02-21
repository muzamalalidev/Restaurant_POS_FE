/**
 * Static Exports in Next.js
 *
 * 1. Set `isStaticExport = true` in `next.config.{mjs|ts}`.
 * 2. This allows `generateStaticParams()` to pre-render dynamic routes at build time.
 *
 * For more details, see:
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 *
 * NOTE: Remove all "generateStaticParams()" functions if not using static exports.
 */
const isStaticExport = false;

// ----------------------------------------------------------------------

const nextConfig = {
  trailingSlash: false,

  output: isStaticExport ? 'export' : undefined,

  // Image optimization for external sources
  images: {
    remotePatterns: [],
  },
  // BYPASS ESLINT ERRORS DURING BUILD
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  env: {
    BUILD_STATIC_EXPORT: JSON.stringify(isStaticExport),
  },
  // Optimize package imports for better tree-shaking and code splitting
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'framer-motion',
    ],
  },
  // Without --turbopack (next dev)
  webpack(config, { isServer }) {
    // SVG loader
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Optimize bundle splitting for client-side
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // MUI chunk
            mui: {
              name: 'mui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Framer Motion chunk
            framer: {
              name: 'framer-motion',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // React vendor chunk
            react: {
              name: 'react-vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common vendor chunk for other libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 5,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  // With --turbopack (next dev --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;

