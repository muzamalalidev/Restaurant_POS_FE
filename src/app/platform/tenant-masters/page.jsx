import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TenantMasterListView = createLazyView(
  () => import('src/sections/platform/tenant-masters/list/tenant-master-list-view'),
  'TenantMasterListView'
);

export const metadata = { title: `Tenant Masters - ${CONFIG.appName}` };

export default function Page() {
  return <TenantMasterListView />;
}
