import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const DealListView = createLazyView(
  () => import('src/sections/tenant/deals/list/deal-list-view'),
  'DealListView'
);

export const metadata = { title: `Deals - ${CONFIG.appName}` };

export default function Page() {
  return <DealListView />;
}
