import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const TenantsView = createLazyView(() => import('src/sections/platform/tenants/list/tenant-list-view'), 'TenantsView');

export const metadata = { title: `Tenants - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.platform.tenants.root}>
      <TenantsView />
    </PermissionPageGuard>
  );
}

