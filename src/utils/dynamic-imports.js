import dynamic from 'next/dynamic';

import { PageLoading } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

/**
 * Creates a lazy-loaded view component with smart defaults
 * IMPORTANT: The importFn must contain a static string literal for Next.js to analyze it
 * Next.js can statically analyze import() when it's directly in the dynamic() call
 * @param {() => Promise} importFn - Function that returns the import (must use static string like () => import('path'))
 * @param {string} componentName - Name of the exported component
 * @param {object} options - Optional overrides for dynamic import
 * @returns {React.Component} - Lazy-loaded component
 */
export function createLazyView(importFn, componentName, options = {}) {
  // Extract import path from function string for SSR detection only (not for the import itself)
  // Handle both standard import() and Turbopack __turbopack_context__.A()
  const fnString = importFn.toString();
  let importPath = '';
  let importPathMatch = fnString.match(/import\(['"]([^'"]+)['"]\)/);
  
  // If that fails, try Turbopack pattern: __turbopack_context__.A("[project]/path [metadata]")
  if (!importPathMatch) {
    const turbopackMatch = fnString.match(/__turbopack_context__\.A\(['"]([^'"]+)['"]\)/);
    if (turbopackMatch) {
      // Extract the actual path from Turbopack format: "[project]/path [metadata]" -> "path"
      const turbopackPath = turbopackMatch[1];
      // Remove [project]/ prefix and metadata suffix (everything after space)
      const pathMatch = turbopackPath.match(/\[project\]\/([^\s]+)/);
      if (pathMatch) {
        importPath = pathMatch[1];
      } else {
        // Fallback: try to extract path without [project] prefix
        const simplePathMatch = turbopackPath.match(/([^\s]+)/);
        if (simplePathMatch) {
          importPath = simplePathMatch[1];
        }
      }
    } else {
      importPath = importPathMatch?.[1] || '';
    }
  } else {
    importPath = importPathMatch[1];
  }
  
  // Compute options inline to satisfy Next.js requirement for object literal
  let ssr = options.ssr;
  let loading = options.loading;

  // If SSR not explicitly set, try to detect from import path
  if (ssr === undefined && importPath) {
    // Check if it's a heavy component by import path
    const isHeavyComponent =
      importPath.includes('/extra/') &&
      (importPath.includes('chart') ||
        importPath.includes('map') ||
        importPath.includes('editor') ||
        importPath.includes('markdown') ||
        importPath.includes('lightbox') ||
        importPath.includes('carousel') ||
        importPath.includes('dnd') ||
        importPath.includes('organization-chart'));

    // Check if it's auth or dashboard route
    const isAuthRoute =
      importPath.includes('/auth/') ||
      importPath.includes('sign-in') ||
      importPath.includes('sign-up') ||
      importPath.includes('reset-password') ||
      importPath.includes('update-password') ||
      importPath.includes('verify');

    const isDashboardRoute = importPath.includes('/dashboard');

    // Default SSR decision
    ssr = !isHeavyComponent && (isAuthRoute || isDashboardRoute);
  }

  // Default loading component
  if (!loading) {
    loading = () => <PageLoading />;
  }

  // Use importFn directly - Next.js can statically analyze the original function
  // This works even with Turbopack transformations because Next.js analyzes the source code
  return dynamic(
    async () => {
      const mod = await importFn();
      // Handle both named exports and default exports
      if (componentName && mod[componentName]) {
        return { default: mod[componentName] };
      }
      if (mod.default) {
        return { default: mod.default };
      }
      // If no component name specified, try to get the first export
      const firstExport = Object.values(mod)[0];
      if (firstExport) {
        return { default: firstExport };
      }
      throw new Error(
        `Component "${componentName}" not found. Available exports: ${Object.keys(mod).join(', ')}`
      );
    },
    {
      ssr,
      loading,
      ...options,
    }
  );
}

