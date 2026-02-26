import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const StockListView = createLazyView(
  () => import('src/sections/tenant/stock/list/stock-list-view'),
  'StockListView'
);

// ----------------------------------------------------------------------

export const metadata = { title: `Stock - ${CONFIG.appName}` };

// ----------------------------------------------------------------------

export default function Page() {
  return <StockListView />;
}

