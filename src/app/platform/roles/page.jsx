import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const RolesListView = createLazyView(
  () => import('src/sections/platform/roles/list/roles-list-view'),
  'RolesListView'
);

export const metadata = { title: `Roles - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.platform.roles.root}>
      <RolesListView />
    </PermissionPageGuard>
  );
}
