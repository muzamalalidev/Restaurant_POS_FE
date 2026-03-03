'use client';

import { useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { can } from 'src/utils/permissions';
import { createLazyView } from 'src/utils/dynamic-imports';

// ----------------------------------------------------------------------

const RolesListView = createLazyView(
  () => import('src/sections/platform/roles/list/roles-list-view'),
  'RolesListView'
);

// ----------------------------------------------------------------------

export function RolesPageGuard() {
  const router = useRouter();

  useEffect(() => {
    if (!can('Roles.GetAll')) {
      router.replace(paths.page403);
    }
  }, [router]);

  if (!can('Roles.GetAll')) {
    return null;
  }

  return <RolesListView />;
}
