import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TenantsView = createLazyView(() => import('src/sections/platform/tenants/list/tenant-list-view'), 'TenantsView');

export const metadata = { title: `Tenants - ${CONFIG.appName}` };

export default function Page() {
  return <TenantsView />;
}

