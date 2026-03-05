import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const DealListView = createLazyView(
  () => import('src/sections/tenant/deals/list/deal-list-view'),
  'DealListView'
);

export const metadata = { title: `Deals - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.deals.root}>
      <DealListView />
    </PermissionPageGuard>
  );
}
