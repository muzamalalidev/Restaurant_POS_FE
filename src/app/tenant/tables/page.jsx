import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const TablesView = createLazyView(() => import('src/sections/tenant/tables/list/table-list-view'), 'TablesView');

export const metadata = { title: `Tables - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.tables.root}>
      <TablesView />
    </PermissionPageGuard>
  );
}

