import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const PosOrderView = createLazyView(
  () => import('src/sections/tenant/orders/pos/pos-order-view'),
  'PosOrderView'
);

export const metadata = { title: `POS - ${CONFIG.appName}` };

export default function Page() {
  return <PosOrderView />;
}

