import NextLink from 'next/link';
import { forwardRef } from 'react';

/**
 * Enhanced RouterLink component with prefetch support
 * Wraps Next.js Link with default prefetch enabled for better navigation performance
 */
const RouterLink = forwardRef(function RouterLink({ prefetch = true, ...props }, ref) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});

RouterLink.displayName = 'RouterLink';

export { RouterLink };
