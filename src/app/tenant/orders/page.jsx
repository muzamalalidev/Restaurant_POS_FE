import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const PosOrderView = createLazyView(
  () => import('src/sections/tenant/orders/pos/pos-order-view'),
  'PosOrderView'
);

export const metadata = { title: `POS - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.orders.root}>
      <PosOrderView />
    </PermissionPageGuard>
  );
}

