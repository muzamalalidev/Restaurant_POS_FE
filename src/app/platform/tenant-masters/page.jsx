import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const TenantMasterListView = createLazyView(
  () => import('src/sections/platform/tenant-masters/list/tenant-master-list-view'),
  'TenantMasterListView'
);

export const metadata = { title: `Tenant Masters - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.platform.tenantMasters.root}>
      <TenantMasterListView />
    </PermissionPageGuard>
  );
}
