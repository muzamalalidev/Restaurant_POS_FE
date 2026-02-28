import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

/**
 * Resolves a product/item image URL for display.
 * - null, undefined, empty string, or non-string: returns null.
 * - Absolute URL (http/https or protocol-relative //): returns as-is.
 * - Relative path: prepends assetsDir and normalizes slashes (no double slash).
 */
export function getResolvedImageSrc(imageUrl) {
  if (imageUrl == null || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (trimmed === '') return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }
  const base = (CONFIG.assetsDir ?? '/').replace(/\/+$/, '') || '';
  const path = trimmed.replace(/^\/+/, '');
  return path ? `${base}/${path}` : base || '/';
}
