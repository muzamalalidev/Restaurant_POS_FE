import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const ItemListView = createLazyView(() => import('src/sections/tenant/items/list/item-list-view'), 'ItemListView');

export const metadata = { title: `Items - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.items.root}>
      <ItemListView />
    </PermissionPageGuard>
  );
}

