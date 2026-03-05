'use client';

import { useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { getRequiredPermissionForPath } from 'src/routes/route-permissions';

import { can } from 'src/utils/permissions';

// ----------------------------------------------------------------------

/**
 * Guards a page by required permission for the given path.
 * If the path has no required permission (null/undefined), children are rendered.
 * If the user lacks the required permission, redirects to 403 and returns null.
 */
export function PermissionPageGuard({ path, children }) {
  const router = useRouter();
  const requiredPermission = getRequiredPermissionForPath(path);

  const hasAccess =
    requiredPermission == null || requiredPermission === undefined || can(requiredPermission);

  useEffect(() => {
    if (!hasAccess) {
      router.replace(paths.page403);
    }
  }, [hasAccess, router]);

  if (!hasAccess) {
    return null;
  }

  return children;
}
