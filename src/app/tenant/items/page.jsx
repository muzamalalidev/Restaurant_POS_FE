import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ItemListView = createLazyView(() => import('src/sections/tenant/items/list/item-list-view'), 'ItemListView');

export const metadata = { title: `Items - ${CONFIG.appName}` };

export default function Page() {
  return <ItemListView />;
}

