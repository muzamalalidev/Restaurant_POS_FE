import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const StockListView = createLazyView(
  () => import('src/sections/tenant/stock/list/stock-list-view'),
  'StockListView'
);

// ----------------------------------------------------------------------

export const metadata = { title: `Stock - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.stock.root}>
      <StockListView />
    </PermissionPageGuard>
  );
}

