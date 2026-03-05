import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const PaymentModesView = createLazyView(
  () => import('src/sections/tenant/payment-modes/list/payment-mode-list-view'),
  'PaymentModesView'
);

export const metadata = { title: `Payment Modes - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.paymentModes.root}>
      <PaymentModesView />
    </PermissionPageGuard>
  );
}
