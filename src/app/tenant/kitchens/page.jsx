import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const KitchenListView = createLazyView(
  () => import('src/sections/tenant/kitchens/list/kitchen-list-view'),
  'KitchenListView'
);

export const metadata = { title: `Kitchens - ${CONFIG.appName}` };

export default function Page() {
  return <KitchenListView />;
}

