import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const KitchenListView = createLazyView(
  () => import('src/sections/tenant/kitchens/list/kitchen-list-view'),
  'KitchenListView'
);

export const metadata = { title: `Kitchens - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.kitchens.root}>
      <KitchenListView />
    </PermissionPageGuard>
  );
}

