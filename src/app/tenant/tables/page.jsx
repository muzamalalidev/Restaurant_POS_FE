import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TablesView = createLazyView(() => import('src/sections/tenant/tables/list/table-list-view'), 'TablesView');

export const metadata = { title: `Tables - ${CONFIG.appName}` };

export default function Page() {
  return <TablesView />;
}

