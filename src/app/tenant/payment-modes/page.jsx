import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const PaymentModesView = createLazyView(
  () => import('src/sections/tenant/payment-modes/list/payment-mode-list-view'),
  'PaymentModesView'
);

export const metadata = { title: `Payment Modes - ${CONFIG.appName}` };

export default function Page() {
  return <PaymentModesView />;
}
