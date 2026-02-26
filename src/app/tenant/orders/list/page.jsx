import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const OrderListView = createLazyView(
  () => import('src/sections/tenant/orders/list/order-list-view'),
  'OrderListView'
);

export const metadata = { title: `Order list - ${CONFIG.appName}` };

export default function Page() {
  return <OrderListView />;
}
